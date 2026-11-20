/**
 * Transport for the daily-login reward preview.
 * The callable is available only in the isolated local Firebase emulator.
 */
export function createFirebaseDailyLoginInvoker({
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
        throw new Error('INVALID_DAILY_LOGIN_CONFIGURATION');
    }

    const params = new URLSearchParams(location.search);
    const localHost = ['localhost', '127.0.0.1'].includes(location.hostname);
    const optedIntoEmulators = localHost &&
        params.get('firebaseEmulator') === '1' &&
        params.get('dailyLoginPreview') === '1';
    if (!optedIntoEmulators || auth.app?.options?.projectId !== 'demo-quizhub') {
        throw new Error('DAILY_LOGIN_PREVIEW_EMULATOR_REQUIRED');
    }

    const functions = getFunctions(auth.app, 'europe-west1');
    connectFunctionsEmulator(functions, emulatorHost, emulatorPort);
    const callable = httpsCallable(functions, 'dailyLoginRewardPreview');

    return async function invokeDailyLogin(payload = { operation: 'claim', payload: {} }) {
        if (!payload || typeof payload !== 'object' || Array.isArray(payload) ||
            Object.keys(payload).some(key => !['operation', 'payload'].includes(key)) ||
            payload.operation !== 'claim' ||
            !payload.payload || typeof payload.payload !== 'object' ||
            Array.isArray(payload.payload) || Object.keys(payload.payload).length !== 0) {
            throw new Error('INVALID_DAILY_LOGIN_REQUEST');
        }
        return callable(payload);
    };
}

/**
 * Validates and adapts the trusted receipt to the legacy popup's reward shape.
 * This helper deliberately does not calculate or grant a reward.
 */
export async function claimDailyLoginPreview(invoke, rewards) {
    if (typeof invoke !== 'function' || !Array.isArray(rewards) || rewards.length !== 7) {
        throw new Error('INVALID_DAILY_LOGIN_PREVIEW');
    }
    const response = await invoke();
    const receipt = response?.data;
    if (!receipt || receipt.alreadyClaimed) return false;
    if (!Number.isSafeInteger(receipt.streak) || receipt.streak < 1) {
        throw new Error('INVALID_DAILY_LOGIN_RECEIPT');
    }
    const reward = rewards[Math.min(receipt.streak - 1, rewards.length - 1)];
    if (!reward || receipt.coins !== reward.coins ||
        !Number.isSafeInteger(receipt.balance) || receipt.balance < receipt.coins) {
        throw new Error('INVALID_DAILY_LOGIN_RECEIPT');
    }
    return { ...reward, day: receipt.streak, balance: receipt.balance };
}
