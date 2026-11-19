import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium } from 'playwright';

const url = 'http://127.0.0.1:8765/?firebaseEmulator=1';
const project = 'demo-quizhub';

async function waitForIdentity(page) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const identity = await page.evaluate(async () => {
      const { auth } = await import('./app/firebase-config.js');
      return { uid: auth.currentUser?.uid || null, projectId: auth.app.options.projectId };
    });
    if (identity.uid) return identity;
    await page.waitForTimeout(250);
  }
  const message = await page.locator('#auth-feedback').textContent().catch(() => '');
  throw new Error('Firebase chat test login did not complete. UI message: ' + message);
}

async function createClient(browser, label) {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('#auth-form').waitFor({ timeout: 25000 });
  const email = `chat-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  await page.evaluate(() => window.switchAuthMode());
  await page.locator('#auth-password[autocomplete="new-password"]').waitFor();
  await page.locator('#auth-email').fill(email);
  await page.locator('#auth-password').fill('Chat-emulator-5830');
  await page.locator('#auth-form button[type="submit"]').click();
  const identity = await waitForIdentity(page);
  assert.equal(identity.projectId, project, 'Browser must authenticate against the demo project');
  return { context, page, uid: identity.uid, errors };
}

async function seedProfile(client, friendUid, nickname) {
  await client.page.evaluate(async ({ friendUid, nickname }) => {
    const { auth, db, doc, setDoc } = await import('./app/firebase-config.js');
    await setDoc(doc(db, 'users', auth.currentUser.uid), {
      nickname, friends: [friendUid], coins: 100, level: 1
    }, { merge: true });
  }, { friendUid, nickname });
}

async function openFriendChat(client, friendUid) {
  await client.page.evaluate(() => window.navigateTo('chat'));
  const friend = client.page.locator(`.chat-friend-item[data-friend-id="${friendUid}"]`);
  await friend.waitFor({ timeout: 20000 });
  await friend.click();
  await client.page.locator('#chat-active').waitFor({ state: 'visible', timeout: 10000 });
  await client.page.locator('#chat-messages').waitFor();
}

async function waitForMessage(page, text) {
  await page.locator('.message-wrapper .message-text').filter({ hasText: text }).waitFor({ timeout: 20000 });
}

test('two authenticated browser clients receive live chat updates and recover their listener after reconnect', { timeout: 150000 }, async () => {
  assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Requires local Auth emulator');
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Requires local Firestore emulator');
  assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project,
    'Never run chat browser tests against production');

  const browser = await chromium.launch({ headless: true });
  let alice, bob;
  try {
    alice = await createClient(browser, 'alice');
    bob = await createClient(browser, 'bob');
    await Promise.all([
      seedProfile(alice, bob.uid, 'Alice'),
      seedProfile(bob, alice.uid, 'Bob')
    ]);

    await Promise.all([
      openFriendChat(alice, bob.uid),
      openFriendChat(bob, alice.uid)
    ]);

    // Real browser A writes through the Firebase Web SDK. Browser B must
    // receive the new document through its active onSnapshot subscription.
    const chatId = [alice.uid, bob.uid].sort().join('_');
    const sent = await alice.page.evaluate(async ({ chatId }) => {
      const { auth, db, collection, addDoc, serverTimestamp } = await import('./app/firebase-config.js');
      const result = await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: auth.currentUser.uid, senderName: 'Alice',
        text: 'Live message from Alice', createdAt: serverTimestamp(),
        edited: false, replyTo: null, reactions: {}
      });
      return result.id;
    }, { chatId });
    await waitForMessage(bob.page, 'Live message from Alice');

    // Editing and reaction changes are also independent Firestore writes;
    // each must replace the rendered message state in the other browser.
    await alice.page.evaluate(async ({ chatId, messageId }) => {
      const { db, doc, updateDoc } = await import('./app/firebase-config.js');
      await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
        text: 'Edited live message', edited: true
      });
    }, { chatId, messageId: sent });
    await waitForMessage(bob.page, 'Edited live message');

    await bob.page.evaluate(async ({ chatId, messageId }) => {
      const { auth, db, doc, runTransaction } = await import('./app/firebase-config.js');
      const ref = doc(db, 'chats', chatId, 'messages', messageId);
      await runTransaction(db, async tx => {
        const snapshot = await tx.get(ref);
        tx.update(ref, { reactions: { ...(snapshot.data().reactions || {}), [auth.currentUser.uid]: '❤️' } });
      });
    }, { chatId, messageId: sent });
    await bob.page.locator('.message-wrapper .message-reactions').filter({ hasText: '❤️' }).waitFor({ timeout: 15000 });
    await alice.page.locator('.message-wrapper .message-reactions').filter({ hasText: '❤️' }).waitFor({ timeout: 15000 });

    // Simulate an actual network interruption in browser B. After connectivity
    // returns, Firestore's existing listener should catch up with a later write.
    await bob.context.setOffline(true);
    await bob.page.waitForTimeout(1200);
    await alice.page.evaluate(async ({ chatId }) => {
      const { auth, db, collection, addDoc, serverTimestamp } = await import('./app/firebase-config.js');
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: auth.currentUser.uid, senderName: 'Alice',
        text: 'Message sent while Bob offline', createdAt: serverTimestamp(),
        edited: false, replyTo: null, reactions: {}
      });
    }, { chatId });
    await bob.page.waitForTimeout(800);
    assert.equal(
      await bob.page.locator('.message-wrapper .message-text').filter({ hasText: 'Message sent while Bob offline' }).count(),
      0,
      'Offline browser must not receive the new message before reconnecting'
    );
    await bob.context.setOffline(false);
    await waitForMessage(bob.page, 'Message sent while Bob offline');

    // Leaving and reopening a conversation must replace (not stack) listeners.
    await bob.page.evaluate(() => window.closeChatWindow());
    await bob.page.waitForTimeout(150);
    await openFriendChat(bob, alice.uid);
    await waitForMessage(bob.page, 'Message sent while Bob offline');
    assert.equal(
      await bob.page.locator('.message-wrapper .message-text').filter({ hasText: 'Message sent while Bob offline' }).count(),
      1,
      'Reopening a chat must not stack duplicate message listeners'
    );

    // A conversation with more than one page must show its newest 100
    // messages, not the oldest 100, while preserving chronological rendering.
    await alice.page.evaluate(async ({ chatId }) => {
      const { auth, db, collection, addDoc } = await import('./app/firebase-config.js');
      const messages = Array.from({ length: 105 }, (_, index) => ({
        senderId: auth.currentUser.uid,
        senderName: 'Alice',
        text: 'Page boundary message ' + String(index).padStart(3, '0'),
        createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, index)),
        edited: false,
        replyTo: null,
        reactions: {}
      }));
      await Promise.all(messages.map(message =>
        addDoc(collection(db, 'chats', chatId, 'messages'), message)
      ));
    }, { chatId });
    await waitForMessage(bob.page, 'Page boundary message 104');
    assert.equal(
      await bob.page.locator('.message-wrapper .message-text').filter({ hasText: 'Page boundary message 000' }).count(),
      0,
      'The oldest message must fall outside the newest-100 window'
    );
    assert.equal(
      await bob.page.locator('.message-wrapper .message-text').filter({ hasText: 'Page boundary message 104' }).count(),
      1,
      'The newest message must be visible'
    );
    await bob.page.locator('#chat-messages').evaluate(element => { element.scrollTop = 0; });
    await waitForMessage(bob.page, 'Page boundary message 000');
    const renderedTexts = await bob.page.locator('.message-wrapper .message-text').allTextContents();
    const oldestIndex = renderedTexts.findIndex(text => text.includes('Page boundary message 000'));
    const newestIndex = renderedTexts.findIndex(text => text.includes('Page boundary message 104'));
    assert.ok(oldestIndex >= 0, 'Scrolling to the top must load the older page');
    assert.ok(newestIndex > oldestIndex, 'Older messages must remain before newer messages');

    assert.deepEqual(alice.errors, [], `Alice browser errors: ${alice.errors.join(' | ')}`);
    assert.deepEqual(bob.errors, [], `Bob browser errors: ${bob.errors.join(' | ')}`);
  } finally {
    if (alice) await alice.context.close();
    if (bob) await bob.context.close();
    await browser.close();
  }
});
