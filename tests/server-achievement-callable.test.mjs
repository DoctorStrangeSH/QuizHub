import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthenticatedAchievementHandler } from '../server/authenticated-achievement-handler.mjs';
import { createAchievementCallableAdapter } from '../server/firebase-achievement-callable-adapter.mjs';

class FakeHttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }

test('handler derives UID from verified auth and rejects caller-supplied progress', async () => {
    const calls = [];
    const handle = createAuthenticatedAchievementHandler({ service: { evaluate: async value => (calls.push(value), { newlyUnlocked: [] }) } });
    await handle('evaluate', {}, { auth: { uid: 'verified' } });
    assert.deepEqual(calls, [{ uid: 'verified' }]);
    await assert.rejects(handle('evaluate', { level: 100 }, { auth: { uid: 'verified' } }), /INVALID_ACHIEVEMENT_REQUEST/);
    await assert.rejects(handle('evaluate', {}, {}), /AUTH_REQUIRED/);
});

test('callable validates request and hides private internal errors', async () => {
    const callable = createAchievementCallableAdapter({ handle: async (op, payload, context) => ({ op, payload, uid: context.auth.uid }), HttpsError: FakeHttpsError });
    assert.deepEqual(await callable({ auth: { uid: 'alice' }, data: { operation: 'evaluate', payload: {} } }),
        { op: 'evaluate', payload: {}, uid: 'alice' });
    await assert.rejects(callable({ data: { operation: 'evaluate', payload: {} } }), e => e.code === 'unauthenticated');
    await assert.rejects(callable({ auth: { uid: 'alice' }, data: { operation: 'evaluate', payload: { facts: {} } } }), e => e.code === 'invalid-argument');

    const broken = createAchievementCallableAdapter({ handle: async () => { throw new Error('private database detail'); }, HttpsError: FakeHttpsError });
    await assert.rejects(broken({ auth: { uid: 'alice' }, data: { operation: 'evaluate', payload: {} } }),
        e => e.code === 'internal' && e.message === 'ACHIEVEMENT_SERVER_ERROR');
});
