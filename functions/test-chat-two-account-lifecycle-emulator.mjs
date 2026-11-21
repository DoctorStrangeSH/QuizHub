import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { directChatId } from '../server/chat-messages.mjs';

const project = 'demo-quizhub';
const base = `http://127.0.0.1:5001/${project}/europe-west1`;
const endpoints = {
    send: `${base}/chatSendPreviewCallable`,
    history: `${base}/chatHistoryPreviewCallable`,
    read: `${base}/chatReadReceiptPreviewCallable`,
    unread: `${base}/chatUnreadCountPreviewCallable`,
    mutate: `${base}/chatMessageMutationPreviewCallable`,
    reaction: `${base}/chatReactionPreviewCallable`
};
const authBase = 'http://127.0.0.1:9099';

async function register(suffix, name) {
    const response = await fetch(
        `${authBase}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-key`,
        {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                email: `chat-flow-${name}-${suffix}@example.test`,
                password: 'TestPassword!123',
                returnSecureToken: true
            })
        }
    );
    const body = await response.json();
    assert.equal(response.status, 200, JSON.stringify(body));
    return { uid: body.localId, token: body.idToken };
}

async function invoke(endpoint, user, data) {
    const headers = { 'content-type': 'application/json' };
    if (user) headers.authorization = 'Bearer ' + user.token;
    const response = await fetch(endpoint, {
        method: 'POST', headers, body: JSON.stringify({ data })
    });
    return { status: response.status, body: await response.json() };
}

test('CHAT lifecycle works end-to-end between two authenticated accounts', {
    timeout: 90000
}, async () => {
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Auth Emulator required');
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Firestore Emulator required');
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project,
        'Never run chat integration tests against production');

    const app = initializeApp({ projectId: project }, 'chat-two-account-flow-' + randomUUID());
    const db = getFirestore(app);
    const adminAuth = getAuth(app);
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    let alice;
    let bob;
    let chatId;

    try {
        [alice, bob] = await Promise.all([
            register(suffix, 'alice'),
            register(suffix, 'bob')
        ]);
        await Promise.all([
            db.collection('users').doc(alice.uid).set({ friends: [bob.uid] }),
            db.collection('users').doc(bob.uid).set({ friends: [alice.uid] })
        ]);

        const originalMessageId = 'message_' + randomUUID().replaceAll('-', '');
        const sent = await invoke(endpoints.send, alice, {
            targetUid: bob.uid, messageId: originalMessageId, text: 'Hello, Bob!'
        });
        assert.equal(sent.status, 200, JSON.stringify(sent.body));
        assert.equal(sent.body.result.status, 'created');
        chatId = directChatId(alice.uid, bob.uid);
        assert.equal(sent.body.result.chatId, chatId);

        const messageId = 'message_' + randomUUID().replaceAll('-', '');
        const replySent = await invoke(endpoints.send, bob, {
            targetUid: alice.uid, messageId, text: 'Replying to your greeting',
            replyToMessageId: originalMessageId
        });
        assert.equal(replySent.status, 200, JSON.stringify(replySent.body));
        assert.equal(replySent.body.result.status, 'created');

        const initialUnread = await invoke(endpoints.unread, bob, { chatId });
        assert.equal(initialUnread.status, 200, JSON.stringify(initialUnread.body));
        assert.equal(initialUnread.body.result.unreadCount, 1);

        const aliceUnread = await invoke(endpoints.unread, alice, { chatId });
        assert.equal(aliceUnread.body.result.unreadCount, 1);

        const bobHistory = await invoke(endpoints.history, bob, { chatId });
        assert.equal(bobHistory.status, 200, JSON.stringify(bobHistory.body));
        assert.equal(bobHistory.body.result.messages.length, 2);
        const replyMessage = bobHistory.body.result.messages.find(message => message.id === messageId);
        assert.equal(replyMessage.text, 'Replying to your greeting');
        assert.deepEqual(replyMessage.replyTo, {
            id: originalMessageId, senderId: alice.uid, text: 'Hello, Bob!'
        });

        const marked = await invoke(endpoints.read, alice, { chatId, upToMessageId: messageId });
        assert.equal(marked.status, 200, JSON.stringify(marked.body));
        const readUnread = await invoke(endpoints.unread, alice, { chatId });
        assert.equal(readUnread.body.result.unreadCount, 0);

        const aliceHistoryAfterRead = await invoke(endpoints.history, bob, { chatId });
        assert.equal(aliceHistoryAfterRead.body.result.messages.find(message => message.id === messageId).readByRecipient, true);

        const aliceReaction = await invoke(endpoints.reaction, alice, {
            chatId, messageId, reactionType: 'love'
        });
        const bobReaction = await invoke(endpoints.reaction, bob, {
            chatId, messageId, reactionType: 'love'
        });
        assert.equal(aliceReaction.body.result.status, 'added');
        assert.equal(bobReaction.body.result.status, 'added');
        let projected = await invoke(endpoints.history, bob, { chatId });
        assert.deepEqual(projected.body.result.messages[0].reactions, {
            love: { count: 2, reactedByMe: true }
        });

        const edited = await invoke(endpoints.mutate, alice, {
            operation: 'edit', chatId, messageId, text: 'Hello, Bob! (edited)'
        });
        assert.equal(edited.status, 200, JSON.stringify(edited.body));
        assert.equal(edited.body.result.status, 'updated');

        const forbiddenEdit = await invoke(endpoints.mutate, bob, {
            operation: 'edit', chatId, messageId, text: 'I am not the author'
        });
        assert.equal(forbiddenEdit.body.error?.status, 'PERMISSION_DENIED');

        projected = await invoke(endpoints.history, bob, { chatId });
        assert.equal(projected.body.result.messages[0].text, 'Hello, Bob! (edited)');
        assert.equal(projected.body.result.messages[0].edited, true);

        const deleted = await invoke(endpoints.mutate, alice, {
            operation: 'delete', chatId, messageId
        });
        assert.equal(deleted.status, 200, JSON.stringify(deleted.body));
        assert.equal(deleted.body.result.status, 'deleted');

        projected = await invoke(endpoints.history, bob, { chatId });
        const finalMessage = projected.body.result.messages[0];
        assert.equal(finalMessage.deleted, true);
        assert.equal(finalMessage.text, null);
        assert.deepEqual(finalMessage.reactions, {});
        assert.equal((await db.collection('chats').doc(chatId).get()).data().lastMessagePreview,
            'Сообщение удалено');
    } finally {
        if (chatId) {
            const messages = await db.collection('chats').doc(chatId).collection('messages').get().catch(() => null);
            if (messages) {
                const batch = db.batch();
                messages.docs.forEach(document => batch.delete(document.ref));
                await batch.commit().catch(() => {});
            }
            await db.collection('chats').doc(chatId).delete().catch(() => {});
        }
        for (const user of [alice, bob]) {
            if (user) {
                await db.collection('users').doc(user.uid).delete().catch(() => {});
                await adminAuth.deleteUser(user.uid).catch(() => {});
            }
        }
        await db.terminate();
        await deleteApp(app);
    }
});
