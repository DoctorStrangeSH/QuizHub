import { auth, functions, httpsCallable } from '../../firebase-config.js';
import { isProfileTimeZonePreviewEnabled, isValidIanaTimeZone } from './profile-timezone-settings.js';

/**
 * The timezone preference transport is deliberately emulator-only until the
 * production callable and Rules/client cutover receive separate approval.
 */
export function createLocalFirebaseProfileTimeZoneInvoker({
    currentAuth = auth,
    functionsInstance = functions,
    callableFactory = httpsCallable,
    location = window.location
} = {}) {
    if (!isProfileTimeZonePreviewEnabled(location, currentAuth)) {
        throw new Error('PROFILE_TIMEZONE_PREVIEW_EMULATOR_REQUIRED');
    }
    if (typeof callableFactory !== 'function' || !functionsInstance) {
        throw new Error('INVALID_PROFILE_TIMEZONE_CONFIGURATION');
    }

    const callable = callableFactory(functionsInstance, 'profileTimeZonePreview');
    return async function updateProfileTimeZone(timeZone) {
        if (!isValidIanaTimeZone(timeZone)) throw new Error('INVALID_TIME_ZONE');
        const ownerUid = currentAuth.currentUser?.uid;
        if (!ownerUid || currentAuth.currentUser?.isAnonymous) {
            throw new Error('SIGNED_IN_ACCOUNT_REQUIRED');
        }
        const response = await callable({ timeZone });
        const result = response?.data;
        if (!result || result.status !== 'updated' ||
            result.uid !== ownerUid || result.timeZone !== timeZone) {
            throw new Error('INVALID_PROFILE_TIMEZONE_RECEIPT');
        }
        return { status: 'updated', timeZone: result.timeZone };
    };
}
