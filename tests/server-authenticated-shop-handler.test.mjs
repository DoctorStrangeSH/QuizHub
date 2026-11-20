import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthenticatedShopHandler } from '../server/authenticated-shop-handler.mjs';

test('shop handler derives owner from verified auth and accepts only item and idempotency key', async () => {
    const calls = [];
    const handle = createAuthenticatedShopHandler({ service: { purchase: async input => (calls.push(input), { ok: true }) } });
    assert.deepEqual(await handle('purchase', { itemId: 'theme_neon', operationId: 'purchase_req_0001' }, {
        auth: { uid: 'verified-user' }, now: 1234
    }), { ok: true });
    assert.deepEqual(calls, [{ uid: 'verified-user', itemId: 'theme_neon', operationId: 'purchase_req_0001' }]);
});

test('shop handler rejects unauthenticated users, client identity and extra fields', async () => {
    const handle = createAuthenticatedShopHandler({ service: { purchase: async () => ({}) } });
    await assert.rejects(handle('purchase', { itemId: 'theme_neon', operationId: 'purchase_req_0001' }, { now: 1 }), /AUTH_REQUIRED/);
    await assert.rejects(handle('purchase', { uid: 'victim', itemId: 'theme_neon', operationId: 'purchase_req_0001' }, { auth: { uid: 'attacker' }, now: 1 }), /UNEXPECTED_SHOP_FIELD/);
    await assert.rejects(handle('purchase', { itemId: 'theme_neon', operationId: 'purchase_req_0001', price: 1 }, { auth: { uid: 'attacker' }, now: 1 }), /UNEXPECTED_SHOP_FIELD/);
    await assert.rejects(handle('admin', {}, { auth: { uid: 'attacker' }, now: 1 }), /UNKNOWN_SHOP_OPERATION/);
});
