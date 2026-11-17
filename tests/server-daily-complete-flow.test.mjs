import test from 'node:test';
import assert from 'node:assert/strict';
import { buildQuestionCatalog } from '../server/question-delivery.mjs';
import { createAuthenticatedDailyChallengeHandler } from '../server/authenticated-daily-challenge-handler.mjs';
import { createServerDailyChallenge } from '../server/daily-challenge-service.mjs';
import { buildDailyLeaderboard } from '../server/daily-leaderboard.mjs';
import { createDailyPrizeService } from '../server/daily-prize-service.mjs';

const day = '2026-11-15';
const now = Date.parse('2026-11-15T12:00:00Z');
const closedAt = Date.parse('2026-11-16T00:00:00Z');

function catalog() {
    const categories = { science: {} };
    for (const difficulty of ['easy', 'medium', 'hard']) {
        categories.science[difficulty] = Array.from({ length: 8 }, (_, i) => ({
            questionRU: difficulty + i, questionEN: difficulty + i,
            optionsRU: ['0', '1'], optionsEN: ['0', '1'],
            correctIndex: 1, points: 10
        }));
    }
    return buildQuestionCatalog(categories);
}

function memoryDatabase() {
    const attempts = new Map();
    const prizes = new Map();
    const users = new Map(['alice', 'bob'].map(uid => [uid, {
        experience: 0, weeklyExperience: 0, coins: 0
    }]));
    let snapshot = null;
    let queue = Promise.resolve();
    return {
        attempts, prizes, users,
        seal(date) {
            const receipts = [...attempts.values()].map(value => value.receipt).filter(Boolean);
            snapshot = { date, sealed: true, receipts };
        },
        runTransaction(callback) {
            const operation = queue.then(async () => {
                const changes = new Map();
                const read = (key, map) => structuredClone(changes.get(key) ?? map.get(key.slice(2)));
                const tx = {
                    getDailyAttempt: async key => read('a:' + key, attempts),
                    setDailyAttempt: async (key, value) => changes.set('a:' + key, structuredClone(value)),
                    getDailyPrize: async key => read('p:' + key, prizes),
                    setDailyPrize: async (key, value) => changes.set('p:' + key, structuredClone(value)),
                    getDailyRanking: async () => structuredClone(snapshot),
                    getUser: async uid => read('u:' + uid, users),
                    setUser: async (uid, value) => changes.set('u:' + uid, structuredClone(value))
                };
                const result = await callback(tx);
                for (const [key, value] of changes) {
                    const prefix = key.slice(0, 2);
                    const id = key.slice(2);
                    if (prefix === 'a:') attempts.set(id, value);
                    else if (prefix === 'p:') prizes.set(id, value);
                    else users.set(id, value);
                }
                return result;
            });
            queue = operation.catch(() => {});
            return operation;
        }
    };
}

test('full two-player ranked challenge yields stable leaderboard and exactly-once prizes', async () => {
    const store = memoryDatabase();
    const answers = catalog();
    const daily = createAuthenticatedDailyChallengeHandler(
        createServerDailyChallenge({ catalog: answers, store })
    );
    const prizes = createDailyPrizeService(store);
    for (const [uid, alwaysCorrect] of [['alice', true], ['bob', false]]) {
        const context = at => ({ auth: { uid }, now: at });
        let progress = await daily('start', {}, context(now));
        assert.equal(progress.totalQuestions, 10);
        assert.equal(progress.date, day);
        for (let index = 0; index < 10; index++) {
            const question = progress.question;
            assert.equal('correctIndex' in question, false);
            progress = await daily('answer', {
                date: day, questionId: question.id,
                answerIndex: alwaysCorrect ? answers.get(question.id).correctIndex : 0
            }, context(now + index + 1));
        }
        assert.equal(progress.status, 'ready_to_complete');
        const receipt = await daily('complete', { date: day }, context(now + 100));
        assert.equal(receipt.score, alwaysCorrect ? 100 : 0);
    }

    await assert.rejects(prizes.claim({
        uid: 'alice', date: day, now: closedAt
    }), /DAILY_RANKING_NOT_SEALED/);
    store.seal(day);
    const board = buildDailyLeaderboard({
        date: day, receipts: [...store.attempts.values()].map(a => a.receipt),
        viewerUid: 'bob'
    });
    assert.equal(board.participants, 2);
    assert.equal(board.viewerRank, 2);
    assert.deepEqual(board.rows.map(row => row.score), [100, 0]);
    const [first, replay] = await Promise.all([
        prizes.claim({ uid: 'alice', date: day, now: closedAt }),
        prizes.claim({ uid: 'alice', date: day, now: closedAt })
    ]);
    assert.equal(first.rank, 1);
    assert.equal(first.coins, 100);
    assert.equal(replay.alreadyClaimed, true);
    assert.equal(store.users.get('alice').coins, 100);
    const second = await prizes.claim({ uid: 'bob', date: day, now: closedAt });
    assert.equal(second.rank, 2);
    assert.equal(second.coins, 60);
    assert.equal(store.users.get('bob').coins, 60);
    assert.equal(store.prizes.size, 2);
});
