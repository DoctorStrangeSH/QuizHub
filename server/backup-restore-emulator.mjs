import { QUIZHUB_FIRESTORE_INVENTORY, validateQuizHubMigrationManifest } from './firestore-migration-inventory.mjs';
import { createBackupIntegrityManifest, verifyBackupIntegrity } from './backup-integrity.mjs';
import { verifyLegacyDataPreservation } from './legacy-data-preservation.mjs';
import { decodeFirestoreBackupData, encodeFirestoreBackupData } from './firestore-backup-codec.mjs';
import { isDeepStrictEqual } from 'node:util';

// Deliberately restricted to the disposable local emulator. This is NOT a
// production backup importer, export reader, or disaster-recovery command.
export function assertIsolatedQuizHubEmulator() {
    if (!process.env.FIRESTORE_EMULATOR_HOST ||
        !/^((127\.0\.0\.1)|(localhost)|(\[::1\])):\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST) ||
        process.env.GCLOUD_PROJECT !== 'demo-quizhub' ||
        (process.env.GOOGLE_CLOUD_PROJECT && process.env.GOOGLE_CLOUD_PROJECT !== 'demo-quizhub')) {
        throw new Error('ISOLATED_DEMO_FIRESTORE_EMULATOR_REQUIRED');
    }
}

const entries = new Map(QUIZHUB_FIRESTORE_INVENTORY.map(entry => [entry.key, entry]));

function validateSegment(segment) {
    if (typeof segment !== 'string' || !segment || segment === '.' || segment === '..' ||
        segment.includes('/') || segment.includes('\0') || segment.startsWith('__') || segment.endsWith('__')) {
        throw new TypeError('INVALID_RESTORE_DOCUMENT_ID');
    }
    return segment;
}

export function planQuizHubEmulatorRestore(snapshot, expectedManifest) {
    const protectedKeys = validateQuizHubMigrationManifest(snapshot);
    if (!expectedManifest || verifyBackupIntegrity(snapshot, expectedManifest).matched !== true) {
        throw new Error('BACKUP_INTEGRITY_NOT_VERIFIED');
    }
    const operations = [];
    const paths = new Set();
    for (const [key, records] of Object.entries(snapshot)) {
        const entry = entries.get(key);
        if (!entry || !entry.preserve) throw new TypeError('RESTORE_COLLECTION_NOT_ALLOWED: ' + key);
        const template = entry.path.split('/');
        for (const record of records) {
            const dynamic = template.filter(part => part.startsWith('{') && part.endsWith('}')).length;
            const ids = record.id.split('/');
            if (ids.length !== dynamic) throw new TypeError('INVALID_RESTORE_ID_DEPTH: ' + key);
            let position = 0;
            const path = template.map(part => part.startsWith('{') && part.endsWith('}')
                ? validateSegment(ids[position++]) : part).join('/');
            if (paths.has(path)) throw new TypeError('DUPLICATE_RESTORE_PATH');
            paths.add(path);
            if (!record.data || typeof record.data !== 'object' ||
                Array.isArray(record.data)) throw new TypeError('INVALID_RESTORE_DOCUMENT_DATA');
            operations.push({ key, id: record.id, path, data: record.data });
        }
    }
    return { protectedKeys, operations, manifest: expectedManifest };
}

// One transaction: preflight existence check + create-only, never overwrite.
// Deliberately small for a predictable emulator rehearsal (not production scale).
export async function restoreQuizHubSnapshotInEmulator(db, snapshot, expectedManifest, {
    confirmation,
    firestoreTypes = {}
} = {}) {
    assertIsolatedQuizHubEmulator();
    if (confirmation !== 'RESTORE_TO_DISPOSABLE_EMULATOR') {
        throw new Error('EXPLICIT_EMULATOR_RESTORE_CONFIRMATION_REQUIRED');
    }
    const plan = planQuizHubEmulatorRestore(snapshot, expectedManifest);
    if (plan.operations.length > 200) throw new RangeError('EMULATOR_REHEARSAL_DOCUMENT_LIMIT');
    const refs = plan.operations.map(operation => db.doc(operation.path));
    const codec = { ...firestoreTypes, db };
    // Decode and reject all corrupt or unsupported tagged values BEFORE writes.
    // Firestore turns JS Date into Timestamp; accepting a tagged Date here would
    // falsely promise an exact restore checksum. Real captured data uses Timestamp.
    const hasDateTag = value => value && typeof value === 'object' && (
        value.__quizhub_firestore_type_v1 === 'date' ||
        Object.values(value).some(hasDateTag)
    );
    const decoded = plan.operations.map(operation => {
        if (hasDateTag(operation.data)) throw new Error('FIRESTORE_DATE_REQUIRES_TIMESTAMP_CANONICALIZATION');
        const data = decodeFirestoreBackupData(operation.data, codec);
        const normalized = encodeFirestoreBackupData(data, codec);
        if (!isDeepStrictEqual(normalized, operation.data)) {
            throw new Error('NON_CANONICAL_OR_UNSTABLE_BACKUP_VALUE');
        }
        return data;
    });
    await db.runTransaction(async tx => {
        // Firestore transactions must finish every read before the first write.
        const current = await tx.getAll(...refs);
        if (current.some(doc => doc.exists)) throw new Error('RESTORE_TARGET_ALREADY_EXISTS');
        for (let i = 0; i < refs.length; i++) tx.create(refs[i], decoded[i]);
    });
    const restored = Object.fromEntries(plan.protectedKeys.map(key => [key, []]));
    for (const operation of plan.operations) {
        const doc = await db.doc(operation.path).get();
        if (!doc.exists) throw new Error('RESTORED_DOCUMENT_MISSING');
        restored[operation.key].push({
            id: operation.id,
            data: encodeFirestoreBackupData(doc.data(), codec)
        });
    }
    const result = verifyLegacyDataPreservation(snapshot, restored, {
        protectedCollections: plan.protectedKeys
    });
    const integrity = verifyBackupIntegrity(restored, expectedManifest);
    if (result.status !== 'preserved' || !integrity.matched) {
        throw new Error('EMULATOR_RESTORE_VERIFICATION_FAILED');
    }
    return {
        status: 'verified',
        restoredDocuments: plan.operations.length,
        checkedCollections: plan.protectedKeys.length,
        rootSha256: createBackupIntegrityManifest(restored).rootSha256
    };
}
