import test from 'node:test';
import assert from 'node:assert/strict';
import { createQuizFirestoreStore } from '../server/quiz-firestore-store.mjs';
import { buildQuestionCatalog } from '../server/question-delivery.mjs';
import { createModeSessionService } from '../server/quiz-mode-session-service.mjs';
import { claimModeSessionReward } from '../server/quiz-mode-reward-claim.mjs';

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
                        assert.equal(wrote, false, 'transaction reads must precede writes');
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
                        assert.ok(current);
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
                    } else records.set(write.path, write.value);
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
        easy: Array.from({ length: 12 }, (_, i) => ({
            questionRU: `Вопрос ${i}?`,
            questionEN: `Question ${i}?`,
            optionsRU: ['Нет', 'Да'],
            optionsEN: ['No', 'Yes'],
            correctIndex: 1,
            points: 10
        })),
        medium: [],
        hard: []
    }
});

function setup() {
    const db = fakeFirestore();
    db.records.set('users/player', {
        experience: 5, weeklyExperience: 5, coins: 7, wins: 2,
        quizzesCompleted: 0,
        stats: { totalGames: 0, totalQuestions: 0, correctAnswers: 0, totalWins: 2, bestStreak: 1 },
        email: 'private@example.test',
        friends: ['friend']
    });
    const store = createQuizFirestoreStore(db);
    const service = createModeSessionService({ catalog, store, random: () => 0.99 });
    return { db, store, service };
}

async function answerAll(service, started, count, now = 2000) {
    let question = started.question;
    let result;
    for (let i = 0; i < count; i++) {
        result = await service.answer({
            uid: 'player', sessionId: started.sessionId,
            questionId: question.id, answerIndex: 1, now: now + i
        });
        question = result.nextQuestion;
    }
    return result;
}

test('Duel reward is atomic, increments wins only for a player victory, and replays once', async () => {
    const { db, store, service } = setup();
    const started = await service.start({
        uid: 'player', mode: 'duel', category: 'science',
        difficulty: 'easy', count: 1, now: 1000
    });
    await answerAll(service, started, 1);
    const [first, retry] = await Promise.all([
        claimModeSessionReward({ store, uid: 'player', sessionId: started.sessionId, at: 3000 }),
        claimModeSessionReward({ store, uid: 'player', sessionId: started.sessionId, at: 3000 })
    ]);
    assert.equal(first.won, true);
    assert.equal(first.alreadyClaimed, false);
    assert.equal(retry.alreadyClaimed, true);
    const user = db.records.get('users/player');
    assert.equal(user.wins, 3);
    assert.equal(user.stats.totalWins, 3);
    assert.equal(user.stats.totalGames, 1);
    assert.equal(user.stats.correctAnswers, 1);
    assert.equal(user.email, 'private@example.test');
    assert.deepEqual(user.friends, ['friend']);
});

test('Survival updates best streak using max semantics and does not increment wins', async () => {
    const { db, store, service } = setup();
    const started = await service.start({
        uid: 'player', mode: 'survival', category: 'science',
        difficulty: 'easy', count: 3, now: 1000
    });
    await answerAll(service, started, 3);
    const receipt = await claimModeSessionReward({
        store, uid: 'player', sessionId: started.sessionId, at: 3000
    });
    assert.equal(receipt.bestStreak, 3);
    const user = db.records.get('users/player');
    assert.equal(user.stats.bestStreak, 3);
    assert.equal(user.wins, 2);
    assert.equal(user.stats.totalWins, 2);
});

test('Time Trial applies strict 70 percent win threshold and server-scored rewards', async () => {
    const { db, store, service } = setup();
    const started = await service.start({
        uid: 'player', mode: 'time', category: 'science',
        difficulty: 'easy', count: 10, now: 1000
    });
    let question = started.question;
    for (let i = 0; i < 10; i++) {
        const result = await service.answer({
            uid: 'player', sessionId: started.sessionId,
            questionId: question.id, answerIndex: 1, now: 1100 + i
        });
        question = result.nextQuestion;
    }
    const receipt = await claimModeSessionReward({
        store, uid: 'player', sessionId: started.sessionId, at: 2000
    });
    assert.equal(receipt.correctAnswers, 10);
    assert.equal(receipt.won, true);
    assert.equal(db.records.get('users/player').wins, 3);
});

test('foreign owner, incomplete run and corrupted mode log cannot claim rewards', async () => {
    const { db, store, service } = setup();
    const started = await service.start({
        uid: 'player', mode: 'survival', category: 'science',
        difficulty: 'easy', count: 2, now: 1000
    });
    await assert.rejects(claimModeSessionReward({
        store, uid: 'intruder', sessionId: started.sessionId, at: 2000
    }), /NOT_SESSION_OWNER/);
    await assert.rejects(claimModeSessionReward({
        store, uid: 'player', sessionId: started.sessionId, at: 2000
    }), /SESSION_INCOMPLETE/);
    const stored = db.records.get(`quizSessions/${started.sessionId}`);
    stored.modeState.score = 999999;
    await assert.rejects(claimModeSessionReward({
        store, uid: 'player', sessionId: started.sessionId, at: 901_000
    }), /INVALID_MODE_RESULT/);
    assert.equal(db.records.get('users/player').coins, 7);
    assert.equal(db.records.get(`quizSessions/${started.sessionId}`).finalized, false);
});
