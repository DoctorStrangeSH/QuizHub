/**
 * Emulator-only transport for trusted achievement evaluation.
 * Progress and achievement IDs are never accepted from the browser.
 */
export function createFirebaseAchievementInvoker({
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
        throw new Error('INVALID_ACHIEVEMENT_CONFIGURATION');
    }

    const params = new URLSearchParams(location.search);
    const localHost = ['localhost', '127.0.0.1'].includes(location.hostname);
    const optedIntoEmulators = localHost &&
        params.get('firebaseEmulator') === '1' &&
        params.get('achievementPreview') === '1';
    if (!optedIntoEmulators || auth.app?.options?.projectId !== 'demo-quizhub') {
        throw new Error('ACHIEVEMENT_PREVIEW_EMULATOR_REQUIRED');
    }

    const functions = getFunctions(auth.app, 'europe-west1');
    connectFunctionsEmulator(functions, emulatorHost, emulatorPort);
    const callable = httpsCallable(functions, 'achievementUnlockPreview');

    return async function invokeAchievementEvaluation(payload = { operation: 'evaluate', payload: {} }) {
        if (!payload || typeof payload !== 'object' || Array.isArray(payload) ||
            Object.keys(payload).some(key => !['operation', 'payload'].includes(key)) ||
            payload.operation !== 'evaluate' ||
            !payload.payload || typeof payload.payload !== 'object' ||
            Array.isArray(payload.payload) || Object.keys(payload.payload).length !== 0) {
            throw new Error('INVALID_ACHIEVEMENT_REQUEST');
        }
        return callable(payload);
    };
}

/**
 * Accepts only a well-formed server receipt and returns newly unlocked IDs.
 * No client-side progress evaluation or persistence occurs here.
 */
export async function evaluateAchievementsPreview(invoke, catalog) {
    if (typeof invoke !== 'function' || !Array.isArray(catalog)) {
        throw new Error('INVALID_ACHIEVEMENT_PREVIEW');
    }
    const response = await invoke();
    const receipt = response?.data;
    if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt) ||
        !Array.isArray(receipt.unlocked) ||
        !Array.isArray(receipt.newlyUnlocked) ||
        typeof receipt.alreadyUnlocked !== 'boolean') {
        throw new Error('INVALID_ACHIEVEMENT_RECEIPT');
    }
    const allowed = new Set(catalog.map(item => item?.id).filter(id => typeof id === 'string'));
    const unique = new Set(receipt.newlyUnlocked);
    if (unique.size !== receipt.newlyUnlocked.length ||
        receipt.newlyUnlocked.some(id => typeof id !== 'string' || !allowed.has(id) || !receipt.unlocked.includes(id)) ||
        receipt.unlocked.some(id => typeof id !== 'string' || !allowed.has(id)) ||
        receipt.alreadyUnlocked !== (receipt.newlyUnlocked.length === 0)) {
        throw new Error('INVALID_ACHIEVEMENT_RECEIPT');
    }
    return receipt.newlyUnlocked;
}
