import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js';
import { auth } from '../../firebase-config.js';
import { createFirebaseProfileCreateInvoker } from './firebase-profile-create-invoker.js';

export function createLocalFirebaseProfileCreateInvoker() {
    return createFirebaseProfileCreateInvoker({
        auth,
        getFunctions,
        connectFunctionsEmulator,
        httpsCallable,
        location: window.location
    });
}
