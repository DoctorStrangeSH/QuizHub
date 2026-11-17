// Read-only migration planner. It NEVER talks to Firestore.
// A separate, reviewed operation must later apply the vetted plan.
const UID = /^[A-Za-z0-9_-]{1,128}$/;
const NICKNAME = /^[A-Za-z0-9_]{3,20}$/;

export function planNicknameClaimBackfill(users, currentClaims = [], { batchSize = 400 } = {}) {
    if (!Array.isArray(users) || !Array.isArray(currentClaims)) throw new TypeError('Expected snapshot arrays');
    if (!Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > 400) {
        throw new RangeError('Batch size must be between 1 and 400');
    }
    const invalid = [];
    const conflicts = [];
    const skipped = [];
    const writes = [];
    const uidCounts = new Map();
    for (const user of users) {
        if (typeof user?.uid === 'string') uidCounts.set(user.uid, (uidCounts.get(user.uid) || 0) + 1);
    }

    const nicknameOwners = new Map();
    const candidates = [];
    for (const user of users) {
        const uid = user?.uid;
        const name = user?.data?.nickname;
        const lower = user?.data?.nicknameLower;
        if (typeof uid !== 'string' || !UID.test(uid) || uidCounts.get(uid) !== 1 ||
            typeof name !== 'string' || !NICKNAME.test(name) ||
            typeof lower !== 'string' || lower !== name.toLowerCase()) {
            invalid.push({ uid: typeof uid === 'string' && UID.test(uid) ? uid : null, reason: 'invalid_or_duplicate_profile' });
            continue;
        }
        const entry = { uid, normalized: lower };
        candidates.push(entry);
        if (!nicknameOwners.has(lower)) nicknameOwners.set(lower, []);
        nicknameOwners.get(lower).push(uid);
    }
    const existing = new Map();
    for (const claim of currentClaims) {
        const name = claim?.normalized;
        if (typeof name !== 'string' || !/^[a-z0-9_]{3,20}$/.test(name) || existing.has(name) ||
            typeof claim?.uid !== 'string' || !UID.test(claim.uid)) {
            invalid.push({ uid: null, reason: 'invalid_or_duplicate_existing_claim' });
            // A malformed duplicate must never be silently ignored.
            if (typeof name === 'string') existing.set(name, { blocked: true });
            continue;
        }
        existing.set(name, { uid: claim.uid });
    }
    for (const candidate of candidates.sort((a, b) => a.normalized.localeCompare(b.normalized) || a.uid.localeCompare(b.uid))) {
        const { uid, normalized } = candidate;
        const owners = nicknameOwners.get(normalized);
        if (owners.length !== 1) {
            conflicts.push({ normalized, uid, reason: 'duplicate_nickname' });
            continue;
        }
        const claim = existing.get(normalized);
        if (claim?.blocked || (claim && claim.uid !== uid)) {
            conflicts.push({ normalized, uid, reason: 'claim_owned_by_another_user' });
        } else if (claim) {
            skipped.push(uid);
        } else {
            writes.push({ path: 'nicknameClaims/' + normalized, data: { uid } });
        }
    }
    const batches = [];
    for (let i = 0; i < writes.length; i += batchSize) batches.push(writes.slice(i, i + batchSize));
    return {
        sourceCount: users.length,
        claimCount: currentClaims.length,
        writeCount: writes.length,
        skippedCount: skipped.length,
        conflictCount: conflicts.length,
        invalidCount: invalid.length,
        batches, skipped, conflicts, invalid
    };
}
