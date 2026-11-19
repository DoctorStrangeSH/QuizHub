import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const project = 'demo-quizhub';
const root = 'http://127.0.0.1:8080/v1/projects/demo-quizhub/databases/(default)/documents';
const signup = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-key';

async function register() {
    const response = await fetch(signup, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}'
    });
    const body = await response.json();
    assert.equal(response.status, 200, JSON.stringify(body));
    return { uid: body.localId, token: body.idToken };
}

async function request(path, method, token, data, expectedStatus) {
    const headers = { 'content-type': 'application/json' };
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await fetch(root + path, {
        method, headers, ...(data === undefined ? {} : { body: JSON.stringify(data) })
    });
    const body = await response.json();
    assert.equal(response.status, expectedStatus, `${method} ${path}: ${JSON.stringify(body)}`);
    if (expectedStatus === 403) assert.equal(body.error?.status, 'PERMISSION_DENIED');
    return body;
}

test('private profiles are owner-only; public projections are authenticated read-only', async () => {
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST);
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project);
    const app = initializeApp({ projectId: project }, 'privacy-' + randomUUID());
    const db = getFirestore(app);
    const alice = await register();
    const bob = await register();
    const alicePrivate = db.collection('users').doc(alice.uid);
    const alicePublic = db.collection('publicProfiles').doc(alice.uid);
    const forged = { fields: { coins: { integerValue: '999999' }, uid: { stringValue: bob.uid } } };
    const projection = {
        uid: alice.uid, nickname: 'AliceQuiz', nicknameLower: 'alicequiz',
        level: 4, experience: 250, weeklyExperience: 50, wins: 8,
        equippedFrame: 'frame_default'
    };
    try {
        // The trusted Admin SDK can backfill, despite client write denials.
        await alicePrivate.set({ email: 'private-alice@example.test', coins: 100, ...projection });
        await alicePublic.set(projection);
        assert.equal((await alicePrivate.get()).data().email, 'private-alice@example.test');

        const owner = await request(`/users/${alice.uid}`, 'GET', alice.token, undefined, 200);
        assert.equal(owner.fields.email.stringValue, 'private-alice@example.test');
        await request(`/users/${alice.uid}`, 'GET', bob.token, undefined, 403);
        await request(`/users/${alice.uid}`, 'GET', null, undefined, 403);
        await request('/users?pageSize=20', 'GET', bob.token, undefined, 403);
        await request('/users?pageSize=20', 'GET', alice.token, undefined, 403);

        const publiclyVisible = await request(`/publicProfiles/${alice.uid}`, 'GET', bob.token, undefined, 200);
        assert.equal(publiclyVisible.fields.nickname.stringValue, 'AliceQuiz');
        assert.equal('email' in publiclyVisible.fields, false);
        await request(`/publicProfiles/${alice.uid}`, 'GET', null, undefined, 403);
        await request('/publicProfiles?pageSize=20', 'GET', bob.token, undefined, 200);

        for (const [path, token] of [
            [`/users/${alice.uid}`, alice.token],
            [`/users/${alice.uid}`, bob.token],
            [`/publicProfiles/${alice.uid}`, alice.token],
            [`/publicProfiles/${alice.uid}`, bob.token]
        ]) {
            await request(path + '?updateMask.fieldPaths=coins', 'PATCH', token, forged, 403);
            await request(path, 'DELETE', token, undefined, 403);
        }
        for (const collection of ['users', 'publicProfiles', 'nicknameClaims', 'transactions',
            'shopItems', 'achievements', 'dailyRewards', 'events', 'settings', 'questions',
            'friendRequests', 'chats', 'quizSessions']) {
            await request(`/${collection}?documentId=${randomUUID()}`, 'POST', bob.token, forged, 403);
        }
        await request(`/chats/${randomUUID()}/messages?documentId=${randomUUID()}`,
            'POST', bob.token, forged, 403);
        await request(`/users/${alice.uid}/notifications?documentId=${randomUUID()}`,
            'POST', bob.token, forged, 403);
        await request(`/chats/${randomUUID()}/messages?pageSize=10`, 'GET', bob.token, undefined, 403);

        assert.equal((await alicePrivate.get()).data().coins, 100);
        assert.deepEqual((await alicePublic.get()).data(), projection);
    } finally {
        await Promise.all([alicePrivate.delete(), alicePublic.delete()]);
        await db.terminate();
        await deleteApp(app);
    }
});

test('only chat members can view messages; outsiders cannot forge membership', async () => {
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST);
    const app = initializeApp({ projectId: project }, 'chat-privacy-' + randomUUID());
    const db = getFirestore(app);
    const alice = await register();
    const bob = await register();
    const charlie = await register();
    const chatId = randomUUID();
    const chat = db.collection('chats').doc(chatId);
    const message = chat.collection('messages').doc('greeting');
    const messageData = { senderId: alice.uid, text: 'Привет!', createdAt: new Date() };
    try {
        await chat.set({ memberUids: [alice.uid, bob.uid] });
        await message.set(messageData);

        for (const token of [alice.token, bob.token]) {
            await request(`/chats/${chatId}`, 'GET', token, undefined, 200);
            const visible = await request(`/chats/${chatId}/messages/greeting`, 'GET', token, undefined, 200);
            assert.equal(visible.fields.text.stringValue, 'Привет!');
            await request(`/chats/${chatId}/messages?pageSize=10`, 'GET', token, undefined, 200);
        }
        for (const token of [charlie.token, null]) {
            await request(`/chats/${chatId}`, 'GET', token, undefined, 403);
            await request(`/chats/${chatId}/messages/greeting`, 'GET', token, undefined, 403);
            await request(`/chats/${chatId}/messages?pageSize=10`, 'GET', token, undefined, 403);
        }
        const forged = { fields: { memberUids: { arrayValue: { values: [
            { stringValue: alice.uid }, { stringValue: charlie.uid }
        ] } } } };
        await request(`/chats/${chatId}?updateMask.fieldPaths=memberUids`, 'PATCH', charlie.token, forged, 403);
        await request(`/chats/${chatId}?updateMask.fieldPaths=memberUids`, 'PATCH', alice.token, forged, 403);
        await request(`/chats/${chatId}/messages?documentId=spoofed`, 'POST', charlie.token,
            { fields: { senderId: { stringValue: alice.uid }, text: { stringValue: 'forged' } } }, 403);
        await request(`/chats/${chatId}/messages/greeting?updateMask.fieldPaths=text`, 'PATCH', bob.token,
            { fields: { text: { stringValue: 'tampered' } } }, 403);
        assert.equal((await message.get()).data().text, 'Привет!');
        assert.deepEqual((await chat.get()).data().memberUids, [alice.uid, bob.uid]);
    } finally {
        await message.delete();
        await chat.delete();
        await db.terminate();
        await deleteApp(app);
    }
});
