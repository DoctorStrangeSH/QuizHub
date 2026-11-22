import { getAllItems } from '../app/modules/shop/shop-data.js';
import { createAccountLedgerEntry } from './account-ledger-entry.mjs';

const OPERATION_ID = /^[A-Za-z0-9_-]{8,128}$/;
const COSMETIC_FIELDS = Object.freeze({
    theme: ['ownedThemes', 'equippedTheme'],
    frame: ['ownedFrames', 'equippedFrame'],
    particles: ['ownedParticles', 'equippedParticles']
});

function validBalance(value) {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('INVALID_USER_BALANCE');
    return value;
}

export function createShopPurchaseService({ store, catalog = getAllItems(), now = () => Date.now() }) {
    if (!store || typeof store.runTransaction !== 'function') throw new Error('INVALID_SHOP_STORE');
    if (!Array.isArray(catalog)) throw new Error('INVALID_SHOP_CATALOG');
    const items = new Map(catalog.map(item => [item.id, item]));
    if (items.size !== catalog.length || catalog.some(item =>
        !item || typeof item.id !== 'string' || !Number.isSafeInteger(item.price) || item.price < 0
    )) throw new Error('INVALID_SHOP_CATALOG');

    return {
        async purchase({ uid, itemId, operationId }) {
            if (typeof uid !== 'string' || !uid.trim()) throw new Error('AUTH_REQUIRED');
            if (typeof itemId !== 'string' || !itemId) throw new Error('INVALID_ITEM');
            if (typeof operationId !== 'string' || !OPERATION_ID.test(operationId)) {
                throw new Error('INVALID_OPERATION_ID');
            }
            const item = items.get(itemId);
            if (!item) throw new Error('SHOP_ITEM_NOT_FOUND');
            const timestamp = now();
            if (!Number.isSafeInteger(timestamp) || timestamp < 0) throw new Error('INVALID_SERVER_TIME');

            return store.runTransaction(async tx => {
                const previous = await tx.getPurchase(uid, operationId);
                if (previous) {
                    if (previous.itemId !== itemId) throw new Error('IDEMPOTENCY_KEY_REUSED');
                    return { ...previous, alreadyPurchased: true };
                }
                const user = await tx.getUser(uid);
                if (!user) throw new Error('USER_NOT_FOUND');
                const balance = validBalance(user.coins ?? 0);
                if (balance < item.price) throw new Error('INSUFFICIENT_COINS');

                let patch;
                let receipt;
                if (item.type === 'bonus') {
                    if (typeof item.effect !== 'string' || !Number.isSafeInteger(item.duration) || item.duration < 0) {
                        throw new Error('INVALID_SHOP_CATALOG');
                    }
                    const activeBonuses = user.activeBonuses && typeof user.activeBonuses === 'object'
                        && !Array.isArray(user.activeBonuses) ? { ...user.activeBonuses } : {};
                    const activeUntil = activeBonuses[item.effect];
                    if (Number.isSafeInteger(activeUntil) && activeUntil > timestamp) {
                        throw new Error('BONUS_ALREADY_ACTIVE');
                    }
                    activeBonuses[item.effect] = timestamp + item.duration * 1000;
                    if (!Number.isSafeInteger(activeBonuses[item.effect])) throw new Error('INVALID_BONUS_EXPIRY');
                    patch = { coins: balance - item.price, activeBonuses };
                    receipt = { uid, operationId, itemId, kind: 'bonus', coinsSpent: item.price, balance: patch.coins, expiresAt: activeBonuses[item.effect] };
                } else {
                    const fields = COSMETIC_FIELDS[item.type];
                    if (!fields) throw new Error('UNSUPPORTED_SHOP_ITEM');
                    const [ownedField, equippedField] = fields;
                    const owned = Array.isArray(user[ownedField]) ? [...user[ownedField]] : [];
                    if (owned.includes(item.id) || item.owned === true) throw new Error('ITEM_ALREADY_OWNED');
                    owned.push(item.id);
                    patch = { coins: balance - item.price, [ownedField]: owned, [equippedField]: item.id };
                    receipt = { uid, operationId, itemId, kind: item.type, coinsSpent: item.price, balance: patch.coins };
                }

                await tx.setUserPatch(uid, patch);
                await tx.setPurchase(uid, operationId, receipt);
                await tx.createLedgerEntry(createAccountLedgerEntry({
                    uid, type: 'shop_purchase', sourceId: operationId, occurredAt: timestamp,
                    coinsDelta: -item.price, itemId: item.id
                }));
                return { ...receipt, alreadyPurchased: false };
            });
        },

        async equip({ uid, itemId }) {
            if (typeof uid !== 'string' || !uid.trim()) throw new Error('AUTH_REQUIRED');
            if (typeof itemId !== 'string' || !itemId) throw new Error('INVALID_ITEM');
            const item = items.get(itemId);
            if (!item) throw new Error('SHOP_ITEM_NOT_FOUND');
            const fields = COSMETIC_FIELDS[item.type];
            if (!fields) throw new Error('UNSUPPORTED_SHOP_ITEM');
            const [ownedField, equippedField] = fields;
            return store.runTransaction(async tx => {
                const user = await tx.getUser(uid);
                if (!user) throw new Error('USER_NOT_FOUND');
                const owned = Array.isArray(user[ownedField]) ? user[ownedField] : [];
                if (!owned.includes(item.id) && item.owned !== true) {
                    throw new Error('ITEM_NOT_OWNED');
                }
                await tx.setUserPatch(uid, { [equippedField]: item.id });
                return { itemId: item.id, type: item.type, equipped: true };
            });
        }
    };
}
