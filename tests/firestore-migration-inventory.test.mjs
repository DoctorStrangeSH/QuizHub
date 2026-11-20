import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    QUIZHUB_FIRESTORE_INVENTORY,
    protectedQuizHubManifestKeys,
    validateQuizHubMigrationManifest
} from '../server/firestore-migration-inventory.mjs';
import { verifyLegacyDataPreservation } from '../server/legacy-data-preservation.mjs';

test('inventory matches repository-backed Firestore sources and has unique manifest keys', () => {
    const keys = QUIZHUB_FIRESTORE_INVENTORY.map(entry => entry.key);
    assert.equal(new Set(keys).size, keys.length);
    for (const entry of QUIZHUB_FIRESTORE_INVENTORY) {
        assert.match(entry.path, /^[A-Za-z][^\s]+$/);
        const source = readFileSync(new URL('../' + entry.source, import.meta.url), 'utf8');
        assert.ok(source.includes(entry.path.split('/')[0]), entry.source + ' missing ' + entry.path);
    }
    assert.equal(keys.includes('chatMessages'), true);
    assert.equal(QUIZHUB_FIRESTORE_INVENTORY.find(x => x.key === 'chatMessages').path,
        'chats/{chatId}/messages/{messageId}');
    assert.equal(keys.includes('friendships'), false, 'friends live in users documents, not a separate collection');
    assert.equal(keys.includes('quizResults'), false, 'no separate quizResults collection appears in app sources');
    assert.equal(QUIZHUB_FIRESTORE_INVENTORY.find(x => x.key === 'achievementFacts').path, 'achievementFacts/{uid}');
    assert.equal(QUIZHUB_FIRESTORE_INVENTORY.find(x => x.key === 'achievementUnlockReceipts').path,
        'achievementUnlockReceipts/{uid}/unlocks/{achievementId}');
});

test('real inventory requires nested messages and all game snapshots before data-preservation pass', () => {
    const required = protectedQuizHubManifestKeys();
    const before = Object.fromEntries(required.map(key => [key, []]));
    const after = structuredClone(before);
    before.users.push({ id: 'alice', data: { friends: ['bob'], coins: 42, achievements: ['winner'] } });
    after.users = structuredClone(before.users);
    before.chatMessages.push({ id: 'chatA/message1', data: { text: 'Private chat message' } });
    after.chatMessages = structuredClone(before.chatMessages);
    assert.deepEqual(validateQuizHubMigrationManifest(before), required);
    assert.equal(verifyLegacyDataPreservation(before, after, { protectedCollections: required }).status, 'preserved');
    delete after.chatMessages;
    assert.throws(() => validateQuizHubMigrationManifest(after), /MISSING_REQUIRED_MIGRATION_COLLECTION: chatMessages/);
    after.chatMessages = [];
    assert.equal(verifyLegacyDataPreservation(before, after, { protectedCollections: required }).status, 'blocked');
});
