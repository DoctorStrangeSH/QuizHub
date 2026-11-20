import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createQuizFirestoreStore } from '../server/quiz-firestore-store.mjs';
import { createSession, submitAnswer } from '../server/quiz-session-core.mjs';
import { claimSessionReward } from '../server/quiz-reward-claim.mjs';

const project = 'demo-quizhub';
test('real Firestore emulator: session persistence, concurrent idempotent claim and rollback', async () => {
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'emulator required: never run against production');
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project);
    const app = initializeApp({ projectId: project }, 'quiz-emulator-' + randomUUID());
    const db = getFirestore(app);
    const uid = 'emulator-' + randomUUID();
    const sessionId = randomUUID();
    const store = createQuizFirestoreStore(db, { syncPublicProfiles: true });

    const userRef = db.collection('users').doc(uid);
    const sessionRef = db.collection('quizSessions').doc(sessionId);
    await userRef.set({
        email: 'private@example.test', nickname: 'Unchanged', friends: ['friend-one'],
        experience: 4, weeklyExperience: 4, coins: 9, quizzesCompleted: 0,
        stats: { totalGames: 0, totalQuestions: 0, correctAnswers: 0, badges: 12 }
    });
    const session = createSession({
        uid, mode: 'classic', startedAt: 1000, deadlineAt: 5000,
        questions: [{ id: 'emulator-question', correctIndex: 1, optionCount: 2, points: 20 }]
    });
    submitAnswer(session, {
        uid, questionId: 'emulator-question', answerIndex: 1, at: 2000
    });
    await store.runTransaction(tx => tx.setSession(sessionId, session));

    const otherProcess = createQuizFirestoreStore(db, { syncPublicProfiles: true });
    const persisted = await otherProcess.runTransaction(tx => tx.getSession(sessionId));
    assert.equal(persisted.answers.length, 1);
    assert.equal(persisted.questions[0].correctIndex, 1);

    const claim = activeStore => claimSessionReward({
        store: activeStore, sessionId, uid, at: 3000
    });
    const receipts = await Promise.all([claim(store), claim(otherProcess), claim(store)]);
    assert.equal(receipts.filter(receipt => !receipt.alreadyClaimed).length, 1);
    assert.equal(receipts.filter(receipt => receipt.alreadyClaimed).length, 2);
    assert.deepEqual(receipts.map(receipt => receipt.coins), [10, 10, 10]);
    const saved = (await userRef.get()).data();
    assert.equal(saved.coins, 19);
    assert.equal(saved.experience, 24);
    assert.equal(saved.weeklyExperience, 24);
    assert.equal(saved.quizzesCompleted, 1);
    assert.equal(saved.stats.totalGames, 1);
    assert.equal(saved.stats.totalQuestions, 1);
    assert.equal(saved.stats.correctAnswers, 1);
    assert.deepEqual(saved.achievements, ['first_quiz', 'first_win']);
    assert.deepEqual((await db.collection('achievementFacts').doc(uid).get()).data(), {
        totalGames: 1, experience: 20, totalWins: 1, perfectGames: 0, level: 1, unlockedIds: ['first_quiz', 'first_win']
    });
    assert.equal((await db.collection('achievementUnlockReceipts').doc(uid).collection('unlocks').doc('first_quiz').get()).data().achievementId, 'first_quiz');
    assert.equal((await db.collection('achievementUnlockReceipts').doc(uid).collection('unlocks').doc('first_win').get()).data().achievementId, 'first_win');
    assert.equal(saved.stats.badges, 12);
    assert.equal(saved.email, 'private@example.test');
    assert.deepEqual(saved.friends, ['friend-one']);
    const publicProfile = (await db.collection('publicProfiles').doc(uid).get()).data();
    assert.equal(publicProfile.nickname, 'Unchanged');
    assert.equal(publicProfile.experience, 24);
    assert.equal(publicProfile.weeklyExperience, 24);
    assert.equal('email' in publicProfile, false);
    assert.equal('coins' in publicProfile, false);
    assert.equal('friends' in publicProfile, false);
    const finalized = (await sessionRef.get()).data();
    assert.equal(finalized.finalized, true);
    assert.deepEqual(finalized.receipt.coins, 10);

    const stranger = 'other-' + randomUUID();
    await assert.rejects(claimSessionReward({
        store, sessionId, uid: stranger, at: 3000
    }), /NOT_SESSION_OWNER/);
    assert.equal((await userRef.get()).data().coins, 19);

    const missingId = randomUUID();
    const unclaimable = createSession({
        uid: 'missing-user-' + randomUUID(), mode: 'classic', startedAt: 1000,
        deadlineAt: 2000,
        questions: [{ id: 'orphan', correctIndex: 0, optionCount: 2, points: 10 }]
    });
    await store.runTransaction(tx => tx.setSession(missingId, unclaimable));
    await assert.rejects(claimSessionReward({
        store, sessionId: missingId, uid: unclaimable.uid, at: 3000
    }), /USER_NOT_FOUND/);
    assert.equal((await db.collection('quizSessions').doc(missingId).get()).data().finalized, false);
    await db.terminate();
    await deleteApp(app);
});
