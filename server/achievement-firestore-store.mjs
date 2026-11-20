const UID = /^[^/\\x00-\\x1f]{1,256}$/;
const data = snapshot => snapshot.exists ? snapshot.data() : null;
function requireUid(uid) {
    if (typeof uid !== 'string' || !UID.test(uid) || uid === '.' || uid === '..') throw new Error('INVALID_ACHIEVEMENT_UID');
    return uid;
}

export function createAchievementFirestoreStore(db) {
    if (!db || typeof db.runTransaction !== 'function' || typeof db.collection !== 'function') {
        throw new Error('INVALID_ACHIEVEMENT_FIRESTORE');
    }
    const userRef = uid => db.collection('users').doc(requireUid(uid));
    const factsRef = uid => db.collection('achievementFacts').doc(requireUid(uid));
    const receiptRef = (uid, id) => db.collection('achievementUnlockReceipts').doc(requireUid(uid)).collection('unlocks').doc(id);
    return {
        runTransaction(callback) {
            if (typeof callback !== 'function') throw new Error('INVALID_TRANSACTION_CALLBACK');
            return db.runTransaction(async native => callback({
                getAchievementFacts: async uid => data(await native.get(factsRef(uid))),
                getUser: async uid => data(await native.get(userRef(uid))),
                setUserPatch: async (uid, patch) => {
                    if (!patch || typeof patch !== 'object' || Array.isArray(patch) ||
                        Object.keys(patch).some(key => key !== 'achievements') ||
                        !Array.isArray(patch.achievements)) throw new Error('FORBIDDEN_ACHIEVEMENT_PATCH');
                    native.update(userRef(uid), patch);
                },
                createUnlockReceipts: async (uid, ids) => {
                    if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string')) throw new Error('INVALID_ACHIEVEMENT_RECEIPT');
                    for (const id of ids) native.create(receiptRef(uid, id), { achievementId: id, unlockedAt: new Date() });
                }
            }));
        }
    };
}
