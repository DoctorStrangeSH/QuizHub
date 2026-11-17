// Intentionally emulator-only until a separately reviewed production rollout.
// Never accepts a privileged live Firestore instance or silently writes by default.
const UID = /^[A-Za-z0-9_-]{1,128}$/;
const NORMALIZED = /^[a-z0-9_]{3,20}$/;
const CONFIRMATION = 'APPLY_DEMO_NICKNAME_CLAIMS';

function validatePlan(plan) {
    if (!plan || !Array.isArray(plan.batches) ||
        !Number.isSafeInteger(plan.writeCount) || plan.writeCount < 0 ||
        !Number.isSafeInteger(plan.conflictCount) || !Number.isSafeInteger(plan.invalidCount)) {
        throw new Error('INVALID_MIGRATION_PLAN');
    }
    if (plan.conflictCount || plan.invalidCount) throw new Error('MIGRATION_PLAN_NEEDS_REVIEW');
    const writes = plan.batches.flat();
    if (writes.length !== plan.writeCount || plan.batches.some(batch => !Array.isArray(batch) || batch.length > 400)) {
        throw new Error('INVALID_MIGRATION_PLAN');
    }
    const names = new Set();
    const uids = new Set();
    for (const write of writes) {
        const normalized = write?.path?.startsWith('nicknameClaims/') ? write.path.slice('nicknameClaims/'.length) : '';
        const uid = write?.data?.uid;
        if (!NORMALIZED.test(normalized) || !UID.test(uid) ||
            Object.keys(write.data).length !== 1 || names.has(normalized) || uids.has(uid)) {
            throw new Error('INVALID_MIGRATION_PLAN');
        }
        names.add(normalized);
        uids.add(uid);
    }
    return writes;
}

function assertDemoEmulator(projectId) {
    if (projectId !== 'demo-quizhub' ||
        process.env.FIRESTORE_EMULATOR_HOST == null ||
        !/^[^/\s:]+:\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST) ||
        (process.env.GCLOUD_PROJECT && process.env.GCLOUD_PROJECT !== projectId) ||
        (process.env.GOOGLE_CLOUD_PROJECT && process.env.GOOGLE_CLOUD_PROJECT !== projectId)) {
        throw new Error('EMULATOR_ONLY_MIGRATION');
    }
}

/**
 * Dry-run by default. Applying is explicitly limited to demo-quizhub Firestore emulator.
 * Each claim is an idempotent transaction; a failure after earlier claims may leave
 * a partial migration, which can be resumed after regenerating the plan.
 */
export async function applyNicknameClaimBackfill(db, plan, {
    mode = 'dry-run',
    confirmation,
    projectId
} = {}) {
    const writes = validatePlan(plan);
    if (mode === 'dry-run') return { mode, planned: writes.length, created: 0, alreadyOwned: 0 };
    if (mode !== 'apply' || confirmation !== CONFIRMATION) throw new Error('EXPLICIT_MIGRATION_CONFIRMATION_REQUIRED');
    assertDemoEmulator(projectId);
    if (!db || typeof db.runTransaction !== 'function') throw new TypeError('Firestore required');
    let created = 0;
    let alreadyOwned = 0;
    for (const write of writes) {
        const normalized = write.path.slice('nicknameClaims/'.length);
        const uid = write.data.uid;
        const userRef = db.collection('users').doc(uid);
        const claimRef = db.collection('nicknameClaims').doc(normalized);
        const result = await db.runTransaction(async tx => {
            const user = await tx.get(userRef);
            const claim = await tx.get(claimRef);
            const data = user.data();
            if (!user.exists || typeof data?.nickname !== 'string' ||
                data.nickname.toLowerCase() !== normalized || data.nicknameLower !== normalized) {
                throw new Error('STALE_MIGRATION_SOURCE');
            }
            if (claim.exists) {
                if (claim.data()?.uid !== uid) throw new Error('NICKNAME_CLAIM_CONFLICT');
                return 'alreadyOwned';
            }
            tx.create(claimRef, { uid });
            return 'created';
        });
        if (result === 'created') created++;
        else alreadyOwned++;
    }
    return { mode, planned: writes.length, created, alreadyOwned };
}
