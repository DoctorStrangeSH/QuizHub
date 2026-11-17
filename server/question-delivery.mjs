import { createHash, randomInt } from 'node:crypto';

// Intended for a trusted backend process ONLY. Never import the answer-key
// catalog into a browser bundle when server-authoritative quizzes go live.
function stableId(category, difficulty, question) {
    const identity = JSON.stringify([category, difficulty, question.questionEN]);
    return createHash('sha256').update(identity).digest('hex').slice(0, 24);
}

export function buildQuestionCatalog(categories) {
    if (!categories || typeof categories !== 'object' || Array.isArray(categories)) {
        throw new Error('INVALID_CATALOG');
    }
    const catalog = new Map();
    for (const [category, group] of Object.entries(categories)) {
        for (const difficulty of ['easy', 'medium', 'hard']) {
            for (const question of group[difficulty] || []) {
                if (!question || !question.questionRU || !question.questionEN ||
                    !Array.isArray(question.optionsRU) || !Array.isArray(question.optionsEN) ||
                    question.optionsRU.length !== question.optionsEN.length ||
                    question.optionsRU.length < 2 ||
                    !Number.isSafeInteger(question.correctIndex) ||
                    question.correctIndex < 0 || question.correctIndex >= question.optionsRU.length ||
                    !Number.isSafeInteger(question.points) || question.points < 0 || question.points > 100) {
                    throw new Error('INVALID_QUESTION');
                }
                const id = stableId(category, difficulty, question);
                if (catalog.has(id)) throw new Error('DUPLICATE_QUESTION_ID');
                catalog.set(id, {
                    id, category, difficulty,
                    questionRU: question.questionRU, questionEN: question.questionEN,
                    optionsRU: [...question.optionsRU], optionsEN: [...question.optionsEN],
                    correctIndex: question.correctIndex, points: question.points
                });
            }
        }
    }
    return catalog;
}

export function selectQuestions(catalog, { category = 'all', difficulty, count }) {
    if (!(catalog instanceof Map) || !['easy', 'medium', 'hard'].includes(difficulty) ||
        !Number.isSafeInteger(count) || count < 1 || count > 100) {
        throw new Error('INVALID_SELECTION');
    }
    const eligible = [...catalog.values()].filter(q =>
        q.difficulty === difficulty && (category === 'all' || q.category === category)
    );
    if (eligible.length < count) throw new Error('NOT_ENOUGH_QUESTIONS');
    // Fisher-Yates with cryptographic randomness on the server.
    for (let i = 0; i < count; i++) {
        const swap = i + randomInt(eligible.length - i);
        [eligible[i], eligible[swap]] = [eligible[swap], eligible[i]];
    }
    return eligible.slice(0, count);
}

export function publicQuestion(question, language = 'ru') {
    if (!question || !question.id) throw new Error('INVALID_QUESTION');
    const isEN = language === 'en';
    return {
        id: question.id,
        category: question.category,
        difficulty: question.difficulty,
        question: isEN ? question.questionEN : question.questionRU,
        options: [...(isEN ? question.optionsEN : question.optionsRU)]
    };
}

export function canonicalQuestion(question) {
    if (!question || !question.id) throw new Error('INVALID_QUESTION');
    return {
        id: question.id,
        correctIndex: question.correctIndex,
        optionCount: question.optionsRU.length,
        points: question.points
    };
}
