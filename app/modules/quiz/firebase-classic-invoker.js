/**
 * Emulator-only transport for authenticated Classic server sessions.
 * The server owns canonical questions, answer keys, scoring and reward claims.
 */
export function createFirebaseClassicInvoker({
    auth, getFunctions, connectFunctionsEmulator, httpsCallable, location,
    emulatorHost = '127.0.0.1', emulatorPort = 5001
}) {
    if (!auth || typeof getFunctions !== 'function' ||
        typeof connectFunctionsEmulator !== 'function' || typeof httpsCallable !== 'function' ||
        !location || typeof location.hostname !== 'string' || typeof location.search !== 'string') {
        throw new Error('INVALID_CLASSIC_CONFIGURATION');
    }
    const params = new URLSearchParams(location.search);
    const allowed = ['localhost', '127.0.0.1'].includes(location.hostname) &&
        params.get('firebaseEmulator') === '1' && params.get('serverModePreview') === '1';
    if (!allowed || auth.app?.options?.projectId !== 'demo-quizhub') {
        throw new Error('CLASSIC_PREVIEW_EMULATOR_REQUIRED');
    }
    const functions = getFunctions(auth.app, 'europe-west1');
    connectFunctionsEmulator(functions, emulatorHost, emulatorPort);
    const callable = httpsCallable(functions, 'quizSessionPreview');
    return async function invoke(payload) {
        if (!payload || typeof payload !== 'object' || Array.isArray(payload) ||
            Object.keys(payload).some(key => !['operation', 'payload'].includes(key)) ||
            !['start', 'answer', 'resume', 'complete'].includes(payload.operation) ||
            !payload.payload || typeof payload.payload !== 'object' || Array.isArray(payload.payload)) {
            throw new Error('INVALID_CLASSIC_REQUEST');
        }
        return callable(payload);
    };
}
