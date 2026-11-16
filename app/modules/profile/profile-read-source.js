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
