import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession, submitAnswer } from '../server/quiz-session-core.mjs';
import { claimSessionReward } from '../server/quiz-reward-claim.mjs';

function setup(questionCount = 2) {
    const questions = Array.from({ length: questionCount }, (_, index) => ({
        id: String.fromCharCode(97 + index), optionCount: 2,
        correctIndex: index === 1 ? 0 : 1, points: index === 0 ? 20 : 10
    }));
    const session = createSession({ uid: 'player', mode: 'classic', startedAt: 1000, deadlineAt: 5000, questions });
    for (let index = 0; index < questions.length; index++) {
        submitAnswer(session, { uid: 'player', questionId: questions[index].id,
            answerIndex: questions[index].correctIndex, at: 2000 + index });
    }
    const sessions = new Map([['session-1', session]]);
    const users = new Map([['player', {
        experience: 5, weeklyExperience: 5, coins: 7,
        quizzesCompleted: 0, stats: { totalGames: 0, totalQuestions: 0, correctAnswers: 0 }
    }]]);
    const facts = new Map();
    const unlockReceipts = new Set();
    let queue = Promise.resolve();
    const store = {
        // Model the serializable transaction contract for independent callers.
        runTransaction(callback) {
            const task = queue.then(async () => {
                const staged = { session: null, user: null, facts: null, receipts: [] };
                const tx = {
                    getSession: async id => structuredClone(sessions.get(id)),
                    getUser: async uid => structuredClone(users.get(uid)),
                    getAchievementFacts: async uid => structuredClone(facts.get(uid) ?? null),
                    setAchievementFacts: async (uid, value) => { staged.facts = [uid, structuredClone(value)]; },
                    createAchievementReceipts: async (uid, ids) => { staged.receipts = ids.map(id => uid + ':' + id); },
                    setSession: async (id, value) => { staged.session = [id, structuredClone(value)]; },
                    setUser: async (uid, value) => { staged.user = [uid, structuredClone(value)]; }
                };
                const result = await callback(tx);
                if (staged.user) users.set(...staged.user);
                if (staged.facts) facts.set(...staged.facts);
                for (const id of staged.receipts) unlockReceipts.add(id);
                if (staged.session) sessions.set(...staged.session);
                return result;
            });
            queue = task.catch(() => {});
            return task;
        }
    };
    return { store, sessions, users, facts, unlockReceipts };
}

const claim = (store, uid = 'player') =>
    claimSessionReward({ store, sessionId: 'session-1', uid, at: 4000 });

test('first claim credits the server-scored result exactly once', async () => {
    const { store, users, facts, unlockReceipts } = setup();
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
    assert.equal(receipt.won, true);
    assert.equal(receipt.perfect, false);
    assert.equal(user.wins, 1);
    assert.equal(user.stats.totalWins, 1);
    assert.deepEqual(user.achievements, ['first_quiz', 'first_win']);
    assert.deepEqual(facts.get('player'), { totalGames: 1, experience: 30, totalWins: 1, perfectGames: 0, level: 1, unlockedIds: ['first_quiz', 'first_win'] });
    assert.ok(unlockReceipts.has('player:first_quiz'));
});

test('perfect Classic run unlocks the 10/10 achievement from server-scored answers', async () => {
    const fixture = setup(10);
    const receipt = await claim(fixture.store);
    assert.equal(receipt.won, true);
    assert.equal(receipt.perfect, true);
    assert.ok(receipt.newlyUnlocked.includes('perfect_score'));
    assert.equal(fixture.facts.get('player').perfectGames, 1);
    assert.ok(fixture.unlockReceipts.has('player:perfect_score'));
});

test('legacy client-maintained profile totals are not imported as trusted achievement facts', async () => {
    const fixture = setup();
    fixture.users.get('player').stats.totalGames = 999;
    fixture.users.get('player').experience = 999999;
    const receipt = await claim(fixture.store);
    assert.deepEqual(receipt.newlyUnlocked, ['first_quiz', 'first_win']);
    assert.deepEqual(fixture.facts.get('player'), { totalGames: 1, experience: 30, totalWins: 1, perfectGames: 0, level: 1, unlockedIds: ['first_quiz', 'first_win'] });
});

test('server unlock ledger ignores legacy profile IDs when deciding new unlocks', async () => {
    const fixture = setup();
    fixture.users.get('player').achievements = ['first_quiz'];
    const receipt = await claim(fixture.store);
    assert.deepEqual(receipt.newlyUnlocked, ['first_quiz', 'first_win']);
    assert.deepEqual(fixture.facts.get('player').unlockedIds, ['first_quiz', 'first_win']);
    assert.ok(fixture.unlockReceipts.has('player:first_quiz'));
});

test('retries and concurrent completion requests return same receipt without double credit', async () => {
    const { store, users } = setup();
    const receipts = await Promise.all([claim(store), claim(store), claim(store)]);
    assert.equal(receipts.filter(receipt => !receipt.alreadyClaimed).length, 1);
    assert.deepEqual(receipts.map(receipt => receipt.coins), [15, 15, 15]);
    assert.equal(users.get('player').coins, 22);
    assert.equal(users.get('player').quizzesCompleted, 1);
    assert.deepEqual(users.get('player').achievements, ['first_quiz', 'first_win']);
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


test('reward claim applies server-time events using the stored player timezone', async () => {
    const fixture = setup();
    fixture.users.get('player').timeZone = 'Europe/Berlin';
    const receipt = await claimSessionReward({
        store: fixture.store,
        sessionId: 'session-1',
        uid: 'player',
        at: Date.parse('2026-11-21T17:30:00Z')
    });
    assert.equal(receipt.score, 30);
    assert.equal(receipt.xp, 60);
    assert.equal(receipt.coins, 22);
    assert.deepEqual(receipt.rewardMultipliers, { xp: 2, coins: 1.5 });
    assert.deepEqual(receipt.activeRewardEvents, ['xp_weekend', 'happy_hour']);
    assert.equal(fixture.users.get('player').experience, 65);
    assert.equal(fixture.users.get('player').coins, 29);
    assert.equal(fixture.facts.get('player').experience, 60);
});

test('legacy profiles without timezone use UTC and never accept client multipliers', async () => {
    const fixture = setup();
    delete fixture.users.get('player').timeZone;
    const receipt = await claimSessionReward({
        store: fixture.store,
        sessionId: 'session-1',
        uid: 'player',
        at: Date.parse('2026-11-21T17:30:00Z')
    });
    assert.equal(receipt.xp, 30);
    assert.equal(receipt.coins, 15);
    assert.deepEqual(receipt.rewardMultipliers, { xp: 1, coins: 1 });
    assert.deepEqual(receipt.activeRewardEvents, []);
});
