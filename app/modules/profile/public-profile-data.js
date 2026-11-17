// Explicit, privacy-safe projection for a future publicProfiles/{uid} collection.
// Do not spread Firestore user documents into public records.
const PUBLIC_FIELDS = Object.freeze([
    'uid', 'nickname', 'nicknameLower', 'level', 'experience',
    'weeklyExperience', 'wins', 'equippedFrame'
]);

function safeCount(value) {
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

export function buildPublicProfile(uid, privateProfile) {
    if (typeof uid !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) {
        throw new TypeError('Invalid profile UID');
    }
    const nickname = privateProfile?.nickname;
    if (typeof nickname !== 'string' || !/^[A-Za-z0-9_]{3,20}$/.test(nickname)) {
        throw new TypeError('Invalid public nickname');
    }
    return {
        uid,
        nickname,
        nicknameLower: nickname.toLowerCase(),
        level: Math.max(1, safeCount(privateProfile.level)),
        experience: safeCount(privateProfile.experience),
        weeklyExperience: safeCount(privateProfile.weeklyExperience),
        wins: safeCount(privateProfile.wins),
        equippedFrame: typeof privateProfile.equippedFrame === 'string' &&
            /^frame_[a-z0-9_]{1,40}$/.test(privateProfile.equippedFrame)
            ? privateProfile.equippedFrame : 'frame_default'
    };
}

export function publicProfileFields() {
    return [...PUBLIC_FIELDS];
}
