import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { directChatId } from '../server/chat-messages.mjs';

const project='demo-quizhub';
const callable=`http://127.0.0.1:5001/${project}/europe-west1/chatReactionPreviewCallable`;
const authBase='http://127.0.0.1:9099';
async function register(suffix,name){
    const response=await fetch(`${authBase}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-key`,{
        method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({email:`reaction-${name}-${suffix}@example.test`,password:'TestPassword!123',returnSecureToken:true})
    });
    const body=await response.json();assert.equal(response.status,200,JSON.stringify(body));
    return {uid:body.localId,token:body.idToken};
}
async function invoke(user,data){
    const headers={'content-type':'application/json'};if(user)headers.authorization='Bearer '+user.token;
    const response=await fetch(callable,{method:'POST',headers,body:JSON.stringify({data})});
    return {status:response.status,body:await response.json()};
}
test('CHAT-04 reactions are participant-only, toggle idempotently and reject deleted messages',{timeout:60000},async()=>{
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST);
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
    assert.equal(process.env.GCLOUD_PROJECT||process.env.GOOGLE_CLOUD_PROJECT,project);
    const app=initializeApp({projectId:project},'chat-reactions-'+randomUUID());
    const db=getFirestore(app),adminAuth=getAuth(app),suffix=randomUUID().replaceAll('-','').slice(0,12);
    let alice,bob,charlie,chatId;
    try{
        [alice,bob,charlie]=await Promise.all([register(suffix,'alice'),register(suffix,'bob'),register(suffix,'charlie')]);
        chatId=directChatId(alice.uid,bob.uid);
        const chatRef=db.collection('chats').doc(chatId);
        const messageId='message_'+randomUUID().replaceAll('-','');
        await chatRef.set({participants:[alice.uid,bob.uid].sort()});
        const messageRef=chatRef.collection('messages').doc(messageId);
        await messageRef.set({senderId:alice.uid,recipientId:bob.uid,text:'hello',createdAt:new Date(),edited:false,deleted:false,reactions:{}});
        const base={chatId,messageId,reactionType:'love'};
        const forged=await invoke(charlie,{...base,actorUid:alice.uid});
        assert.equal(forged.body.error?.status,'INVALID_ARGUMENT');
        const stranger=await invoke(charlie,base);
        assert.equal(stranger.body.error?.status,'PERMISSION_DENIED');

        const first=await invoke(alice,base);
        assert.equal(first.status,200,JSON.stringify(first.body));
        assert.equal(first.body.result.status,'added');
        const second=await invoke(bob,base);
        assert.equal(second.body.result.status,'added');
        let stored=(await messageRef.get()).data();
        assert.deepEqual(stored.reactions.love.sort(),[alice.uid,bob.uid].sort());

        const historyUrl=`http://127.0.0.1:5001/${project}/europe-west1/chatHistoryPreviewCallable`;
        const historyResponse=await fetch(historyUrl,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+alice.token},body:JSON.stringify({data:{chatId}})});
        const history=await historyResponse.json();
        assert.equal(historyResponse.status,200,JSON.stringify(history));
        const projected=history.result.messages.find(x=>x.id===messageId);
        assert.deepEqual(projected.reactions,{love:{count:2,reactedByMe:true}});

        const remove=await invoke(alice,base);
        assert.equal(remove.body.result.status,'removed');
        stored=(await messageRef.get()).data();
        assert.deepEqual(stored.reactions.love,[bob.uid]);

        await messageRef.update({deleted:true,text:null});
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
