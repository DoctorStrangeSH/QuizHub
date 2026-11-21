import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const project = 'demo-quizhub';
const callable = `http://127.0.0.1:5001/${project}/europe-west1/profileTimeZonePreview`;

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

test('existing profile timezone callable updates only the authenticated private preference', async () => {
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST);
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project);
    const app = initializeApp({ projectId: project }, 'profile-timezone-' + randomUUID());
    const db = getFirestore(app);
    const suffix = randomUUID().replaceAll('-', '').slice(0, 10);
    const alice = await register('timezone-a-' + suffix + '@example.test');
    const bob = await register('timezone-b-' + suffix + '@example.test');
    const aliceRef = db.collection('users').doc(alice.uid);
    const bobRef = db.collection('users').doc(bob.uid);
    try {
        await aliceRef.set({
            nickname: 'Alice_' + suffix, timeZone: 'UTC',
            experience: 725, level: 8, coins: 91,
            stats: { totalGames: 12 }, privateMarker: 'preserve-me'
        });
        await bobRef.set({ nickname: 'Bob_' + suffix, timeZone: 'UTC', coins: 17 });

        const anonymous = await invoke(null, { timeZone: 'Europe/Berlin' });
        assert.equal(anonymous.body.error?.status, 'UNAUTHENTICATED');

        const forged = await invoke(alice, { timeZone: 'Europe/Berlin', uid: bob.uid });
        assert.equal(forged.body.error?.status, 'INVALID_ARGUMENT');
        const invalid = await invoke(alice, { timeZone: 'Mars/Olympus' });
        assert.equal(invalid.body.error?.status, 'INVALID_ARGUMENT');

        const updated = await invoke(alice, { timeZone: 'Europe/Berlin' });
        assert.equal(updated.body.result?.status, 'updated', JSON.stringify(updated.body));
        assert.equal(updated.body.result?.uid, alice.uid);
        assert.equal(updated.body.result?.timeZone, 'Europe/Berlin');

        const aliceProfile = (await aliceRef.get()).data();
        const bobProfile = (await bobRef.get()).data();
        assert.deepEqual(aliceProfile, {
            nickname: 'Alice_' + suffix, timeZone: 'Europe/Berlin',
            experience: 725, level: 8, coins: 91,
            stats: { totalGames: 12 }, privateMarker: 'preserve-me'
        });
        assert.equal(bobProfile.timeZone, 'UTC');
        assert.equal(bobProfile.coins, 17);

        const missing = await invoke(bob, { timeZone: 'UTC' });
        await db.collection('users').doc(bob.uid).delete();
        const missingAfterDelete = await invoke(bob, { timeZone: 'UTC' });
        assert.equal(missingAfterDelete.body.error?.status, 'NOT_FOUND');
        assert.equal((await aliceRef.get()).data().coins, 91);
    } finally {
        await Promise.all([aliceRef.delete(), bobRef.delete()]);
        await db.terminate();
        await deleteApp(app);
    }
});
