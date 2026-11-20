/**
 * Creates the Firebase Functions transport for the isolated quiz-mode preview.
 * All SDK functions are injected so this module stays testable without a browser.
 * Production hosts are deliberately rejected: quizModePreview is emulator-only.
 */
export function createFirebaseModeInvoker({
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
        throw new Error('INVALID_FIREBASE_MODE_CONFIGURATION');
    }

    const params = new URLSearchParams(location.search);
    const localHost = ['localhost', '127.0.0.1'].includes(location.hostname);
    const optedIntoEmulators = localHost && params.get('firebaseEmulator') === '1';
    if (!optedIntoEmulators || auth.app?.options?.projectId !== 'demo-quizhub') {
        throw new Error('MODE_PREVIEW_EMULATOR_REQUIRED');
    }

    const functions = getFunctions(auth.app, 'europe-west1');
    connectFunctionsEmulator(functions, emulatorHost, emulatorPort);
    const callable = httpsCallable(functions, 'quizModePreview');

    return async function invokeModeCallable(payload) {
        if (!payload || typeof payload !== 'object' || Array.isArray(payload) ||
            Object.keys(payload).some(key => !['operation', 'payload'].includes(key)) ||
            typeof payload.operation !== 'string' ||
            !payload.payload || typeof payload.payload !== 'object' || Array.isArray(payload.payload)) {
            throw new Error('INVALID_MODE_REQUEST');
        }
        return callable(payload);
    };
}
