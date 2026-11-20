import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js';
import { auth } from '../../firebase-config.js';
import { createFirebaseDailyLoginInvoker } from './firebase-daily-login-invoker.js';

export function createLocalFirebaseDailyLoginInvoker() {
    return createFirebaseDailyLoginInvoker({
        auth,
        getFunctions,
        connectFunctionsEmulator,
        httpsCallable,
        location: window.location
    });
}
