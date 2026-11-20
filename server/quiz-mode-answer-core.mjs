import { applyModeAnswer } from './quiz-mode-session.mjs';

// Public transport names are deliberately explicit. The browser's "time"
// identifier maps to the domain's "timetrial" mode; no other aliases are accepted.
export function resolvePublicMode(mode) {
    if (mode === 'duel' || mode === 'survival') return mode;
    if (mode === 'time') return 'timetrial';
    throw new Error('UNSUPPORTED_QUIZ_MODE');
}

function requireTimestamp(value, code = 'INVALID_TIME') {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error(code);
}

function validateCanonicalQuestion(question) {
    if (!question || typeof question.id !== 'string' || !question.id ||
        !Number.isSafeInteger(question.correctIndex) || question.correctIndex < 0 ||
        !Number.isSafeInteger(question.optionCount) || question.optionCount < 2 ||
        question.correctIndex >= question.optionCount ||
        !Number.isSafeInteger(question.points) || question.points < 0 || question.points > 100) {
        throw new Error('INVALID_CANONICAL_QUESTION');
    }
}

export function applyCanonicalModeAnswer({
    state,
    question,
    answerIndex,
    now,
    sessionDeadlineAt,
    questionDeadlineAt,
    aiRandomValue
}) {
    validateCanonicalQuestion(question);
    requireTimestamp(now);
    requireTimestamp(sessionDeadlineAt, 'INVALID_SESSION_DEADLINE');
    if (now >= sessionDeadlineAt) throw new Error('SESSION_EXPIRED');
    if (!state || !['duel', 'survival', 'timetrial'].includes(state.mode)) {
        throw new Error('INVALID_MODE_STATE');
    }

    let correct = false;
    let remainingMs;

    if (state.mode === 'timetrial') {
        requireTimestamp(questionDeadlineAt, 'INVALID_QUESTION_DEADLINE');
        if (questionDeadlineAt > sessionDeadlineAt) throw new Error('INVALID_QUESTION_DEADLINE');
        if (now >= questionDeadlineAt) {
            // Timeout is a completed incorrect answer. The server ignores any
            // submitted index once the deadline has passed.
            correct = false;
            remainingMs = 0;
        } else {
            if (!Number.isSafeInteger(answerIndex) || answerIndex < 0 ||
                answerIndex >= question.optionCount) throw new Error('INVALID_ANSWER');
            correct = answerIndex === question.correctIndex;
            remainingMs = questionDeadlineAt - now;
        }
    } else {
        if (!Number.isSafeInteger(answerIndex) || answerIndex < 0 ||
            answerIndex >= question.optionCount) throw new Error('INVALID_ANSWER');
        correct = answerIndex === question.correctIndex;
    }

    const transition = applyModeAnswer(state, {
        correct,
        points: question.points,
        remainingMs,
        aiRandomValue
    });

    return {
        state: transition.state,
        finished: transition.finished,
        result: {
            questionId: question.id,
            correct,
            points: transition.round.points,
            ...(state.mode === 'duel' ? { aiCorrect: transition.round.aiCorrect } : {}),
            ...(state.mode === 'timetrial' ? {
                speedBonus: transition.round.speedBonus,
                timedOut: now >= questionDeadlineAt
            } : {})
        }
    };
}
