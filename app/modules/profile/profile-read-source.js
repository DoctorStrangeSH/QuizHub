import { buildPublicProfile } from './public-profile-data.js';

// One migration gate for every directory-style read.
// Keep disabled until publicProfiles is fully backfilled and security rules
// have been verified against all profile/friends/leaderboard queries.
export const PUBLIC_PROFILE_READS_ENABLED = false;

export function directoryCollection() {
    return PUBLIC_PROFILE_READS_ENABLED ? 'publicProfiles' : 'users';
}

export function profileCollectionForViewer(viewerUid, targetUid) {
    // Private account data is needed for the owner's own profile and settings.
    // After cutover, foreign profile cards must never fetch users/{otherUid}.
    return viewerUid && viewerUid === targetUid ? 'users' : directoryCollection();
}


// Legacy directory queries still fetch users/{uid} until the migration.
// Never pass a foreign private account record into UI renderers or callers.
export function projectProfileForViewer(viewerUid, targetUid, rawProfile) {
    if (!rawProfile || typeof rawProfile !== 'object' || Array.isArray(rawProfile)) {
        throw new TypeError('INVALID_PROFILE_DATA');
    }
    if (viewerUid && viewerUid === targetUid) {
        // The Firestore document path, not an editable payload field, owns identity.
        return { ...rawProfile, uid: targetUid };
    }
    return buildPublicProfile(targetUid, rawProfile);
}

// Shared boundary for friends search, friend lists and leaderboard entries.
// Firestore still downloads legacy private users until the cutover gate opens;
// this boundary ensures only the explicit public allowlist reaches UI code.
export function projectDirectoryProfile(uid, rawProfile) {
    return buildPublicProfile(uid, rawProfile);
}
