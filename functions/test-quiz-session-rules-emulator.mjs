import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const project = 'demo-quizhub';
const firestore = 'http://127.0.0.1:8080/v1/projects/demo-quizhub/databases/(default)/documents';
const authBase = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-key';

async function register() {
    const response = await fetch(authBase, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}'
    });
    const body = await response.json();
    assert.equal(response.status, 200, JSON.stringify(body));
    return { uid: body.localId, token: body.idToken };
}

async function attempt(path, method, token, data) {
    const headers = { 'content-type': 'application/json' };
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await fetch(firestore + path, {
        method,
        headers,
        ...(data === undefined ? {} : { body: JSON.stringify(data) })
    });
    const body = await response.json();
    assert.equal(response.status, 403, `${method} ${path}: ${JSON.stringify(body)}`);
    assert.equal(body.error?.status, 'PERMISSION_DENIED');
}

test('emulator denies all client access to server-owned quiz sessions', async () => {
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST);
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project);

    const app = initializeApp({ projectId: project }, 'rules-' + randomUUID());
    const db = getFirestore(app);
    const alice = await register();
    const bob = await register();
    const id = randomUUID();
    const path = `/quizSessions/${id}`;
    const document = db.collection('quizSessions').doc(id);
    const canonical = {
        uid: alice.uid, mode: 'classic', status: 'active',
        questions: [{ id: 'private-question', correctIndex: 2 }],
        answers: [], receipt: null
    };
    try {
        // Admin SDK writes work even though untrusted client writes are denied.
        await document.set(canonical);
        assert.equal((await document.get()).data().questions[0].correctIndex, 2);

        for (const token of [null, alice.token, bob.token]) {
            await attempt(path, 'GET', token);
            await attempt('/quizSessions?pageSize=20', 'GET', token);
            await attempt('/quizSessions?documentId=forged-' + id, 'POST', token,
                { fields: { uid: { stringValue: alice.uid }, coins: { integerValue: '99999' } } });
            await attempt(path + '?updateMask.fieldPaths=status', 'PATCH', token,
                { fields: { status: { stringValue: 'completed' } } });
            await attempt(path, 'DELETE', token);
        }

        // Explicitly reject a forged owner and reward claim attempt.
        await attempt('/quizSessions?documentId=imposter-' + id, 'POST', bob.token,
            { fields: { uid: { stringValue: alice.uid }, receipt: { mapValue: { fields: {} } } } });
        assert.deepEqual((await document.get()).data(), canonical);
    } finally {
        await document.delete();
        await db.terminate();
        await deleteApp(app);
    }
});
