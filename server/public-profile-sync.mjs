import { buildPublicProfile } from '../app/modules/profile/public-profile-data.js';

// Server-only projection. Pass a trusted Firebase Admin Firestore instance.
// The browser must never be allowed to publish its own ranking fields.
export async function syncPublicProfile(db, uid) {
    if (!db || typeof db.runTransaction !== 'function' || typeof db.collection !== 'function') {
        throw new TypeError('A trusted Firestore adapter is required');
    }
    if (typeof uid !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) {
        throw new TypeError('Invalid UID');
    }
    const privateRef = db.collection('users').doc(uid);
    const publicRef = db.collection('publicProfiles').doc(uid);
    return db.runTransaction(async transaction => {
        // Read both snapshots before any transaction writes.
        const privateSnap = await transaction.get(privateRef);
        if (!privateSnap.exists) {
            return { status: 'missing', uid };
        }
        const publicSnap = await transaction.get(publicRef);
        const projection = buildPublicProfile(uid, privateSnap.data());
        const existing = publicSnap.exists ? publicSnap.data() : null;
        if (existing && Object.keys(existing).length === Object.keys(projection).length &&
            Object.keys(projection).every(key => existing[key] === projection[key])) {
            return { status: 'unchanged', uid };
        }
        // Overwrite, never merge: purge extraneous legacy fields such as email/coins.
        transaction.set(publicRef, projection);
        return { status: existing ? 'updated' : 'created', uid };
    });
}
