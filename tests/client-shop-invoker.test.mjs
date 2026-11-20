import test from 'node:test';
import assert from 'node:assert/strict';
import { createFirebaseShopInvoker } from '../app/modules/shop/firebase-shop-invoker.js';

function setup({ hostname = 'localhost', search = '?firebaseEmulator=1&shopPreview=1', projectId = 'demo-quizhub' } = {}) {
    const calls = [];
    const auth = { app: { options: { projectId } } };
    const functions = { name: 'functions-emulator' };
    const callable = async payload => (calls.push(payload), { data: { balance: 200, coinsSpent: 500 } });
    const invoke = createFirebaseShopInvoker({
        auth,
        getFunctions: (...args) => (calls.push(['getFunctions', ...args]), functions),
        connectFunctionsEmulator: (...args) => calls.push(['connect', ...args]),
        httpsCallable: (...args) => (calls.push(['httpsCallable', ...args]), callable),
        location: { hostname, search }
    });
    return { invoke, calls };
}

test('connects only to local demo project with explicit shop preview opt-in', async () => {
    const { invoke, calls } = setup();
    const result = await invoke('purchase', { itemId: 'theme_neon', operationId: 'purchase_req_0001' });
    assert.deepEqual(result.data, { balance: 200, coinsSpent: 500 });
    assert.deepEqual(calls[0], ['getFunctions', { options: { projectId: 'demo-quizhub' } }, 'europe-west1']);
    assert.deepEqual(calls[1], ['connect', { name: 'functions-emulator' }, '127.0.0.1', 5001]);
    assert.deepEqual(calls[2], ['httpsCallable', { name: 'functions-emulator' }, 'shopPurchasePreview']);
    assert.deepEqual(calls[3], { operation: 'purchase', payload: { itemId: 'theme_neon', operationId: 'purchase_req_0001' } });
});

test('rejects production hosts, missing opt-in and non-demo projects before connecting', () => {
    for (const config of [
        { hostname: 'quizhub.example', search: '?firebaseEmulator=1&shopPreview=1' },
        { hostname: 'localhost', search: '?firebaseEmulator=1' },
        { hostname: 'localhost', search: '?shopPreview=1' },
        { hostname: 'localhost', search: '?firebaseEmulator=1&shopPreview=1', projectId: 'quizhub-e65f5' }
    ]) {
        assert.throws(() => setup(config), /SHOP_PREVIEW_EMULATOR_REQUIRED/);
    }
});

test('rejects client-authored price, UID, duration and malformed operations', async () => {
    const { invoke, calls } = setup();
    for (const [operation, payload] of [
        ['purchase', { itemId: 'theme_neon', operationId: 'purchase_req_0001', price: 1 }],
        ['purchase', { itemId: 'theme_neon', operationId: 'purchase_req_0001', uid: 'victim' }],
        ['equip', { itemId: 'theme_neon', uid: 'victim' }],
        ['purchase', { itemId: 'theme_neon' }],
        ['delete', { itemId: 'theme_neon' }]
    ]) {
        await assert.rejects(invoke(operation, payload), /INVALID_SHOP_REQUEST/);
    }
    assert.equal(calls.length, 3, 'invalid requests never reach the callable');
});

test('routes owned cosmetic equip through the same trusted callable', async () => {
    const { invoke, calls } = setup();
    await invoke('equip', { itemId: 'theme_neon' });
    assert.deepEqual(calls.at(-1), { operation: 'equip', payload: { itemId: 'theme_neon' } });
});
