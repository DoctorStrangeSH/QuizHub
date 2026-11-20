import test from 'node:test';
import assert from 'node:assert/strict';
import { createShopCallableAdapter } from '../server/firebase-shop-callable-adapter.mjs';

class FakeHttpsError extends Error {
    constructor(code, message) { super(message); this.code = code; }
}

test('callable forwards only verified UID and server clock', async () => {
    const calls = [];
    const callable = createShopCallableAdapter({
        handle: async (...args) => (calls.push(args), { success: true }),
        HttpsError: FakeHttpsError,
        clock: () => 12345
    });
    const result = await callable({
        auth: { uid: 'verified' },
        data: { operation: 'purchase', payload: { itemId: 'theme_neon', operationId: 'purchase_req_0001' } }
    });
    assert.deepEqual(result, { success: true });
    assert.deepEqual(calls, [['purchase', { itemId: 'theme_neon', operationId: 'purchase_req_0001' }, { auth: { uid: 'verified' }, now: 12345 }]]);
});

test('callable rejects missing auth and malformed envelope', async () => {
    const callable = createShopCallableAdapter({ handle: async () => ({}), HttpsError: FakeHttpsError });
    await assert.rejects(callable({ data: { operation: 'purchase', payload: {} } }), e => e.code === 'unauthenticated');
    await assert.rejects(callable({ auth: { uid: 'a' }, data: { operation: 'purchase', payload: {}, uid: 'b' } }), e => e.code === 'invalid-argument');
});

test('callable maps business errors and hides unexpected internal errors', async () => {
    const make = error => createShopCallableAdapter({ handle: async () => { throw new Error(error); }, HttpsError: FakeHttpsError });
    await assert.rejects(make('INSUFFICIENT_COINS')({ auth: { uid: 'a' }, data: { operation: 'purchase', payload: {} } }), e => e.code === 'failed-precondition' && e.message === 'INSUFFICIENT_COINS');
    await assert.rejects(make('private database detail')({ auth: { uid: 'a' }, data: { operation: 'purchase', payload: {} } }), e => e.code === 'internal' && e.message === 'SHOP_SERVER_ERROR');
});

test('callable forwards authenticated cosmetic equip operation', async () => {
    const calls = [];
    const callable = createShopCallableAdapter({
        handle: async (...args) => (calls.push(args), { equipped: true }),
        HttpsError: FakeHttpsError,
        clock: () => 54321
    });
    const result = await callable({
        auth: { uid: 'verified' },
        data: { operation: 'equip', payload: { itemId: 'theme_neon' } }
    });
    assert.deepEqual(result, { equipped: true });
    assert.deepEqual(calls, [['equip', { itemId: 'theme_neon' }, { auth: { uid: 'verified' }, now: 54321 }]]);
});
