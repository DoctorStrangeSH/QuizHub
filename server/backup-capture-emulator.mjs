import { QUIZHUB_FIRESTORE_INVENTORY, protectedQuizHubManifestKeys } from './firestore-migration-inventory.mjs';
import { assertIsolatedQuizHubEmulator } from './backup-restore-emulator.mjs';
import { encodeFirestoreBackupData } from './firestore-backup-codec.mjs';
import { createBackupIntegrityManifest } from './backup-integrity.mjs';

// Emulator-only read-only snapshot. This is an integrity rehearsal, NOT a
// consistent production export: concurrent writes can change the result.
const inventory = new Map(QUIZHUB_FIRESTORE_INVENTORY.map(entry => [entry.path, entry]));
const roots = new Set(QUIZHUB_FIRESTORE_INVENTORY.map(entry => entry.path.split('/')[0]));
const ignoredRoots = new Set(QUIZHUB_FIRESTORE_INVENTORY
    .filter(entry => !entry.preserve).map(entry => entry.path.split('/')[0]));

function pathPattern(path) {
    return path.split('/').map((segment, index) => index % 2 === 1 ? '{id}' : segment).join('/');
}

function knownEntry(path) {
    return QUIZHUB_FIRESTORE_INVENTORY.find(entry =>
        entry.path.split('/').map((part, index) => index % 2 === 1 ? '{id}' : part).join('/') === pathPattern(path));
}

function snapshotId(path) {
    return path.split('/').filter((_, index) => index % 2 === 1).join('/');
}

export async function captureQuizHubEmulatorSnapshot(db, {
    firestoreTypes = {},
    maxDocuments = 200
} = {}) {
    assertIsolatedQuizHubEmulator();
    if (!Number.isSafeInteger(maxDocuments) || maxDocuments < 1 || maxDocuments > 1000) {
        throw new RangeError('INVALID_EMULATOR_SNAPSHOT_LIMIT');
    }
    const snapshot = Object.fromEntries(protectedQuizHubManifestKeys().map(key => [key, []]));
    const codec = { ...firestoreTypes, db };
    let count = 0;
    const visitDocument = async ref => {
        const entry = knownEntry(ref.path);
        const doc = await ref.get();
        if (doc.exists) {
            if (!entry || !entry.preserve) throw new Error('UNINVENTORIED_EMULATOR_DOCUMENT');
            if (++count > maxDocuments) throw new RangeError('EMULATOR_SNAPSHOT_DOCUMENT_LIMIT');
            snapshot[entry.key].push({
                id: snapshotId(ref.path),
                data: encodeFirestoreBackupData(doc.data(), codec)
            });
        }
        const children = await ref.listCollections();
        for (const collection of children) {
            const childPattern = pathPattern(collection.path);
            const expected = QUIZHUB_FIRESTORE_INVENTORY.some(item =>
                item.path.split('/').map((part, index) => index % 2 === 1 ? '{id}' : part).join('/') === childPattern + '/{id}');
            if (!expected) throw new Error('UNKNOWN_NESTED_EMULATOR_COLLECTION');
            const childDocs = await collection.listDocuments();
            for (const child of childDocs) await visitDocument(child);
        }
    };
    const collections = await db.listCollections();
    for (const collection of collections) {
        if (!roots.has(collection.id)) throw new Error('UNKNOWN_ROOT_EMULATOR_COLLECTION');
        if (ignoredRoots.has(collection.id)) continue;
        const docs = await collection.listDocuments();
        for (const ref of docs) await visitDocument(ref);
    }
    const manifest = createBackupIntegrityManifest(snapshot);
    return {
        snapshot, manifest,
        summary: {
            status: 'emulator_snapshot_captured',
            documentCount: count,
            collectionCount: Object.keys(snapshot).length,
            rootSha256: manifest.rootSha256,
            consistentAtSingleInstant: false
        }
    };
}
