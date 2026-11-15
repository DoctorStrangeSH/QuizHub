import allQuestions from '../../data/questions/index.js';

const DAILY_PLAN = [
    { difficulty: 'easy', count: 3 },
    { difficulty: 'medium', count: 3 },
    { difficulty: 'hard', count: 4 }
];

function assertDateKey(dateKey) {
    if (typeof dateKey !== 'string' || !/^\\d{4}-\\d{2}-\\d{2}$/.test(dateKey)) {
        throw new TypeError('Daily challenge date must use YYYY-MM-DD.');
    }

    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        throw new RangeError('Daily challenge date is not a valid calendar date.');
    }

    return dateKey;
}

export function getUtcDateKey(now = new Date()) {
    if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
        throw new TypeError('A valid Date instance is required.');
    }

    return [
        now.getUTCFullYear(),
        String(now.getUTCMonth() + 1).padStart(2, '0'),
        String(now.getUTCDate()).padStart(2, '0')
    ].join('-');
}

function hashSeed(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index++) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

export function createSeededRandom(seed) {
    let state = hashSeed(String(seed));

    return () => {
        state += 0x6D2B79F5;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

function seededShuffle(items, seed) {
    const result = [...items];
    const random = createSeededRandom(seed);

    for (let index = result.length - 1; index > 0; index--) {
        const target = Math.floor(random() * (index + 1));
        [result[index], result[target]] = [result[target], result[index]];
    }

    return result;
}

function isUsableQuestion(question) {
    return Boolean(
        question &&
        typeof question.questionRU === 'string' &&
        typeof question.questionEN === 'string' &&
        Array.isArray(question.optionsRU) &&
        Array.isArray(question.optionsEN) &&
        question.optionsRU.length === 4 &&
        question.optionsEN.length === 4 &&
        Number.isInteger(question.correctIndex) &&
        question.correctIndex >= 0 &&
        question.correctIndex < 4
    );
}

/**
 * Creates the same daily question set for every client using the same catalog.
 * This is a deterministic client-side practice selector, not an anti-cheat boundary.
 */
export function createDailyChallenge(dateKey = getUtcDateKey(), questionBank = allQuestions) {
    const date = assertDateKey(dateKey);

    if (!questionBank || typeof questionBank !== 'object') {
        throw new TypeError('A question bank is required.');
    }

    const selected = [];

    for (const { difficulty, count } of DAILY_PLAN) {
        const pool = [];

        for (const category of Object.keys(questionBank).sort()) {
            const questions = questionBank[category]?.[difficulty];
            if (!Array.isArray(questions)) continue;

            questions.forEach((question, sourceIndex) => {
                if (!isUsableQuestion(question)) return;
                pool.push({
                    ...question,
                    category,
                    difficulty,
                    dailyQuestionId: `${category}:${difficulty}:${sourceIndex}`
                });
            });
        }

        if (pool.length < count) {
            throw new Error(
                `Daily challenge requires ${count} ${difficulty} questions; found ${pool.length}.`
            );
        }

        selected.push(...seededShuffle(pool, `${date}:${difficulty}`).slice(0, count));
    }

    return {
        id: `daily-${date}`,
        date,
        totalQuestions: selected.length,
        questions: selected
    };
}
