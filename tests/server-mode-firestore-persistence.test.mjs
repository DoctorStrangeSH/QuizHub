import test from 'node:test';
import assert from 'node:assert/strict';
import { createQuizFirestoreStore } from '../server/quiz-firestore-store.mjs';
import { buildQuestionCatalog } from '../server/question-delivery.mjs';
import { createModeSessionService } from '../server/quiz-mode-session-service.mjs';

function fakeFirestore() {
    const records = new Map();
    let queue = Promise.resolve();
    const ref = path => ({ path });
    return {
        records,
        collection: name => ({ doc: id => ref(name + '/' + id) }),
        runTransaction(callback) {
            const task = queue.then(async () => {
                const pending = [];
                let wrote = false;
                const tx = {
                    async get(document) {
                        assert.equal(wrote, false, 'all Firestore reads must precede writes');
                        return {
                            exists: records.has(document.path),
                            data: () => structuredClone(records.get(document.path))
                        };
                    },
                    set(document, value) {
                        wrote = true;
                        pending.push({ path: document.path, value: structuredClone(value) });
                    },
                    update(document, fields) {
                        wrote = true;
                        pending.push({ path: document.path, fields: structuredClone(fields) });
                    }
                };
                const result = await callback(tx);
                for (const write of pending) {
                    if (write.fields) {
                        const current = structuredClone(records.get(write.path));
                        assert.ok(current, 'update target must exist');
                        for (const [key, value] of Object.entries(write.fields)) {
                            const parts = key.split('.');
                            let target = current;
                            for (const part of parts.slice(0, -1)) {
                                target[part] ??= {};
                                target = target[part];
                            }
                            target[parts.at(-1)] = value;
                        }
                        records.set(write.path, current);
                    } else {
                        records.set(write.path, write.value);
                    }
                }
                return result;
            });
            queue = task.catch(() => {});
            return task;
        }
    };
}

const catalog = buildQuestionCatalog({
    science: {
        easy: Array.from({ length: 12 }, (_, index) => ({
            questionRU: `Вопрос ${index}?`,
            questionEN: `Question ${index}?`,
            optionsRU: ['Неверно', 'Верно'],
            optionsEN: ['Wrong', 'Right'],
            correctIndex: 1,
            points: 10
        })),
        medium: [],
        hard: []
    }
});

test('mode session survives independent Firestore store and service instances', async () => {
    const db = fakeFirestore();
    const firstService = createModeSessionService({
        catalog, store: createQuizFirestoreStore(db)
    });
    const started = await firstService.start({
        uid: 'alice', mode: 'survival', category: 'science',
        difficulty: 'easy', count: 3, now: 1000
    });
    const firstAnswer = await firstService.answer({
        uid: 'alice', sessionId: started.sessionId,
        questionId: started.question.id, answerIndex: 1, now: 2000
    });
    const secondService = createModeSessionService({
        catalog, store: createQuizFirestoreStore(db)
    });
    const resumed = await secondService.resume({
        uid: 'alice', sessionId: started.sessionId, now: 2500
    });
    assert.equal(resumed.status, 'in_progress');
    assert.equal(resumed.answeredQuestions, 1);
    assert.equal(resumed.question.id, firstAnswer.nextQuestion.id);
    const stored = db.records.get(`quizSessions/${started.sessionId}`);
    assert.equal(stored.domainMode, 'survival');
    assert.equal(stored.modeState.score, 10);
    assert.equal(stored.acceptedAnswers.length, 1);
    assert.equal('correctIndex' in resumed.question, false);
});

test('concurrent exact answer retries commit one transition and retain the same AI outcome', async () => {
    const db = fakeFirestore();
    let aiRolls = 0;
    const service = createModeSessionService({
        catalog,
        store: createQuizFirestoreStore(db),
        random: () => { aiRolls += 1; return 0.99; }
    });
    const started = await service.start({
        uid: 'alice', mode: 'duel', category: 'science',
        difficulty: 'easy', count: 1, now: 1000
    });
    const request = {
        uid: 'alice', sessionId: started.sessionId,
        questionId: started.question.id, answerIndex: 1, now: 2000
    };
    const [first, retry] = await Promise.all([
        service.answer(request),
        service.answer(request)
    ]);
    assert.equal([first, retry].filter(value => value.replayed).length, 1);
    assert.equal(first.aiCorrect, retry.aiCorrect);
    assert.equal(aiRolls, 1);
    const stored = db.records.get(`quizSessions/${started.sessionId}`);
    assert.equal(stored.modeState.roundsPlayed, 1);
    assert.equal(stored.acceptedAnswers.length, 1);
});

test('Firestore adapter rejects unsafe session identifiers for mode sessions too', async () => {
    const store = createQuizFirestoreStore(fakeFirestore());
    await assert.rejects(store.runTransaction(tx => tx.getSession('../users/alice')),
        /INVALID_STORAGE_SESSION_ID/);
});
