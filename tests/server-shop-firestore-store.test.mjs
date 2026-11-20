import test from 'node:test';
import assert from 'node:assert/strict';
import { createShopFirestoreStore } from '../server/shop-firestore-store.mjs';
import { createShopPurchaseService } from '../server/shop-purchase-service.mjs';

function fakeFirestore() {
    const records = new Map();
    const paths = [];
    let queue = Promise.resolve();
    const ref = path => ({
        path,
        collection(name) { return { doc: id => ref(path + '/' + name + '/' + id) }; }
    });
    const db = {
        records, paths,
        collection: name => ({ doc: id => ref(name + '/' + id) }),
        runTransaction(callback) {
            const task = queue.then(async () => {
                const writes = [];
                let wrote = false;
                const tx = {
                    async get(document) {
                        assert.equal(wrote, false, 'all Firestore transaction reads must precede writes');
                        paths.push(document.path);
                        return { exists: records.has(document.path), data: () => structuredClone(records.get(document.path)) };
                    },
                    create(document, value) {
                        wrote = true;
                        writes.push(() => {
                            assert.equal(records.has(document.path), false, 'purchase receipt must be created once');
                            records.set(document.path, structuredClone(value));
                        });
                    },
                    update(document, patch) {
                        wrote = true;
                        writes.push(() => {
                            const current = records.get(document.path);
                            assert.ok(current, 'update target must exist');
                            records.set(document.path, { ...current, ...structuredClone(patch) });
                        });
                    },
                    create(document, value) {
                        wrote = true;
                        writes.push(() => {
                            assert.equal(records.has(document.path), false, 'purchase receipt must be created once');
                            records.set(document.path, structuredClone(value));
                        });
                    }
                };
                const result = await callback(tx);
                writes.forEach(write => write());
                return result;
            });
            queue = task.catch(() => {});
            return task;
        }
    };
    return db;
}

test('Firestore adapter atomically stores cosmetic debit, ownership and idempotency receipt', async () => {
    const db = fakeFirestore();
    db.records.set('users/alice', { coins: 600, ownedFrames: ['frame_default'], email: 'private@example.test' });
    const store = createShopFirestoreStore(db);
    const service = createShopPurchaseService({ store, now: () => 1000 });
    const receipt = await service.purchase({
        uid: 'alice', itemId: 'frame_gold', operationId: 'purchase_req_0001'
    });
    assert.equal(receipt.balance, 300);
    assert.equal(db.records.get('users/alice').coins, 300);
    assert.deepEqual(db.records.get('users/alice').ownedFrames, ['frame_default', 'frame_gold']);
    assert.equal(db.records.get('users/alice').email, 'private@example.test');
    assert.equal(db.records.has('shopPurchaseRequests/alice/requests/purchase_req_0001'), true);
    const before = db.records.get('users/alice').coins;
    const retry = await service.purchase({
        uid: 'alice', itemId: 'frame_gold', operationId: 'purchase_req_0001'
    });
    assert.equal(retry.alreadyPurchased, true);
    assert.equal(db.records.get('users/alice').coins, before);
});

test('Firestore adapter validates owner and operation document paths', async () => {
    const db = fakeFirestore();
    const store = createShopFirestoreStore(db);
    await assert.rejects(store.runTransaction(tx => tx.getPurchase('../other', 'purchase_req_0001')), /INVALID_STORAGE_UID/);
    await assert.rejects(store.runTransaction(tx => tx.getPurchase('alice', '../other')), /INVALID_STORAGE_OPERATION_ID/);
    await assert.rejects(store.runTransaction(tx => tx.setPurchase('alice', 'purchase_req_0001', {})), /native\.create is not a function/);
});
