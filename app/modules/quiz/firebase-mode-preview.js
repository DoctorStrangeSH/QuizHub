import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js';
import { auth } from '../../firebase-config.js';
import { createFirebaseModeInvoker } from './firebase-mode-invoker.js';

export function createLocalFirebaseModeInvoker() {
    return createFirebaseModeInvoker({
        auth,
        getFunctions,
        connectFunctionsEmulator,
        httpsCallable,
        location: window.location
    });
}
