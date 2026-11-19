import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const project = 'demo-quizhub';
const endpoint = `http://127.0.0.1:5001/${project}/europe-west1/friendOperationPreview`;

async function register(email) {
    const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-key', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password: 'TestPassword!123', returnSecureToken: true })
    });
    const data = await response.json();
    assert.equal(response.status, 200, JSON.stringify(data));
    return { uid: data.localId, token: data.idToken };
}

async function invoke(user, data) {
    const headers = { 'content-type': 'application/json' };
    if (user) headers.authorization = `Bearer ${user.token}`;
    const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify({ data }) });
    return { status: response.status, body: await response.json() };
}

test('emulator social callable authorizes actor, prevents forged writes and updates both profiles atomically', async () => {
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project);
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST);
    const app = initializeApp({ projectId: project }, 'friend-preview-' + randomUUID());
    const db = getFirestore(app);
    const suffix = randomUUID().slice(0, 12);
    const alice = await register(`friend-a-${suffix}@example.test`);
    const bob = await register(`friend-b-${suffix}@example.test`);
    const refs = [db.collection('users').doc(alice.uid), db.collection('users').doc(bob.uid)];
    const profile = { friends: [], friendRequests: [], sentRequests: [], coins: 150, admin: false };
    try {
        await Promise.all(refs.map(ref => ref.set(profile)));
        const anonymous = await invoke(null, { operation: 'send', targetUid: bob.uid });
        assert.equal(anonymous.body.error?.status, 'UNAUTHENTICATED');
        const forged = await invoke(alice, { operation: 'send', targetUid: bob.uid, actorUid: bob.uid });
        assert.equal(forged.body.error?.status, 'INVALID_ARGUMENT');
        assert.deepEqual((await refs[0].get()).data().sentRequests, []);

        const request = await invoke(alice, { operation: 'send', targetUid: bob.uid });
        assert.equal(request.body.result?.status, 'updated', JSON.stringify(request));
        const duplicate = await invoke(alice, { operation: 'send', targetUid: bob.uid });
        assert.equal(duplicate.body.result?.status, 'unchanged');
        const accepted = await invoke(bob, { operation: 'accept', targetUid: alice.uid });
        assert.equal(accepted.body.result?.status, 'updated', JSON.stringify(accepted));
        const [a, b] = await Promise.all(refs.map(async ref => (await ref.get()).data()));
        assert.deepEqual(a.friends, [bob.uid]);
        assert.deepEqual(b.friends, [alice.uid]);
        assert.deepEqual(a.sentRequests, []);
        assert.deepEqual(b.friendRequests, []);
        assert.equal(a.coins, 150);
        assert.equal(b.admin, false);
    } finally {
        await Promise.all(refs.map(ref => ref.delete()));
        await db.terminate();
        await deleteApp(app);
    }
});
