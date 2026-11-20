import { buildPublicProfile } from '../app/modules/profile/public-profile-data.js';

// Firestore Standard backend adapter for trusted quiz sessions.
// No browser access: only Firebase Admin may instantiate this adapter.
// Sessions contain canonical answer keys and MUST NOT be readable or writable
// by a client until explicit deny-by-default Firestore rules are deployed.
const UID = /^[^/\x00-\x1f]{1,256}$/;
const SESSION_ID = /^[A-Za-z0-9_-]{1,128}$/;

function requireUid(uid) {
    if (typeof uid !== 'string' || !UID.test(uid) || uid === '.' || uid === '..') {
        throw new Error('INVALID_STORAGE_UID');
    }
    return uid;
}

function requireSessionId(sessionId) {
    if (typeof sessionId !== 'string' || !SESSION_ID.test(sessionId)) {
        throw new Error('INVALID_STORAGE_SESSION_ID');
    }
    return sessionId;
}

const data = snapshot => snapshot.exists ? snapshot.data() : null;

export function createQuizFirestoreStore(db, { syncPublicProfiles = false } = {}) {
    if (!db || typeof db.runTransaction !== 'function' || typeof db.collection !== 'function') {
        throw new Error('INVALID_FIRESTORE_ADAPTER');
    }
    const sessionRef = id => db.collection('quizSessions').doc(requireSessionId(id));
    const userRef = uid => db.collection('users').doc(requireUid(uid));
    const publicRef = uid => db.collection('publicProfiles').doc(requireUid(uid));
    const achievementFactsRef = uid => db.collection('achievementFacts').doc(requireUid(uid));
    const achievementReceiptRef = (uid, id) => {
        if (typeof id !== 'string' || !/^[a-z0-9_]{1,64}$/.test(id)) throw new Error('INVALID_ACHIEVEMENT_ID');
        return db.collection('achievementUnlockReceipts').doc(requireUid(uid)).collection('unlocks').doc(id);
    };

    return {
        runTransaction(callback) {
            if (typeof callback !== 'function') throw new Error('INVALID_TRANSACTION_CALLBACK');
            return db.runTransaction(async native => {
                return callback({
                    getSession: async id => data(await native.get(sessionRef(id))),
                    setSession: async (id, value) => {
                        // Server-generated canonical session, receipt and claim marker.
                        native.set(sessionRef(id), value);
                    },
                    getAchievementFacts: async uid => data(await native.get(achievementFactsRef(uid))),
                    setAchievementFacts: async (uid, facts) => {
                        if (!facts || typeof facts !== 'object' || Array.isArray(facts) ||
                            Object.keys(facts).some(key => !['totalGames', 'experience', 'level'].includes(key)) ||
                            !Number.isSafeInteger(facts.totalGames) || facts.totalGames < 0 ||
                            !Number.isSafeInteger(facts.experience) || facts.experience < 0 ||
                            (facts.level !== undefined && (!Number.isSafeInteger(facts.level) || facts.level < 1))) {
                            throw new Error('INVALID_ACHIEVEMENT_FACTS');
                        }
                        native.set(achievementFactsRef(uid), facts);
                    },
                    createAchievementReceipts: async (uid, ids) => {
                        if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string' || !/^[a-z0-9_]{1,64}$/.test(id))) {
                            throw new Error('INVALID_ACHIEVEMENT_RECEIPT');
                        }
                        for (const id of ids) native.create(achievementReceiptRef(uid, id), {
                            achievementId: id,
                            unlockedAt: new Date()
                        });
                    },
                    getUser: async uid => {
                        const user = data(await native.get(userRef(uid)));
                        if (syncPublicProfiles && user) {
                            // Firestore transactions must finish all reads before any write.
                            await native.get(publicRef(uid));
                        }
                        return user;
                    },
                    setUser: async (uid, value) => {
                        if (!value || !value.stats) throw new Error('INVALID_USER_STATS');
                        // Update only authoritative reward fields. Do not replace
                        // private profile, friends, settings or unrecognized fields.
                        const fields = {
                            experience: value.experience,
                            weeklyExperience: value.weeklyExperience,
                            coins: value.coins,
                            quizzesCompleted: value.quizzesCompleted,
                            'stats.totalGames': value.stats.totalGames,
                            'stats.totalQuestions': value.stats.totalQuestions,
                            'stats.correctAnswers': value.stats.correctAnswers,
                            achievements: Array.isArray(value.achievements) ? value.achievements : []
                        };
                        // Optional mode-specific counters are written only when
                        // present; Classic reward claims must not send undefined
                        // values to Firestore update().
                        if (Number.isSafeInteger(value.wins)) fields.wins = value.wins;
                        if (Number.isSafeInteger(value.stats.totalWins)) {
                            fields['stats.totalWins'] = value.stats.totalWins;
                        }
                        if (Number.isSafeInteger(value.stats.bestStreak)) {
                            fields['stats.bestStreak'] = value.stats.bestStreak;
                        }
                        native.update(userRef(uid), fields);
                        if (syncPublicProfiles && typeof value.nickname === 'string' &&
                            /^[A-Za-z0-9_]{3,20}$/.test(value.nickname)) {
                            // Same native transaction as the credit and claim marker.
                            // Replace rather than merge so legacy secrets cannot linger.
                            native.set(publicRef(uid), buildPublicProfile(uid, value));
                        }
                    }
                });
            });
        }
    };
}
