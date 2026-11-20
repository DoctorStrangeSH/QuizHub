// Repository-derived Firestore inventory, NOT a live database enumeration.
// Snapshot keys are flat manifest labels for verifyLegacyDataPreservation.
// A collector must recursively enumerate every matching nested path.
export const QUIZHUB_FIRESTORE_INVENTORY = Object.freeze([
    { key: 'users', path: 'users/{uid}', category: 'private', preserve: true, source: 'app/modules/profile/profile.js' },
    { key: 'chats', path: 'chats/{chatId}', category: 'private', preserve: true, source: 'app/modules/chat/chat.js' },
    { key: 'chatMessages', path: 'chats/{chatId}/messages/{messageId}', category: 'private', preserve: true, source: 'app/modules/chat/chat.js' },
    { key: 'online', path: 'online/{uid}', category: 'presence', preserve: false, source: 'app/modules/chat/chat.js' },
    { key: 'dailyAttempts', path: 'dailyAttempts/{date}/users/{uid}', category: 'server', preserve: true, source: 'server/daily-firestore-store.mjs' },
    { key: 'dailyPrizes', path: 'dailyPrizes/{date}/users/{uid}', category: 'server', preserve: true, source: 'server/daily-firestore-store.mjs' },
    { key: 'dailyReceipts', path: 'dailyReceipts/{date}/users/{uid}', category: 'server', preserve: true, source: 'server/daily-firestore-store.mjs' },
    { key: 'dailyRankings', path: 'dailyRankings/{date}', category: 'server', preserve: true, source: 'server/daily-firestore-store.mjs' },
    { key: 'quizSessions', path: 'quizSessions/{sessionId}', category: 'server', preserve: true, source: 'server/quiz-firestore-store.mjs' },
    { key: 'achievementFacts', path: 'achievementFacts/{uid}', category: 'server', preserve: true, source: 'server/quiz-firestore-store.mjs' },
    { key: 'achievementUnlockReceipts', path: 'achievementUnlockReceipts/{uid}/unlocks/{achievementId}', category: 'server', preserve: true, source: 'server/quiz-firestore-store.mjs' },
    { key: 'publicProfiles', path: 'publicProfiles/{uid}', category: 'projection', preserve: false, source: 'server/profile-create.mjs' },
    { key: 'nicknameClaims', path: 'nicknameClaims/{normalized}', category: 'reservation', preserve: false, source: 'server/profile-create.mjs' }
]);

export function protectedQuizHubManifestKeys() {
    return QUIZHUB_FIRESTORE_INVENTORY.filter(entry => entry.preserve).map(entry => entry.key);
}

export function validateQuizHubMigrationManifest(manifest) {
    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
        throw new TypeError('MIGRATION_MANIFEST_REQUIRED');
    }
    for (const entry of QUIZHUB_FIRESTORE_INVENTORY.filter(x => x.preserve)) {
        if (!Array.isArray(manifest[entry.key])) {
            throw new TypeError('MISSING_REQUIRED_MIGRATION_COLLECTION: ' + entry.key);
        }
    }
    return protectedQuizHubManifestKeys();
}
