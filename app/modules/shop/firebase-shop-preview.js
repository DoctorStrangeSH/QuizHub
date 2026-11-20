import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js';
import { auth } from '../../firebase-config.js';
import { createFirebaseShopInvoker } from './firebase-shop-invoker.js';

export function createLocalFirebaseShopInvoker() {
    return createFirebaseShopInvoker({
        auth,
        getFunctions,
        connectFunctionsEmulator,
        httpsCallable,
        location: window.location
    });
}
