const UID = /^[^/\\x00-\\x1f]{1,256}$/;
const OPERATION_ID = /^[A-Za-z0-9_-]{8,128}$/;
const data = snapshot => snapshot.exists ? snapshot.data() : null;
const requireUid = uid => {
    if (typeof uid !== 'string' || !UID.test(uid) || uid === '.' || uid === '..') throw new Error('INVALID_STORAGE_UID');
    return uid;
};

export function createShopFirestoreStore(db) {
    if (!db || typeof db.runTransaction !== 'function' || typeof db.collection !== 'function') {
        throw new Error('INVALID_SHOP_FIRESTORE_ADAPTER');
    }
    const userRef = uid => db.collection('users').doc(requireUid(uid));
    const purchaseRef = (uid, operationId) => {
        if (typeof operationId !== 'string' || !OPERATION_ID.test(operationId)) throw new Error('INVALID_STORAGE_OPERATION_ID');
        return db.collection('shopPurchaseRequests').doc(requireUid(uid)).collection('requests').doc(operationId);
    };

    return {
        runTransaction(callback) {
            if (typeof callback !== 'function') throw new Error('INVALID_TRANSACTION_CALLBACK');
            return db.runTransaction(async native => callback({
                getUser: async uid => data(await native.get(userRef(uid))),
                getPurchase: async (uid, operationId) => data(await native.get(purchaseRef(uid, operationId))),
                setUserPatch: async (uid, patch) => {
                    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('INVALID_USER_PATCH');
                    const allowed = new Set(['coins', 'ownedThemes', 'equippedTheme', 'ownedFrames', 'equippedFrame', 'ownedParticles', 'equippedParticles', 'activeBonuses']);
                    if (Object.keys(patch).some(key => !allowed.has(key))) throw new Error('FORBIDDEN_USER_PATCH');
                    native.update(userRef(uid), patch);
                },
                setPurchase: async (uid, operationId, receipt) => {
                    native.create(purchaseRef(uid, operationId), receipt);
                }
            }));
        }
    };
}
