import { auth, functions, httpsCallable } from '../../firebase-config.js';
import { createFirebaseProfileTimeZoneInvoker } from './firebase-profile-timezone-invoker.js';

export function createLocalFirebaseProfileTimeZoneInvoker() {
    return createFirebaseProfileTimeZoneInvoker({
        auth,
        functions,
        httpsCallable,
        location: window.location
    });
}
