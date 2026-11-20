import test from 'node:test';
import assert from 'node:assert/strict';
import { collectFirestoreInventory } from '../server/firestore-live-inventory.mjs';

function fakeCollection(path, documents) {
    return {
        path,
        async listDocuments() { return documents; }
    };
}

function fakeDocument(path, data, subcollections = []) {
    return {
        path,
        async get() {
            return { exists: data !== null, data: () => data };
        },
        async listCollections() { return subcollections; }
    };
}

test('inventory recursively finds nested collections under missing parent documents', async () => {
    const users = fakeCollection('users', [
        fakeDocument('users/alice-private-id', {
            email: 'private@example.test',
            nickname: 'Alice',
            stats: { wins: 4, totalGames: 7 }, tags: ['one', 'two'], inventory: [{ sku: 'secret-sku', quantity: 2 }]
        })
    ]);
    const messages = fakeCollection('chats/orphan-chat-id/messages', [
        fakeDocument('chats/orphan-chat-id/messages/message-secret-id', {
            senderId: 'alice-private-id',
            text: 'private message body',
            createdAt: new Date('2026-01-01T00:00:00Z')
        })
    ]);
    const chats = fakeCollection('chats', [
        fakeDocument('chats/orphan-chat-id', null, [messages])
    ]);
    const report = await collectFirestoreInventory({
        async listCollections() { return [users, chats]; }
    });

    assert.equal(report.complete, true);
    assert.equal(report.documentIdsIncluded, false);
    assert.equal(report.dataValuesIncluded, false);
    assert.equal(report.totalDocumentReferences, 3);
    assert.equal(report.existingDocuments, 2);
    assert.equal(report.missingParentDocuments, 1);
    assert.deepEqual(report.collections.map(x => x.path), [
        'chats', 'chats/{docId}/messages', 'users'
    ]);
    const userSchema = report.collections.find(x => x.path === 'users');
    assert.deepEqual(userSchema.fields, [
        { field: 'email', types: { string: 1 } },
        { field: 'inventory', types: { array: 1 } },
        { field: 'inventory[]', types: { map: 1 } },
        { field: 'inventory[].quantity', types: { integer: 1 } },
        { field: 'inventory[].sku', types: { string: 1 } },
        { field: 'nickname', types: { string: 1 } },
        { field: 'stats', types: { map: 1 } },
        { field: 'stats.totalGames', types: { integer: 1 } },
        { field: 'stats.wins', types: { integer: 1 } },
        { field: 'tags', types: { array: 1 } },
        { field: 'tags[]', types: { string: 2 } }
    ]);
    const serialized = JSON.stringify(report);
    for (const secret of ['alice-private-id', 'orphan-chat-id', 'message-secret-id',
        'private@example.test', 'private message body', 'secret-sku']) {
        assert.equal(serialized.includes(secret), false);
    }
});

test('inventory aborts rather than returning a partial report after the document cap', async () => {
    const users = fakeCollection('users', [
        fakeDocument('users/a', { nickname: 'A' }),
        fakeDocument('users/b', { nickname: 'B' })
    ]);
    await assert.rejects(
        collectFirestoreInventory({ async listCollections() { return [users]; } }, { maxDocuments: 1 }),
        /INVENTORY_MAX_DOCUMENTS_EXCEEDED/
    );
});

test('inventory enforces safe depth and document limits', async () => {
    const db = { async listCollections() { return []; } };
    await assert.rejects(collectFirestoreInventory(db, { maxDocuments: 20001 }), /INVALID_INVENTORY_DOCUMENT_LIMIT/);
    await assert.rejects(collectFirestoreInventory(db, { maxDepth: 9 }), /INVALID_INVENTORY_DEPTH_LIMIT/);
});
