import test from 'node:test';
import assert from 'node:assert/strict';
import { createFirebaseShopProductionInvoker } from '../app/modules/shop/firebase-shop-production.js';

function setup({ currentUser = { uid: 'player-1' } } = {}) {
    const calls = [];
    const auth = { currentUser };
    const functions = { name: 'production-functions' };
    const callable = async data => (calls.push(data), { data: { ok: true } });
    const invoke = createFirebaseShopProductionInvoker({
        auth,
        functions,
        httpsCallable: (instance, name) => {
            calls.push({ instance, name });
            return callable;
        }
    });
    return { invoke, calls, auth };
}

test('production shop transport targets only shopPurchase and sends the minimal purchase payload', async () => {
    const { invoke, calls } = setup();
    const response = await invoke('purchase', {
        itemId: 'theme_neon',
        operationId: 'shop_purchase_0001'
    });
    assert.deepEqual(response.data, { ok: true });
    assert.deepEqual(calls[0], { instance: { name: 'production-functions' }, name: 'shopPurchase' });
    assert.deepEqual(calls[1], {
        operation: 'purchase',
        payload: { itemId: 'theme_neon', operationId: 'shop_purchase_0001' }
    });
});

test('production shop transport rejects signed-out callers before invoking the callable', async () => {
    const { invoke, calls } = setup({ currentUser: null });
    await assert.rejects(invoke('purchase', {
        itemId: 'theme_neon', operationId: 'shop_purchase_0001'
    }), /AUTH_REQUIRED/);
    assert.equal(calls.length, 1, 'only callable binding is created; no request is sent');
});

test('production shop transport rejects client-authored prices, owner IDs and bonus metadata', async () => {
    const { invoke, calls } = setup();
    for (const [operation, payload] of [
        ['purchase', { itemId: 'theme_neon', operationId: 'shop_purchase_0001', price: 1 }],
        ['purchase', { itemId: 'theme_neon', operationId: 'shop_purchase_0001', uid: 'victim' }],
        ['purchase', { itemId: 'bonus_xp_boost', operationId: 'shop_purchase_0001', duration: 1, effect: 'skip' }],
        ['equip', { itemId: 'frame_gold', uid: 'victim' }],
        ['purchase', { itemId: '../users', operationId: 'shop_purchase_0001' }]
    ]) {
        await assert.rejects(invoke(operation, payload), /INVALID_SHOP_REQUEST/);
    }
    assert.equal(calls.length, 1, 'invalid payloads never reach the callable');
});

test('production shop transport requires an authenticated user with a valid UID', async () => {
    const { invoke } = setup({ currentUser: { uid: '   ' } });
    await assert.rejects(invoke('equip', { itemId: 'frame_gold' }), /AUTH_REQUIRED/);
});
