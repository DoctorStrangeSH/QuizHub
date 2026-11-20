import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js';
import { auth } from '../../firebase-config.js';
import { createFirebaseClassicInvoker } from './firebase-classic-invoker.js';

export function createLocalFirebaseClassicInvoker() {
    return createFirebaseClassicInvoker({
        auth, getFunctions, connectFunctionsEmulator, httpsCallable,
        location: window.location
    });
}
