import { buildPublicProfile } from '../app/modules/profile/public-profile-data.js';

const UID = /^[A-Za-z0-9_-]{1,128}$/;
const NICKNAME = /^[A-Za-z0-9_]{3,20}$/;

// Pure, read-only release gate for legacy accounts. Nothing here can write to
// Firestore or mutate source snapshots. Reports never include private values.
export function auditLegacyAccountMigration({
    users, claims, publicProfiles, authUids
}) {
    if (![users, claims, publicProfiles, authUids].every(Array.isArray)) {
        throw new TypeError('COMPLETE_SNAPSHOTS_REQUIRED');
    }
    const issues = [];
    const add = (uid, code, severity) => issues.push({ uid, code, severity });
    const usersById = new Map();
    const publicById = new Map();
    const claimsByName = new Map();
    const authIds = new Set();
    const ownersByName = new Map();

    for (const uid of authUids) {
        if (typeof uid !== 'string' || !UID.test(uid) || authIds.has(uid)) {
            add(null, 'INVALID_OR_DUPLICATE_AUTH_UID', 'block');
        } else authIds.add(uid);
    }
    for (const entry of users) {
        const uid = entry?.uid;
        if (typeof uid !== 'string' || !UID.test(uid) || usersById.has(uid)) {
            add(UID.test(String(uid)) ? uid : null, 'INVALID_OR_DUPLICATE_USER', 'block');
            continue;
        }
        usersById.set(uid, entry.data);
        const nickname = entry.data?.nickname;
        if (typeof nickname === 'string' && NICKNAME.test(nickname)) {
            const normalized = nickname.toLowerCase();
            if (!ownersByName.has(normalized)) ownersByName.set(normalized, []);
            ownersByName.get(normalized).push(uid);
        }
    }
    for (const entry of claims) {
        const name = entry?.normalized;
        if (typeof name !== 'string' || !/^[a-z0-9_]{3,20}$/.test(name) ||
            claimsByName.has(name) || typeof entry.uid !== 'string' || !UID.test(entry.uid)) {
            add(null, 'INVALID_OR_DUPLICATE_CLAIM', 'block');
            continue;
        }
        claimsByName.set(name, entry.uid);
    }
    for (const entry of publicProfiles) {
        const uid = entry?.uid;
        if (typeof uid !== 'string' || !UID.test(uid) || publicById.has(uid)) {
            add(UID.test(String(uid)) ? uid : null, 'INVALID_OR_DUPLICATE_PUBLIC_PROFILE', 'block');
            continue;
        }
        publicById.set(uid, entry.data);
    }

    for (const [name, owners] of ownersByName) {
        if (owners.length > 1) {
            for (const uid of owners) add(uid, 'DUPLICATE_NICKNAME', 'block');
        }
    }
    for (const [uid, profile] of usersById) {
        if (!authIds.has(uid)) add(uid, 'AUTH_IDENTITY_MISSING', 'block');
        const nickname = profile?.nickname;
        if (typeof nickname !== 'string' || !NICKNAME.test(nickname) ||
            profile.nicknameLower !== nickname.toLowerCase()) {
            add(uid, 'INVALID_LEGACY_NICKNAME', 'block');
            continue;
        }
        const normalized = nickname.toLowerCase();
        if (!claimsByName.has(normalized)) {
            add(uid, 'NICKNAME_CLAIM_MISSING', 'backfill');
        } else if (claimsByName.get(normalized) !== uid) {
            add(uid, 'NICKNAME_CLAIM_WRONG_OWNER', 'block');
        }
        let expected;
        try { expected = buildPublicProfile(uid, profile); }
        catch {
            add(uid, 'PUBLIC_PROJECTION_INVALID', 'block');
            continue;
        }
        if (!publicById.has(uid)) {
            add(uid, 'PUBLIC_PROFILE_MISSING', 'backfill');
        } else {
            const actual = publicById.get(uid);
            if (!actual || typeof actual !== 'object' ||
                Object.keys(actual).length !== Object.keys(expected).length ||
                Object.keys(expected).some(key => actual[key] !== expected[key])) {
                add(uid, 'PUBLIC_PROFILE_MISMATCH_OR_PRIVATE_FIELDS', 'block');
            }
        }
    }
    for (const uid of authIds) {
        if (!usersById.has(uid)) add(uid, 'AUTH_WITHOUT_PROFILE', 'review');
    }
    for (const [uid] of publicById) {
        if (!usersById.has(uid)) add(uid, 'ORPHAN_PUBLIC_PROFILE', 'block');
    }
    for (const [name, uid] of claimsByName) {
        const user = usersById.get(uid);
        if (!user || user.nicknameLower !== name || user.nickname?.toLowerCase() !== name) {
            add(uid, 'ORPHAN_OR_STALE_CLAIM', 'block');
        }
    }
    const severityRank = { block: 0, review: 1, backfill: 2 };
    issues.sort((a, b) => severityRank[a.severity] - severityRank[b.severity] ||
        String(a.uid).localeCompare(String(b.uid)) || a.code.localeCompare(b.code));
    const blockerCount = issues.filter(x => x.severity === 'block').length;
    const reviewCount = issues.filter(x => x.severity === 'review').length;
    const backfillCount = issues.filter(x => x.severity === 'backfill').length;
    return {
        status: blockerCount || reviewCount ? 'blocked' : backfillCount ? 'needs_backfill' : 'ready',
        counts: {
            users: users.length, authIdentities: authUids.length,
            publicProfiles: publicProfiles.length, claims: claims.length,
            blockerCount, reviewCount, backfillCount
        },
        issues
    };
}
