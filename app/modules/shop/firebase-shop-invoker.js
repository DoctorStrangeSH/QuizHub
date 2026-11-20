/**
 * Shop callable transport is restricted to the isolated local demo project.
 * No caller-supplied price, owner UID or bonus duration is accepted.
 */
export function createFirebaseShopInvoker({
    auth,
    getFunctions,
    connectFunctionsEmulator,
    httpsCallable,
    location,
    emulatorHost = '127.0.0.1',
    emulatorPort = 5001
}) {
    if (!auth || typeof getFunctions !== 'function' ||
        typeof connectFunctionsEmulator !== 'function' ||
        typeof httpsCallable !== 'function' ||
        !location || typeof location.hostname !== 'string' ||
        typeof location.search !== 'string') {
        throw new Error('INVALID_SHOP_CONFIGURATION');
    }

    const params = new URLSearchParams(location.search);
    const localHost = ['localhost', '127.0.0.1'].includes(location.hostname);
    const optedIntoEmulators = localHost &&
        params.get('firebaseEmulator') === '1' &&
        params.get('shopPreview') === '1';
    if (!optedIntoEmulators || auth.app?.options?.projectId !== 'demo-quizhub') {
        throw new Error('SHOP_PREVIEW_EMULATOR_REQUIRED');
    }

    const functions = getFunctions(auth.app, 'europe-west1');
    connectFunctionsEmulator(functions, emulatorHost, emulatorPort);
    const callable = httpsCallable(functions, 'shopPurchasePreview');

    return async function invokeShop(operation, payload) {
        if (!['purchase', 'equip'].includes(operation) ||
            !payload || typeof payload !== 'object' || Array.isArray(payload)) {
            throw new Error('INVALID_SHOP_REQUEST');
        }
        const allowed = operation === 'purchase' ? ['itemId', 'operationId'] : ['itemId'];
        if (Object.keys(payload).some(key => !allowed.includes(key)) ||
            typeof payload.itemId !== 'string' || !payload.itemId ||
            (operation === 'purchase' &&
                (typeof payload.operationId !== 'string' || !/^[A-Za-z0-9_-]{8,128}$/.test(payload.operationId)))) {
            throw new Error('INVALID_SHOP_REQUEST');
        }
        return callable({ operation, payload });
    };
}
