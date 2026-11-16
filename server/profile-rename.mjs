import { buildPublicProfile } from '../app/modules/profile/public-profile-data.js';

// Server-side migration contract. Do not expose until every existing nickname
// has an owned nicknameClaims/{normalizedNickname} reservation.
export async function renameProfile(db, { uid, nickname }) {
    if (!db || typeof db.runTransaction !== 'function' || typeof db.collection !== 'function') {
        throw new TypeError('TRUSTED_DATABASE_REQUIRED');
    }
    if (typeof uid !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) {
        throw new Error('INVALID_UID');
    }
    if (typeof nickname !== 'string' || !/^[A-Za-z0-9_]{3,20}$/.test(nickname)) {
        throw new Error('INVALID_NICKNAME');
    }
    const normalized = nickname.toLowerCase();
    const userRef = db.collection('users').doc(uid);
    const targetClaim = db.collection('nicknameClaims').doc(normalized);
    const publicRef = db.collection('publicProfiles').doc(uid);

    return db.runTransaction(async tx => {
        const userSnapshot = await tx.get(userRef);
        if (!userSnapshot.exists) throw new Error('PROFILE_NOT_FOUND');
        const user = userSnapshot.data();
        const previous = user.nicknameLower;
        if (typeof previous !== 'string' || !/^[a-z0-9_]{3,20}$/.test(previous) ||
            previous !== String(user.nickname || '').toLowerCase()) {
            throw new Error('PROFILE_MIGRATION_REQUIRED');
        }
        const oldClaim = db.collection('nicknameClaims').doc(previous);
        // All reads precede writes (Firestore transaction requirement).
        const oldClaimSnapshot = await tx.get(oldClaim);
        const targetSnapshot = previous === normalized ? oldClaimSnapshot : await tx.get(targetClaim);
        if (!oldClaimSnapshot.exists || oldClaimSnapshot.data().uid !== uid) {
            throw new Error('PROFILE_MIGRATION_REQUIRED');
        }
        if (targetSnapshot.exists && targetSnapshot.data().uid !== uid) {
            throw new Error('NICKNAME_TAKEN');
        }
        if (user.nickname === nickname) return { status: 'unchanged', nickname };
        const next = { ...user, nickname, nicknameLower: normalized };
        const publicProjection = buildPublicProfile(uid, next);
        tx.update(userRef, { nickname, nicknameLower: normalized });
        tx.set(publicRef, publicProjection);
        if (previous !== normalized) {
            if (!targetSnapshot.exists) tx.create(targetClaim, { uid });
            tx.delete(oldClaim);
        }
        return { status: 'updated', nickname };
    });
}
