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

    const uidCounts = new Map();
    const nicknameOwners = new Map();
    for (const user of users) {
        const uid = user?.uid;
        if (typeof uid === 'string') uidCounts.set(uid, (uidCounts.get(uid) || 0) + 1);
        const nickname = user?.data?.nickname;
        if (typeof nickname === 'string' && /^[A-Za-z0-9_]{3,20}$/.test(nickname)) {
            const lower = nickname.toLowerCase();
            nicknameOwners.set(lower, (nicknameOwners.get(lower) || 0) + 1);
        }
    }

    const writes = [];
    const skipped = [];
    const conflicts = [];
    const invalid = [];
    // No first-wins behavior: every colliding identity stays quarantined.
    for (const user of users) {
        const uid = user?.uid;
        if (typeof uid !== 'string' || uidCounts.get(uid) !== 1) {
            invalid.push({ uid: typeof uid === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(uid) ? uid : null,
                reason: 'invalid_or_duplicate_uid' });
            continue;
        }
        try {
            const publicRecord = buildPublicProfile(uid, user.data);
            if (nicknameOwners.get(publicRecord.nicknameLower) !== 1) {
                conflicts.push(uid);
            } else if (!existing.has(uid)) {
                writes.push({ path: `publicProfiles/${uid}`, data: publicRecord });
            } else if (samePublicRecord(existing.get(uid), publicRecord)) {
                skipped.push(uid);
            } else {
                conflicts.push(uid);
            }
        } catch {
            invalid.push({ uid: /^[A-Za-z0-9_-]{1,128}$/.test(uid) ? uid : null,
                reason: 'invalid_profile' });
        }
    }
    writes.sort((a, b) => a.path.localeCompare(b.path));
    skipped.sort();
    conflicts.sort();
    invalid.sort((a, b) => String(a.uid).localeCompare(String(b.uid)) || a.reason.localeCompare(b.reason));

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
