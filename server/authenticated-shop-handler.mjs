const ALLOWED = new Set(['purchase', 'equip']);
const FIELDS = {
    purchase: new Set(['itemId', 'operationId']),
    equip: new Set(['itemId'])
};

export function createAuthenticatedShopHandler({ service }) {
    if (!service || typeof service.purchase !== 'function') throw new Error('INVALID_SHOP_SERVICE');
    return async function handleShopRequest(operation, data, context) {
        const uid = context?.auth?.uid;
        if (typeof uid !== 'string' || !uid.trim()) throw new Error('AUTH_REQUIRED');
        if (!Number.isSafeInteger(context?.now) || context.now < 0) throw new Error('INVALID_SERVER_TIME');
        if (!ALLOWED.has(operation)) throw new Error('UNKNOWN_SHOP_OPERATION');
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('INVALID_SHOP_REQUEST');
        if (Object.keys(data).some(key => !FIELDS[operation].has(key))) throw new Error('UNEXPECTED_SHOP_FIELD');
        if (operation === 'equip') return service.equip({ uid, itemId: data.itemId });
        return service.purchase({ uid, itemId: data.itemId, operationId: data.operationId });
    };
}
