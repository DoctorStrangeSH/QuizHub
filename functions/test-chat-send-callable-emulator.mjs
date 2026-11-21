import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { directChatId } from '../server/chat-messages.mjs';

const project = 'demo-quizhub';
const callable = `http://127.0.0.1:5001/${project}/europe-west1/chatSendPreviewCallable`;
const authBase = 'http://127.0.0.1:9099';

async function register(suffix, name) {
    const response = await fetch(
        `${authBase}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-key`,
        {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                email: `chat-${name}-${suffix}@example.test`,
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

test('CHAT-01 callable sends idempotent messages only between mutual friends', {
    timeout: 60000
}, async () => {
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Auth Emulator required');
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Firestore Emulator required');
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project,
        'Never run chat integration tests against production');

    const app = initializeApp({ projectId: project }, 'chat-send-' + randomUUID());
    const db = getFirestore(app);
    const adminAuth = getAuth(app);
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    let alice;
    let bob;
    let charlie;
    try {
        [alice, bob, charlie] = await Promise.all([
            register(suffix, 'alice'), register(suffix, 'bob'), register(suffix, 'charlie')
        ]);
        const aliceRef = db.collection('users').doc(alice.uid);
        const bobRef = db.collection('users').doc(bob.uid);
        const charlieRef = db.collection('users').doc(charlie.uid);
        await Promise.all([
            aliceRef.set({ friends: [bob.uid], coins: 500, email: 'alice-private@example.test' }),
            bobRef.set({ friends: [alice.uid], coins: 700, email: 'bob-private@example.test' }),
            charlieRef.set({ friends: [], coins: 900, email: 'charlie-private@example.test' })
        ]);

        const messageId = 'message_' + randomUUID().replaceAll('-', '');
        const payload = { targetUid: bob.uid, messageId, text: 'Hello from Alice' };
        const guest = await invoke(null, payload);
        assert.equal(guest.body.error?.status, 'UNAUTHENTICATED');

        const forged = await invoke(alice, { ...payload, senderId: charlie.uid });
        assert.equal(forged.body.error?.status, 'INVALID_ARGUMENT');

        const sent = await invoke(alice, payload);
        assert.equal(sent.status, 200, JSON.stringify(sent.body));
        assert.equal(sent.body.result.status, 'created');

        const duplicate = await invoke(alice, payload);
        assert.equal(duplicate.status, 200, JSON.stringify(duplicate.body));
        assert.equal(duplicate.body.result.status, 'unchanged');
        assert.equal(duplicate.body.result.chatId, sent.body.result.chatId);

        const chatId = directChatId(alice.uid, bob.uid);
        assert.equal(sent.body.result.chatId, chatId);
        const chat = (await db.collection('chats').doc(chatId).get()).data();
        assert.deepEqual(chat.participants, [alice.uid, bob.uid].sort());
        assert.equal(chat.lastMessageId, messageId);
        const messages = await db.collection('chats').doc(chatId).collection('messages').get();
        assert.equal(messages.size, 1);
        const message = messages.docs[0].data();
        assert.equal(message.senderId, alice.uid);
        assert.equal(message.recipientId, bob.uid);
        assert.equal(message.text, 'Hello from Alice');

        const blocked = await invoke(charlie, {
            targetUid: alice.uid,
            messageId: 'message_' + randomUUID().replaceAll('-', ''),
            text: 'I am not a friend'
        });
        assert.equal(blocked.body.error?.status, 'PERMISSION_DENIED');

        const self = await invoke(alice, {
            targetUid: alice.uid,
            messageId: 'message_' + randomUUID().replaceAll('-', ''),
            text: 'self'
        });
        assert.equal(self.body.error?.status, 'INVALID_ARGUMENT');

        assert.equal((await aliceRef.get()).data().coins, 500);
        assert.equal((await bobRef.get()).data().coins, 700);
        assert.equal((await charlieRef.get()).data().coins, 900);
        assert.equal((await aliceRef.get()).data().email, 'alice-private@example.test');
        assert.equal((await bobRef.get()).data().email, 'bob-private@example.test');
    } finally {
        for (const user of [alice, bob, charlie]) {
            if (user) await adminAuth.deleteUser(user.uid).catch(() => {});
            if (user) await db.collection('users').doc(user.uid).delete().catch(() => {});
        }
        if (alice && bob) {
            const chatId = directChatId(alice.uid, bob.uid);
            const messages = await db.collection('chats').doc(chatId).collection('messages').get().catch(() => null);
            if (messages) {
                const batch = db.batch();
                messages.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit().catch(() => {});
            }
            await db.collection('chats').doc(chatId).delete().catch(() => {});
        }
        await db.terminate();
        await deleteApp(app);
    }
});
