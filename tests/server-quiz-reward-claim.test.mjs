import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession, submitAnswer } from '../server/quiz-session-core.mjs';
import { claimSessionReward } from '../server/quiz-reward-claim.mjs';

function setup() {
    const session = createSession({
        uid: 'player', mode: 'classic', startedAt: 1000, deadlineAt: 5000,
        questions: [
            { id: 'a', optionCount: 2, correctIndex: 1, points: 20 },
            { id: 'b', optionCount: 2, correctIndex: 0, points: 10 }
        ]
    });
    submitAnswer(session, { uid: 'player', questionId: 'a', answerIndex: 1, at: 2000 });
    submitAnswer(session, { uid: 'player', questionId: 'b', answerIndex: 0, at: 3000 });
    const sessions = new Map([['session-1', session]]);
    const users = new Map([['player', {
        experience: 5, weeklyExperience: 5, coins: 7,
        quizzesCompleted: 0, stats: { totalGames: 0, totalQuestions: 0, correctAnswers: 0 }
    }]]);
    let queue = Promise.resolve();
    const store = {
        // Model the serializable transaction contract for independent callers.
        runTransaction(callback) {
            const task = queue.then(async () => {
                const staged = { session: null, user: null };
                const tx = {
                    getSession: async id => structuredClone(sessions.get(id)),
                    getUser: async uid => structuredClone(users.get(uid)),
                    setSession: async (id, value) => { staged.session = [id, structuredClone(value)]; },
                    setUser: async (uid, value) => { staged.user = [uid, structuredClone(value)]; }
                };
                const result = await callback(tx);
                if (staged.user) users.set(...staged.user);
                if (staged.session) sessions.set(...staged.session);
                return result;
            });
            queue = task.catch(() => {});
            return task;
        }
    };
    return { store, sessions, users };
}

const claim = (store, uid = 'player') =>
    claimSessionReward({ store, sessionId: 'session-1', uid, at: 4000 });

test('first claim credits the server-scored result exactly once', async () => {
    const { store, users } = setup();
    const receipt = await claim(store);
    assert.equal(receipt.alreadyClaimed, false);
    assert.equal(receipt.score, 30);
    assert.equal(receipt.xp, 30);
    assert.equal(receipt.coins, 15);
    const user = users.get('player');
    assert.equal(user.experience, 35);
    assert.equal(user.coins, 22);
    assert.equal(user.stats.totalQuestions, 2);
    assert.equal(user.stats.correctAnswers, 2);
});

test('retries and concurrent completion requests return same receipt without double credit', async () => {
    const { store, users } = setup();
    const receipts = await Promise.all([claim(store), claim(store), claim(store)]);
    assert.equal(receipts.filter(receipt => !receipt.alreadyClaimed).length, 1);
    assert.deepEqual(receipts.map(receipt => receipt.coins), [15, 15, 15]);
    assert.equal(users.get('player').coins, 22);
    assert.equal(users.get('player').quizzesCompleted, 1);
});

test('foreign users cannot claim someone else\'s session', async () => {
    const { store, users } = setup();
    await assert.rejects(claim(store, 'intruder'), /NOT_SESSION_OWNER/);
    assert.equal(users.get('player').coins, 7);
});

test('tampered logged points are ignored and malformed answers fail closed', async () => {
    const { store, sessions, users } = setup();
    sessions.get('session-1').answers[0].points = 9999999;
    sessions.get('session-1').answers[0].correct = false;
    const receipt = await claim(store);
    assert.equal(receipt.score, 30);
    assert.equal(users.get('player').coins, 22);

    const second = setup();
    second.sessions.get('session-1').answers[0].answerIndex = 99;
    await assert.rejects(claim(second.store), /INVALID_ANSWER_LOG/);
    assert.equal(second.users.get('player').coins, 7);
});

test('failed transaction does not mark reward claimed or update balance', async () => {
    const { store, sessions, users } = setup();
    users.delete('player');
    await assert.rejects(claim(store), /USER_NOT_FOUND/);
    assert.equal(sessions.get('session-1').finalized, false);
    assert.equal(sessions.get('session-1').receipt, undefined);
});

test('invalid or negative stored balances never get silently overwritten', async () => {
    const { store, users, sessions } = setup();
    users.get('player').coins = -20;
    await assert.rejects(claim(store), /INVALID_USER_BALANCE/);
    assert.equal(users.get('player').coins, -20);
    assert.equal(sessions.get('session-1').finalized, false);
});

test('unsafe integer overflow fails atomically', async () => {
    const { store, users, sessions } = setup();
    users.get('player').coins = Number.MAX_SAFE_INTEGER;
    await assert.rejects(claim(store), /BALANCE_OVERFLOW/);
    assert.equal(users.get('player').coins, Number.MAX_SAFE_INTEGER);
    assert.equal(sessions.get('session-1').finalized, false);
});

test('corrupted chronological answer log cannot claim a reward', async () => {
    const { store, users, sessions } = setup();
    sessions.get('session-1').answers[1].answeredAt = 1500;
    await assert.rejects(claim(store), /INVALID_ANSWER_LOG/);
    assert.equal(users.get('player').coins, 7);
    assert.equal(sessions.get('session-1').finalized, false);
});
