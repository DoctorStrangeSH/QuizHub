import { buildPublicProfile } from '../app/modules/profile/public-profile-data.js';

function samePublicRecord(a, b) {
    if (!a || !b) return false;
    return Object.keys(a).length === Object.keys(b).length &&
        Object.keys(a).every(key => a[key] === b[key]);
}

// Pure dry-run planner: no Firebase SDK, credentials or database writes.
// Existing divergent public records are reported, never silently overwritten.
export function planPublicProfileBackfill(users, existingPublic = [], { batchSize = 400 } = {}) {
    if (!Array.isArray(users) || !Array.isArray(existingPublic)) {
        throw new TypeError('Expected snapshot arrays');
    }
    if (!Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > 400) {
        throw new RangeError('Batch size must be between 1 and 400');
    }

    const existing = new Map();
    for (const record of existingPublic) {
        if (typeof record?.uid !== 'string' || existing.has(record.uid)) {
            throw new TypeError('Invalid or duplicate existing public UID');
        }
        existing.set(record.uid, record.data);
    }

    const seen = new Set();
    const writes = [];
    const skipped = [];
    const conflicts = [];
    const invalid = [];
    for (const user of users) {
        const uid = user?.uid;
        if (typeof uid !== 'string' || seen.has(uid)) {
            invalid.push({ uid: typeof uid === 'string' ? uid : null, reason: 'invalid_or_duplicate_uid' });
            continue;
        }
        seen.add(uid);
        try {
            const publicRecord = buildPublicProfile(uid, user.data);
            if (!existing.has(uid)) {
                writes.push({ path: `publicProfiles/${uid}`, data: publicRecord });
            } else if (samePublicRecord(existing.get(uid), publicRecord)) {
                skipped.push(uid);
            } else {
                conflicts.push(uid);
            }
        } catch {
            invalid.push({ uid, reason: 'invalid_profile' });
        }
    }

    const batches = [];
    for (let i = 0; i < writes.length; i += batchSize) {
        batches.push(writes.slice(i, i + batchSize));
    }
    return {
        sourceCount: users.length,
        writeCount: writes.length,
        skippedCount: skipped.length,
        conflictCount: conflicts.length,
        invalidCount: invalid.length,
        skipped, conflicts, invalid, batches
    };
}
