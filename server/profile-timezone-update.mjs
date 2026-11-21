import { normalizeQuizTimeZone } from './quiz-event-rewards.mjs';

/**
 * Updates only the authenticated player's private timezone preference.
 * This value controls server-side event-local time; it never changes balances,
 * progress, public profile data or any other user-owned field.
 */
export async function updatePlayerTimeZone(db, { uid, timeZone } = {}) {
    if (!db || typeof db.collection !== 'function' || typeof db.runTransaction !== 'function') {
        throw new TypeError('TRUSTED_DATABASE_REQUIRED');
    }
    if (typeof uid !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) {
        throw new Error('INVALID_UID');
    }
    const normalizedTimeZone = normalizeQuizTimeZone(timeZone);
    const userRef = db.collection('users').doc(uid);

    return db.runTransaction(async transaction => {
        const snapshot = await transaction.get(userRef);
        if (!snapshot.exists) throw new Error('USER_NOT_FOUND');
        transaction.update(userRef, { timeZone: normalizedTimeZone });
        return { status: 'updated', uid, timeZone: normalizedTimeZone };
    });
}
