import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { createAccountLedgerEntry } from '../server/account-ledger-entry.mjs';

const project='demo-quizhub';
const callable=`http://127.0.0.1:5001/${project}/europe-west1/accountLedgerHistoryPreviewCallable`;
const authBase='http://127.0.0.1:9099';
async function register(suffix){
    const response=await fetch(`${authBase}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-key`,{
        method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({email:`ledger-history-${suffix}@example.test`,password:'TestPassword!123',returnSecureToken:true})
    });
    const body=await response.json();assert.equal(response.status,200,JSON.stringify(body));
    return {uid:body.localId,token:body.idToken};
}
async function invoke(user,data){
    const headers={'content-type':'application/json'};if(user)headers.authorization='Bearer '+user.token;
    const response=await fetch(callable,{method:'POST',headers,body:JSON.stringify({data})});
    return {status:response.status,body:await response.json()};
}
test('account ledger history callable is owner-scoped, filtered and cursor-paginated',{timeout:60000},async()=>{
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST);
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
    assert.equal(process.env.GCLOUD_PROJECT||process.env.GOOGLE_CLOUD_PROJECT,project);
    const app=initializeApp({projectId:project},'ledger-history-'+randomUUID());
    const db=getFirestore(app),adminAuth=getAuth(app),suffix=randomUUID().replaceAll('-','').slice(0,12);
    let alice,bob;
    try{
        [alice,bob]=await Promise.all([register('alice-'+suffix),register('bob-'+suffix)]);
        const write=async(user,sourceId,occurredAt,type='quiz_reward')=>{
            const entry=createAccountLedgerEntry({
                uid:user.uid,type,sourceId,occurredAt,
                coinsDelta:type==='shop_purchase'?-50:10,
                xpDelta:type==='shop_purchase'?0:20,
                ...(type==='shop_purchase'?{itemId:'frame_gold'}:{})
            });
            await db.collection('accountLedger').doc(user.uid).collection('entries').doc(entry.entryId).create(entry);
            return entry;
        };
        const a=await write(alice,'session_0001',1000);
        const b=await write(alice,'session_0002',1000);
        const c=await write(alice,'purchase_0001',900,'shop_purchase');
        await write(bob,'foreign_session',2000);
        const first=await invoke(alice,{pageSize:2});
        assert.equal(first.status,200,JSON.stringify(first.body));
        assert.equal(first.body.result.entries.length,2);
        assert.ok(first.body.result.nextCursor);
        assert.deepEqual(new Set(first.body.result.entries.map(x=>x.entryId)),new Set([a.entryId,b.entryId]));
        assert.equal(JSON.stringify(first.body.result).includes(bob.uid),false);
        const second=await invoke(alice,{pageSize:2,cursor:first.body.result.nextCursor});
        assert.equal(second.status,200,JSON.stringify(second.body));
        assert.deepEqual(second.body.result.entries.map(x=>x.entryId),[c.entryId]);
        assert.equal(second.body.result.nextCursor,null);
        const filtered=await invoke(alice,{type:'shop_purchase'});
        assert.equal(filtered.status,200,JSON.stringify(filtered.body));
        assert.deepEqual(filtered.body.result.entries.map(x=>x.type),['shop_purchase']);
        const forged=await invoke(alice,{uid:bob.uid});
        assert.equal(forged.body.error?.status,'INVALID_ARGUMENT');
        const stranger=await invoke(bob,{pageSize:10});
        assert.equal(stranger.status,200);
        assert.deepEqual(stranger.body.result.entries.map(x=>x.sourceId),['foreign_session']);
        const guest=await invoke(null,{});
        assert.equal(guest.body.error?.status,'UNAUTHENTICATED');
    }finally{
        for(const user of [alice,bob]){
            if(user){
                const entries=await db.collection('accountLedger').doc(user.uid).collection('entries').get().catch(()=>null);
                if(entries){const batch=db.batch();entries.docs.forEach(doc=>batch.delete(doc.ref));await batch.commit().catch(()=>{});}
                await adminAuth.deleteUser(user.uid).catch(()=>{});
            }
        }
        await db.terminate();await deleteApp(app);
    }
});
