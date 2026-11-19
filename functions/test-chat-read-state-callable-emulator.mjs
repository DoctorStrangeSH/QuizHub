import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { directChatId } from '../server/chat-send.mjs';

const project = 'demo-quizhub';
const endpoint = `http://127.0.0.1:5001/${project}/europe-west1/chatReadStatePreview`;

async function register() {
    const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-key', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: `read-${randomUUID()}@example.test`, password: 'TestPassword!123', returnSecureToken: true })
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

test('chat read cursor is authenticated, member-scoped and monotonic in emulators', async () => {
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project);
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST);
    const app = initializeApp({ projectId: project }, 'chat-read-' + randomUUID());
    const db = getFirestore(app);
    const alice = await register();
    const bob = await register();
    const outsider = await register();
    const chatId = directChatId(alice.uid, bob.uid);
    const chat = db.collection('chats').doc(chatId);
    try {
        await chat.set({ memberUids: [alice.uid, bob.uid].sort() });
        await chat.collection('messages').doc('message_earlier').set({
            senderId: bob.uid, text: 'Earlier', createdAt: new Date('2030-01-01T10:00:00.000Z')
        });
        await chat.collection('messages').doc('message_later').set({
            senderId: alice.uid, text: 'Later', createdAt: new Date('2030-01-01T10:01:00.000Z')
        });
        await chat.collection('messages').doc('message_tie_a').set({
            senderId: bob.uid, text: 'Tie A', createdAt: new Date('2030-01-01T10:02:00.000Z')
        });
        await chat.collection('messages').doc('message_tie_b').set({
            senderId: alice.uid, text: 'Tie B', createdAt: new Date('2030-01-01T10:02:00.000Z')
        });
        await chat.collection('messages').doc('message-tie-a').set({
            senderId: bob.uid, text: 'Tie punctuation', createdAt: new Date('2030-01-01T10:02:00.000Z')
        });
        await chat.collection('members').doc(alice.uid).set({ uid: alice.uid, unreadCount: 4 });

        const unauthenticated = await invoke(null, { chatId, lastReadMessageId: 'message_later' });
        assert.equal(unauthenticated.body.error?.status, 'UNAUTHENTICATED');
        const denied = await invoke(outsider, { chatId, lastReadMessageId: 'message_later' });
        assert.equal(denied.body.error?.status, 'PERMISSION_DENIED');

        const first = await invoke(alice, { chatId, lastReadMessageId: 'message_earlier' });
        assert.equal(first.body.result?.status, 'updated', JSON.stringify(first));
        const second = await invoke(alice, { chatId, lastReadMessageId: 'message_later' });
        assert.equal(second.body.result?.status, 'updated', JSON.stringify(second));
        const stale = await invoke(alice, { chatId, lastReadMessageId: 'message_earlier' });
        assert.equal(stale.body.result?.status, 'stale', JSON.stringify(stale));
        const tieAdvance = await invoke(alice, { chatId, lastReadMessageId: 'message_tie_b' });
        assert.equal(tieAdvance.body.result?.status, 'updated', JSON.stringify(tieAdvance));
        const tieStale = await invoke(alice, { chatId, lastReadMessageId: 'message_tie_a' });
        assert.equal(tieStale.body.result?.status, 'stale', JSON.stringify(tieStale));
        const punctuationStale = await invoke(alice, { chatId, lastReadMessageId: 'message-tie-a' });
        assert.equal(punctuationStale.body.result?.status, 'stale', JSON.stringify(punctuationStale));

        const aliceState = (await chat.collection('members').doc(alice.uid).get()).data();
        assert.equal(aliceState.lastReadMessageId, 'message_tie_b');
        assert.equal(aliceState.unreadCount, 4, 'partial read cursor must not clear unread count');
        assert.equal((await chat.collection('members').doc(bob.uid).get()).exists, false);
        const forged = await invoke(alice, { chatId, lastReadMessageId: 'message_later', uid: bob.uid });
        assert.equal(forged.body.error?.status, 'INVALID_ARGUMENT');
    } finally {
        const messages = await chat.collection('messages').get();
        await Promise.all(messages.docs.map(doc => doc.ref.delete()));
        const memberStates = await chat.collection('members').get();
        await Promise.all(memberStates.docs.map(doc => doc.ref.delete()));
        await chat.delete();
        await db.terminate();
        await deleteApp(app);
    }
});
