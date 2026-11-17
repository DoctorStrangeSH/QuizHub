import { buildPublicProfile } from '../app/modules/profile/public-profile-data.js';

// Trusted server-only registration contract. Do not connect clients until legacy
// nicknameClaims backfill is complete and production rules deny client profile writes.
export async function createPlayerProfile(db, { uid, nickname, email = null }) {
    if (!db || typeof db.runTransaction !== 'function' || typeof db.collection !== 'function') {
        throw new TypeError('TRUSTED_DATABASE_REQUIRED');
    }
    if (typeof uid !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) throw new Error('INVALID_UID');
    if (typeof nickname !== 'string' || !/^[A-Za-z0-9_]{3,20}$/.test(nickname)) throw new Error('INVALID_NICKNAME');
    if (email !== null && (typeof email !== 'string' || email.length > 254 || !email.includes('@'))) {
        throw new Error('INVALID_EMAIL');
    }
    const normalized = nickname.toLowerCase();
    const userRef = db.collection('users').doc(uid);
    const publicRef = db.collection('publicProfiles').doc(uid);
    const claimRef = db.collection('nicknameClaims').doc(normalized);

    return db.runTransaction(async tx => {
        // Read all documents before staging any transaction writes.
        const userSnapshot = await tx.get(userRef);
        const publicSnapshot = await tx.get(publicRef);
        const claimSnapshot = await tx.get(claimRef);
        if (userSnapshot.exists || publicSnapshot.exists) throw new Error('PROFILE_ALREADY_EXISTS');
        if (claimSnapshot.exists) throw new Error('NICKNAME_TAKEN');

        const profile = {
            nickname, nicknameLower: normalized,
            email,
            createdAt: new Date(),
            level: 1, experience: 0, weeklyExperience: 0, coins: 100,
            quizzesCompleted: 0, wins: 0,
            friends: [], friendRequests: [], sentRequests: [],
            achievements: [], dailyStreak: 0, lastDailyClaim: null,
            equippedTheme: 'theme_default',
            equippedFrame: 'frame_default',
            equippedParticles: 'particles_default',
            ownedThemes: ['theme_default', 'theme_light'],
            ownedFrames: ['frame_default'],
            ownedParticles: ['particles_default'],
            activeBonuses: {},
            stats: {
                totalGames: 0, totalWins: 0, totalQuestions: 0,
                correctAnswers: 0, bestStreak: 0
            }
        };
        tx.create(userRef, profile);
        tx.create(publicRef, buildPublicProfile(uid, profile));
        tx.create(claimRef, { uid });
        return { status: 'created', uid, nickname };
    });
}
