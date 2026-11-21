import { isProfileTimeZonePreviewEnabled, isValidIanaTimeZone } from './profile-timezone-settings.js';

/**
 * Emulator-only callable transport. Firebase dependencies are injected so the
 * authorization boundary can be unit-tested without browser/network imports.
 */
export function createFirebaseProfileTimeZoneInvoker({
    auth,
    functions,
    httpsCallable,
    location
} = {}) {
    if (!isProfileTimeZonePreviewEnabled(location, auth)) {
        throw new Error('PROFILE_TIMEZONE_PREVIEW_EMULATOR_REQUIRED');
    }
    if (typeof httpsCallable !== 'function' || !functions) {
        throw new Error('INVALID_PROFILE_TIMEZONE_CONFIGURATION');
    }

    const callable = httpsCallable(functions, 'profileTimeZonePreview');
    return async function updateProfileTimeZone(timeZone) {
        if (!isValidIanaTimeZone(timeZone)) throw new Error('INVALID_TIME_ZONE');
        const ownerUid = auth.currentUser?.uid;
        if (!ownerUid || auth.currentUser?.isAnonymous) {
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
