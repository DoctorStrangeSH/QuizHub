import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const at = path => new URL('../' + path, import.meta.url);
const config = JSON.parse(readFileSync(at('firebase.json'), 'utf8'));
const preview = JSON.parse(readFileSync(at('firebase.rules-preview.json'), 'utf8'));
const cutover = readFileSync(at('docs/FIRESTORE_PROFILE_CUTOVER.md'), 'utf8');
const rulesReview = readFileSync(at('docs/FIRESTORE_RULES_REVIEW_2026-11-19.md'), 'utf8');
const reportedRules = readFileSync(at('docs/FIRESTORE_RULES_REPORTED_2026-11-19.txt'), 'utf8');

test('preview-only emulator rules are never mistaken for deployed production rules', () => {
    assert.equal(preview.firestore?.rules, 'tests/fixtures/quiz-sessions.rules');
    assert.ok(existsSync(at(preview.firestore.rules)));
    assert.equal(config.emulators?.firestore?.port, 8080);

    if (!config.firestore?.rules) {
        assert.match(cutover, /effective rules published[\s\S]*?UNVERIFIED/i);
        assert.match(cutover, /NOT READY/);
        return;
    }

    // A future explicit production configuration must name an existing,
    // separately reviewed file, never the preview emulator fixture.
    assert.notEqual(config.firestore.rules, preview.firestore.rules);
    assert.ok(existsSync(at(config.firestore.rules)));
});

test('user-supplied rules are treated as a critical security finding, not an approved deployment', () => {
    assert.match(rulesReview, /CRITICAL \/ DO NOT DEPLOY AS A FIX/);
    for (const collection of ['users', 'chats', 'shopItems', 'achievements', 'dailyRewards', 'events', 'settings', 'questions', 'friendRequests', 'usernames', 'transactions', 'notifications']) {
        assert.ok(rulesReview.includes(collection), `${collection} must be covered by the review`);
    }
    assert.match(rulesReview, /actual.*active rules release/);
    assert.match(rulesReview, /isolated Firebase Emulator/);
    assert.match(rulesReview, /backup/);
    assert.match(rulesReview, /PUBLIC_PROFILE_READS_ENABLED.*false/);
    assert.match(reportedRules, /AUDIT EVIDENCE ONLY\. DO NOT DEPLOY/);
    for (const unsafeGrant of [
        /match \/users\/\{uid\}[\s\S]*?allow read: if isAuth\(\)/,
        /match \/chats\/\{chatId\}[\s\S]*?allow read, create: if isAuth\(\)/,
        /match \/shopItems\/\{id\}[\s\S]*?allow write: if isAuth\(\)/
    ]) assert.match(reportedRules, unsafeGrant);
});
