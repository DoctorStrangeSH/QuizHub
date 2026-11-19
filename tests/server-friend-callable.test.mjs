import test from 'node:test';
import assert from 'node:assert/strict';
import { createFriendCallableAdapter } from '../server/friend-callable-adapter.mjs';

class HttpsError extends Error {
    constructor(code, message) { super(message); this.code = code; }
}
const authenticated = data => ({ auth: { uid: 'alice', token: { firebase: { sign_in_provider: 'password' } } }, data });

test('friend callable derives actor from verified Auth, never from request data', async () => {
    const calls = [];
    const handler = createFriendCallableAdapter({
        HttpsError, update: async args => { calls.push(args); return { status: 'updated' }; }
    });
    assert.deepEqual(await handler(authenticated({ operation: 'send', targetUid: 'bob' })), { status: 'updated' });
    assert.deepEqual(calls, [{ actorUid: 'alice', targetUid: 'bob', operation: 'send' }]);
    for (const data of [
        { operation: 'send', targetUid: 'bob', actorUid: 'bob' },
        { operation: 'send', targetUid: 'alice' },
        { operation: 'unknown', targetUid: 'bob' },
        { operation: 'send', targetUid: 'bob', admin: true },
        { operation: 'send', targetUid: 'bad/id' },
        ['send', 'bob'], null
    ]) await assert.rejects(handler(authenticated(data)), e => e.code === 'invalid-argument');
    assert.equal(calls.length, 1);
});

test('friend callable refuses guests and maps known errors without leaking private failures', async () => {
    const handler = createFriendCallableAdapter({
        HttpsError, update: async () => { throw new Error('private database connection failed'); }
    });
    await assert.rejects(handler({ data: { operation: 'send', targetUid: 'bob' } }), e => e.code === 'unauthenticated');
    await assert.rejects(handler({ ...authenticated({ operation: 'send', targetUid: 'bob' }), auth: {
        uid: 'alice', token: { firebase: { sign_in_provider: 'anonymous' } }
    } }), e => e.code === 'unauthenticated');
    await assert.rejects(handler(authenticated({ operation: 'send', targetUid: 'bob' })), e =>
        e.code === 'internal' && e.message === 'FRIEND_OPERATION_FAILED');
    const conflict = createFriendCallableAdapter({ HttpsError, update: async () => {
        throw new Error('SOCIAL_STATE_CONFLICT');
    } });
    await assert.rejects(conflict(authenticated({ operation: 'accept', targetUid: 'bob' })), e =>
        e.code === 'failed-precondition' && e.message === 'SOCIAL_STATE_CONFLICT');
});
