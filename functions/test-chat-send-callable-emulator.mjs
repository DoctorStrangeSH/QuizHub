import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const project = 'demo-quizhub';
const endpoint = `http://127.0.0.1:5001/${project}/europe-west1/chatSendPreview`;

async function register() {
    const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-key', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            email: `chat-${randomUUID()}@example.test`,
            password: 'TestPassword!123', returnSecureToken: true
        })
    });
    const data = await response.json();
    assert.equal(response.status, 200, JSON.stringify(data));
    return { uid: data.localId, token: data.idToken };
}

async function registerGuest() {
    const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-key', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}'
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

test('emulator chat callable permits mutual friends and rejects forgery, strangers, replay changes', async () => {
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project);
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST);
    const app = initializeApp({ projectId: project }, 'chat-preview-' + randomUUID());
    const db = getFirestore(app);
    const alice = await register();
    const bob = await register();
    const charlie = await register();
    const guest = await registerGuest();
    const refs = [alice, bob, charlie].map(user => db.collection('users').doc(user.uid));
    let chatRef;
    try {
        await Promise.all([
            refs[0].set({ friends: [bob.uid], coins: 12 }),
            refs[1].set({ friends: [alice.uid], coins: 99 }),
            refs[2].set({ friends: [], coins: 5 })
        ]);
        const message = { recipientUid: bob.uid, text: 'Привет!', clientMessageId: 'emulator_' + randomUUID().slice(0, 12) };
        const unauthorized = await invoke(null, message);
        assert.equal(unauthorized.body.error?.status, 'UNAUTHENTICATED');
        const anonymous = await invoke(guest, message);
        assert.equal(anonymous.body.error?.status, 'UNAUTHENTICATED');
        const forged = await invoke(alice, { ...message, senderUid: charlie.uid });
        assert.equal(forged.body.error?.status, 'INVALID_ARGUMENT');
        const stranger = await invoke(charlie, message);
        assert.equal(stranger.body.error?.status, 'PERMISSION_DENIED');

        const sent = await invoke(alice, message);
        assert.equal(sent.body.result?.status, 'sent', JSON.stringify(sent));
        const { chatId, messageId } = sent.body.result;
        chatRef = db.collection('chats').doc(chatId);
        assert.deepEqual((await chatRef.get()).data().memberUids, [alice.uid, bob.uid].sort());
        assert.equal((await chatRef.collection('messages').doc(messageId).get()).data().senderId, alice.uid);
        const duplicate = await invoke(alice, message);
        assert.equal(duplicate.body.result?.status, 'unchanged', JSON.stringify(duplicate));
        const changed = await invoke(alice, { ...message, text: 'Другое сообщение' });
        assert.equal(changed.body.error?.status, 'ALREADY_EXISTS');
        const messages = await chatRef.collection('messages').get();
        assert.equal(messages.size, 1);
        assert.equal(messages.docs[0].data().text, 'Привет!');
        assert.equal((await refs[0].get()).data().coins, 12);
    } finally {
        if (chatRef) {
            const messages = await chatRef.collection('messages').get();
            await Promise.all(messages.docs.map(doc => doc.ref.delete()));
            await chatRef.delete();
        }
        await Promise.all(refs.map(ref => ref.delete()));
        await db.terminate();
        await deleteApp(app);
    }
});
