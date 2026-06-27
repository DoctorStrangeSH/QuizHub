// ============================================
// QuizHub — Шаблоны с переводами v2.0 (полный)
// Все сложные HTML-блоки с t() собираются здесь
// ============================================

console.log('✅ templates.js начал загрузку');

const I18N_TEMPLATES = {

    // ========== АВТОРИЗАЦИЯ ==========

    authLoggedIn(user) {
        const photoURL = user.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=FF6B9D&color=fff&size=32`;
        return `
            <div class="d-flex align-items-center gap-2">
                <img src="${photoURL}" class="rounded-circle" width="32" height="32" 
                     style="border:2px solid var(--accent);object-fit:cover;"
                     alt="${user.displayName || 'User'}"
                     onerror="this.src='https://ui-avatars.com/api/?name=U&background=FF6B9D&color=fff&size=32'">
                <span class="d-none d-lg-inline small fw-semibold user-name">${user.displayName || ''}</span>
                <button class="btn btn-outline-accent btn-sm rounded-pill px-3 ms-1" onclick="signOut()" title="${t('logout')}">
                    <i class="bi bi-box-arrow-right"></i>
                </button>
            </div>
        `;
    },

    authLoggedOut() {
        return `
            <button class="btn btn-accent btn-sm rounded-pill px-3" onclick="signInWithGoogle()">
                <i class="bi bi-google me-2"></i>${t('login')}
            </button>
        `;
    },

    // ========== КВИЗ ==========

    quizScreen(question, currentIndex, total, score, timeLeft, totalTime) {
        const progress = ((currentIndex + 1) / total) * 100;
        const circumference = 2 * Math.PI * 36;
        const offset = circumference * (1 - timeLeft / totalTime);
        const timerDanger = timeLeft <= 5 ? 'danger' : '';

        return `
            <div class="row justify-content-center">
                <div class="col-lg-7">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <small class="text-muted">${t('survivalQuestion')} ${currentIndex + 1} ${t('of')} ${total}</small>
                        <small class="text-muted">🏆 ${score} ${t('points')}</small>
                    </div>
                    <div class="progress mb-4" style="height: 6px;">
                        <div class="progress-bar bg-accent progress-animated" style="width: ${progress}%;"></div>
                    </div>
                    <div class="d-flex justify-content-center mb-4">
                        <div class="timer-circle-advanced">
                            <svg viewBox="0 0 80 80">
                                <circle class="timer-circle-bg" cx="40" cy="40" r="36"/>
                                <circle class="timer-circle-progress ${timerDanger}" id="timer-progress-circle"
                                        cx="40" cy="40" r="36"
                                        stroke-dasharray="${circumference}"
                                        stroke-dashoffset="${offset}"/>
                            </svg>
                            <span class="timer-circle-text" id="timer-display">${timeLeft}</span>
                        </div>
                    </div>
                    <div class="bg-card rounded-4 p-4 p-md-5 mb-4">
                        <span class="badge bg-accent bg-opacity-25 text-accent rounded-pill px-3 py-2 mb-3">
                            ${typeof getCategoryName === 'function' ? getCategoryName(question.category) : question.category} • ${typeof getDifficultyLabel === 'function' ? getDifficultyLabel(question.difficulty) : question.difficulty}
                        </span>
                        <h3 class="fw-bold mb-4">${question.question}</h3>
                        <div class="d-grid gap-3" id="answers-container">
                            ${question.answers.map((a, i) => `
                                <button class="btn btn-answer rounded-4 p-3 text-start" data-index="${i}">
                                    <span class="answer-letter">${String.fromCharCode(65 + i)}</span>
                                    <span class="answer-text">${a}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="text-center d-flex justify-content-center gap-2">
                        <button class="btn btn-outline-accent rounded-pill px-4" id="skip-question">
                            <i class="bi bi-skip-forward me-2"></i>${t('skip')}
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // ========== РЕЗУЛЬТАТ КВИЗА ==========

    quizResult(result, grade) {
        const totalQuestions = typeof QUIZ_SETTINGS !== 'undefined' ? QUIZ_SETTINGS.totalQuestions : 10;
        return `
            <div class="row justify-content-center">
                <div class="col-lg-6 text-center">
                    <div class="result-icon mb-4 ${grade.color}">
                        <i class="bi bi-${grade.icon} fs-1"></i>
                    </div>
                    <h2 class="fw-bold font-display mb-2">${grade.title}</h2>
                    <p class="text-muted mb-4">${grade.message} ${result.playerName}!</p>
                    <div class="row g-3 mb-4">
                        <div class="col-4">
                            <div class="bg-card rounded-4 p-3">
                                <p class="display-6 fw-bold text-accent mb-0">${result.score}</p>
                                <small class="text-muted">${t('points')}</small>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="bg-card rounded-4 p-3">
                                <p class="display-6 fw-bold text-success mb-0">${result.correctAnswers}/${totalQuestions}</p>
                                <small class="text-muted">${t('correctShort')}</small>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="bg-card rounded-4 p-3">
                                <p class="display-6 fw-bold text-warning mb-0">${typeof formatTime === 'function' ? formatTime(result.totalTime) : result.totalTime}</p>
                                <small class="text-muted">${t('time')}</small>
                            </div>
                        </div>
                    </div>
                    <div class="d-flex flex-wrap justify-content-center gap-3">
                        <button class="btn btn-accent btn-lg rounded-pill px-4" onclick="startQuiz()">
                            <i class="bi bi-arrow-repeat me-2"></i>${t('playAgain') || 'Пройти ещё раз'}
                        </button>
                        <button class="btn btn-outline-accent btn-lg rounded-pill px-4" onclick="showScreen('home')">
                            <i class="bi bi-house me-2"></i>${t('home')}
                        </button>
                        <button class="btn btn-outline-accent btn-lg rounded-pill px-4" id="view-leaderboard">
                            <i class="bi bi-trophy me-2"></i>${t('leaderboard')}
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // ========== ВЫЖИВАНИЕ ==========

    survivalScreen(question, questionNumber, lives, maxLives, difficultyLevel, combo, score, timeLeft) {
        const heartsStr = '❤️'.repeat(lives) + '🖤'.repeat(maxLives - lives);
        let diffColor = 'var(--success)';
        if (difficultyLevel >= 5) diffColor = 'var(--danger)';
        else if (difficultyLevel >= 3) diffColor = 'var(--warning)';

        return `
            <div class="row justify-content-center"><div class="col-lg-7">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <small class="text-muted">💀 ${t('survivalMode')} #${questionNumber + 1}</small>
                    <div><span class="me-2">${heartsStr}</span><small class="text-muted">🏆 ${score}</small></div>
                </div>
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <small style="color: ${diffColor}">⚡ ${t('survivalDifficulty')}: ${difficultyLevel}/10</small>
                    <small class="text-muted">🔥 ${t('survivalCombo')}: x${combo}</small>
                </div>
                <div class="d-flex justify-content-center mb-4">
                    ${typeof createCircularTimer === 'function' ? createCircularTimer(timeLeft) : ''}
                </div>
                <div class="bg-card rounded-4 p-4 p-md-5 mb-4">
                    <span class="badge bg-accent bg-opacity-25 text-accent rounded-pill px-3 py-2 mb-3">
                        ${typeof getCategoryName === 'function' ? getCategoryName(question.category) : question.category} • ${typeof getDifficultyLabel === 'function' ? getDifficultyLabel(question.difficulty) : question.difficulty}
                    </span>
                    <h3 class="fw-bold mb-4">${question.question}</h3>
                    <div class="d-grid gap-3" id="answers-container">
                        ${question.answers.map((a, i) => `
                            <button class="btn btn-answer rounded-4 p-3 text-start" data-index="${i}">
                                <span class="answer-letter">${String.fromCharCode(65 + i)}</span>
                                <span class="answer-text">${a}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div></div>
        `;
    },

    survivalResult(score, questionCount, bestCombo, coins) {
        return `
            <div class="row justify-content-center"><div class="col-lg-6 text-center py-5">
                <h2 class="fw-bold font-display mb-3">💀 ${t('survivalGameOver')}</h2>
                <div class="bg-card rounded-4 p-4 mb-4">
                    <p class="display-3 fw-bold text-accent mb-0">${score}</p>
                    <p class="text-muted">${t('points')}</p>
                    <p class="text-muted">${t('survivalQuestionsAnswered')}: ${questionCount} | ${t('survivalBestCombo')}: x${bestCombo}</p>
                    <p class="text-success">+${coins} 🪙</p>
                </div>
                <button class="btn btn-accent rounded-pill px-4" onclick="startSurvivalMode()">🔄 ${t('survivalPlayAgain')}</button>
                <button class="btn btn-outline-accent rounded-pill px-4 mt-2" onclick="showScreen('home')">🏠 ${t('home')}</button>
            </div></div>
        `;
    },

    // ========== РЕЖИМ НА ВРЕМЯ ==========

    timedScreen(question, currentIndex, score, globalTimeLeft) {
        return `
            <div class="row justify-content-center">
                <div class="col-lg-7">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <small class="text-muted">⏱ ${t('timedMode')}</small>
                        <small class="text-muted">🏆 ${score} ${t('points')}</small>
                    </div>
                    <div class="d-flex justify-content-center mb-4">
                        <div class="timer-circle ${globalTimeLeft <= 10 ? 'timer-danger' : ''}">
                            <span class="timer-text" id="global-timer">${globalTimeLeft}</span>
                        </div>
                    </div>
                    <div class="bg-card rounded-4 p-4 p-md-5 mb-4">
                        <span class="badge bg-accent bg-opacity-25 text-accent rounded-pill px-3 py-2 mb-3">
                            ${typeof getCategoryName === 'function' ? getCategoryName(question.category) : question.category} • ${t('survivalQuestion')} ${currentIndex + 1}
                        </span>
                        <h3 class="fw-bold mb-4">${question.question}</h3>
                        <div class="d-grid gap-3" id="answers-container">
                            ${question.answers.map((a, i) => `
                                <button class="btn btn-answer rounded-4 p-3 text-start" data-index="${i}">
                                    <span class="answer-letter">${String.fromCharCode(65 + i)}</span>
                                    <span class="answer-text">${a}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    timedResult(score) {
        return `
            <div class="row justify-content-center">
                <div class="col-lg-6 text-center py-5">
                    <h2 class="fw-bold font-display mb-3">⏱ ${t('timedGameOver')}</h2>
                    <div class="bg-card rounded-4 p-4 mb-4">
                        <p class="display-3 fw-bold text-accent mb-0">${score}</p>
                        <p class="text-muted">${t('timedScore')}</p>
                    </div>
                    <button class="btn btn-accent rounded-pill px-4" onclick="startTimedMode()">
                        <i class="bi bi-arrow-repeat me-2"></i>${t('survivalPlayAgain')}
                    </button>
                    <button class="btn btn-outline-accent rounded-pill px-4 mt-2" onclick="showScreen('home')">
                        <i class="bi bi-house me-2"></i>${t('home')}
                    </button>
                </div>
            </div>
        `;
    },

    // ========== AI ==========

    aiSelectScreen(profiles) {
        return `
            <div class="row justify-content-center">
                <div class="col-lg-6 text-center py-5">
                    <h2 class="fw-bold font-display mb-4">🤖 ${t('aiTitle')}</h2>
                    <div class="row g-3 mb-4">
                        ${Object.entries(profiles).map(([key, profile]) => `
                            <div class="col-6">
                                <div class="bg-card rounded-4 p-4" onclick="setAIDifficulty('${key}'); startAIDuel();" style="cursor:pointer;">
                                    <span class="fs-1">${profile.icon}</span>
                                    <h5 class="fw-bold mt-2">${profile.name}</h5>
                                    <small class="text-muted">${t('aiAccuracy')}: ${Math.round(profile.accuracy * 100)}%</small>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-outline-accent rounded-pill px-4" onclick="showScreen('home')">🏠 ${t('home')}</button>
                </div>
            </div>
        `;
    },

    // ========== ТАБЛИЦА ЛИДЕРОВ ==========

    leaderboardHeader(difficulty) {
        const labels = { easy: t('easyLevel'), medium: t('mediumLevel'), hard: t('hardLevel') };
        return `
            <div class="text-center mb-4">
                <h2 class="fw-bold font-display mb-2">🏆 ${t('leaderboardTitle')}</h2>
                <p class="text-muted">${labels[difficulty]} <span class="live-dot"></span></p>
            </div>
        `;
    },

    leaderboardTabs() {
        const labels = { easy: t('easyLevel'), medium: t('mediumLevel'), hard: t('hardLevel') };
        return ['easy', 'medium', 'hard'].map(d => {
            const active = (typeof currentLeaderboardDifficulty !== 'undefined' && currentLeaderboardDifficulty === d) ? 'active' : '';
            return `<button class="btn btn-difficulty rounded-pill px-4 ${active}" onclick="switchLeaderboardDifficulty('${d}')">${labels[d]}</button>`;
        }).join('');
    },

    leaderboardEmpty(difficulty) {
        const labels = { easy: t('easyLevel'), medium: t('mediumLevel'), hard: t('hardLevel') };
        return `
            <div class="text-center py-5">
                <i class="bi bi-trophy fs-1 text-muted d-block mb-3"></i>
                <h3 class="fw-bold mb-2">${t('nobodyHere')}</h3>
                <p class="text-muted mb-4">${t('beFirst')} «${labels[difficulty]}»!</p>
                <div class="d-flex gap-2 justify-content-center mb-4">${I18N_TEMPLATES.leaderboardTabs()}</div>
                <button class="btn btn-accent rounded-pill px-4" onclick="showScreen('home')">${t('startQuiz')}</button>
            </div>
        `;
    },

    leaderboardTable(leaders) {
        const medals = ['🥇', '🥈', '🥉'];
        const locale = (typeof currentLocale !== 'undefined') ? currentLocale : 'ru';
        const dateLocale = locale === 'en' ? 'en-US' : 'ru-RU';

        return leaders.map((l, i) => {
            const date = l.date?.seconds ? new Date(l.date.seconds * 1000) : new Date();
            const dateStr = date.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' });
            const isYou = typeof currentUser !== 'undefined' && currentUser && l.userId === currentUser.uid;
            return `
                <tr class="${isYou ? 'table-active-row' : ''}">
                    <td class="ps-3 fw-bold">${i < 3 ? medals[i] : i + 1}</td>
                    <td>
                        <span class="fw-semibold">${l.playerName}</span>
                        ${isYou ? ` <small class="text-accent">(${t('you')})</small>` : ''}
                    </td>
                    <td class="fw-bold">${l.score}</td>
                    <td class="text-muted">${typeof formatTime === 'function' ? formatTime(l.totalTime) : l.totalTime}</td>
                    <td class="text-end pe-3"><small class="text-muted">${dateStr}</small></td>
                </tr>
            `;
        }).join('');
    },

    // ========== МАГАЗИН ==========

    shopHeader() {
        const coins = typeof AppState !== 'undefined' ? AppState.get('coins') : 0;
        const activeTheme = typeof AppState !== 'undefined' ? AppState.get('activeCustomTheme') : null;
        return `
            <div class="text-center mb-4">
                <h2 class="fw-bold font-display mb-2">🛍️ ${t('shopTitle')}</h2>
                <p class="text-muted">${t('shopBalance')}: <span class="text-accent fw-bold">${coins} 🪙</span></p>
                ${activeTheme ? `<button class="btn btn-outline-warning btn-sm rounded-pill px-3 mt-2" onclick="resetTheme()">${t('shopReset')}</button>` : ''}
            </div>
        `;
    },

    shopItemCard(item, purchased, isActive) {
        const name = t('item_' + item.id) || item.name;
        const desc = t('item_' + item.id + '_desc') || item.desc;
        let btnHTML = '';

        if (!purchased) {
            btnHTML = `<button class="btn btn-accent btn-sm rounded-pill px-3 shop-buy-btn" onclick="buyItem('${item.id}')">${item.price} 🪙</button>`;
        } else if (isActive) {
            btnHTML = `<span class="badge bg-success shop-active-badge">✅ ${t('shopActive')}</span>`;
        } else {
            btnHTML = `<button class="btn btn-outline-accent btn-sm rounded-pill px-3 shop-apply-btn" onclick="applyItem('${item.id}')">${t('shopApply')}</button>`;
        }

        return `
            <div class="bg-card rounded-4 p-3 d-flex align-items-center gap-3">
                <span class="fs-2">${item.icon}</span>
                <div class="flex-grow-1 text-start">
                    <p class="fw-bold mb-0">${name} ${isActive ? '✅' : ''}</p>
                    <small class="text-muted">${desc}</small>
                </div>
                ${btnHTML}
            </div>
        `;
    },

    // ========== ДРУЗЬЯ ==========

    friendsHeader(count) {
        return `
            <div class="text-center mb-4">
                <h2 class="fw-bold font-display mb-2">👥 ${t('friendsTitle')}</h2>
                <p class="text-muted">${count} ${t('friendsCount')}</p>
            </div>
        `;
    },

    friendsReferral(code) {
        return `
            <div class="bg-card rounded-4 p-4 mb-4 text-center">
                <p class="text-muted mb-2">${t('referralCode')}</p>
                <h3 class="font-display text-accent mb-2">${code || '————'}</h3>
                <button class="btn btn-outline-accent btn-sm rounded-pill px-3" onclick="copyReferralCode('${code}')">
                    <i class="bi bi-clipboard me-1"></i>${t('copy')}
                </button>
            </div>
        `;
    },

    friendsEmpty() {
        return `<p class="text-muted text-center">${t('noFriends')}</p>`;
    },

    friendsList(friends) {
        return friends.map(f => `
            <div class="d-flex align-items-center gap-3 p-2 rounded-3 bg-card-hover">
                ${f.photoURL
                ? `<img src="${f.photoURL}" width="32" height="32" class="rounded-circle">`
                : `<div class="bg-accent rounded-circle d-flex align-items-center justify-content-center" style="width:32px;height:32px;"><small>${(f.displayName || '?')[0]}</small></div>`
            }
                <span class="flex-grow-1 fw-semibold">${f.displayName || t('player')}</span>
                <button class="btn btn-sm btn-outline-accent rounded-pill px-2" onclick="sendDailyGift('${f.uid}')" title="${t('sendGift')}">🎁</button>
                <button class="btn btn-sm btn-outline-danger rounded-pill px-2" onclick="removeFriend('${f.uid}')" title="${t('remove')}">✕</button>
            </div>
        `).join('');
    },

    // ========== ЗАДАНИЯ ==========

    questsSection(type) {
        const titles = {
            daily: '📋 ' + t('dailyQuests'),
            weekly: '📅 ' + t('weeklyQuests'),
            monthly: '🗓️ ' + t('monthlyQuests')
        };
        const resetInfo = {
            daily: t('resetDaily'),
            weekly: t('resetWeekly'),
            monthly: t('resetMonthly')
        };
        return { title: titles[type], reset: resetInfo[type] };
    },

    questItem(quest, progress, done) {
        const pct = Math.min((progress / quest.target) * 100, 100);
        const questName = t('quest_' + quest.id) || quest.name;
        const questDesc = t('quest_' + quest.id + '_desc') || quest.desc;
        return `
        <div class="quest-item d-flex align-items-center gap-3 p-2 rounded-3 ${done ? 'quest-done' : ''}">
            <span class="fs-4">${quest.icon}</span>
            <div class="flex-grow-1 min-width-0">
                <div class="d-flex justify-content-between align-items-center">
                    <span class="fw-semibold text-truncate ${done ? 'text-success' : ''}">${questName}</span>
                    <small class="text-muted flex-shrink-0 ms-2">+${quest.reward} 🪙</small>
                </div>
                <div class="progress mt-1" style="height:4px;">
                    <div class="progress-bar ${done ? 'bg-success' : 'bg-accent'}" style="width:${pct}%;"></div>
                </div>
                <small class="text-muted">${progress}/${quest.target} • ${questDesc}</small>
            </div>
            ${done ? '<span class="fs-5 flex-shrink-0">✅</span>' : ''}
        </div>
    `;
    },

    // ========== ЧАТ ==========

    chatHeader() {
        return `
            <div class="chat-header">
                <div class="chat-header-left">
                    <span class="chat-header-icon">💬</span>
                    <div>
                        <div class="chat-header-title">${t('chatTitle')}</div>
                        <div class="chat-header-status">
                            <span class="chat-online-dot"></span>
                            <span>${t('online')}</span>
                        </div>
                    </div>
                </div>
                <button class="chat-close-btn" onclick="closeChat()">✕</button>
            </div>
        `;
    },

    chatTabs() {
        const tabs = [
            { room: 'global', icon: t('chatGlobal') },
            { room: 'help', icon: t('chatHelp') },
            { room: 'lfg', icon: t('chatLFG') }
        ];
        return tabs.map(tab => {
            const active = (typeof currentChatRoom !== 'undefined' && currentChatRoom === tab.room) ? 'active' : '';
            return `<button class="chat-tab ${active}" data-room="${tab.room}" onclick="switchChatRoom('${tab.room}')">${tab.icon}</button>`;
        }).join('');
    },

    chatEmpty() {
        return `
            <div class="text-center text-muted py-4">
                <i class="bi bi-chat-dots fs-3 d-block mb-2 opacity-50"></i>
                <small>${t('noMessages')}</small>
            </div>
        `;
    },

    chatLoading() {
        return `
            <div class="text-center text-muted py-4">
                <small>${t('loadingMessages')}</small>
            </div>
        `;
    },

    // ========== СТАТИСТИКА ==========

    statsHeader() {
        return `
            <div class="text-center mb-4">
                <h2 class="fw-bold font-display mb-2">📊 ${t('statsTitle')}</h2>
                <p class="text-muted">${t('yourPath')}</p>
            </div>
        `;
    },

    statsCards(stats, achCount, achTotal) {
        return `
            <div class="row g-3 mb-4">
                <div class="col-6 col-md-3">
                    <div class="bg-card rounded-4 p-3 text-center">
                        <p class="display-6 fw-bold text-accent mb-0">${stats.totalQuizzes || 0}</p>
                        <small class="text-muted">${t('totalQuizzes')}</small>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="bg-card rounded-4 p-3 text-center">
                        <p class="display-6 fw-bold text-warning mb-0">${stats.bestScore || 0}</p>
                        <small class="text-muted">${t('bestScore')}</small>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="bg-card rounded-4 p-3 text-center">
                        <p class="display-6 fw-bold text-success mb-0">${stats.dayStreak || 0}</p>
                        <small class="text-muted">${t('dayStreak')}</small>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="bg-card rounded-4 p-3 text-center">
                        <p class="display-6 fw-bold text-info mb-0">${achCount}/${achTotal}</p>
                        <small class="text-muted">${t('achievements')}</small>
                    </div>
                </div>
            </div>
        `;
    },

    // ========== ДОСТИЖЕНИЯ ==========

    achievementsHeader(count, total) {
        return `
            <div class="text-center mb-4">
                <h2 class="fw-bold font-display mb-2">🏆 ${t('achievementsTitle')}</h2>
                <p class="text-muted">${t('unlocked')}: ${count} ${t('of')} ${total}</p>
            </div>
        `;
    },

    playerLevelCard(level, progress, xpProgress) {
        return `
            <div class="bg-card rounded-4 p-4 mb-4">
                <h5 class="fw-bold mb-3">🎮 ${t('playerProgress')}</h5>
                <div class="d-flex align-items-center gap-2 mb-2">
                    <span class="fs-4">${level.icon}</span>
                    <span class="fw-bold" style="color:${level.color}">${typeof getLevelName === 'function' ? getLevelName(level) : level.name}</span>
                    <small class="text-muted ms-2">${t('level')} ${level.level}</small>
                </div>
                <div class="progress" style="height:6px;">
                    <div class="progress-bar" style="width:${progress}%;background:${level.color};"></div>
                </div>
                <small class="text-muted">${xpProgress}</small>
            </div>
        `;
    },
};

console.log('✅ I18N_TEMPLATES создан успешно');