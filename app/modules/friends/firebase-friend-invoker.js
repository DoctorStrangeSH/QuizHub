/**
 * Browser transport for the trusted friendship callable.
 * It can connect only to the local demo Auth/Firestore/Functions emulators.
 */
export function createFirebaseFriendInvoker({
    auth, getFunctions, connectFunctionsEmulator, httpsCallable, location,
    emulatorHost = '127.0.0.1', emulatorPort = 5001
}) {
    if (!auth || typeof getFunctions !== 'function' ||
        typeof connectFunctionsEmulator !== 'function' || typeof httpsCallable !== 'function' ||
        !location || typeof location.hostname !== 'string' || typeof location.search !== 'string') {
        throw new Error('INVALID_FRIENDSHIP_CONFIGURATION');
    }
    const params = new URLSearchParams(location.search);
    const allowed = ['localhost', '127.0.0.1'].includes(location.hostname) &&
        params.get('firebaseEmulator') === '1' &&
        params.get('friendshipPreview') === '1';
    if (!allowed || auth.app?.options?.projectId !== 'demo-quizhub') {
        throw new Error('FRIENDSHIP_PREVIEW_EMULATOR_REQUIRED');
    }
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
        throw new Error('SIGNED_IN_ACCOUNT_REQUIRED');
    }

    const functions = getFunctions(auth.app, 'europe-west1');
    connectFunctionsEmulator(functions, emulatorHost, emulatorPort);
    const callable = httpsCallable(functions, 'friendRelationshipPreview');
    return async function invokeFriendship(request) {
        const allowedOperations = new Set(['send', 'accept', 'decline', 'cancel', 'remove']);
        if (!request || typeof request !== 'object' || Array.isArray(request) ||
            Object.keys(request).length !== 2 ||
            Object.keys(request).some(key => !['operation', 'targetUid'].includes(key)) ||
            !allowedOperations.has(request.operation) ||
            typeof request.targetUid !== 'string' ||
            !/^[A-Za-z0-9_-]{1,128}$/.test(request.targetUid) ||
            request.targetUid === auth.currentUser?.uid) {
            throw new Error('INVALID_FRIENDSHIP_REQUEST');
        }
        if (!auth.currentUser || auth.currentUser.isAnonymous) {
            throw new Error('SIGNED_IN_ACCOUNT_REQUIRED');
        }
        return callable(request);
    };
}
