import test from 'node:test';
import assert from 'node:assert/strict';
import {
    isProfileTimeZonePreviewEnabled,
    isValidIanaTimeZone,
    renderProfileTimeZoneSettings,
    getSupportedTimeZones
} from '../app/modules/profile/profile-timezone-settings.js';
import { createFirebaseProfileTimeZoneInvoker } from '../app/modules/profile/firebase-profile-timezone-invoker.js';

function setup({
    hostname = 'localhost',
    search = '?firebaseEmulator=1&profileTimeZonePreview=1',
    projectId = 'demo-quizhub',
    user = { uid: 'verified-player', isAnonymous: false },
    receipt = null
} = {}) {
    const calls = [];
    const auth = { app: { options: { projectId } }, currentUser: user };
    const functions = { name: 'functions-emulator' };
    const invoke = async payload => {
        calls.push(payload);
        return { data: receipt || {
            status: 'updated', uid: auth.currentUser.uid, timeZone: payload.timeZone
        } };
    };
    const update = createFirebaseProfileTimeZoneInvoker({
        auth,
        functions,
        httpsCallable: (...args) => (calls.push(['httpsCallable', ...args]), invoke),
        location: { hostname, search }
    });
    return { update, calls, auth, functions };
}

test('only accepts a signed-in local demo emulator with explicit timezone preview opt-in', () => {
    assert.equal(isProfileTimeZonePreviewEnabled(
        { hostname: 'localhost', search: '?firebaseEmulator=1&profileTimeZonePreview=1' },
        { app: { options: { projectId: 'demo-quizhub' } }, currentUser: { uid: 'p1', isAnonymous: false } }
    ), true);
    for (const config of [
        { hostname: 'quizhub.example', search: '?firebaseEmulator=1&profileTimeZonePreview=1' },
        { hostname: 'localhost', search: '?firebaseEmulator=1' },
        { hostname: 'localhost', search: '?profileTimeZonePreview=1' },
        { hostname: 'localhost', search: '?firebaseEmulator=1&profileTimeZonePreview=1', projectId: 'quizhub-e65f5' },
        { hostname: 'localhost', search: '?firebaseEmulator=1&profileTimeZonePreview=1', user: null },
        { hostname: 'localhost', search: '?firebaseEmulator=1&profileTimeZonePreview=1', user: { uid: 'anon', isAnonymous: true } }
    ]) {
        const auth = { app: { options: { projectId: config.projectId || 'demo-quizhub' } }, currentUser: config.user === undefined ? { uid: 'p1', isAnonymous: false } : config.user };
        assert.equal(isProfileTimeZonePreviewEnabled(
            { hostname: config.hostname, search: config.search }, auth
        ), false);
        assert.throws(() => createFirebaseProfileTimeZoneInvoker({
            auth, functions: {}, httpsCallable: () => async () => ({}),
            location: { hostname: config.hostname, search: config.search }
        }), /PROFILE_TIMEZONE_PREVIEW_EMULATOR_REQUIRED/);
    }
});

test('validates IANA timezone values and uses the supported browser list', () => {
    assert.equal(isValidIanaTimeZone('Europe/Berlin'), true);
    assert.equal(isValidIanaTimeZone('UTC'), true);
    assert.equal(isValidIanaTimeZone('Mars/Olympus'), false);
    assert.equal(isValidIanaTimeZone(''), false);
    assert.ok(getSupportedTimeZones().includes('UTC'));
    assert.ok(getSupportedTimeZones().includes('Europe/Berlin'));
});

test('renders localized settings, retains a valid saved zone and never enables production writes', () => {
    const ru = renderProfileTimeZoneSettings({
        timeZone: 'Europe/Berlin', detectedTimeZone: 'Europe/Berlin',
        language: 'ru', previewEnabled: false
    });
    assert.match(ru, /Часовой пояс/);
    assert.match(ru, /Europe\/Berlin/);
    assert.match(ru, /disabled/);
    assert.match(ru, /безопасного серверного выпуска/);
    const en = renderProfileTimeZoneSettings({
        timeZone: 'UTC', language: 'en', previewEnabled: true
    });
    assert.match(en, /Time zone/);
    assert.match(en, /Save time zone/);
    assert.doesNotMatch(en, /disabled/);
});

test('calls only the timezone preview and validates the server receipt', async () => {
    const { update, calls, functions } = setup();
    assert.deepEqual(await update('Europe/Berlin'), {
        status: 'updated', timeZone: 'Europe/Berlin'
    });
    assert.deepEqual(calls, [
        ['httpsCallable', functions, 'profileTimeZonePreview'],
        { timeZone: 'Europe/Berlin' }
    ]);
});

test('rejects invalid timezone values and mismatched server receipts', async () => {
    const { update, calls } = setup();
    await assert.rejects(update('Mars/Olympus'), /INVALID_TIME_ZONE/);
    assert.equal(calls.length, 1);
    const forged = setup({ receipt: {
        status: 'updated', uid: 'another-player', timeZone: 'Europe/Berlin'
    } });
    await assert.rejects(forged.update('Europe/Berlin'), /INVALID_PROFILE_TIMEZONE_RECEIPT/);
});

test('profile UI exposes timezone settings only on the owner card and never writes timezone directly', async () => {
    const { readFile } = await import('node:fs/promises');
    const profileSource = await readFile(new URL('../app/modules/profile/public-profile.js', import.meta.url), 'utf8');
    const listenerSource = await readFile(new URL('../app/modules/profile/profile.js', import.meta.url), 'utf8');
    assert.match(profileSource, /isOwnProfile \? renderProfileTimeZoneSettings/);
    assert.match(listenerSource, /window\.confirm\(messages\.confirm\)/);
    assert.match(listenerSource, /createFirebaseProfileTimeZoneInvoker/);
    assert.doesNotMatch(listenerSource, /updateDoc\([^\n]*timeZone/);
    assert.doesNotMatch(listenerSource, /setDoc\([^\n]*timeZone/);
});
