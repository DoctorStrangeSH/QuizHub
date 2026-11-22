import test from 'node:test';
import assert from 'node:assert/strict';
import { buildQuestionCatalog } from '../server/question-delivery.mjs';
import { createQuizService } from '../server/quiz-service.mjs';
import { createAuthenticatedQuizHandler } from '../server/authenticated-quiz-handler.mjs';

function atomicMemoryStore() {
    const sessions = new Map();
    const facts = new Map();
    const unlockReceipts = new Set();
    const ledgerEntries = new Map();
    const users = new Map([
        ['alice', { experience: 0, weeklyExperience: 0, coins: 0, quizzesCompleted: 0, stats: {} }],
        ['bob', { experience: 0, weeklyExperience: 0, coins: 0, quizzesCompleted: 0, stats: {} }]
    ]);
    let queue = Promise.resolve();
    return {
        sessions, users, facts, unlockReceipts, ledgerEntries,
        runTransaction(operation) {
            const result = queue.then(async () => {
                const staged = new Map();
                const tx = {
                    getSession: async id => structuredClone(staged.get('s:' + id) ?? sessions.get(id)),
                    setSession: async (id, value) => { staged.set('s:' + id, structuredClone(value)); },
                    createLedgerEntry: async entry => {
                        const key = 'l:' + entry.uid + ':' + entry.entryId;
                        if (ledgerEntries.has(key) || staged.has(key)) throw new Error('LEDGER_ENTRY_EXISTS');
                        staged.set(key, structuredClone(entry));
                    },
                    getUser: async id => structuredClone(staged.get('u:' + id) ?? users.get(id)),
                    getAchievementFacts: async id => structuredClone(staged.get('f:' + id) ?? facts.get(id) ?? null),
                    setAchievementFacts: async (id, value) => { staged.set('f:' + id, structuredClone(value)); },
                    createAchievementReceipts: async (id, ids) => { for (const achievementId of ids) staged.set('r:' + id + ':' + achievementId, true); },
                    setUser: async (id, value) => { staged.set('u:' + id, structuredClone(value)); }
                };
                const answer = await operation(tx);
                for (const [key, value] of staged) {
                    if (key.startsWith('s:')) sessions.set(key.slice(2), value);
                    else if (key.startsWith('u:')) users.set(key.slice(2), value);
                    else if (key.startsWith('f:')) facts.set(key.slice(2), value);
                    else if (key.startsWith('r:')) unlockReceipts.add(key.slice(2));
                    else if (key.startsWith('l:')) ledgerEntries.set(key, value);
                }
                return answer;
            });
            queue = result.catch(() => {});
            return result;
        }
    };
}

test('authenticated request -> answer -> claim is owner-bound and awards once', async () => {
    const catalog = buildQuestionCatalog({
        science: { easy: [{
            questionRU: 'Сколько будет 2 + 2?', questionEN: 'What is 2 + 2?',
            optionsRU: ['3', '4'], optionsEN: ['3', '4'],
            correctIndex: 1, points: 10
        }] }
    });
    const store = atomicMemoryStore();
    const service = createQuizService({ catalog, store, sessionDurationMs: 5000 });
    const request = createAuthenticatedQuizHandler(service);
    const alice = time => ({ auth: { uid: 'alice' }, now: time });
    const bob = time => ({ auth: { uid: 'bob' }, now: time });

    const started = await request('start', {
        mode: 'classic', category: 'science', difficulty: 'easy', count: 1
    }, alice(1000));
    assert.equal('correctIndex' in started.question, false);
    assert.equal('points' in started.question, false);

    await assert.rejects(request('answer', {
        sessionId: started.sessionId, questionId: started.question.id, answerIndex: 1
    }, bob(1500)), /NOT_SESSION_OWNER/);
    await assert.rejects(request('complete', {
        sessionId: started.sessionId
    }, bob(1500)), /NOT_SESSION_OWNER/);
    await assert.rejects(request('answer', {
        sessionId: started.sessionId, questionId: started.question.id,
        answerIndex: 1, uid: 'bob'
    }, alice(1500)), /UNEXPECTED_FIELD/);

    const answer = await request('answer', {
        sessionId: started.sessionId, questionId: started.question.id, answerIndex: 1
    }, alice(2000));
    assert.equal(answer.correct, true);

    const [first, retry] = await Promise.all([
        request('complete', { sessionId: started.sessionId }, alice(3000)),
        request('complete', { sessionId: started.sessionId }, alice(3000))
    ]);
    assert.equal(first.alreadyClaimed, false);
    assert.equal(retry.alreadyClaimed, true);
    assert.equal(store.users.get('alice').coins, first.coins);
    assert.equal(store.users.get('alice').quizzesCompleted, 1);
    assert.equal(store.users.get('bob').coins, 0);
    assert.equal(store.users.get('bob').quizzesCompleted, 0);
    assert.equal(store.ledgerEntries.size, 1);
    const [ledgerEvent] = store.ledgerEntries.values();
    assert.equal(ledgerEvent.type, 'quiz_reward');
    assert.equal(ledgerEvent.sourceId, started.sessionId);
    assert.equal(ledgerEvent.coinsDelta, first.coins);
    assert.equal(ledgerEvent.xpDelta, first.xp);

    const resumed = await request('resume', { sessionId: started.sessionId }, alice(4000));
    assert.equal(resumed.status, 'completed');
    assert.equal(resumed.receipt.alreadyClaimed, true);
    await assert.rejects(request('resume', { sessionId: started.sessionId }, bob(4000)), /NOT_SESSION_OWNER/);
});
