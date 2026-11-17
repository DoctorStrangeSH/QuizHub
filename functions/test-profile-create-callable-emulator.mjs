import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const project = 'demo-quizhub';
const callable = `http://127.0.0.1:5001/${project}/europe-west1/profileCreatePreview`;

async function register(email) {
    const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-key', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password: 'TestPassword!123', returnSecureToken: true })
    });
    const body = await response.json();
    assert.equal(response.status, 200, JSON.stringify(body));
    return { uid: body.localId, token: body.idToken, email };
}
async function invoke(user, data) {
    const headers = { 'content-type': 'application/json' };
    if (user) headers.authorization = 'Bearer ' + user.token;
    const response = await fetch(callable, {
        method: 'POST', headers, body: JSON.stringify({ data })
    });
    return { status: response.status, body: await response.json() };
}

test('emulator-only profile callable trusts Auth identity, denies forgery, and atomically reserves nickname', async () => {
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST);
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project);
    const app = initializeApp({ projectId: project }, 'profile-callable-' + randomUUID());
    const db = getFirestore(app);
    const suffix = randomUUID().replaceAll('-', '').slice(0, 10);
    const nickname = 'hero_' + suffix;
    const alice = await register('a-' + suffix + '@example.test');
    const bob = await register('b-' + suffix + '@example.test');
    const refs = [
        db.collection('users').doc(alice.uid), db.collection('users').doc(bob.uid),
        db.collection('publicProfiles').doc(alice.uid), db.collection('publicProfiles').doc(bob.uid),
        db.collection('nicknameClaims').doc(nickname)
    ];
    try {
        const anonymous = await invoke(null, { nickname });
        assert.equal(anonymous.body.error?.status, 'UNAUTHENTICATED');
        const forged = await invoke(alice, { nickname, uid: bob.uid, email: 'forged@example.test', coins: 50000 });
        assert.equal(forged.body.error?.status, 'INVALID_ARGUMENT');
        assert.equal((await refs[0].get()).exists, false);
        const results = await Promise.all([invoke(alice, { nickname }), invoke(bob, { nickname: nickname.toUpperCase() })]);
        assert.equal(results.filter(x => x.body.result?.status === 'created').length, 1, JSON.stringify(results));
        assert.equal(results.filter(x => x.body.error?.status === 'ALREADY_EXISTS').length, 1, JSON.stringify(results));
        const owner = (await refs[4].get()).data().uid;
        const profile = (await db.collection('users').doc(owner).get()).data();
        const publicProfile = (await db.collection('publicProfiles').doc(owner).get()).data();
        assert.equal(profile.email, owner === alice.uid ? alice.email : bob.email);
        assert.equal(profile.coins, 100);
        assert.equal(publicProfile.nicknameLower, nickname);
        assert.equal('email' in publicProfile, false);
        assert.equal('coins' in publicProfile, false);
        assert.equal('friends' in publicProfile, false);
        const winner = owner === alice.uid ? alice : bob;
        const retry = await invoke(winner, { nickname });
        assert.equal(retry.body.error?.status, 'ALREADY_EXISTS');
        assert.equal((await db.collection('users').doc(owner).get()).data().coins, 100);
    } finally {
        await Promise.all(refs.map(ref => ref.delete()));
        await db.terminate();
        await deleteApp(app);
    }
});
