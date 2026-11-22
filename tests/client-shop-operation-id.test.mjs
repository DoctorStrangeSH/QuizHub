import test from 'node:test';
import assert from 'node:assert/strict';
import {
    getOrCreateShopOperationId,
    clearShopOperationId
} from '../app/modules/shop/shop-operation-id.js';

function memoryStorage() {
    const values = new Map();
    return {
        values,
        getItem(key) { return values.get(key) ?? null; },
        setItem(key, value) { values.set(key, String(value)); },
        removeItem(key) { values.delete(key); }
    };
}

test('pending purchase operation ID survives a lost response and a new module instance', () => {
    const storage = memoryStorage();
    let generated = 0;
    const options = {
        uid: 'player-1',
        itemId: 'theme_neon',
        storage,
        randomUUID: () => `uuid-${++generated}`
    };
    const first = getOrCreateShopOperationId(options);
    // A retry after a timeout must reuse the original key, not create a new debit.
    const retry = getOrCreateShopOperationId({ ...options, randomUUID: () => 'unexpected-new-key' });
    assert.equal(retry, first);
    assert.equal(generated, 1);

    // Simulate a reload: persisted storage still restores the same key.
    clearShopOperationId(options);
    const reloaded = getOrCreateShopOperationId({ ...options, randomUUID: () => 'uuid-after-reload' });
    assert.equal(reloaded, 'shop_uuid-after-reload');
});

test('operation IDs are scoped independently by account and item', () => {
    const storage = memoryStorage();
    const ids = [
        getOrCreateShopOperationId({ uid: 'alice', itemId: 'theme_neon', storage, randomUUID: () => 'uuid-alice-theme' }),
        getOrCreateShopOperationId({ uid: 'alice', itemId: 'frame_gold', storage, randomUUID: () => 'uuid-alice-frame' }),
        getOrCreateShopOperationId({ uid: 'bob', itemId: 'theme_neon', storage, randomUUID: () => 'uuid-bob-theme' })
    ];
    assert.equal(new Set(ids).size, 3);
});

test('invalid stored IDs are replaced and a confirmed receipt clears the pending key', () => {
    const storage = memoryStorage();
    const options = {
        uid: 'player-2', itemId: 'particles_gold', storage,
        randomUUID: () => 'safe-generated-id'
    };
    const key = 'quizhub:shop:pending:player-2:particles_gold';
    storage.setItem(key, '../invalid');
    const id = getOrCreateShopOperationId(options);
    assert.equal(id, 'shop_safe-generated-id');
    assert.equal(storage.getItem(key), id);

    clearShopOperationId(options);
    assert.equal(storage.getItem(key), null);
    assert.equal(getOrCreateShopOperationId({ ...options, randomUUID: () => 'after-confirmation' }), 'shop_after-confirmation');
});

test('storage failures fall back to a stable in-memory operation ID', () => {
    const storage = {
        getItem() { throw new Error('storage disabled'); },
        setItem() { throw new Error('storage disabled'); },
        removeItem() { throw new Error('storage disabled'); }
    };
    const options = { uid: 'player-3', itemId: 'frame_gold', storage, randomUUID: () => 'fallback-id-123' };
    const first = getOrCreateShopOperationId(options);
    const retry = getOrCreateShopOperationId({ ...options, randomUUID: () => 'should-not-be-used' });
    assert.equal(first, retry);
    clearShopOperationId(options);
});
