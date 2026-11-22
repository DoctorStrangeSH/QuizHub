import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccountLedgerEntry } from '../server/account-ledger-entry.mjs';
import { readAccountLedgerHistory } from '../server/account-ledger-history.mjs';

const uid = 'alice';
function fixture(entries = []) {
    const docs = new Map(entries.map(entry => [entry.entryId, entry]));
    const queryCalls = [];
    const db = {
        collection(name) {
            assert.equal(name, 'accountLedger');
            return { doc(owner) {
                queryCalls.push({ owner });
                return { collection(sub) {
                    assert.equal(sub, 'entries');
                    return {
                        where(field, op, value) {
                            queryCalls.push({ field, op, value });
                            return this;
                        },
                        orderBy(field, direction) {
                            queryCalls.push({ field, direction });
                            return this;
                        },
                        startAfter(occurredAt, entryId) {
                            queryCalls.push({ occurredAt, entryId });
                            this.cursor = { occurredAt, entryId };
                            return this;
                        },
                        limit(size) {
                            return { async get() {
                                let values = [...docs.values()];
                                const typeFilter = queryCalls.findLast(x => x.field === 'type')?.value;
                                if (typeFilter) values = values.filter(x => x.type === typeFilter);
                                values.sort((a,b) => b.occurredAt-a.occurredAt || b.entryId.localeCompare(a.entryId));
                                if (this.cursor) values = values.filter(x =>
                                    x.occurredAt < this.cursor.occurredAt ||
                                    (x.occurredAt === this.cursor.occurredAt && x.entryId < this.cursor.entryId));
                                return { docs: values.slice(0,size).map(value => ({ id:value.entryId, data:()=>value })) };
                            }};
                        }
                    };
                }};
            }};
        }
    };
    return { db, docs, queryCalls };
}
const event=(sourceId,occurredAt,type='quiz_reward',deltas={})=>createAccountLedgerEntry({
    uid,type,sourceId,occurredAt,coinsDelta:deltas.coinsDelta??10,xpDelta:deltas.xpDelta??20,
    ...(type==='achievement_unlock'?{achievementId:'first_quiz'}:{}),
    ...(type==='shop_purchase'?{coinsDelta:-50,xpDelta:0,itemId:'frame_gold'}:{})
});

test('reads only the authenticated owner path and paginates deterministically across equal timestamps',async()=>{
    const a=event('session_01',1000),b=event('session_02',1000),c=event('session_03',900);
    const {db,queryCalls}=fixture([a,b,c]);
    const first=await readAccountLedgerHistory(db,{actorUid:uid,pageSize:2});
    assert.equal(queryCalls[0].owner,uid);
    assert.deepEqual(first.entries.map(x=>x.entryId),[a.entryId,b.entryId].sort((x,y)=>y.localeCompare(x)));
    assert.ok(first.nextCursor);
    const second=await readAccountLedgerHistory(db,{actorUid:uid,pageSize:2,cursor:first.nextCursor});
    assert.deepEqual(second.entries.map(x=>x.entryId),[c.entryId]);
    assert.equal(second.nextCursor,null);
});

test('filters by event type and binds the cursor to the same filter',async()=>{
    const quiz=event('session_01',3000);
    const shop=event('purchase_01',2000,'shop_purchase');
    const {db}=fixture([quiz,shop]);
    const page=await readAccountLedgerHistory(db,{actorUid:uid,type:'shop_purchase'});
    assert.deepEqual(page.entries.map(x=>x.type),['shop_purchase']);
    await assert.rejects(readAccountLedgerHistory(db,{actorUid:uid,type:'quiz_reward',cursor:page.nextCursor}),/INVALID_LEDGER_CURSOR/);
});

test('empty history returns an empty page and null cursor',async()=>{
    const {db}=fixture([]);
    assert.deepEqual(await readAccountLedgerHistory(db,{actorUid:uid}),{entries:[],nextCursor:null});
});

test('rejects forged owner, malformed cursor, invalid page size and corrupt documents',async()=>{
    const {db}=fixture([event('session_01',1)]);
    await assert.rejects(readAccountLedgerHistory(db,{actorUid:'../victim'}),/INVALID_LEDGER_OWNER/);
    await assert.rejects(readAccountLedgerHistory(db,{actorUid:uid,pageSize:51}),/INVALID_LEDGER_PAGE_SIZE/);
    await assert.rejects(readAccountLedgerHistory(db,{actorUid:uid,cursor:'not-a-cursor'}),/INVALID_LEDGER_CURSOR/);
    const corrupt={...event('session_02',2),uid:'mallory'};
    const broken=fixture([corrupt]);
    await assert.rejects(readAccountLedgerHistory(broken.db,{actorUid:uid}),/LEDGER_OWNER_MISMATCH/);
});
