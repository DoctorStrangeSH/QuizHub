/**
 * Emulator-only transport for trusted profile creation.
 * The callable derives UID and email from verified Firebase Auth.
 */
export function createFirebaseProfileCreateInvoker({
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
        throw new Error('INVALID_PROFILE_CREATE_CONFIGURATION');
    }

    const params = new URLSearchParams(location.search);
    const optedIn = ['localhost', '127.0.0.1'].includes(location.hostname) &&
        params.get('firebaseEmulator') === '1' &&
        params.get('profileCreatePreview') === '1';
    if (!optedIn || auth.app?.options?.projectId !== 'demo-quizhub') {
        throw new Error('PROFILE_CREATE_PREVIEW_EMULATOR_REQUIRED');
    }
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
        throw new Error('SIGNED_IN_ACCOUNT_REQUIRED');
    }

    const functions = getFunctions(auth.app, 'europe-west1');
    connectFunctionsEmulator(functions, emulatorHost, emulatorPort);
    const callable = httpsCallable(functions, 'profileCreatePreview');

    return async function createProfile(nickname) {
        if (typeof nickname !== 'string' || !/^[A-Za-z0-9_]{3,20}$/.test(nickname)) {
            throw new Error('INVALID_NICKNAME');
        }
        const response = await callable({ nickname });
        const result = response?.data;
        if (!result || result.status !== 'created' ||
            result.uid !== auth.currentUser.uid || result.nickname !== nickname) {
            throw new Error('INVALID_PROFILE_CREATE_RECEIPT');
        }
        return { status: 'created', nickname: result.nickname };
    };
}
