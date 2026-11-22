import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const project = 'demo-quizhub';
const callable = `http://127.0.0.1:5001/${project}/europe-west1/quizSessionPreview`;
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
        method: 'POST', headers,
        body: JSON.stringify({ data: { operation, payload } })
    });
    return { status: response.status, body: await response.json() };
}

test('emulator-only callable verifies auth, scores answers and credits once', async () => {
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Firestore emulator required');
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Auth emulator required');
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project);
    const app = initializeApp({ projectId: project }, 'callable-integration-' + randomUUID());
    const db = getFirestore(app);
    try {
        const anonymous = await invoke(null, 'start', { mode: 'classic' });
        assert.equal(anonymous.body.error?.status, 'UNAUTHENTICATED');

        const alice = await register();
        const bob = await register();
        await db.collection('users').doc(alice.uid).set({
            email: 'never-return@example.test', coins: 3, experience: 7,
            weeklyExperience: 7, quizzesCompleted: 0,
            stats: { totalGames: 0, totalQuestions: 0, correctAnswers: 0 }
        });

        const forged = await invoke(alice, 'start', {
            mode: 'classic', difficulty: 'easy', count: 2, uid: bob.uid
        });
        assert.equal(forged.body.error?.status, 'INVALID_ARGUMENT');

        const unsupported = await invoke(alice, 'start', {
            mode: 'survival', difficulty: 'easy', count: 2
        });
        assert.equal(unsupported.body.error?.status, 'FAILED_PRECONDITION');

        const first = await invoke(alice, 'start', {
            mode: 'classic', category: 'science', difficulty: 'easy', count: 2
        });
        assert.equal(first.status, 200, JSON.stringify(first.body));
        const started = first.body.result;
        assert.ok(started?.sessionId);
        assert.ok(started?.question?.id);
        assert.equal('correctIndex' in started.question, false);
        assert.equal('points' in started.question, false);

        const foreign = await invoke(bob, 'resume', { sessionId: started.sessionId });
        assert.equal(foreign.body.error?.status, 'PERMISSION_DENIED');

        const firstAnswer = await invoke(alice, 'answer', {
            sessionId: started.sessionId, questionId: started.question.id, answerIndex: 0
        });
        assert.equal(firstAnswer.status, 200, JSON.stringify(firstAnswer.body));
        const replay = await invoke(alice, 'answer', {
            sessionId: started.sessionId, questionId: started.question.id, answerIndex: 0
        });
        assert.equal(replay.body.result?.replayed, true);

        const nextId = firstAnswer.body.result?.nextQuestion?.id;
        assert.ok(nextId);
        const secondAnswer = await invoke(alice, 'answer', {
            sessionId: started.sessionId, questionId: nextId, answerIndex: 0
        });
        assert.equal(secondAnswer.body.result?.finished, true);

        const complete = await invoke(alice, 'complete', { sessionId: started.sessionId });
        const repeat = await invoke(alice, 'complete', { sessionId: started.sessionId });
        assert.equal(complete.status, 200, JSON.stringify(complete.body));
        assert.equal(repeat.body.result?.alreadyClaimed, true);
        const receipt = complete.body.result;
        assert.equal(receipt.alreadyClaimed, false);
        assert.equal(receipt.score >= 0, true);

        const saved = (await db.collection('users').doc(alice.uid).get()).data();
        assert.equal(saved.quizzesCompleted, 1);
        assert.equal(saved.coins, 3 + receipt.coins);
        assert.equal(saved.experience, 7 + receipt.xp);
        assert.equal(saved.email, 'never-return@example.test');
        const ledger = await db.collection('accountLedger').doc(alice.uid).collection('entries').get();
        assert.equal(ledger.size, 1, 'completed quiz must append exactly one ledger event, even with zero rewards');
        const ledgerEvent = ledger.docs[0].data();
        assert.equal(ledgerEvent.type, 'quiz_reward');
        assert.equal(ledgerEvent.sourceId, started.sessionId);
        assert.equal(ledgerEvent.coinsDelta, receipt.coins);
        assert.equal(ledgerEvent.xpDelta, receipt.xp);
        const result = await invoke(alice, 'resume', { sessionId: started.sessionId });
        assert.equal(result.body.result?.receipt?.alreadyClaimed, true);
    } finally {
        await db.terminate();
        await deleteApp(app);
    }
});
