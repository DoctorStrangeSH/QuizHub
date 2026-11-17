// Firebase Admin Firestore adapter for the backend-only Daily Challenge contracts.
// Requires an authenticated Admin Firestore instance, not the browser SDK.
// Never initialize this module in a client bundle or grant browser writes here.
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const UID = /^[^/\x00-\x1f]{1,256}$/;

function dateId(date) {
    if (typeof date !== 'string' || !DAY.test(date) ||
        Number.isNaN(Date.parse(date + 'T00:00:00Z')) ||
        new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) !== date) {
        throw new Error('INVALID_DAILY_STORAGE_DATE');
    }
    return date;
}

function playerKey(key) {
    let parts;
    try { parts = JSON.parse(key); } catch { throw new Error('INVALID_DAILY_STORAGE_KEY'); }
    if (!Array.isArray(parts) || parts.length !== 2) throw new Error('INVALID_DAILY_STORAGE_KEY');
    const [date, uid] = parts;
    dateId(date);
    if (typeof uid !== 'string' || !UID.test(uid) || uid === '.' || uid === '..') {
        throw new Error('INVALID_DAILY_STORAGE_UID');
    }
    return { date, uid };
}

export function createDailyFirestoreStore(db) {
    if (!db || typeof db.runTransaction !== 'function' || typeof db.collection !== 'function') {
        throw new Error('INVALID_FIRESTORE_ADAPTER');
    }
    const attempt = (key) => {
        const { date, uid } = playerKey(key);
        return db.collection('dailyAttempts').doc(date).collection('users').doc(uid);
    };
    const prize = (key) => {
        const { date, uid } = playerKey(key);
        return db.collection('dailyPrizes').doc(date).collection('users').doc(uid);
    };
    const ranking = date => db.collection('dailyRankings').doc(dateId(date));
    const receipt = (date, uid) =>
        db.collection('dailyReceipts').doc(dateId(date)).collection('users').doc(uid);
    const user = uid => {
        if (typeof uid !== 'string' || !UID.test(uid)) throw new Error('INVALID_DAILY_STORAGE_UID');
        return db.collection('users').doc(uid);
    };
    const data = snapshot => snapshot.exists ? snapshot.data() : null;

    return {
        runTransaction(callback) {
            if (typeof callback !== 'function') throw new Error('INVALID_TRANSACTION_CALLBACK');
            return db.runTransaction(async native => {
                const tx = {
                    getDailyAttempt: async key => data(await native.get(attempt(key))),
                    setDailyAttempt: async (key, value) => {
                        const ref = attempt(key);
                        native.set(ref, value);
                        if (value?.receipt) {
                            const { date, uid } = playerKey(key);
                            native.set(receipt(date, uid), value.receipt);
                        }
                    },
                    getDailyPrize: async key => data(await native.get(prize(key))),
                    setDailyPrize: async (key, value) => { native.set(prize(key), value); },
                    getDailyRanking: async date => data(await native.get(ranking(date))),
                    setDailyRanking: async (date, value) => { native.create(ranking(date), value); },
                    getDailyReceipts: async date => {
                        const query = db.collection('dailyReceipts').doc(dateId(date)).collection('users');
                        const snapshots = await native.get(query);
                        return snapshots.docs.map(document => document.data());
                    },
                    getUser: async uid => data(await native.get(user(uid))),
                    setUser: async (uid, value) => {
                        // Restrict reward updates to economy fields and preserve existing
                        // profile metadata, preferences and unknown future user fields.
                        native.update(user(uid), {
                            experience: value.experience,
                            weeklyExperience: value.weeklyExperience,
                            coins: value.coins
                        });
                    }
                };
                return callback(tx);
            });
        }
    };
}
