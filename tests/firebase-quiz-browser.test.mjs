import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium } from 'playwright';

const url = 'http://127.0.0.1:8765/?firebaseEmulator=1';
const project = 'demo-quizhub';

test('authenticated browser: complete a real classic quiz and persist earned rewards', { timeout: 150000 }, async () => {
  assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Requires local Auth emulator');
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Requires local Firestore emulator');
  assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project,
    'Never run this test against a production project');

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    await page.locator('#auth-form').waitFor({ timeout: 30000 });

    const email = 'quiz-round-' + Date.now() + '@example.test';
    await page.evaluate(() => window.switchAuthMode());
    await page.locator('#auth-password[autocomplete="new-password"]').waitFor();
    await page.locator('#auth-email').fill(email);
    await page.locator('#auth-password').fill('Quiz-round-emulator-5830');
    await page.locator('#auth-form button[type="submit"]').click();
    await page.locator('#profile-form').waitFor({ timeout: 30000 });

    const nickname = 'QRound' + Date.now().toString(36);
    await page.locator('#nickname-input').fill(nickname);
    await page.locator('#check-nickname-btn').click();
    await page.locator('#save-profile-btn:not([disabled])').waitFor({ timeout: 20000 });
    await page.locator('#save-profile-btn').click();
    await page.locator('.play-btn').waitFor({ timeout: 30000 });

    const initial = await page.evaluate(async () => {
      const { auth, db, doc, getDoc } = await import('./app/firebase-config.js');
      const snapshot = await getDoc(doc(db, 'users', auth.currentUser.uid));
      return { uid: auth.currentUser.uid, ...snapshot.data() };
    });
    assert.equal(initial.nickname, nickname);
    assert.equal(initial.quizzesCompleted || 0, 0);
    await page.evaluate(() => window.closeDailyPopup?.());
    await page.locator('.play-btn').click();
    await page.locator('#answers-container .answer-card').first().waitFor({ timeout: 30000 });

    // Answer all ten actual questions through the real route and click handlers.
    for (let round = 0; round < 10; round++) {
      await page.locator('.answer-card[data-correct="true"]').first().click();
      await page.locator('#answer-feedback:not([hidden])').waitFor({ timeout: 8000 });
      await page.locator('#next-btn-container button').click();
      if (round < 9) {
        await page.locator('.answer-card:not(.answered)').first().waitFor({ timeout: 10000 });
      }
    }
    await page.locator('.arcade-result').waitFor({ timeout: 10000 });
    assert.equal((await page.locator('.arcade-accuracy-heading strong').innerText()).trim(), '100%');
    assert.match(await page.locator('.arcade-streak-summary').innerText(), /10/);

    await page.locator('.quiz-result [role="status"]').filter({ hasText: /Награды сохранены|Rewards saved/ })
      .waitFor({ timeout: 25000 });
    const updated = await page.evaluate(async () => {
      const { auth, db, doc, getDoc } = await import('./app/firebase-config.js');
      const snapshot = await getDoc(doc(db, 'users', auth.currentUser.uid));
      return snapshot.data();
    });
    assert.equal(updated.quizzesCompleted, 1, 'One real completed quiz must persist');
    assert.ok(updated.experience > (initial.experience || 0), 'XP must increase');
    assert.ok(updated.coins > initial.coins, 'Coins must increase');
    assert.equal(updated.stats?.totalGames, 1);
    assert.equal(updated.stats?.correctAnswers, 10);
    assert.deepEqual(errors, [], 'No uncaught browser exceptions');

    await page.reload();
    await page.waitForFunction(async () => {
      const { auth } = await import('./app/firebase-config.js');
      return Boolean(auth.currentUser);
    }, { timeout: 30000 });
    const persisted = await page.evaluate(async () => {
      const { auth, db, doc, getDoc } = await import('./app/firebase-config.js');
      return (await getDoc(doc(db, 'users', auth.currentUser.uid))).data();
    });
    assert.equal(persisted.quizzesCompleted, 1, 'Reload must retain one saved result');
    assert.equal(persisted.coins, updated.coins, 'Reload must retain earned coins');
    await context.close();
  } finally {
    await browser.close();
  }
});
