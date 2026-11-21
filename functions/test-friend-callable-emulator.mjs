import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const project = 'demo-quizhub';
const callable = `http://127.0.0.1:5001/${project}/europe-west1/friendRelationshipPreview`;
const authBase = 'http://127.0.0.1:9099';

async function register(suffix, index) {
    const response = await fetch(
        `${authBase}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-key`,
        {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                email: `friend-${index}-${suffix}@example.test`,
                password: 'TestPassword!123',
                returnSecureToken: true
            })
        }
    );
    const body = await response.json();
    assert.equal(response.status, 200, JSON.stringify(body));
    return { uid: body.localId, token: body.idToken };
}

async function invoke(user, data) {
    const headers = { 'content-type': 'application/json' };
    if (user) headers.authorization = 'Bearer ' + user.token;
    const response = await fetch(callable, {
        method: 'POST', headers, body: JSON.stringify({ data })
    });
    return { status: response.status, body: await response.json() };
}

test('friend callable enforces verified Auth, symmetric atomic transitions and idempotency', {
    timeout: 60000
}, async () => {
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Auth Emulator required');
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Firestore Emulator required');
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project,
        'Never run friendship integration tests against production');

    const app = initializeApp({ projectId: project }, 'friend-callable-' + randomUUID());
    const db = getFirestore(app);
    const adminAuth = getAuth(app);
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    let alice;
    let bob;
    try {
        alice = await register(suffix, 'alice');
        bob = await register(suffix, 'bob');
        const aliceRef = db.collection('users').doc(alice.uid);
        const bobRef = db.collection('users').doc(bob.uid);
        const emptySocialState = {
            friends: [], friendRequests: [], sentRequests: [],
            coins: 750, experience: 120, level: 3,
            email: 'private-social-fixture@example.test'
        };
        await Promise.all([
            aliceRef.set({ ...emptySocialState, email: 'alice-private@example.test' }),
            bobRef.set({ ...emptySocialState, email: 'bob-private@example.test' })
        ]);

        const anonymous = await invoke(null, { operation: 'send', targetUid: bob.uid });
        assert.equal(anonymous.body.error?.status, 'UNAUTHENTICATED');

        const forged = await invoke(alice, {
            operation: 'send', targetUid: bob.uid, actorUid: bob.uid
        });
        assert.equal(forged.body.error?.status, 'INVALID_ARGUMENT');

        const self = await invoke(alice, { operation: 'send', targetUid: alice.uid });
        assert.equal(self.body.error?.status, 'INVALID_ARGUMENT');

        const sent = await invoke(alice, { operation: 'send', targetUid: bob.uid });
        assert.equal(sent.status, 200, JSON.stringify(sent.body));
        assert.deepEqual(sent.body.result, { status: 'updated' });

        const duplicate = await invoke(alice, { operation: 'send', targetUid: bob.uid });
        assert.equal(duplicate.status, 200, JSON.stringify(duplicate.body));
        assert.deepEqual(duplicate.body.result, { status: 'unchanged' });

        const reverse = await invoke(bob, { operation: 'send', targetUid: alice.uid });
        assert.equal(reverse.body.error?.status, 'FAILED_PRECONDITION');

        let aliceData = (await aliceRef.get()).data();
        let bobData = (await bobRef.get()).data();
        assert.deepEqual(aliceData.sentRequests, [bob.uid]);
        assert.deepEqual(bobData.friendRequests, [alice.uid]);
        assert.deepEqual(aliceData.friends, []);
        assert.deepEqual(bobData.friends, []);

        const accepted = await invoke(bob, { operation: 'accept', targetUid: alice.uid });
        assert.equal(accepted.status, 200, JSON.stringify(accepted.body));
        aliceData = (await aliceRef.get()).data();
        bobData = (await bobRef.get()).data();
        assert.deepEqual(aliceData.friends, [bob.uid]);
        assert.deepEqual(bobData.friends, [alice.uid]);
        assert.deepEqual(aliceData.sentRequests, []);
        assert.deepEqual(bobData.friendRequests, []);

        const removed = await invoke(alice, { operation: 'remove', targetUid: bob.uid });
        assert.equal(removed.status, 200, JSON.stringify(removed.body));
        assert.deepEqual((await aliceRef.get()).data().friends, []);
        assert.deepEqual((await bobRef.get()).data().friends, []);

        await invoke(alice, { operation: 'send', targetUid: bob.uid });
        const declined = await invoke(bob, { operation: 'decline', targetUid: alice.uid });
        assert.equal(declined.status, 200, JSON.stringify(declined.body));
        assert.deepEqual((await aliceRef.get()).data().sentRequests, []);
        assert.deepEqual((await bobRef.get()).data().friendRequests, []);

        await invoke(alice, { operation: 'send', targetUid: bob.uid });
        const cancelled = await invoke(alice, { operation: 'cancel', targetUid: bob.uid });
        assert.equal(cancelled.status, 200, JSON.stringify(cancelled.body));
        assert.deepEqual((await aliceRef.get()).data().sentRequests, []);
        assert.deepEqual((await bobRef.get()).data().friendRequests, []);

        aliceData = (await aliceRef.get()).data();
        bobData = (await bobRef.get()).data();
        assert.equal(aliceData.coins, 750);
        assert.equal(bobData.coins, 750);
        assert.equal(aliceData.experience, 120);
        assert.equal(bobData.experience, 120);
        assert.equal(aliceData.email, 'alice-private@example.test');
        assert.equal(bobData.email, 'bob-private@example.test');
    } finally {
        if (alice) await adminAuth.deleteUser(alice.uid).catch(() => {});
        if (bob) await adminAuth.deleteUser(bob.uid).catch(() => {});
        if (alice) await db.collection('users').doc(alice.uid).delete().catch(() => {});
        if (bob) await db.collection('users').doc(bob.uid).delete().catch(() => {});
        await db.terminate();
        await deleteApp(app);
    }
});
