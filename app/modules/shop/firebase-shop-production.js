import { validateShopCallableRequest } from './shop-callable-request.js';

/**
 * Production transport for the authenticated shop callable.
 * This module is intentionally not wired into the live shop UI until the
 * callable is deployed and the coordinated client/Rules cutover is approved.
 */
export function createFirebaseShopProductionInvoker({ auth, functions, httpsCallable }) {
    if (!auth || !functions || typeof httpsCallable !== 'function') {
        throw new Error('INVALID_SHOP_CONFIGURATION');
    }

    const callable = httpsCallable(functions, 'shopPurchase');

    return async function invokeShop(operation, payload) {
        const user = auth.currentUser;
        if (!user || typeof user.uid !== 'string' || !user.uid.trim()) {
            throw new Error('AUTH_REQUIRED');
        }

        const validatedPayload = validateShopCallableRequest(operation, payload);
        return callable({ operation, payload: validatedPayload });
    };
}
