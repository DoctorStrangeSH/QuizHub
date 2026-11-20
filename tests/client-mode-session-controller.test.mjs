import test from 'node:test';
import assert from 'node:assert/strict';
import { createModeSessionController } from '../app/modules/quiz/mode-session-controller.js';

function sequenceRandom(values) {
    let index = 0;
    return () => values[index++] ?? 0;
}

test('controller maps shuffled visible option back to canonical server index', async () => {
    const calls = [];
    const controller = createModeSessionController({
        random: sequenceRandom([0, 0, 0]),
        client: {
            start: async () => ({
                sessionId: 'session-1', mode: 'duel', deadlineAt: 9000, totalQuestions: 2,
                question: { id: 'q1', question: 'Question?', options: ['A', 'B', 'C', 'D'] }
            }),
            answer: async payload => {
                calls.push(payload);
                return {
                    correct: payload.answerIndex === 3,
                    finished: false,
                    nextQuestion: { id: 'q2', question: 'Next?', options: ['E', 'F'] }
                };
            },
            resume: async () => ({}),
            claim: async () => ({})
        }
    });
    const started = await controller.start({ mode: 'duel', count: 2 });
    assert.deepEqual(started.question.options, ['B', 'C', 'D', 'A']);
    await controller.answerDisplayed(2);
    assert.equal(calls[0].answerIndex, 3);
    assert.equal(calls[0].questionId, 'q1');
    assert.equal(controller.getState().question.id, 'q2');
});

test('controller prevents double answers while a request is pending', async () => {
    let release;
    const controller = createModeSessionController({
        client: {
            start: async () => ({
                sessionId: 's', mode: 'survival', deadlineAt: 5000, totalQuestions: 1,
                question: { id: 'q', question: 'Q', options: ['A', 'B'] }
            }),
            answer: () => new Promise(resolve => { release = resolve; }),
            resume: async () => ({}), claim: async () => ({})
        }
    });
    await controller.start({ mode: 'survival', count: 1 });
    const pending = controller.answerDisplayed(0);
    await assert.rejects(controller.answerDisplayed(1), /NO_ACTIVE_QUESTION/);
    release({ finished: true, correct: true });
    await pending;
    assert.equal(controller.getState().status, 'ready_to_claim');
});

test('controller restores server session without exposing answer keys', async () => {
    const controller = createModeSessionController({
        client: {
            start: async () => ({}), answer: async () => ({}),
            resume: async () => ({
                status: 'in_progress', sessionId: 's', mode: 'time',
                answeredQuestions: 2, totalQuestions: 10, deadlineAt: 9000,
                questionDeadlineAt: 8000,
                question: { id: 'q3', question: 'Restored?', options: ['X', 'Y'] }
            }),
            claim: async () => ({})
        }
    });
    const state = await controller.resume({ sessionId: 's' });
    assert.equal(state.answeredQuestions, 2);
    assert.equal(state.question.id, 'q3');
    assert.equal('correctIndex' in state.question, false);
});

test('controller claims only a ready session and stores the server receipt', async () => {
    const controller = createModeSessionController({
        client: {
            start: async () => ({
                sessionId: 's', mode: 'survival', deadlineAt: 9000, totalQuestions: 1,
                question: { id: 'q', question: 'Q', options: ['A', 'B'] }
            }),
            answer: async () => ({ finished: true, score: 10 }),
            resume: async () => ({}),
            claim: async () => ({ xp: 5, coins: 2, alreadyClaimed: false })
        }
    });
    await assert.rejects(controller.claim(), /SESSION_NOT_READY/);
    await controller.start({ mode: 'survival', count: 1 });
    await controller.answerDisplayed(0);
    const complete = await controller.claim();
    assert.equal(complete.status, 'completed');
    assert.equal(complete.receipt.xp, 5);
});


test('controller allows claiming a session that resume marks ready_to_complete', async () => {
    let claimCalls = 0;
    const controller = createModeSessionController({
        client: {
            start: async () => ({}), answer: async () => ({}),
            resume: async () => ({
                status: 'ready_to_complete', sessionId: 's-expired',
                mode: 'time', answeredQuestions: 4, totalQuestions: 10,
                deadlineAt: 1000, question: null
            }),
            claim: async ({ sessionId }) => {
                claimCalls++;
                return { sessionId, xp: 4, coins: 2 };
            }
        }
    });
    const resumed = await controller.resume({ sessionId: 's-expired' });
    assert.equal(resumed.status, 'ready_to_complete');
    const completed = await controller.claim();
    assert.equal(claimCalls, 1);
    assert.equal(completed.status, 'completed');
    assert.equal(completed.receipt.sessionId, 's-expired');
});
