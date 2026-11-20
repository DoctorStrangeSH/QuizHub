import { ACHIEVEMENT_CATALOG } from './achievement-catalog.mjs';

function nonNegative(value, code) {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error(code);
    return value;
}

// Called only while the trusted quiz reward transaction is open.
// Facts start at zero rather than importing legacy client-editable profile stats.
export function advanceAchievementFacts({ previousFacts, previousAchievements, experienceDelta, winDelta = 0, perfectDelta = 0, catalog = ACHIEVEMENT_CATALOG }) {
    nonNegative(experienceDelta, 'INVALID_ACHIEVEMENT_EXPERIENCE_DELTA');
    if (![0, 1].includes(winDelta)) throw new Error('INVALID_ACHIEVEMENT_WIN_DELTA');
    if (![0, 1].includes(perfectDelta)) throw new Error('INVALID_ACHIEVEMENT_PERFECT_DELTA');
    const current = previousFacts ?? {};
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
        throw new Error('INVALID_ACHIEVEMENT_FACTS');
    }
    const totalGames = current.totalGames === undefined ? 0 : nonNegative(current.totalGames, 'INVALID_ACHIEVEMENT_FACTS');
    const experience = current.experience === undefined ? 0 : nonNegative(current.experience, 'INVALID_ACHIEVEMENT_FACTS');
    const totalWins = current.totalWins === undefined ? 0 : nonNegative(current.totalWins, 'INVALID_ACHIEVEMENT_FACTS');
    const perfectGames = current.perfectGames === undefined ? 0 : nonNegative(current.perfectGames, 'INVALID_ACHIEVEMENT_FACTS');
    const nextFacts = {
        totalGames: totalGames + 1,
        experience: experience + experienceDelta,
        totalWins: totalWins + winDelta,
        perfectGames: perfectGames + perfectDelta
    };
    if (current.unlockedIds !== undefined && !Array.isArray(current.unlockedIds)) throw new Error('INVALID_ACHIEVEMENT_FACTS');
    const serverUnlocked = Array.isArray(current.unlockedIds) ? current.unlockedIds : [];
    if (serverUnlocked.some(id => typeof id !== 'string' || !/^[a-z0-9_]{1,64}$/.test(id))) {
        throw new Error('INVALID_ACHIEVEMENT_FACTS');
    }
    if (![nextFacts.totalGames, nextFacts.experience, nextFacts.totalWins, nextFacts.perfectGames].every(Number.isSafeInteger)) {
        throw new Error('ACHIEVEMENT_FACTS_OVERFLOW');
    }

    // Match the existing V1 progression formula. Derive level only from the
    // server-owned XP ledger; never import legacy users.level or client stats.
    nextFacts.level = Math.floor(nextFacts.experience / 100) + 1;

    const legacyAchievements = Array.isArray(previousAchievements) ? previousAchievements : [];
    if (legacyAchievements.some(id => typeof id !== 'string')) throw new Error('INVALID_ACHIEVEMENT_STATE');
    const newlyUnlocked = catalog.filter(item =>
        !serverUnlocked.includes(item.id) &&
        Number.isSafeInteger(nextFacts[item.fact]) &&
        nextFacts[item.fact] >= item.threshold
    ).map(item => item.id);

    nextFacts.unlockedIds = [...new Set([...serverUnlocked, ...newlyUnlocked])];
    return {
        facts: nextFacts,
        achievements: [...new Set([...legacyAchievements, ...nextFacts.unlockedIds])],
        newlyUnlocked
    };
}
