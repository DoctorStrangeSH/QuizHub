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

export function createQuizFirestoreStore(db) {
    if (!db || typeof db.runTransaction !== 'function' || typeof db.collection !== 'function') {
        throw new Error('INVALID_FIRESTORE_ADAPTER');
    }
    const sessionRef = id => db.collection('quizSessions').doc(requireSessionId(id));
    const userRef = uid => db.collection('users').doc(requireUid(uid));

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
                    getUser: async uid => data(await native.get(userRef(uid))),
                    setUser: async (uid, value) => {
                        if (!value || !value.stats) throw new Error('INVALID_USER_STATS');
                        // Update only authoritative reward fields. Do not replace
                        // private profile, friends, settings or unrecognized fields.
                        native.update(userRef(uid), {
                            experience: value.experience,
                            weeklyExperience: value.weeklyExperience,
                            coins: value.coins,
                            quizzesCompleted: value.quizzesCompleted,
                            'stats.totalGames': value.stats.totalGames,
                            'stats.totalQuestions': value.stats.totalQuestions,
                            'stats.correctAnswers': value.stats.correctAnswers
                        });
                    }
                });
            });
        }
    };
}
