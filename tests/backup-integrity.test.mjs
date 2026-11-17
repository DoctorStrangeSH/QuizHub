import test from 'node:test';
import assert from 'node:assert/strict';
import { QUIZHUB_FIRESTORE_INVENTORY, protectedQuizHubManifestKeys } from '../server/firestore-migration-inventory.mjs';
import { createBackupIntegrityManifest, verifyBackupIntegrity } from '../server/backup-integrity.mjs';

const snapshot = () => Object.fromEntries(protectedQuizHubManifestKeys().map(key => [key, []]));

test('backup checksums remain stable across collection, record and object-key ordering', () => {
    const a = snapshot();
    a.users = [
        { id: 'bob', data: { coins: 8, achievements: ['earned'], settings: { theme: 'dark', music: true } } },
        { id: 'alice', data: { experience: 999, coins: 100 } }
    ];
    a.chatMessages = [{ id: 'chatX/m1', data: { text: 'Private message' } }];
    const b = Object.fromEntries(Object.entries(structuredClone(a)).reverse());
    b.users.reverse();
    b.users[1].data = { settings: { music: true, theme: 'dark' }, achievements: ['earned'], coins: 8 };
    const proof = createBackupIntegrityManifest(a);
    assert.equal(proof.version, 'quizhub-json-snapshot-v1');
    assert.deepEqual(createBackupIntegrityManifest(b), proof);
    assert.equal(verifyBackupIntegrity(b, proof).status, 'verified');
    assert.equal(proof.collections.users.count, 2);
    assert.ok(!JSON.stringify(proof).includes('Private message'));
    assert.ok(!JSON.stringify(proof).includes('999'));
});

test('modification, deletion and unrecognized data all invalidate original backup', () => {
    const a = snapshot();
    a.users.push({ id: 'alice', data: { coins: 100, friends: ['bob'] } });
    a.chatMessages.push({ id: 'chat1/message1', data: { text: 'Hello' } });
    const proof = createBackupIntegrityManifest(a);
    const changed = structuredClone(a);
    changed.users[0].data.coins = 1000;
    assert.equal(verifyBackupIntegrity(changed, proof).status, 'mismatch');
    const missing = structuredClone(a);
    missing.chatMessages = [];
    assert.equal(verifyBackupIntegrity(missing, proof).status, 'mismatch');
    const unknown = structuredClone(a);
    unknown.abandonedLegacyCollection = [{ id: 'old', data: { value: 1 } }];
    assert.equal(verifyBackupIntegrity(unknown, proof).status, 'mismatch');
    assert.equal(createBackupIntegrityManifest(unknown).collections.abandonedLegacyCollection.count, 1);
});

test('incomplete or malformed snapshots fail closed without leaking private values', () => {
    const a = snapshot();
    delete a.chatMessages;
    assert.throws(() => createBackupIntegrityManifest(a), /MISSING_REQUIRED_MIGRATION_COLLECTION/);
    const full = snapshot();
    full.users = [{ id: 'alice', data: { email: 'private@example.test' } }, { id: 'alice', data: {} }];
    assert.throws(() => createBackupIntegrityManifest(full), /INVALID_OR_DUPLICATE_BACKUP_RECORD/);
    full.users = [{ id: 'alice', data: { when: new Date() } }];
    assert.throws(() => createBackupIntegrityManifest(full), /NON_JSON_BACKUP_VALUE/);
    full.users = [{ id: 'alice', data: { amount: Number.NaN } }];
    assert.throws(() => createBackupIntegrityManifest(full), /UNSUPPORTED_BACKUP_VALUE/);
    full.users = [{ id: 'alice', data: { items: [undefined] } }];
    assert.throws(() => createBackupIntegrityManifest(full), /UNSUPPORTED_BACKUP_VALUE/);
});

test('verification rejects corrupt or forged metadata without claiming authenticity', () => {
    const a = snapshot();
    const proof = createBackupIntegrityManifest(a);
    assert.deepEqual(verifyBackupIntegrity(a, { ...proof, rootSha256: 'broken' }), {
        status: 'invalid_manifest', matched: false
    });
    const changedCounts = structuredClone(proof);
    changedCounts.collections.users.count = 42;
    assert.equal(verifyBackupIntegrity(a, changedCounts).status, 'mismatch');
    assert.equal(QUIZHUB_FIRESTORE_INVENTORY.some(x => x.path.includes('/messages/')), true);
});
