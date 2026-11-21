import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { directChatId } from '../server/chat-messages.mjs';

const project='demo-quizhub';
const callable=`http://127.0.0.1:5001/${project}/europe-west1/chatReadReceiptPreviewCallable`;
const unreadCallable=`http://127.0.0.1:5001/${project}/europe-west1/chatUnreadCountPreviewCallable`;
const authBase='http://127.0.0.1:9099';
async function register(suffix,name){
    const response=await fetch(`${authBase}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-key`,{
        method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({email:`receipt-${name}-${suffix}@example.test`,password:'TestPassword!123',returnSecureToken:true})
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
const unread=(user,data)=>invokeAt(unreadCallable,user,data);
test('CHAT-05 read receipts are participant-only, monotonic and idempotent',{timeout:60000},async()=>{
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST);
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
    assert.equal(process.env.GCLOUD_PROJECT||process.env.GOOGLE_CLOUD_PROJECT,project);
    const app=initializeApp({projectId:project},'chat-receipts-'+randomUUID());
    const db=getFirestore(app),adminAuth=getAuth(app),suffix=randomUUID().replaceAll('-','').slice(0,12);
    let alice,bob,charlie,chatId;
    try{
        [alice,bob,charlie]=await Promise.all([register(suffix,'alice'),register(suffix,'bob'),register(suffix,'charlie')]);
        chatId=directChatId(alice.uid,bob.uid);
        const chatRef=db.collection('chats').doc(chatId);
        const firstId='message_'+randomUUID().replaceAll('-','');
        const secondId='message_'+randomUUID().replaceAll('-','');
        const firstRef=chatRef.collection('messages').doc(firstId);
        const secondRef=chatRef.collection('messages').doc(secondId);
        await chatRef.set({participants:[alice.uid,bob.uid].sort()});
        await firstRef.set({senderId:bob.uid,recipientId:alice.uid,text:'first',createdAt:new Date(1000),deleted:false});
        await secondRef.set({senderId:bob.uid,recipientId:alice.uid,text:'second',createdAt:new Date(2000),deleted:false});
        const base={chatId,upToMessageId:secondId};
        const initialUnread=await unread(alice,{chatId});
        assert.equal(initialUnread.status,200,JSON.stringify(initialUnread.body));
        assert.equal(initialUnread.body.result.unreadCount,2);
        const forged=await invoke(charlie,{...base,actorUid:alice.uid});
        assert.equal(forged.body.error?.status,'INVALID_ARGUMENT');
        const stranger=await invoke(charlie,base);
        assert.equal(stranger.body.error?.status,'PERMISSION_DENIED');
        const strangerCount=await unread(charlie,{chatId});
        assert.equal(strangerCount.body.error?.status,'PERMISSION_DENIED');
        const outgoing=await invoke(bob,{...base,upToMessageId:firstId});
        assert.equal(outgoing.body.error?.status,'FAILED_PRECONDITION');
        const firstRead=await invoke(alice,{chatId,upToMessageId:firstId});
        assert.equal(firstRead.status,200,JSON.stringify(firstRead.body));
        const oneUnread=await unread(alice,{chatId});
        assert.equal(oneUnread.body.result.unreadCount,1);
        const first=await invoke(alice,base);
        assert.equal(first.status,200,JSON.stringify(first.body));
        assert.equal(first.body.result.status,'updated');
        assert.equal(first.body.result.lastReadMessageId,secondId);
        const zeroUnread=await unread(alice,{chatId});
        assert.equal(zeroUnread.body.result.unreadCount,0);
        const again=await invoke(alice,base);
        assert.equal(again.body.result.status,'unchanged');
        const older=await invoke(alice,{...base,upToMessageId:firstId});
        assert.equal(older.body.result.status,'unchanged');
        const stored=(await chatRef.get()).data();
        assert.equal(stored.readReceipts[alice.uid].lastReadMessageId,secondId);
        assert.equal(stored.readReceipts[bob.uid],undefined);
        await secondRef.update({deleted:true});
        const deleted=await invoke(alice,base);
        assert.equal(deleted.body.error?.status,'FAILED_PRECONDITION');
        const anonymous=await invoke(null,base);
        assert.equal(anonymous.body.error?.status,'UNAUTHENTICATED');
    }finally{
        if(chatId){
            const messages=await db.collection('chats').doc(chatId).collection('messages').get().catch(()=>null);
            if(messages){const batch=db.batch();messages.docs.forEach(doc=>batch.delete(doc.ref));await batch.commit().catch(()=>{});}
            await db.collection('chats').doc(chatId).delete().catch(()=>{});
        }
        for(const user of [alice,bob,charlie])if(user)await adminAuth.deleteUser(user.uid).catch(()=>{});
        await db.terminate();await deleteApp(app);
    }
});
