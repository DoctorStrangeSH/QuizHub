const COUNTER_FIELDS = Object.freeze([
    'experience', 'weeklyExperience', 'coins', 'quizzesCompleted', 'wins', 'level'
]);
const STAT_FIELDS = Object.freeze([
    'totalGames', 'totalWins', 'totalQuestions', 'correctAnswers', 'bestStreak'
]);
const LEGACY_ACHIEVEMENT_IDS = new Set([
    'first_quiz', 'ten_quizzes', 'fifty_quizzes', 'hundred_quizzes',
    'first_win', 'ten_wins', 'perfect_score', 'fast_learner',
    'level_five', 'level_ten', 'social', 'collector'
]);

function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function copyArray(value) {
    return Array.isArray(value) ? [...value] : value;
}

function readCounter(source, key, path, anomalies) {
    const value = source?.[key];
    if (value === undefined) return null;
    if (!Number.isSafeInteger(value) || value < 0) {
        anomalies.push({ code: 'INVALID_LEGACY_COUNTER', path, observedType: value === null ? 'null' : typeof value });
        return null;
    }
    return value;
}

/**
 * Produces a read-only audit report for one legacy user profile.
 *
 * IMPORTANT: fields in users/{uid} were historically client-writable. This
 * function deliberately never creates or returns importable achievementFacts.
 * A clean report is still a review candidate, not trusted provenance.
 */
export function auditLegacyProgressionProfile({ uid, profile, existingAchievementFacts = null } = {}) {
    if (typeof uid !== 'string' || !uid.trim() || uid.length > 128) {
        throw new Error('INVALID_AUDIT_UID');
    }
    if (!isRecord(profile)) throw new Error('INVALID_LEGACY_PROFILE');

    const anomalies = [];
    const warnings = [];
    const blockers = [
        'LEGACY_PROFILE_FIELDS_ARE_NOT_TRUSTED_PROVENANCE',
        'PRODUCTION_BACKUP_AND_LIVE_INVENTORY_NOT_VERIFIED',
        'OWNER_APPROVAL_REQUIRED_BEFORE_IMPORT'
    ];

    const statsSource = profile.stats === undefined ? {} : profile.stats;
    if (!isRecord(statsSource)) {
        anomalies.push({ code: 'INVALID_LEGACY_STATS_OBJECT', path: 'stats' });
    }
    const stats = isRecord(statsSource) ? statsSource : {};

    const counters = {};
    for (const key of COUNTER_FIELDS) counters[key] = readCounter(profile, key, key, anomalies);
    for (const key of STAT_FIELDS) counters['stats.' + key] = readCounter(stats, key, 'stats.' + key, anomalies);

    const achievements = profile.achievements;
    if (achievements !== undefined && (!Array.isArray(achievements) ||
        achievements.some(id => typeof id !== 'string' || !/^[a-z0-9_]{1,64}$/.test(id)))) {
        anomalies.push({ code: 'INVALID_LEGACY_ACHIEVEMENTS', path: 'achievements' });
    }
    const legacyAchievementIds = Array.isArray(achievements) &&
        achievements.every(id => typeof id === 'string' && /^[a-z0-9_]{1,64}$/.test(id))
        ? [...new Set(achievements)] : [];

    const unknownAchievementIds = legacyAchievementIds.filter(id => !LEGACY_ACHIEVEMENT_IDS.has(id));
    if (unknownAchievementIds.length) {
        warnings.push({ code: 'UNKNOWN_LEGACY_ACHIEVEMENT_IDS', ids: unknownAchievementIds });
    }

    const compare = (left, right, code) => {
        if (left !== null && right !== null && left !== right) {
            anomalies.push({ code, left, right });
        }
    };
    compare(counters.quizzesCompleted, counters['stats.totalGames'], 'QUIZ_COUNT_MISMATCH');
    compare(counters.wins, counters['stats.totalWins'], 'WIN_COUNT_MISMATCH');

    if (counters['stats.totalWins'] !== null && counters['stats.totalGames'] !== null &&
        counters['stats.totalWins'] > counters['stats.totalGames']) {
        anomalies.push({ code: 'WINS_EXCEED_GAMES' });
    }
    if (counters['stats.correctAnswers'] !== null && counters['stats.totalQuestions'] !== null &&
        counters['stats.correctAnswers'] > counters['stats.totalQuestions']) {
        anomalies.push({ code: 'CORRECT_ANSWERS_EXCEED_QUESTIONS' });
    }
    if (counters.experience !== null && counters.level !== null) {
        const formulaLevel = Math.floor(counters.experience / 100) + 1;
        if (counters.level !== formulaLevel) {
            anomalies.push({ code: 'LEVEL_EXPERIENCE_MISMATCH', storedLevel: counters.level, formulaLevel });
        }
    }

    if (legacyAchievementIds.includes('perfect_score')) {
        warnings.push({
            code: 'PERFECT_SCORE_SEMANTICS_CHANGED',
            legacyMeaning: 'bestStreak >= 10',
            trustedMeaning: 'server-scored perfect 10/10 quiz',
            action: 'Preserve the legacy unlock for display; do not convert it into trusted perfectGames.'
        });
    }
    if (counters['stats.bestStreak'] !== null) {
        warnings.push({
            code: 'BEST_STREAK_NOT_EQUIVALENT_TO_PERFECT_GAMES',
            action: 'Do not derive trusted perfectGames from bestStreak.'
        });
    }

    let existingFacts = null;
    if (existingAchievementFacts !== null) {
        if (!isRecord(existingAchievementFacts)) {
            anomalies.push({ code: 'INVALID_EXISTING_ACHIEVEMENT_FACTS', path: 'achievementFacts' });
        } else {
            existingFacts = structuredClone(existingAchievementFacts);
            for (const key of ['totalGames', 'experience', 'totalWins', 'perfectGames', 'level']) {
                const value = existingAchievementFacts[key];
                if (value !== undefined && (!Number.isSafeInteger(value) || value < 0)) {
                    anomalies.push({ code: 'INVALID_EXISTING_ACHIEVEMENT_FACT', path: 'achievementFacts.' + key });
                }
            }
            if (existingAchievementFacts.unlockedIds !== undefined &&
                (!Array.isArray(existingAchievementFacts.unlockedIds) ||
                    existingAchievementFacts.unlockedIds.some(id => typeof id !== 'string' || !/^[a-z0-9_]{1,64}$/.test(id)))) {
                anomalies.push({ code: 'INVALID_EXISTING_ACHIEVEMENT_FACTS', path: 'achievementFacts.unlockedIds' });
            }
        }
    } else {
        warnings.push({ code: 'NO_EXISTING_TRUSTED_ACHIEVEMENT_FACTS' });
    }

    // This is a comparison aid only. Trusted facts may cover a shorter
    // period than legacy profile counters; equality does not prove provenance,
    // and divergence must never be resolved by overwriting either side.
    const trustedComparisons = [];
    if (existingFacts) {
        const mappings = [
            ['experience', 'experience'],
            ['quizzesCompleted', 'totalGames'],
            ['stats.totalGames', 'totalGames'],
            ['wins', 'totalWins'],
            ['stats.totalWins', 'totalWins'],
            ['level', 'level']
        ];
        for (const [legacyKey, trustedKey] of mappings) {
            const legacyValue = counters[legacyKey];
            const trustedValue = existingFacts[trustedKey];
            if (legacyValue !== null && Number.isSafeInteger(legacyValue) && legacyValue >= 0 &&
                Number.isSafeInteger(trustedValue) && trustedValue >= 0) {
                trustedComparisons.push({
                    legacyField: legacyKey,
                    trustedField: trustedKey,
                    status: legacyValue === trustedValue ? 'equal' : 'different'
                });
            }
        }
        if (trustedComparisons.length) {
            warnings.push({
                code: 'TRUSTED_LEDGER_COVERAGE_REQUIRES_PROVENANCE',
                action: 'A comparison is not proof of matching coverage. Establish the trusted ledger start point before reconciling or importing.'
            });
        }
    }

    const legacySnapshot = {};
    for (const key of COUNTER_FIELDS) {
        if (profile[key] !== undefined) legacySnapshot[key] = profile[key];
    }
    if (profile.stats !== undefined) legacySnapshot.stats = structuredClone(profile.stats);
    if (profile.achievements !== undefined) legacySnapshot.achievements = copyArray(profile.achievements);

    return {
        schemaVersion: 1,
        uid,
        status: 'review_required',
        eligibleForAutomaticImport: false,
        legacySnapshot,
        observedCounters: counters,
        legacyAchievementIds,
        existingAchievementFacts: existingFacts,
        trustedComparisons,
        blockers: [...new Set(blockers)],
        anomalies,
        warnings
    };
}
