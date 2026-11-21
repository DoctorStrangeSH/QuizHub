import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const project = 'demo-quizhub';
const callable = `http://127.0.0.1:5001/${project}/europe-west1/quizModePreview`;
const authBase = 'http://127.0.0.1:9099';

async function register() {
    const response = await fetch(
        `${authBase}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-key`,
        { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }
    );
    const data = await response.json();
    assert.equal(response.status, 200, JSON.stringify(data));
    return { uid: data.localId, token: data.idToken };
}

async function invoke(user, operation, payload = {}) {
    const headers = { 'content-type': 'application/json' };
    if (user) headers.authorization = `Bearer ${user.token}`;
    const response = await fetch(callable, {
        method: 'POST',
        headers,
        body: JSON.stringify({ data: { operation, payload } })
    });
    return { status: response.status, body: await response.json() };
}

test('Auth + Functions + Firestore: Duel, Survival and Time Trial use trusted sessions and idempotent rewards', { timeout: 150000 }, async () => {
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Firestore emulator required');
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Auth emulator required');
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project,
        'This test must never use a production Firebase project');

    const app = initializeApp({ projectId: project }, 'mode-callable-' + randomUUID());
    const db = getFirestore(app);
    const createdUsers = [];
    const sessionIds = [];
    try {
        const alice = await register();
        const bob = await register();
        createdUsers.push(alice.uid, bob.uid);
        await db.collection('users').doc(alice.uid).set({
            email: 'private-mode-test@example.test',
            experience: 5,
            weeklyExperience: 5,
            coins: 7,
            wins: 0,
            quizzesCompleted: 0,
            achievements: [],
            stats: {
                totalGames: 0,
                totalQuestions: 0,
                correctAnswers: 0,
                totalWins: 0,
                bestStreak: 0
            },
            preferences: { theme: 'night' },
            friends: ['legacy-friend']
        });
        await db.collection('users').doc(bob.uid).set({
            experience: 0, weeklyExperience: 0, coins: 0, wins: 0,
            quizzesCompleted: 0, achievements: [],
            stats: { totalGames: 0, totalQuestions: 0, correctAnswers: 0, totalWins: 0 }
        });

        const forged = await invoke(alice, 'start', {
            mode: 'duel', category: 'science', difficulty: 'easy',
            count: 2, uid: bob.uid, score: 999999
        });
        assert.equal(forged.body.error?.status, 'INVALID_ARGUMENT');

        const modes = [
            { mode: 'duel', count: 2 },
            { mode: 'survival', count: 2 },
            { mode: 'time', count: 2 }
        ];
        const results = [];

        for (const scenario of modes) {
            const startedResponse = await invoke(alice, 'start', {
                mode: scenario.mode,
                category: 'science',
                difficulty: 'easy',
                count: scenario.count,
                language: 'en'
            });
            assert.equal(startedResponse.status, 200, JSON.stringify(startedResponse.body));
            const started = startedResponse.body.result;
            assert.ok(started.sessionId);
            sessionIds.push(started.sessionId);
            assert.equal(started.totalQuestions, scenario.count);
            assert.ok(started.question?.id);
            assert.equal('correctIndex' in started.question, false);
            assert.equal('points' in started.question, false);

            const foreignResume = await invoke(bob, 'resume', {
                sessionId: started.sessionId, language: 'en'
            });
            assert.equal(foreignResume.body.error?.status, 'PERMISSION_DENIED');

            let question = started.question;
            let lastAnswer;
            for (let index = 0; index < scenario.count; index++) {
                const answerPayload = {
                    sessionId: started.sessionId,
                    questionId: question.id,
                    answerIndex: 0,
                    language: 'en'
                };
                const answer = await invoke(alice, 'answer', answerPayload);
                assert.equal(answer.status, 200, JSON.stringify(answer.body));
                lastAnswer = answer.body.result;
                assert.equal(lastAnswer.replayed, false);
                assert.equal(lastAnswer.finished, index === scenario.count - 1);
                if (index === 0) {
                    const replay = await invoke(alice, 'answer', answerPayload);
                    assert.equal(replay.status, 200, JSON.stringify(replay.body));
                    assert.equal(replay.body.result.replayed, true);
                    assert.equal(replay.body.result.correct, lastAnswer.correct);
                    assert.equal(replay.body.result.points, lastAnswer.points);
                }
                question = lastAnswer.nextQuestion;
                if (index < scenario.count - 1) assert.ok(question?.id);
                else assert.equal(question, null);
            }

            const claim = await invoke(alice, 'claim', { sessionId: started.sessionId });
            assert.equal(claim.status, 200, JSON.stringify(claim.body));
            const receipt = claim.body.result;
            assert.equal(receipt.alreadyClaimed, false);
            assert.equal(receipt.uid, alice.uid);
            assert.equal(receipt.totalQuestions, scenario.count);
            assert.equal(Number.isSafeInteger(receipt.score), true);
            assert.equal(Number.isSafeInteger(receipt.xp), true);
            assert.equal(Number.isSafeInteger(receipt.coins), true);

            const retry = await invoke(alice, 'claim', { sessionId: started.sessionId });
            assert.equal(retry.status, 200, JSON.stringify(retry.body));
            assert.equal(retry.body.result.alreadyClaimed, true);
            assert.equal(retry.body.result.score, receipt.score);
            assert.equal(retry.body.result.xp, receipt.xp);
            assert.equal(retry.body.result.coins, receipt.coins);

            const resumed = await invoke(alice, 'resume', {
                sessionId: started.sessionId, language: 'en'
            });
            assert.equal(resumed.status, 200, JSON.stringify(resumed.body));
            assert.equal(resumed.body.result.status, 'completed');
            assert.equal(resumed.body.result.receipt.score, receipt.score);
            results.push({ mode: scenario.mode, receipt });
        }

        const [aliceDoc, bobDoc] = await Promise.all([
            db.collection('users').doc(alice.uid).get(),
            db.collection('users').doc(bob.uid).get()
        ]);
        const aliceProfile = aliceDoc.data();
        const expectedCoins = 7 + results.reduce((sum, item) => sum + item.receipt.coins, 0);
        const expectedXp = 5 + results.reduce((sum, item) => sum + item.receipt.xp, 0);
        assert.equal(aliceProfile.coins, expectedCoins);
        assert.equal(aliceProfile.experience, expectedXp);
        assert.equal(aliceProfile.weeklyExperience, expectedXp);
        assert.equal(aliceProfile.quizzesCompleted, 3);
        assert.equal(aliceProfile.stats.totalGames, 3);
        assert.equal(aliceProfile.stats.totalQuestions, 6);
        assert.equal(aliceProfile.stats.correctAnswers,
            results.reduce((sum, item) => sum + item.receipt.correctAnswers, 0));
        assert.equal(aliceProfile.email, 'private-mode-test@example.test');
        assert.deepEqual(aliceProfile.preferences, { theme: 'night' });
        assert.deepEqual(aliceProfile.friends, ['legacy-friend']);
        assert.equal(bobDoc.data().coins, 0);

        const foreignClaim = await invoke(bob, 'claim', { sessionId: sessionIds[0] });
        assert.equal(foreignClaim.body.error?.status, 'PERMISSION_DENIED');
    } finally {
        for (const sessionId of sessionIds) {
            await db.collection('quizSessions').doc(sessionId).delete().catch(() => {});
        }
        for (const uid of createdUsers) {
            const unlocks = await db.collection('achievementUnlockReceipts').doc(uid)
                .collection('unlocks').get().catch(() => null);
            if (unlocks) await Promise.all(unlocks.docs.map(doc => doc.ref.delete()));
            await db.collection('achievementUnlockReceipts').doc(uid).delete().catch(() => {});
            await db.collection('achievementFacts').doc(uid).delete().catch(() => {});
            await db.collection('users').doc(uid).delete().catch(() => {});
        }
        await db.terminate();
        await deleteApp(app);
    }
});
