import { ACHIEVEMENT_CATALOG } from './achievement-catalog.mjs';

function nonNegative(value, code) {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error(code);
    return value;
}

// Called only while the trusted quiz reward transaction is open.
// Facts start at zero rather than importing legacy client-editable profile stats.
export function advanceAchievementFacts({ previousFacts, previousAchievements, experienceDelta, catalog = ACHIEVEMENT_CATALOG }) {
    nonNegative(experienceDelta, 'INVALID_ACHIEVEMENT_EXPERIENCE_DELTA');
    const current = previousFacts ?? {};
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
        throw new Error('INVALID_ACHIEVEMENT_FACTS');
    }
    const totalGames = current.totalGames === undefined ? 0 : nonNegative(current.totalGames, 'INVALID_ACHIEVEMENT_FACTS');
    const experience = current.experience === undefined ? 0 : nonNegative(current.experience, 'INVALID_ACHIEVEMENT_FACTS');
    const nextFacts = {
        totalGames: totalGames + 1,
        experience: experience + experienceDelta
    };
    if (!Number.isSafeInteger(nextFacts.totalGames) || !Number.isSafeInteger(nextFacts.experience)) {
        throw new Error('ACHIEVEMENT_FACTS_OVERFLOW');
    }

    // Level is deliberately carried forward only if a trusted source has
    // already written it. Legacy users.level is client-editable and is not used.
    if (Number.isSafeInteger(current.level) && current.level > 0) nextFacts.level = current.level;

    const unlocked = Array.isArray(previousAchievements) ? previousAchievements : [];
    if (unlocked.some(id => typeof id !== 'string')) throw new Error('INVALID_ACHIEVEMENT_STATE');
    const newlyUnlocked = catalog.filter(item =>
        !unlocked.includes(item.id) &&
        Number.isSafeInteger(nextFacts[item.fact]) &&
        nextFacts[item.fact] >= item.threshold
    ).map(item => item.id);

    return {
        facts: nextFacts,
        achievements: [...new Set([...unlocked, ...newlyUnlocked])],
        newlyUnlocked
    };
}
