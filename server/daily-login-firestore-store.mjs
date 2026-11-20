const UID = /^[^/\\x00-\\x1f]{1,256}$/;
const DATE = /^\\d{4}-\\d{2}-\\d{2}$/;
function parseKey(key) {
    let parts;
    try { parts = JSON.parse(key); } catch { throw new Error('INVALID_DAILY_LOGIN_KEY'); }
    if (!Array.isArray(parts) || parts.length !== 2) throw new Error('INVALID_DAILY_LOGIN_KEY');
    const [date, uid] = parts;
    if (typeof date !== 'string' || !DATE.test(date) ||
        new Date(date + 'T00:00:00.000Z').toISOString().slice(0, 10) !== date) {
        throw new Error('INVALID_DAILY_LOGIN_DATE');
    }
    if (typeof uid !== 'string' || !UID.test(uid) || uid === '.' || uid === '..') {
        throw new Error('INVALID_DAILY_LOGIN_UID');
    }
    return { date, uid };
}
const data = snapshot => snapshot.exists ? snapshot.data() : null;

export function createDailyLoginFirestoreStore(db) {
    if (!db || typeof db.runTransaction !== 'function' || typeof db.collection !== 'function') {
        throw new Error('INVALID_DAILY_LOGIN_FIRESTORE');
    }
    const userRef = uid => {
        if (typeof uid !== 'string' || !UID.test(uid) || uid === '.' || uid === '..') throw new Error('INVALID_DAILY_LOGIN_UID');
        return db.collection('users').doc(uid);
    };
    const claimRef = key => {
        const { date, uid } = parseKey(key);
        return db.collection('dailyLoginClaims').doc(date).collection('users').doc(uid);
    };
    return {
        runTransaction(callback) {
            if (typeof callback !== 'function') throw new Error('INVALID_TRANSACTION_CALLBACK');
            return db.runTransaction(async native => callback({
                getDailyLoginClaim: async key => data(await native.get(claimRef(key))),
                getUser: async uid => data(await native.get(userRef(uid))),
                setUserPatch: async (uid, patch) => {
                    const allowed = new Set(['coins', 'dailyStreak', 'lastDailyClaim']);
                    if (!patch || typeof patch !== 'object' || Object.keys(patch).some(k => !allowed.has(k))) {
                        throw new Error('FORBIDDEN_DAILY_LOGIN_PATCH');
                    }
                    native.update(userRef(uid), patch);
                },
                setDailyLoginClaim: async (key, receipt) => {
                    native.create(claimRef(key), receipt);
                }
            }));
        }
    };
}
