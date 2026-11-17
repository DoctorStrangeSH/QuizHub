import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { planNicknameClaimBackfill } from '../server/nickname-claims-backfill.mjs';
import { applyNicknameClaimBackfill } from '../server/nickname-claims-apply.mjs';

test('Firestore emulator: migration is opt-in, resumable and rejects stale or stolen names', async () => {
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
    const app = initializeApp({ projectId: 'demo-quizhub' }, 'claim-backfill-' + randomUUID());
    const db = getFirestore(app);
    const suffix = randomUUID().replaceAll('-', '').slice(0, 10);
    const a = 'claim_a_' + suffix;
    const b = 'claim_b_' + suffix;
    const nickA = 'name_a_' + suffix;
    const nickB = 'name_b_' + suffix;
    const userA = db.collection('users').doc(a);
    const userB = db.collection('users').doc(b);
    const claimA = db.collection('nicknameClaims').doc(nickA);
    const claimB = db.collection('nicknameClaims').doc(nickB);
    const options = { mode: 'apply', confirmation: 'APPLY_DEMO_NICKNAME_CLAIMS', projectId: 'demo-quizhub' };
    const plan = planNicknameClaimBackfill([
        { uid: a, data: { nickname: nickA, nicknameLower: nickA } },
        { uid: b, data: { nickname: nickB, nicknameLower: nickB } }
    ]);
    try {
        await userA.set({ nickname: nickA, nicknameLower: nickA, email: 'private@demo.test' });
        await userB.set({ nickname: nickB, nicknameLower: nickB });
        assert.deepEqual(await applyNicknameClaimBackfill(db, plan), {
            mode: 'dry-run', planned: 2, created: 0, alreadyOwned: 0
        });
        assert.equal((await claimA.get()).exists, false);
        await assert.rejects(applyNicknameClaimBackfill(db, plan, { ...options, confirmation: 'NO' }), /EXPLICIT_MIGRATION_CONFIRMATION_REQUIRED/);
        await assert.rejects(applyNicknameClaimBackfill(db, plan, { ...options, projectId: 'live-project' }), /EMULATOR_ONLY_MIGRATION/);
        await assert.rejects(applyNicknameClaimBackfill(db, { ...plan, conflictCount: 1 }, options), /MIGRATION_PLAN_NEEDS_REVIEW/);
        await assert.rejects(applyNicknameClaimBackfill(db, { ...plan, batches: [[plan.batches[0][0], plan.batches[0][0]]] }, options), /INVALID_MIGRATION_PLAN/);
        assert.equal((await claimA.get()).exists, false);
        await userA.update({ nickname: 'changedName', nicknameLower: 'changedname' });
        await assert.rejects(applyNicknameClaimBackfill(db, plan, options), /STALE_MIGRATION_SOURCE/);
        assert.equal((await claimA.get()).exists, false);
        await userA.update({ nickname: nickA, nicknameLower: nickA });
        assert.deepEqual(await applyNicknameClaimBackfill(db, plan, options), {
            mode: 'apply', planned: 2, created: 2, alreadyOwned: 0
        });
        assert.equal((await claimA.get()).data().uid, a);
        assert.equal((await claimB.get()).data().uid, b);
        assert.equal((await userA.get()).data().email, 'private@demo.test');
        assert.equal((await applyNicknameClaimBackfill(db, plan, options)).alreadyOwned, 2);
        await claimB.set({ uid: 'foreign' });
        await assert.rejects(applyNicknameClaimBackfill(db, plan, options), /NICKNAME_CLAIM_CONFLICT/);
        assert.equal((await claimB.get()).data().uid, 'foreign');
    } finally {
        await Promise.all([userA.delete(), userB.delete(), claimA.delete(), claimB.delete()]);
        await db.terminate();
        await deleteApp(app);
    }
});
