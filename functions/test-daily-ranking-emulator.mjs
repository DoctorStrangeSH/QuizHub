import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createDailyFirestoreStore } from '../server/daily-firestore-store.mjs';
import { createDailyRankingSealService } from '../server/daily-ranking-seal-service.mjs';
import { createDailyPrizeService } from '../server/daily-prize-service.mjs';

const project = 'demo-quizhub';
const date = '2026-11-15';
const sealedAt = Date.parse('2026-11-16T00:05:00.000Z');
const receipt = (uid, score) => ({
    uid, date, mode: 'daily', score,
    correctAnswers: score / 10, answeredQuestions: 10, totalQuestions: 10
});

test('real Firestore emulator: seal immutable daily snapshot and pay each ranked player exactly once', { timeout: 60000 }, async () => {
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Firestore emulator required; never run against production');
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project,
        'This test must never use a production Firebase project');

    const app = initializeApp({ projectId: project }, 'daily-ranking-' + randomUUID());
    const db = getFirestore(app);
    const suffix = randomUUID().replaceAll('-', '').slice(0, 18);
    const alice = 'daily_alice_' + suffix;
    const bob = 'daily_bob_' + suffix;
    const users = [alice, bob];
    const attempts = users.map(uid => db.collection('dailyAttempts').doc(date).collection('users').doc(uid));
    const receipts = users.map(uid => db.collection('dailyReceipts').doc(date).collection('users').doc(uid));
    const prizes = users.map(uid => db.collection('dailyPrizes').doc(date).collection('users').doc(uid));
    const ranking = db.collection('dailyRankings').doc(date);
    const store = createDailyFirestoreStore(db);

    try {
        await Promise.all([
            db.collection('users').doc(alice).create({
                coins: 7, experience: 10, weeklyExperience: 5,
                email: 'private-alice@example.test', preferences: { theme: 'night' }
            }),
            db.collection('users').doc(bob).create({
                coins: 3, experience: 20, weeklyExperience: 15,
                email: 'private-bob@example.test', friends: ['legacy-friend']
            })
        ]);

        for (const [uid, score] of [[alice, 100], [bob, 90]]) {
            const value = {
                uid, date, receipt: receipt(uid, score),
                session: { answers: [], questions: [] }
            };
            await store.runTransaction(tx => tx.setDailyAttempt(JSON.stringify([date, uid]), value));
        }

        const sealer = createDailyRankingSealService(store);
        await assert.rejects(
            sealer.seal({ date, now: Date.parse(date + 'T23:59:59.999Z') }),
            /DAILY_NOT_CLOSED/
        );
        const [sealed, replay] = await Promise.all([
            sealer.seal({ date, now: sealedAt }),
            sealer.seal({ date, now: sealedAt })
        ]);
        assert.equal(sealed.participants, 2);
        assert.equal([sealed, replay].filter(value => !value.alreadySealed).length, 1);
        assert.equal([sealed, replay].filter(value => value.alreadySealed).length, 1);

        const snapshot = (await ranking.get()).data();
        assert.equal(snapshot.sealed, true);
        assert.equal(snapshot.receipts.length, 2);
        assert.equal(snapshot.receipts.find(value => value.uid === alice).score, 100);

        // A later source-receipt mutation must not rewrite the sealed ranking snapshot.
        await receipts[0].update({ score: 0 });
        assert.equal((await ranking.get()).data().receipts.find(value => value.uid === alice).score, 100);

        const prizeService = createDailyPrizeService(store);
        const [aliceFirst, aliceReplay] = await Promise.all([
            prizeService.claim({ uid: alice, date, now: sealedAt }),
            prizeService.claim({ uid: alice, date, now: sealedAt })
        ]);
        assert.equal(aliceFirst.rank, 1);
        assert.equal(aliceFirst.xp, 200);
        assert.equal(aliceFirst.coins, 100);
        assert.equal([aliceFirst, aliceReplay].filter(value => !value.alreadyClaimed).length, 1);
        assert.equal([aliceFirst, aliceReplay].filter(value => value.alreadyClaimed).length, 1);

        const bobPrize = await prizeService.claim({ uid: bob, date, now: sealedAt });
        assert.equal(bobPrize.rank, 2);
        assert.equal(bobPrize.xp, 120);
        assert.equal(bobPrize.coins, 60);
        const bobReplay = await prizeService.claim({ uid: bob, date, now: sealedAt });
        assert.equal(bobReplay.alreadyClaimed, true);

        const [aliceUser, bobUser] = await Promise.all([
            db.collection('users').doc(alice).get(),
            db.collection('users').doc(bob).get()
        ]);
        assert.deepEqual(
            (({ coins, experience, weeklyExperience }) => ({ coins, experience, weeklyExperience }))(aliceUser.data()),
            { coins: 107, experience: 210, weeklyExperience: 205 }
        );
        assert.deepEqual(
            (({ coins, experience, weeklyExperience }) => ({ coins, experience, weeklyExperience }))(bobUser.data()),
            { coins: 63, experience: 140, weeklyExperience: 135 }
        );
        assert.equal(aliceUser.data().email, 'private-alice@example.test');
        assert.deepEqual(aliceUser.data().preferences, { theme: 'night' });
        assert.equal(bobUser.data().email, 'private-bob@example.test');
        assert.deepEqual(bobUser.data().friends, ['legacy-friend']);
        assert.equal((await prizes[0].get()).exists, true);
        assert.equal((await prizes[1].get()).exists, true);

        await assert.rejects(
            prizeService.claim({ uid: 'not-a-participant-' + suffix, date, now: sealedAt }),
            /DAILY_RESULT_NOT_FOUND/
        );
        assert.equal((await sealer.seal({ date, now: sealedAt + 1000 })).alreadySealed, true);

        assert.equal((await db.collection('users').doc(alice).get()).data().coins, 107);
    } finally {
        await Promise.all([
            ...attempts.map(ref => ref.delete().catch(() => {})),
            ...receipts.map(ref => ref.delete().catch(() => {})),
            ...prizes.map(ref => ref.delete().catch(() => {})),
            ranking.delete().catch(() => {}),
            ...users.map(uid => db.collection('users').doc(uid).delete().catch(() => {}))
        ]);
        await db.terminate();
        await deleteApp(app);
    }
});
