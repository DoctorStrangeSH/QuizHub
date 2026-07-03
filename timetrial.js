import { getState } from '../../store/state.js';
import { auth, db, doc, getDoc, updateDoc, collection, query, where, getDocs, arrayUnion, arrayRemove, onSnapshot } from '../../firebase-config.js';

export function renderFriends() {
    const t = getState().translations.friends || {};
    
    return `
        <div class="friends-container">
            <div class="friends-header glass-card animate-in">
                <div class="d-flex align-items-center gap-3">
                    <button class="btn btn-icon glass-card" onclick="window.navigateTo('home')">←</button>
                    <h3 class="mb-0 fw-bold">${t.title || 'Друзья'}</h3>
                </div>
            </div>
            
            <!-- Поиск друзей -->
            <div class="search-section glass-card animate-in animate-in-delay-1">
                <div class="input-group-custom">
                    <input type="text" id="friend-search-input" class="input-glass" 
                           placeholder="${t.searchPlaceholder || 'Поиск...'}" />
                    <button id="search-friend-btn" class="btn-premium">${t.search || 'Поиск'}</button>
                </div>
                <div id="search-results" class="search-results mt-3"></div>
            </div>
            
            <!-- Вкладки -->
            <div class="friends-tabs glass-card animate-in animate-in-delay-2">
                <div class="tab-buttons">
                    <button class="tab-btn active" data-tab="friends">${t.myFriends || 'Друзья'}</button>
                    <button class="tab-btn" data-tab="requests">${t.requests || 'Заявки'}</button>
                    <button class="tab-btn" data-tab="sent">${t.sent || 'Отправленные'}</button>
                </div>
                <div id="tab-content" class="tab-content mt-3"></div>
            </div>
        </div>
    `;
}

export function attachFriendsListeners() {
    const user = auth.currentUser;
    if (!user) return;
    
    loadFriendsList(user);
    loadRequests(user);
    setupSearch(user);
    setupTabs(user);
}

async function loadFriendsList(user) {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return;
    
    const friends = userDoc.data().friends || [];
    const tabContent = document.getElementById('tab-content');
    
    if (friends.length === 0) {
        tabContent.innerHTML = `
            <div class="text-center py-4">
                <span class="empty-icon">👥</span>
                <p class="text-secondary mt-2">У вас пока нет друзей</p>
            </div>
        `;
        return;
    }
    
    // Загружаем данные друзей
    const friendsData = [];
    for (const friendId of friends) {
        const friendDoc = await getDoc(doc(db, 'users', friendId));
        if (friendDoc.exists()) {
            friendsData.push({ id: friendId, ...friendDoc.data() });
        }
    }
    
    tabContent.innerHTML = friendsData.map(f => `
        <div class="friend-item glass-card">
            <div class="d-flex align-items-center gap-3">
                <div class="avatar-circle">👤</div>
                <div>
                    <span class="fw-semibold">${f.nickname}</span>
                    <span class="text-secondary small ms-2">Ур. ${f.level || 1}</span>
                </div>
            </div>
            <button class="btn-remove" onclick="window.removeFriend('${f.id}')">Удалить</button>
        </div>
    `).join('');
}

async function loadRequests(user) {
    // Будет загружено при переключении вкладок
}

function setupSearch(user) {
    const searchBtn = document.getElementById('search-friend-btn');
    const searchInput = document.getElementById('search-friend-input');
    const resultsDiv = document.getElementById('search-results');
    
    searchBtn.onclick = async () => {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) return;
        
        resultsDiv.innerHTML = '<p class="text-secondary small">Поиск...</p>';
        
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('nicknameLower', '>=', query), 
                        where('nicknameLower', '<=', query + '\uf8ff'));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            resultsDiv.innerHTML = '<p class="text-secondary small">Никого не найдено</p>';
            return;
        }
        
        resultsDiv.innerHTML = '';
        snapshot.forEach(doc => {
            if (doc.id !== user.uid) {
                const data = doc.data();
                resultsDiv.innerHTML += `
                    <div class="search-result-item glass-card">
                        <div class="d-flex align-items-center gap-2">
                            <span class="fw-semibold">${data.nickname}</span>
                            <span class="text-secondary small">Ур. ${data.level || 1}</span>
                        </div>
                        <button class="btn-premium btn-sm" onclick="window.sendFriendRequest('${doc.id}')">
                            Добавить
                        </button>
                    </div>
                `;
            }
        });
    };
}

function setupTabs(user) {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const tabName = tab.dataset.tab;
            
            if (tabName === 'friends') loadFriendsList(user);
            else if (tabName === 'requests') loadFriendRequests(user);
            else if (tabName === 'sent') loadSentRequests(user);
        };
    });
}

// Глобальные функции для кнопок
window.sendFriendRequest = async (friendId) => {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        await updateDoc(doc(db, 'users', friendId), {
            friendRequests: arrayUnion(user.uid)
        });
        await updateDoc(doc(db, 'users', user.uid), {
            sentRequests: arrayUnion(friendId)
        });
        alert('Заявка отправлена!');
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
};

window.removeFriend = async (friendId) => {
    const user = auth.currentUser;
    if (!user || !confirm('Удалить из друзей?')) return;
    
    try {
        await updateDoc(doc(db, 'users', user.uid), {
            friends: arrayRemove(friendId)
        });
        await updateDoc(doc(db, 'users', friendId), {
            friends: arrayRemove(user.uid)
        });
        loadFriendsList(user);
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
};