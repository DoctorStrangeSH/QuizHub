import test from 'node:test';
import assert from 'node:assert/strict';
import { createShopPurchaseService } from '../server/shop-purchase-service.mjs';

function makeStore(users) {
    const purchases = new Map();
    let queue = Promise.resolve();
    const store = {
        users: structuredClone(users),
        purchases,
        runTransaction(callback) {
            const task = queue.then(async () => {
                const writes = [];
                const tx = {
                    async getUser(uid) { return structuredClone(store.users[uid] ?? null); },
                    async getPurchase(uid, id) { return structuredClone(purchases.get(uid + '/' + id) ?? null); },
                    async setUserPatch(uid, patch) { writes.push(() => { store.users[uid] = { ...store.users[uid], ...structuredClone(patch) }; }); },
                    async setPurchase(uid, id, receipt) { writes.push(() => { purchases.set(uid + '/' + id, structuredClone(receipt)); }); }
                };
                const result = await callback(tx);
                writes.forEach(write => write());
                return result;
            });
            queue = task.catch(() => {});
            return task;
        }
    };
    return store;
}

const operationId = 'purchase_req_0001';

test('cosmetic purchase uses catalog price and updates ownership, equipment and balance atomically', async () => {
    const store = makeStore({ alice: { coins: 700, ownedThemes: ['theme_default'], email: 'private@example.test' } });
    const service = createShopPurchaseService({ store, now: () => 1000 });
    const receipt = await service.purchase({ uid: 'alice', itemId: 'theme_neon', operationId });
    assert.equal(receipt.coinsSpent, 500);
    assert.equal(receipt.balance, 200);
    assert.deepEqual(store.users.alice.ownedThemes, ['theme_default', 'theme_neon']);
    assert.equal(store.users.alice.equippedTheme, 'theme_neon');
    assert.equal(store.users.alice.email, 'private@example.test');
});

test('concurrent identical purchase retries charge once and return the stored receipt', async () => {
    const store = makeStore({ alice: { coins: 600, ownedFrames: ['frame_default'] } });
    const service = createShopPurchaseService({ store, now: () => 1000 });
    const [first, retry] = await Promise.all([
        service.purchase({ uid: 'alice', itemId: 'frame_gold', operationId }),
        service.purchase({ uid: 'alice', itemId: 'frame_gold', operationId })
    ]);
    assert.equal(first.coinsSpent, 300);
    assert.equal(first.balance, 300);
    assert.equal(first.alreadyPurchased, false);
    assert.equal(retry.alreadyPurchased, true);
    assert.equal(store.users.alice.coins, 300);
    assert.deepEqual(store.users.alice.ownedFrames, ['frame_default', 'frame_gold']);
});

test('idempotency key cannot be reused for a different item', async () => {
    const store = makeStore({ alice: { coins: 1000, ownedFrames: ['frame_default'] } });
    const service = createShopPurchaseService({ store, now: () => 1000 });
    await service.purchase({ uid: 'alice', itemId: 'frame_gold', operationId });
    await assert.rejects(service.purchase({ uid: 'alice', itemId: 'theme_neon', operationId }), /IDEMPOTENCY_KEY_REUSED/);
    assert.equal(store.users.alice.coins, 700);
});

test('insufficient balance and already-owned items do not mutate the profile', async () => {
    const store = makeStore({
        alice: { coins: 20, ownedThemes: ['theme_default'] },
        bob: { coins: 1000, ownedFrames: ['frame_default', 'frame_gold'] }
    });
    const service = createShopPurchaseService({ store, now: () => 1000 });
    await assert.rejects(service.purchase({ uid: 'alice', itemId: 'theme_neon', operationId }), /INSUFFICIENT_COINS/);
    await assert.rejects(service.purchase({ uid: 'bob', itemId: 'frame_gold', operationId: 'purchase_req_0002' }), /ITEM_ALREADY_OWNED/);
    assert.equal(store.users.alice.coins, 20);
    assert.equal(store.users.bob.coins, 1000);
});

test('bonus expiry is derived from server time and an active bonus cannot be purchased again', async () => {
    const store = makeStore({ alice: { coins: 500, activeBonuses: {} } });
    const service = createShopPurchaseService({ store, now: () => 10_000 });
    const receipt = await service.purchase({ uid: 'alice', itemId: 'bonus_xp_boost', operationId });
    assert.equal(receipt.expiresAt, 3_610_000);
    assert.equal(store.users.alice.activeBonuses.xp_boost, 3_610_000);
    await assert.rejects(
        service.purchase({ uid: 'alice', itemId: 'bonus_xp_boost', operationId: 'purchase_req_0002' }),
        /BONUS_ALREADY_ACTIVE/
    );
    assert.equal(store.users.alice.coins, 300);
});

test('client-supplied prices, unknown items and malformed operation IDs are not accepted', async () => {
    const store = makeStore({ alice: { coins: 5000 } });
    const service = createShopPurchaseService({ store, now: () => 1000 });
    await assert.rejects(service.purchase({ uid: 'alice', itemId: 'not-a-real-item', operationId }), /SHOP_ITEM_NOT_FOUND/);
    await assert.rejects(service.purchase({ uid: 'alice', itemId: 'theme_neon', operationId: 'x' }), /INVALID_OPERATION_ID/);
    assert.equal(store.users.alice.coins, 5000);
});

test('equipping requires server-confirmed ownership and never changes the coin balance', async () => {
    const store = makeStore({
        alice: { coins: 42, ownedThemes: ['theme_default', 'theme_neon'], equippedTheme: 'theme_default' },
        bob: { coins: 99, ownedFrames: ['frame_default'] }
    });
    const service = createShopPurchaseService({ store, now: () => 1000 });
    const receipt = await service.equip({ uid: 'alice', itemId: 'theme_neon' });
    assert.deepEqual(receipt, { itemId: 'theme_neon', type: 'theme', equipped: true });
    assert.equal(store.users.alice.equippedTheme, 'theme_neon');
    assert.equal(store.users.alice.coins, 42);
    await assert.rejects(service.equip({ uid: 'bob', itemId: 'theme_neon' }), /ITEM_NOT_OWNED/);
    await assert.rejects(service.equip({ uid: 'alice', itemId: 'bonus_xp_boost' }), /UNSUPPORTED_SHOP_ITEM/);
    assert.equal(store.users.bob.coins, 99);
});
