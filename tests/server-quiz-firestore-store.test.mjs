import test from 'node:test';
import assert from 'node:assert/strict';
import { createQuizFirestoreStore } from '../server/quiz-firestore-store.mjs';
import { createSession, submitAnswer } from '../server/quiz-session-core.mjs';
import { claimSessionReward } from '../server/quiz-reward-claim.mjs';

function fakeFirestore() {
    const records = new Map();
    const mutations = [];
    let queue = Promise.resolve();
    const ref = path => ({ path });
    return {
        records, mutations,
        collection: name => ({ doc: id => ref(name + '/' + id) }),
        runTransaction(callback) {
            const task = queue.then(async () => {
                const pending = [];
                let wrote = false;
                const tx = {
                    async get(document) {
                        assert.equal(wrote, false, 'Firestore requires reads before writes');
                        return {
                            exists: records.has(document.path),
                            data: () => structuredClone(records.get(document.path))
                        };
                    },
                    set(document, value) {
                        wrote = true;
                        pending.push({ operation: 'set', path: document.path, value: structuredClone(value) });
                    },
                    update(document, fields) {
                        wrote = true;
                        pending.push({ operation: 'update', path: document.path, value: structuredClone(fields) });
                    }
                };
                const result = await callback(tx);
                for (const write of pending) {
                    const updated = write.operation === 'set'
                        ? write.value : structuredClone(records.get(write.path));
                    assert.ok(updated, 'Firestore update requires existing document');
                    if (write.operation === 'update') {
                        for (const [key, value] of Object.entries(write.value)) {
                            const parts = key.split('.');
                            let target = updated;
                            for (const part of parts.slice(0, -1)) {
                                target[part] ??= {};
                                target = target[part];
                            }
                            target[parts.at(-1)] = value;
                        }
                    }
                    records.set(write.path, updated);
                    mutations.push(write);
                }
                return result;
            });
            queue = task.catch(() => {});
            return task;
        }
    };
}

test('session creation is durable across independent adapter instances', async () => {
    const db = fakeFirestore();
    const first = createQuizFirestoreStore(db);
    await first.runTransaction(async tx => {
        assert.equal(await tx.getSession('session_1'), null);
        await tx.setSession('session_1', { uid: 'alice', finalized: false });
    });
    const second = createQuizFirestoreStore(db);
    assert.deepEqual(await second.runTransaction(tx => tx.getSession('session_1')),
        { uid: 'alice', finalized: false });
    assert.equal(db.mutations[0].path, 'quizSessions/session_1');
});

test('reward claim updates only economy fields and replays exactly once', async () => {
    const db = fakeFirestore();
    const session = createSession({
        uid: 'alice', mode: 'classic', startedAt: 1000, deadlineAt: 5000,
        questions: [{ id: 'question', optionCount: 2, correctIndex: 1, points: 20 }]
    });
    submitAnswer(session, { uid: 'alice', questionId: 'question', answerIndex: 1, at: 2000 });
    db.records.set('quizSessions/session_2', session);
    db.records.set('users/alice', {
        email: 'private@example.test', nickname: 'Player', coins: 8,
        experience: 2, weeklyExperience: 2, quizzesCompleted: 0,
        stats: { totalGames: 0, totalQuestions: 0, correctAnswers: 0, special: 17 },
        friends: ['bob']
    });
    const first = createQuizFirestoreStore(db);
    const second = createQuizFirestoreStore(db);
    const [receipt, retry] = await Promise.all([
        claimSessionReward({ store: first, uid: 'alice', sessionId: 'session_2', at: 3000 }),
        claimSessionReward({ store: second, uid: 'alice', sessionId: 'session_2', at: 3000 })
    ]);
    assert.equal(receipt.alreadyClaimed, false);
    assert.equal(retry.alreadyClaimed, true);
    assert.equal(receipt.coins, 10);
    const user = db.records.get('users/alice');
    assert.equal(user.coins, 18);
    assert.equal(user.experience, 22);
    assert.equal(user.stats.totalGames, 1);
    assert.equal(user.stats.special, 17);
    assert.equal(user.email, 'private@example.test');
    assert.deepEqual(user.friends, ['bob']);
    const writes = db.mutations.filter(mutation => mutation.path === 'users/alice');
    assert.equal(writes.length, 1);
    assert.equal(writes[0].operation, 'update');
    assert.deepEqual(Object.keys(writes[0].value).sort(), [
        'coins', 'experience', 'quizzesCompleted', 'stats.correctAnswers',
        'stats.totalGames', 'stats.totalQuestions', 'weeklyExperience'
    ].sort());
});

test('failed reward claim makes no partial user or session writes', async () => {
    const db = fakeFirestore();
    db.records.set('quizSessions/session_3', createSession({
        uid: 'alice', mode: 'classic', startedAt: 1000, deadlineAt: 2000,
        questions: [{ id: 'q', optionCount: 2, correctIndex: 0, points: 10 }]
    }));
    const store = createQuizFirestoreStore(db);
    await assert.rejects(claimSessionReward({
        store, uid: 'alice', sessionId: 'session_3', at: 3000
    }), /USER_NOT_FOUND/);
    assert.equal(db.records.get('quizSessions/session_3').finalized, false);
    assert.equal(db.mutations.length, 0);
});

test('rejects unsafe document identifiers and invalid transaction configuration', async () => {
    const db = fakeFirestore();
    const store = createQuizFirestoreStore(db);
    await assert.rejects(store.runTransaction(tx => tx.getSession('../other')), /INVALID_STORAGE_SESSION_ID/);
    await assert.rejects(store.runTransaction(tx => tx.getUser('bad/uid')), /INVALID_STORAGE_UID/);
    await assert.rejects(store.runTransaction(tx => tx.setSession('bad/path', {})), /INVALID_STORAGE_SESSION_ID/);
    assert.throws(() => createQuizFirestoreStore({}), /INVALID_FIRESTORE_ADAPTER/);
});
