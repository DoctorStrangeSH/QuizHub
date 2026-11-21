import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { directChatId } from '../server/chat-messages.mjs';

const project='demo-quizhub';
const callable=`http://127.0.0.1:5001/${project}/europe-west1/chatHistoryPreviewCallable`;
const readCallable=`http://127.0.0.1:5001/${project}/europe-west1/chatReadReceiptPreviewCallable`;
const authBase='http://127.0.0.1:9099';
async function register(suffix,name){
    const response=await fetch(`${authBase}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-key`,{
        method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({email:`history-${name}-${suffix}@example.test`,password:'TestPassword!123',returnSecureToken:true})
    });
    const body=await response.json();assert.equal(response.status,200,JSON.stringify(body));
    return {uid:body.localId,token:body.idToken};
}
async function invokeAt(url,user,data){
    const headers={'content-type':'application/json'};if(user)headers.authorization='Bearer '+user.token;
    const response=await fetch(url,{method:'POST',headers,body:JSON.stringify({data})});
    return {status:response.status,body:await response.json()};
}
const invoke=(user,data)=>invokeAt(callable,user,data);
const markRead=(user,data)=>invokeAt(readCallable,user,data);
test('CHAT-02 history is readable only by the two chat participants and paginates safely',{timeout:60000},async()=>{
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST);
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
    assert.equal(process.env.GCLOUD_PROJECT||process.env.GOOGLE_CLOUD_PROJECT,project);
    const app=initializeApp({projectId:project},'chat-history-'+randomUUID());
    const db=getFirestore(app),adminAuth=getAuth(app),suffix=randomUUID().replaceAll('-','').slice(0,12);
    let alice,bob,charlie;
    try{
        [alice,bob,charlie]=await Promise.all([register(suffix,'alice'),register(suffix,'bob'),register(suffix,'charlie')]);
        const chatId=directChatId(alice.uid,bob.uid),chatRef=db.collection('chats').doc(chatId);
        await chatRef.set({participants:[alice.uid,bob.uid].sort(),createdAt:new Date(),updatedAt:new Date()});
        const batch=db.batch();
        for(let i=1;i<=3;i++){
            const id='message_'+String(i).padStart(16,'0');
            batch.set(chatRef.collection('messages').doc(id),{
                senderId:i%2?alice.uid:bob.uid,recipientId:i%2?bob.uid:alice.uid,
                text:'message '+i,createdAt:new Date(1700000000000+i*1000),
                edited:false,deleted:false,reactions:{}
            });
        }
        await batch.commit();
        const readByBob=await markRead(bob,{chatId,upToMessageId:'message_000000000001'});
        assert.equal(readByBob.status,200,JSON.stringify(readByBob.body));
        const first=await invoke(alice,{chatId,pageSize:2});
        assert.equal(first.status,200,JSON.stringify(first.body));
        assert.equal(first.body.result.messages.length,2);
        assert.ok(first.body.result.nextCursor);
        assert.equal(first.body.result.peerUid,bob.uid);
        assert.deepEqual(first.body.result.messages[0].reactions, {});
        assert.equal(first.body.result.messages[0].readByRecipient,false);
        assert.equal(first.body.result.messages[1].readByRecipient,true);
        assert.equal(JSON.stringify(first.body.result.messages[0].reactions).includes(alice.uid), false);
        const second=await invoke(bob,{chatId,pageSize:2,cursorMessageId:first.body.result.nextCursor});
        assert.equal(second.status,200,JSON.stringify(second.body));
        assert.equal(second.body.result.messages.length,1);
        const stranger=await invoke(charlie,{chatId});
        assert.equal(stranger.body.error?.status,'PERMISSION_DENIED');
        const forged=await invoke(alice,{chatId,actorUid:charlie.uid});
        assert.equal(forged.body.error?.status,'INVALID_ARGUMENT');
        const guest=await invoke(null,{chatId});
        assert.equal(guest.body.error?.status,'UNAUTHENTICATED');
    }finally{
        const chatId=alice&&bob?directChatId(alice.uid,bob.uid):null;
        if(chatId){
            const messages=await db.collection('chats').doc(chatId).collection('messages').get().catch(()=>null);
            if(messages){const batch=db.batch();messages.docs.forEach(doc=>batch.delete(doc.ref));await batch.commit().catch(()=>{});}
            await db.collection('chats').doc(chatId).delete().catch(()=>{});
        }
        for(const user of [alice,bob,charlie]){
            if(user)await adminAuth.deleteUser(user.uid).catch(()=>{});
        }
        await db.terminate();await deleteApp(app);
    }
});
