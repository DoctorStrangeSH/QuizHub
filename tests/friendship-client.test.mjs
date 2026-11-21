import test from 'node:test';
import assert from 'node:assert/strict';
import { createFriendshipClient } from '../app/modules/friends/friendship-client.js';

test('friendship client sends only supported operations and accepts stable receipts', async () => {
    const calls = [];
    const client = createFriendshipClient({ invoke: async request => {
        calls.push(request);
        return { data: { status: 'updated' } };
    }});
    assert.deepEqual(await client.perform('send', 'bob'), { status: 'updated' });
    assert.deepEqual(await client.perform('remove', 'bob'), { status: 'updated' });
    assert.deepEqual(calls, [
        { operation: 'send', targetUid: 'bob' },
        { operation: 'remove', targetUid: 'bob' }
    ]);
    for (const [operation, uid] of [['admin', 'bob'], ['send', 'bad/id'], ['send', '']]) {
        await assert.rejects(client.perform(operation, uid), /INVALID_FRIENDSHIP_REQUEST/);
    }
});

test('friendship client maps callable errors and rejects malformed receipts', async () => {
    const conflict = createFriendshipClient({ invoke: async () => {
        const error = new Error('internal detail'); error.code = 'failed-precondition'; throw error;
    }});
    await assert.rejects(conflict.perform('accept', 'bob'), /FRIENDSHIP_STATE_CONFLICT/);
    const malformed = createFriendshipClient({ invoke: async () => ({ data: { status: 'admin' } }) });
    await assert.rejects(malformed.perform('send', 'bob'), /INVALID_FRIENDSHIP_RESPONSE/);
});
