import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isAccountLedgerHistoryPreviewEnabled } from '../app/modules/profile/account-ledger-history-settings.js';
import { createFirebaseAccountLedgerHistoryInvoker } from '../app/modules/profile/firebase-account-ledger-history-invoker.js';

function setup({
    hostname = 'localhost',
    search = '?firebaseEmulator=1&accountLedgerHistoryPreview=1',
    projectId = 'demo-quizhub',
    user = { uid: 'verified-player', isAnonymous: false },
    data = { entries: [], nextCursor: null }
} = {}) {
    const calls = [];
    const auth = { app: { options: { projectId } }, currentUser: user };
    const functions = { name: 'functions-emulator' };
    const invoker = createFirebaseAccountLedgerHistoryInvoker({
        auth, functions, location: { hostname, search },
        httpsCallable: (...args) => {
            calls.push(['httpsCallable', ...args]);
            return async payload => {
                calls.push(payload);
                return { data };
            };
        }
    });
    return { invoker, calls, auth, functions };
}

test('history preview is opt-in only for a signed-in local demo emulator user', () => {
    assert.equal(isAccountLedgerHistoryPreviewEnabled(
        { hostname: 'localhost', search: '?firebaseEmulator=1&accountLedgerHistoryPreview=1' },
        { app: { options: { projectId: 'demo-quizhub' } }, currentUser: { uid: 'p1', isAnonymous: false } }
    ), true);
    for (const config of [
        { hostname: 'quizhub.example', search: '?firebaseEmulator=1&accountLedgerHistoryPreview=1' },
        { hostname: 'localhost', search: '?firebaseEmulator=1' },
        { hostname: 'localhost', search: '?firebaseEmulator=1&accountLedgerHistoryPreview=1', projectId: 'quizhub-e65f5' },
        { hostname: 'localhost', search: '?firebaseEmulator=1&accountLedgerHistoryPreview=1', user: null },
        { hostname: 'localhost', search: '?firebaseEmulator=1&accountLedgerHistoryPreview=1', user: { uid: 'anon', isAnonymous: true } }
    ]) {
        const auth = {
            app: { options: { projectId: config.projectId || 'demo-quizhub' } },
            currentUser: config.user === undefined ? { uid: 'p1', isAnonymous: false } : config.user
        };
        assert.equal(isAccountLedgerHistoryPreviewEnabled(
            { hostname: config.hostname, search: config.search }, auth
        ), false);
        assert.throws(() => createFirebaseAccountLedgerHistoryInvoker({
            auth, functions: {}, httpsCallable: () => async () => ({ data: { entries: [], nextCursor: null } }),
            location: { hostname: config.hostname, search: config.search }
        }), /ACCOUNT_LEDGER_HISTORY_PREVIEW_EMULATOR_REQUIRED/);
    }
});

test('invoker calls the guarded history callable and projects only approved fields', async () => {
    const { invoker, calls, functions } = setup({
        data: { entries: [{
            entryId: 'quiz_reward_abc123', type: 'quiz_reward',
            occurredAt: 1760000000000, coinsDelta: 25, xpDelta: 40,
            sourceId: 'internal-session-id', uid: 'another-user'
        }], nextCursor: 'cursor_123' }
    });
    const result = await invoker({ pageSize: 20 });
    assert.deepEqual(calls[0], ['httpsCallable', functions, 'accountLedgerHistoryPreviewCallable']);
    assert.deepEqual(calls[1], { pageSize: 20, type: null, cursor: null });
    assert.deepEqual(result, {
        entries: [{
            entryId: 'quiz_reward_abc123', type: 'quiz_reward',
            occurredAt: 1760000000000, coinsDelta: 25, xpDelta: 40
        }],
        nextCursor: 'cursor_123'
    });
});

test('invoker rejects invalid requests and malformed server projections', async () => {
    const { invoker } = setup();
    await assert.rejects(invoker({ pageSize: 100 }), /INVALID_ACCOUNT_LEDGER_HISTORY_REQUEST/);
    await assert.rejects(invoker({ type: 'admin_grant' }), /INVALID_ACCOUNT_LEDGER_HISTORY_REQUEST/);
    const malformed = setup({ data: { entries: [{
        entryId: 'bad id', type: 'quiz_reward', occurredAt: 1760000000000, coinsDelta: 10, xpDelta: 5
    }], nextCursor: null } });
    await assert.rejects(malformed.invoker(), /INVALID_ACCOUNT_LEDGER_HISTORY_ENTRY/);
    const invalidDate = setup({ data: { entries: [{
        entryId: 'quiz_reward_abc123', type: 'quiz_reward', occurredAt: Number.MAX_SAFE_INTEGER,
        coinsDelta: 10, xpDelta: 5
    }], nextCursor: null } });
    await assert.rejects(invalidDate.invoker(), /INVALID_ACCOUNT_LEDGER_HISTORY_ENTRY/);
});

test('profile UI renders localized locked and emulator-preview states and is owner-only', () => {
    const ui = readFileSync(new URL('../app/modules/profile/account-ledger-history.js', import.meta.url), 'utf8');
    const profile = readFileSync(new URL('../app/modules/profile/public-profile.js', import.meta.url), 'utf8');
    const listeners = readFileSync(new URL('../app/modules/profile/profile.js', import.meta.url), 'utf8');
    const css = readFileSync(new URL('../app/modules/profile/profile.css', import.meta.url), 'utf8');
    assert.match(ui, /История операций/);
    assert.match(ui, /Activity history/);
    assert.match(ui, /Подтверждённые сервером операции/);
    assert.match(ui, /profile-ledger-filter/);
    assert.match(ui, /profile-ledger-more/);
    assert.match(profile, /isOwnProfile \? renderAccountLedgerHistory/);
    assert.match(profile, /isAccountLedgerHistoryPreviewEnabled/);
    assert.match(listeners, /attachAccountLedgerHistoryListeners/);
    assert.match(ui, /filter\.disabled = true/);
    assert.match(ui, /filter\.disabled = false/);
    assert.match(css, /@media \(max-width: 560px\)/);
});

test('history panel never uses direct Firestore reads or displays unverified legacy activity', () => {
    const ui = readFileSync(new URL('../app/modules/profile/account-ledger-history.js', import.meta.url), 'utf8');
    const invoker = readFileSync(new URL('../app/modules/profile/firebase-account-ledger-history-invoker.js', import.meta.url), 'utf8');
    assert.match(invoker, /accountLedgerHistoryPreviewCallable/);
    assert.doesNotMatch(ui, /getDocs|collection\(db|onSnapshot/);
    assert.match(ui, /Старые неподтверждённые записи/);
});
