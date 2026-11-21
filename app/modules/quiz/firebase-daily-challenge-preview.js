import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js';
import { auth } from '../../firebase-config.js';
import { createFirebaseDailyChallengeInvoker } from './firebase-daily-challenge-invoker.js';

export function createLocalFirebaseDailyChallengeInvoker() {
    return createFirebaseDailyChallengeInvoker({
        auth, getFunctions, connectFunctionsEmulator, httpsCallable,
        location: window.location
    });
}
