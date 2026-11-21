/**
 * Local browser transport for the server-owned Daily Challenge.
 * The preview is opt-in and cannot connect outside the demo Firebase emulators.
 */
export function createFirebaseDailyChallengeInvoker({
    auth, getFunctions, connectFunctionsEmulator, httpsCallable, location,
    emulatorHost = '127.0.0.1', emulatorPort = 5001
}) {
    if (!auth || typeof getFunctions !== 'function' ||
        typeof connectFunctionsEmulator !== 'function' || typeof httpsCallable !== 'function' ||
        !location || typeof location.hostname !== 'string' || typeof location.search !== 'string') {
        throw new Error('INVALID_DAILY_CHALLENGE_CONFIGURATION');
    }
    const params = new URLSearchParams(location.search);
    const allowed = ['localhost', '127.0.0.1'].includes(location.hostname) &&
        params.get('firebaseEmulator') === '1' &&
        params.get('dailyChallengePreview') === '1';
    if (!allowed || auth.app?.options?.projectId !== 'demo-quizhub') {
        throw new Error('DAILY_CHALLENGE_PREVIEW_EMULATOR_REQUIRED');
    }

    const functions = getFunctions(auth.app, 'europe-west1');
    connectFunctionsEmulator(functions, emulatorHost, emulatorPort);
    const callable = httpsCallable(functions, 'dailyChallenge');
    const allowedFields = Object.freeze({
        start: ['language'],
        resume: ['date', 'language'],
        answer: ['date', 'questionId', 'answerIndex', 'language'],
        complete: ['date']
    });

    return async function invokeDailyChallenge(request) {
        if (!request || typeof request !== 'object' || Array.isArray(request) ||
            Object.keys(request).some(key => !['operation', 'payload'].includes(key)) ||
            !Object.hasOwn(allowedFields, request.operation) ||
            !request.payload || typeof request.payload !== 'object' || Array.isArray(request.payload) ||
            Object.keys(request.payload).some(key => !allowedFields[request.operation].includes(key))) {
            throw new Error('INVALID_DAILY_CHALLENGE_REQUEST');
        }
        return callable(request);
    };
}
