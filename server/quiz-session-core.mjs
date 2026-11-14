// Pure, server-side quiz scoring rules. No browser imports or persistence.
// Canonical questions (including correctIndex) MUST remain server-only.
// This is not an endpoint and does not by itself protect Firestore rewards.

export function createSession({ uid, mode, questions, startedAt, deadlineAt }) {
    if (typeof uid !== 'string' || !uid.trim()) throw new Error('AUTH_REQUIRED');
    if (typeof mode !== 'string' || !mode.trim()) throw new Error('INVALID_MODE');
    if (!Array.isArray(questions) || questions.length < 1 || questions.length > 100) {
        throw new Error('INVALID_QUESTIONS');
    }
    if (!Number.isSafeInteger(startedAt) || !Number.isSafeInteger(deadlineAt) || deadlineAt <= startedAt) {
        throw new Error('INVALID_DEADLINE');
    }
    const ids = new Set();
    const canonical = questions.map(question => {
        if (!question || typeof question.id !== 'string' || !question.id || ids.has(question.id)) {
            throw new Error('INVALID_QUESTION_ID');
        }
        if (!Number.isSafeInteger(question.correctIndex) || question.correctIndex < 0 ||
            !Number.isSafeInteger(question.optionCount) || question.optionCount < 2 ||
            question.correctIndex >= question.optionCount) {
            throw new Error('INVALID_ANSWER_KEY');
        }
        if (!Number.isSafeInteger(question.points) || question.points < 0 || question.points > 100) {
            throw new Error('INVALID_POINTS');
        }
        ids.add(question.id);
        return {
            id: question.id,
            correctIndex: question.correctIndex,
            optionCount: question.optionCount,
            points: question.points
        };
    });
    return {
        uid, mode, startedAt, deadlineAt,
        questions: canonical,
        answers: [],
        finalized: false
    };
}

export function submitAnswer(session, { uid, questionId, answerIndex, at }) {
    if (!session || session.finalized) throw new Error('SESSION_CLOSED');
    if (uid !== session.uid) throw new Error('NOT_SESSION_OWNER');
    if (!Number.isSafeInteger(at) || at < session.startedAt || at > session.deadlineAt) {
        throw new Error('SESSION_EXPIRED');
    }
    const question = session.questions[session.answers.length];
    if (!question) throw new Error('ALL_QUESTIONS_ANSWERED');
    if (questionId !== question.id) throw new Error('OUT_OF_ORDER');
    if (!Number.isSafeInteger(answerIndex) || answerIndex < 0 || answerIndex >= question.optionCount) {
        throw new Error('INVALID_ANSWER');
    }

    const correct = answerIndex === question.correctIndex;
    const answer = {
        questionId, answerIndex, correct,
        points: correct ? question.points : 0,
        answeredAt: at
    };
    session.answers.push(answer);
    return { correct, points: answer.points, finished: session.answers.length === session.questions.length };
}

export function finalizeSession(session, { uid, at }) {
    if (!session || uid !== session.uid) throw new Error('NOT_SESSION_OWNER');
    if (session.finalized) throw new Error('ALREADY_FINALIZED');
    if (!Number.isSafeInteger(at) || at < session.startedAt) throw new Error('INVALID_TIME');
    if (session.answers.length < session.questions.length && at < session.deadlineAt) {
        throw new Error('SESSION_INCOMPLETE');
    }

    // Recompute the result from the canonical server question key, never
    // from stored answer.correct/points or any client-supplied score.
    let score = 0;
    let correctAnswers = 0;
    if (session.answers.length > session.questions.length) throw new Error('INVALID_ANSWER_LOG');
    for (let i = 0; i < session.answers.length; i++) {
        const answer = session.answers[i];
        const question = session.questions[i];
        if (!answer || answer.questionId !== question.id ||
            !Number.isSafeInteger(answer.answerIndex) ||
            answer.answerIndex < 0 || answer.answerIndex >= question.optionCount ||
            !Number.isSafeInteger(answer.answeredAt) ||
            answer.answeredAt < session.startedAt || answer.answeredAt > session.deadlineAt) {
            throw new Error('INVALID_ANSWER_LOG');
        }
        if (answer.answerIndex === question.correctIndex) {
            score += question.points;
            correctAnswers++;
        }
    }
    session.finalized = true;
    return {
        mode: session.mode,
        totalQuestions: session.questions.length,
        answeredQuestions: session.answers.length,
        correctAnswers,
        score
    };
}
