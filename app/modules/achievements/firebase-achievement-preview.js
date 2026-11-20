import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js';
import { auth } from '../../firebase-config.js';
import { createFirebaseAchievementInvoker } from './firebase-achievement-invoker.js';

export function createLocalFirebaseAchievementInvoker() {
    return createFirebaseAchievementInvoker({
        auth,
        getFunctions,
        connectFunctionsEmulator,
        httpsCallable,
        location: window.location
    });
}
