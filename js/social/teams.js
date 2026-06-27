// ============================================
// QuizHub — Команды v2.1
// ============================================

let userTeam = JSON.parse(localStorage.getItem('quizhub-team') || 'null');

// ========== СОЗДАНИЕ КОМАНДЫ ==========

async function createTeam(teamName) {
    if (!currentUser) {
        showToast('Войди в аккаунт для создания команды', 'warning');
        return;
    }

    try {
        const teamRef = await db.collection('teams').add({
            name: teamName,
            captain: currentUser.uid,
            captainName: currentUser.displayName || 'Капитан',
            members: [{
                uid: currentUser.uid,
                name: currentUser.displayName || 'Игрок',
                photoURL: currentUser.photoURL || null,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                score: 0
            }],
            totalScore: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            memberCount: 1
        });

        userTeam = {
            id: teamRef.id,
            name: teamName,
            role: 'captain'
        };

        localStorage.setItem('quizhub-team', JSON.stringify(userTeam));
        showToast(`Команда «${teamName}» создана! 🎉`, 'success');

        if (typeof showScreen === 'function') showScreen('team');
        return teamRef.id;
    } catch (error) {
        console.error('Ошибка создания команды:', error);
        showToast('Не удалось создать команду', 'danger');
    }
}

// ========== ПРИГЛАШЕНИЕ В КОМАНДУ ==========

async function inviteToTeam(teamId, targetUserId) {
    if (!userTeam || userTeam.role !== 'captain') {
        showToast('Только капитан может приглашать', 'warning');
        return;
    }

    try {
        await db.collection('teamInvites').add({
            teamId: teamId,
            teamName: userTeam.name,
            from: currentUser.uid,
            fromName: currentUser.displayName,
            to: targetUserId,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showToast('Приглашение отправлено! 📨', 'success');
    } catch (error) {
        console.error('Ошибка приглашения:', error);
        showToast('Не удалось отправить приглашение', 'danger');
    }
}

// ========== ПРИНЯТЬ ПРИГЛАШЕНИЕ ==========

async function acceptInvite(inviteId, teamId) {
    try {
        await db.collection('teams').doc(teamId).update({
            members: firebase.firestore.FieldValue.arrayUnion({
                uid: currentUser.uid,
                name: currentUser.displayName || 'Игрок',
                photoURL: currentUser.photoURL || null,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                score: 0
            }),
            memberCount: firebase.firestore.FieldValue.increment(1)
        });

        await db.collection('teamInvites').doc(inviteId).update({
            status: 'accepted'
        });

        userTeam = { id: teamId, role: 'member' };
        localStorage.setItem('quizhub-team', JSON.stringify(userTeam));

        showToast('Ты в команде! 🎉', 'success');
    } catch (error) {
        console.error('Ошибка:', error);
        showToast('Не удалось присоединиться', 'danger');
    }
}

// ========== НАЧИСЛЕНИЕ ОЧКОВ КОМАНДЕ ==========

async function addTeamScore(score) {
    if (!userTeam || !currentUser) return;

    try {
        const teamRef = db.collection('teams').doc(userTeam.id);
        const teamDoc = await teamRef.get();
        const teamData = teamDoc.data();

        const members = teamData.members.map(m => {
            if (m.uid === currentUser.uid) {
                return { ...m, score: (m.score || 0) + score };
            }
            return m;
        });

        const totalScore = members.reduce((sum, m) => sum + (m.score || 0), 0);

        await teamRef.update({
            members: members,
            totalScore: totalScore
        });

        console.log(`Командные очки обновлены: +${score}`);
    } catch (error) {
        console.error('Ошибка обновления командных очков:', error);
    }
}

// ========== ТАБЛИЦА ЛИДЕРОВ КОМАНД ==========

function getTeamLeaderboard(limit = 20) {
    return db.collection('teams')
        .orderBy('totalScore', 'desc')
        .limit(limit)
        .get()
        .then(snapshot => {
            const teams = [];
            snapshot.forEach(doc => {
                teams.push({ id: doc.id, ...doc.data() });
            });
            return teams;
        });
}

function onTeamLeaderboardUpdate(callback, limit = 20) {
    return db.collection('teams')
        .orderBy('totalScore', 'desc')
        .limit(limit)
        .onSnapshot(snapshot => {
            const teams = [];
            snapshot.forEach(doc => {
                teams.push({ id: doc.id, ...doc.data() });
            });
            callback(teams);
        });
}

// ========== UI КОМАНДЫ ==========

function renderTeamScreen() {
    const screen = document.getElementById('screen-team');
    if (!screen) return;

    const hasTeam = (typeof userTeam !== 'undefined' && userTeam && userTeam.id);

    if (hasTeam) {
        renderTeamDashboard(screen);
    } else {
        screen.innerHTML = `
            <div class="row justify-content-center">
                <div class="col-lg-6 text-center py-5">
                    <i class="bi bi-people fs-1 text-accent d-block mb-3"></i>
                    <h3 class="fw-bold mb-2">${t('teamTitle')}</h3>
                    <p class="text-muted mb-4">${t('noTeam')}</p>
                    <div class="bg-card rounded-4 p-4 mb-3">
                        <h5 class="fw-bold mb-3">${t('createTeam')}</h5>
                        <div class="input-group mb-3">
                            <input type="text" class="form-control rounded-pill px-4" 
                                   id="team-name-input" placeholder="${t('teamName')}" maxlength="30">
                            <button class="btn btn-accent rounded-pill px-4 ms-2" onclick="createTeamFromInput()">
                                ${t('createTeam')}
                            </button>
                        </div>
                    </div>
                    <button class="btn btn-outline-accent rounded-pill px-4" onclick="showScreen('home')">
                        <i class="bi bi-house me-2"></i>${t('home')}
                    </button>
                </div>
            </div>
        `;
    }
}

function renderTeamDashboard(screen) {
    getTeamLeaderboard().then(teams => {
        const myTeam = teams.find(t => t.id === userTeam.id);

        screen.innerHTML = `
            <div class="row justify-content-center">
                <div class="col-lg-8">
                    <div class="text-center mb-4">
                        <h2 class="fw-bold font-display mb-2">👥 ${myTeam?.name || t('teamTitle')}</h2>
                        <p class="text-muted">${t('teamScore')}: ${myTeam?.totalScore || 0}</p>
                    </div>
                    <div class="bg-card rounded-4 p-4 mb-4">
                        <h5 class="fw-bold mb-3">${t('teamMembers')}</h5>
                        <div class="d-grid gap-2">
                            ${(myTeam?.members || []).map(m => `
                                <div class="d-flex align-items-center gap-3 p-2">
                                    ${m.photoURL 
                                        ? `<img src="${m.photoURL}" class="rounded-circle" width="32" height="32" style="object-fit:cover;">`
                                        : `<div class="bg-accent rounded-circle d-flex align-items-center justify-content-center" style="width:32px;height:32px;"><small class="text-white fw-bold">${(m.name || '?')[0].toUpperCase()}</small></div>`
                                    }
                                    <span class="fw-bold">${m.name}</span>
                                    <span class="text-accent">${m.score || 0} очков</span>
                                    ${m.uid === myTeam?.captain ? '<span class="badge bg-warning">Капитан</span>' : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="text-center">
                        <button class="btn btn-accent rounded-pill px-4" onclick="showScreen('home')">
                            <i class="bi bi-house me-2"></i>${t('home')}
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
}

function createTeamFromInput() {
    const input = document.getElementById('team-name-input');
    const name = input?.value?.trim();
    if (!name || name.length < 3) {
        showToast('Название команды должно быть от 3 символов', 'warning');
        return;
    }
    if (typeof createTeam === 'function') createTeam(name);
}

// Для обратной совместимости
function showTeamScreen() {
    renderTeamScreen();
    showScreen('team');
}