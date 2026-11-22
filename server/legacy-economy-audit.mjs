const INVENTORY_FIELDS = Object.freeze(['ownedThemes', 'ownedFrames', 'ownedParticles']);
const EQUIPPED_FIELDS = Object.freeze([['equippedTheme','ownedThemes'],['equippedFrame','ownedFrames'],['equippedParticles','ownedParticles']]);
const ITEM_ID = /^[A-Za-z0-9_-]{1,80}$/;
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Read-only audit. Legacy balances and ownership were historically client-writable. */
export function auditLegacyEconomyProfile({ uid, profile, purchaseReceipts = null } = {}) {
    if (typeof uid !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) throw new Error('INVALID_AUDIT_UID');
    if (!isRecord(profile)) throw new Error('INVALID_LEGACY_PROFILE');
    const anomalies = [];
    const warnings = [{code:'LEGACY_ECONOMY_FIELDS_ARE_NOT_TRUSTED_PROVENANCE'},{code:'PURCHASE_RECEIPTS_REQUIRE_INDEPENDENT_VERIFICATION'}];
    const blockers = ['LEGACY_PROFILE_FIELDS_ARE_NOT_TRUSTED_PROVENANCE','PRODUCTION_BACKUP_AND_LIVE_INVENTORY_NOT_VERIFIED','OWNER_APPROVAL_REQUIRED_BEFORE_IMPORT'];
    const coins = profile.coins === undefined ? null : profile.coins;
    if (coins !== null && (!Number.isSafeInteger(coins) || coins < 0)) anomalies.push({code:'INVALID_LEGACY_COIN_BALANCE',path:'coins'});
    const inventory = {};
    for (const field of INVENTORY_FIELDS) {
        const value = profile[field];
        if (value === undefined) { inventory[field] = null; continue; }
        if (!Array.isArray(value) || value.some(id => typeof id !== 'string' || !ITEM_ID.test(id))) {
            anomalies.push({code:'INVALID_LEGACY_INVENTORY',path:field}); inventory[field] = null; continue;
        }
        const unique = [...new Set(value)];
        if (unique.length !== value.length) anomalies.push({code:'DUPLICATE_OWNED_ITEM_IDS',path:field,count:value.length-unique.length});
        inventory[field] = unique;
    }
    const equipped = {};
    for (const [field, ownedField] of EQUIPPED_FIELDS) {
        const value = profile[field];
        if (value === undefined || value === null || value === '') { equipped[field] = value ?? null; continue; }
        if (typeof value !== 'string' || !ITEM_ID.test(value)) { anomalies.push({code:'INVALID_EQUIPPED_ITEM_ID',path:field}); equipped[field] = null; continue; }
        equipped[field] = value;
        if (inventory[ownedField] && !inventory[ownedField].includes(value)) anomalies.push({code:'EQUIPPED_ITEM_NOT_IN_OWNED_INVENTORY',path:field,ownedField});
        if (inventory[ownedField] === null) warnings.push({code:'OWNED_INVENTORY_MISSING_FOR_EQUIPPED_ITEM',path:field,ownedField});
    }
    if (profile.activeBonuses !== undefined) {
        if (!Array.isArray(profile.activeBonuses) && !isRecord(profile.activeBonuses)) anomalies.push({code:'INVALID_ACTIVE_BONUSES_SHAPE',path:'activeBonuses'});
        else warnings.push({code:'ACTIVE_BONUS_SEMANTICS_REQUIRE_CATALOG_REVIEW',action:'Preserve legacy bonus data as-is; do not infer expiry, value or trusted entitlement.'});
    }
    let receipts = null;
    if (purchaseReceipts !== null) {
        if (!Array.isArray(purchaseReceipts)) anomalies.push({code:'INVALID_PURCHASE_RECEIPTS_SNAPSHOT',path:'shopPurchaseRequests'});
        else {
            const seen = new Set();
            receipts = purchaseReceipts.map((receipt,index) => {
                if (!isRecord(receipt) || typeof receipt.operationId !== 'string' || !/^[A-Za-z0-9_-]{8,128}$/.test(receipt.operationId) || seen.has(receipt.operationId)) {
                    anomalies.push({code:'INVALID_OR_DUPLICATE_PURCHASE_RECEIPT',index}); return {valid:false};
                }
                seen.add(receipt.operationId);
                return {valid:true,operationId:receipt.operationId,itemId:typeof receipt.itemId==='string'&&ITEM_ID.test(receipt.itemId)?receipt.itemId:null,status:typeof receipt.status==='string'?receipt.status:null};
            });
        }
    } else warnings.push({code:'NO_PURCHASE_RECEIPT_SNAPSHOT'});
    return {
        schemaVersion:1,uid,status:'review_required',eligibleForAutomaticImport:false,
        observedCoins:Number.isSafeInteger(coins)&&coins>=0?coins:null,inventory,equipped,
        receiptSummary:receipts===null?null:{count:receipts.length,validCount:receipts.filter(x=>x.valid).length,invalidCount:receipts.filter(x=>!x.valid).length},
        receiptReferences:receipts,blockers,anomalies,warnings
    };
}
