import { validateShopCallableRequest } from './shop-callable-request.js';

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
        const validatedPayload = validateShopCallableRequest(operation, payload);
        return callable({ operation, payload: validatedPayload });
    };
}
