const ITEM_ID = /^[A-Za-z0-9_-]{1,80}$/;
const OPERATION_ID = /^[A-Za-z0-9_-]{8,128}$/;

export function validateShopCallableRequest(operation, payload) {
    if (!['purchase', 'equip'].includes(operation) ||
        !payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new Error('INVALID_SHOP_REQUEST');
    }

    const allowed = operation === 'purchase' ? ['itemId', 'operationId'] : ['itemId'];
    if (Object.keys(payload).some(key => !allowed.includes(key)) ||
        typeof payload.itemId !== 'string' || !ITEM_ID.test(payload.itemId) ||
        (operation === 'purchase' &&
            (typeof payload.operationId !== 'string' || !OPERATION_ID.test(payload.operationId)))) {
        throw new Error('INVALID_SHOP_REQUEST');
    }

    return operation === 'purchase'
        ? { itemId: payload.itemId, operationId: payload.operationId }
        : { itemId: payload.itemId };
}
