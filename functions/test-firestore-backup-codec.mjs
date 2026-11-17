import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, GeoPoint, DocumentReference } from 'firebase-admin/firestore';
import { encodeFirestoreBackupData, decodeFirestoreBackupData } from '../server/firestore-backup-codec.mjs';
import { createBackupIntegrityManifest, verifyBackupIntegrity } from '../server/backup-integrity.mjs';
import { protectedQuizHubManifestKeys } from '../server/firestore-migration-inventory.mjs';

test('real Admin Firestore values survive tagged JSON encoding, parsing and decoding', async () => {
    const app = initializeApp({ projectId: 'demo-quizhub' }, 'codec-' + randomUUID());
    const db = getFirestore(app);
    const options = { Timestamp, GeoPoint, DocumentReference, db };
    try {
        const data = {
            createdAt: new Timestamp(1723000000, 123456789),
            point: new GeoPoint(59.9, 30.3),
            avatar: Buffer.from([0, 1, 2, 255]),
            bytes: new Uint8Array([3, 4, 5]),
            birthday: new Date('2024-04-01T12:00:00.123Z'),
            rival: db.collection('users').doc('rival123'),
            rewards: [NaN, Infinity, -Infinity, -0, { games: 16 }],
            coins: 237
        };
        const encoded = encodeFirestoreBackupData(data, options);
        const diskCopy = JSON.parse(JSON.stringify(encoded));
        const decoded = decodeFirestoreBackupData(diskCopy, options);
        assert.equal(decoded.createdAt.seconds, data.createdAt.seconds);
        assert.equal(decoded.createdAt.nanoseconds, data.createdAt.nanoseconds);
        assert.deepEqual(decoded.point, data.point);
        assert.deepEqual(decoded.avatar, data.avatar);
        assert.deepEqual(decoded.bytes, Buffer.from(data.bytes));
        assert.equal(decoded.birthday.getTime(), data.birthday.getTime());
        assert.equal(decoded.rival.path, data.rival.path);
        assert.ok(Number.isNaN(decoded.rewards[0]));
        assert.equal(decoded.rewards[1], Infinity);
        assert.equal(decoded.rewards[2], -Infinity);
        assert.ok(Object.is(decoded.rewards[3], -0));
        assert.deepEqual(encodeFirestoreBackupData(decoded, options), encoded);
        const snapshot = Object.fromEntries(protectedQuizHubManifestKeys().map(key => [key, []]));
        snapshot.users.push({ id: 'codecUser', data: diskCopy });
        assert.equal(verifyBackupIntegrity(snapshot, createBackupIntegrityManifest(snapshot)).status, 'verified');
    } finally {
        await db.terminate();
        await deleteApp(app);
    }
});

test('unsupported data, tag collisions, corrupt type fields and foreign refs fail closed', async () => {
    const app = initializeApp({ projectId: 'demo-quizhub' }, 'codec-invalid-' + randomUUID());
    const other = initializeApp({ projectId: 'demo-quizhub' }, 'codec-other-' + randomUUID());
    const db = getFirestore(app), otherDb = getFirestore(other);
    const options = { Timestamp, GeoPoint, DocumentReference, db };
    try {
        assert.throws(() => encodeFirestoreBackupData({ bad: undefined }, options), /UNSUPPORTED_BACKUP_VALUE/);
        assert.throws(() => encodeFirestoreBackupData({ bad: new Set([1]) }, options), /NON_JSON_BACKUP_VALUE/);
        assert.throws(() => encodeFirestoreBackupData({ '__quizhub_firestore_type_v1': 'timestamp' }, options), /RESERVED_BACKUP_TAG_COLLISION/);
        assert.throws(() => encodeFirestoreBackupData({ other: otherDb.doc('users/other') }, options), /CROSS_DATABASE_BACKUP_REFERENCE/);
        assert.throws(() => decodeFirestoreBackupData({ '__quizhub_firestore_type_v1': 'timestamp', seconds: 3, nanoseconds: -1 }, options), /INVALID_BACKUP_TYPE_TAG/);
        assert.throws(() => decodeFirestoreBackupData({ '__quizhub_firestore_type_v1': 'reference', path: 'users/abc/messages' }, options), /INVALID_BACKUP_REFERENCE_PATH/);
        assert.throws(() => decodeFirestoreBackupData({ '__quizhub_firestore_type_v1': 'bytes', base64: 'not-base64!' }, options), /INVALID_BACKUP_BYTES/);
        assert.throws(() => decodeFirestoreBackupData({ '__quizhub_firestore_type_v1': 'mystery' }, options), /INVALID_BACKUP_TYPE_TAG/);
    } finally {
        await db.terminate();
        await otherDb.terminate();
        await deleteApp(app);
        await deleteApp(other);
    }
});
