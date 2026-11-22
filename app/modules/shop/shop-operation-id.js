const pendingInMemory = new Map();
const OPERATION_ID = /^shop_[A-Za-z0-9_-]{8,128}$/;

function storageKey(uid, itemId) {
    if (typeof uid !== 'string' || !uid.trim() ||
        typeof itemId !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(itemId)) {
        throw new Error('INVALID_SHOP_OPERATION_SCOPE');
    }
    return `quizhub:shop:pending:${encodeURIComponent(uid)}:${itemId}`;
}

/**
 * Reuse one operation ID for a user/item until a valid server receipt confirms
 * the outcome. This makes a manual retry after a lost response idempotent.
 * Storage is best-effort; the in-memory fallback still protects same-tab retries.
 */
export function getOrCreateShopOperationId({ uid, itemId, storage, randomUUID }) {
    if (typeof randomUUID !== 'function') throw new Error('SECURE_OPERATION_ID_UNAVAILABLE');
    const key = storageKey(uid, itemId);
    const memoryValue = pendingInMemory.get(key);
    if (typeof memoryValue === 'string' && OPERATION_ID.test(memoryValue)) return memoryValue;

    let stored;
    try { stored = storage?.getItem(key); } catch { /* use memory fallback */ }
    if (typeof stored === 'string' && OPERATION_ID.test(stored)) {
        pendingInMemory.set(key, stored);
        return stored;
    }

    const uuid = randomUUID();
    if (typeof uuid !== 'string' || !/^[A-Za-z0-9_-]{8,128}$/.test(uuid)) {
        throw new Error('INVALID_SHOP_OPERATION_ID');
    }
    const operationId = `shop_${uuid}`;
    pendingInMemory.set(key, operationId);
    try { storage?.setItem(key, operationId); } catch { /* use memory fallback */ }
    return operationId;
}

export function clearShopOperationId({ uid, itemId, storage }) {
    const key = storageKey(uid, itemId);
    pendingInMemory.delete(key);
    try { storage?.removeItem(key); } catch { /* memory entry is already cleared */ }
}
