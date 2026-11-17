import { assertIsolatedQuizHubEmulator, planQuizHubEmulatorRestore, restoreQuizHubSnapshotInEmulator } from './backup-restore-emulator.mjs';
import { verifyBackupIntegrity } from './backup-integrity.mjs';
import { protectedQuizHubManifestKeys } from './firestore-migration-inventory.mjs';

const FORMAT = 'quizhub-emulator-backup-package-v1';

function verifyPackageFields(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        Object.keys(value).sort().join(',') !== 'format,manifest,metadata,snapshot,state' ||
        value.format !== FORMAT || value.state !== 'complete' ||
        !value.metadata || typeof value.metadata !== 'object' ||
        value.metadata.stableAcrossTwoPasses !== true ||
        value.metadata.consistentAtSingleInstant !== false) {
        throw new Error('INCOMPLETE_EMULATOR_BACKUP_PACKAGE');
    }
    const expectedKeys = protectedQuizHubManifestKeys().sort();
    if (!value.snapshot || Object.keys(value.snapshot).sort().join(',') !== expectedKeys.join(',')) {
        throw new Error('INCOMPLETE_EMULATOR_BACKUP_PACKAGE');
    }
    const count = expectedKeys.reduce((sum, key) => {
        if (!Array.isArray(value.snapshot[key])) throw new Error('INCOMPLETE_EMULATOR_BACKUP_PACKAGE');
        return sum + value.snapshot[key].length;
    }, 0);
    if (!Number.isSafeInteger(value.metadata.documentCount) ||
        value.metadata.documentCount !== count ||
        value.metadata.rootSha256 !== value.manifest?.rootSha256 ||
        verifyBackupIntegrity(value.snapshot, value.manifest).matched !== true) {
        throw new Error('INCOMPLETE_OR_CORRUPT_EMULATOR_BACKUP_PACKAGE');
    }
    return { snapshot: value.snapshot, manifest: value.manifest };
}

// Completion is asserted only after BOTH capture passes have succeeded.
// This protects against accidental partial exports, not maliciously forged
// self-consistent packages or production consistency races.
export function sealQuizHubEmulatorBackup(captureResult) {
    assertIsolatedQuizHubEmulator();
    if (captureResult?.summary?.stableAcrossTwoPasses !== true ||
        captureResult?.summary?.consistentAtSingleInstant !== false ||
        captureResult?.summary?.status !== 'emulator_snapshot_captured') {
        throw new Error('UNSTABLE_OR_INCOMPLETE_EMULATOR_CAPTURE');
    }
    const value = {
        format: FORMAT,
        state: 'complete',
        snapshot: captureResult.snapshot,
        manifest: captureResult.manifest,
        metadata: {
            documentCount: captureResult.summary.documentCount,
            rootSha256: captureResult.summary.rootSha256,
            stableAcrossTwoPasses: true,
            consistentAtSingleInstant: false
        }
    };
    verifyPackageFields(value);
    return value;
}

export async function restoreSealedQuizHubBackupInEmulator(db, backupPackage, options = {}) {
    assertIsolatedQuizHubEmulator();
    const { snapshot, manifest } = verifyPackageFields(backupPackage);
    return restoreQuizHubSnapshotInEmulator(db, snapshot, manifest, options);
}


// Diagnostic only: the restore transaction re-checks conflicts atomically.
// Never expose player IDs or values in this report.
export async function preflightSealedQuizHubRestoreInEmulator(db, backupPackage) {
    assertIsolatedQuizHubEmulator();
    const { snapshot, manifest } = verifyPackageFields(backupPackage);
    const plan = planQuizHubEmulatorRestore(snapshot, manifest);
    if (plan.operations.length > 200) throw new RangeError('EMULATOR_REHEARSAL_DOCUMENT_LIMIT');
    const refs = plan.operations.map(operation => db.doc(operation.path));
    const existing = refs.length ? await db.getAll(...refs) : [];
    const conflicts = existing.filter(doc => doc.exists).length;
    return {
        status: conflicts ? 'blocked_existing_documents' : 'ready',
        documentCount: plan.operations.length,
        conflictingDocuments: conflicts,
        checkedCollections: plan.protectedKeys.length,
        rootSha256: manifest.rootSha256,
        readOnly: true
    };
}
