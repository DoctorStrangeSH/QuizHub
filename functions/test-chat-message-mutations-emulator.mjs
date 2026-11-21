import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { directChatId } from '../server/chat-messages.mjs';

const project='demo-quizhub';
const callable=`http://127.0.0.1:5001/${project}/europe-west1/chatMessageMutationPreviewCallable`;
const authBase='http://127.0.0.1:9099';
async function register(suffix,name){
    const response=await fetch(`${authBase}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-key`,{
        method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({email:`mutation-${name}-${suffix}@example.test`,password:'TestPassword!123',returnSecureToken:true})
    });
    const body=await response.json();assert.equal(response.status,200,JSON.stringify(body));
    return {uid:body.localId,token:body.idToken};
}
async function invoke(user,data){
    const headers={'content-type':'application/json'};if(user)headers.authorization='Bearer '+user.token;
    const response=await fetch(callable,{method:'POST',headers,body:JSON.stringify({data})});
    return {status:response.status,body:await response.json()};
}
test('CHAT-03 only message author can edit and delete, deletion clears body',{timeout:60000},async()=>{
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST);
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
    assert.equal(process.env.GCLOUD_PROJECT||process.env.GOOGLE_CLOUD_PROJECT,project);
    const app=initializeApp({projectId:project},'chat-mutation-'+randomUUID());
    const db=getFirestore(app),adminAuth=getAuth(app),suffix=randomUUID().replaceAll('-','').slice(0,12);
    let alice,bob,charlie;
    let chatId;
    try{
        [alice,bob,charlie]=await Promise.all([register(suffix,'alice'),register(suffix,'bob'),register(suffix,'charlie')]);
        chatId=directChatId(alice.uid,bob.uid);
        const chatRef=db.collection('chats').doc(chatId);
        const messageId='message_'+randomUUID().replaceAll('-','');
        await chatRef.set({participants:[alice.uid,bob.uid].sort(),lastMessageId:messageId,lastMessagePreview:'Original'});
        await chatRef.collection('messages').doc(messageId).set({
            senderId:alice.uid,recipientId:bob.uid,text:'Original',
            createdAt:new Date(),edited:false,deleted:false,reactions:{}
        });
        const base={chatId,messageId};
        const forged=await invoke(bob,{...base,operation:'delete',actorUid:alice.uid});
        assert.equal(forged.body.error?.status,'INVALID_ARGUMENT');
        const recipient=await invoke(bob,{...base,operation:'edit',text:'Hijack'});
        assert.equal(recipient.body.error?.status,'PERMISSION_DENIED');
        const stranger=await invoke(charlie,{...base,operation:'delete'});
        assert.equal(stranger.body.error?.status,'PERMISSION_DENIED');

        const edited=await invoke(alice,{...base,operation:'edit',text:'Edited by Alice'});
        assert.equal(edited.status,200,JSON.stringify(edited.body));
        assert.equal(edited.body.result.status,'updated');
        let message=(await chatRef.collection('messages').doc(messageId).get()).data();
        assert.equal(message.text,'Edited by Alice');
        assert.equal(message.edited,true);
        assert.equal((await chatRef.get()).data().lastMessagePreview,'Edited by Alice');

        const deleted=await invoke(alice,{...base,operation:'delete'});
        assert.equal(deleted.status,200,JSON.stringify(deleted.body));
        assert.equal(deleted.body.result.status,'deleted');
        message=(await chatRef.collection('messages').doc(messageId).get()).data();
        assert.equal(message.text,null);
        assert.equal(message.deleted,true);
        assert.equal((await chatRef.get()).data().lastMessagePreview,'Сообщение удалено');

        const repeated=await invoke(alice,{...base,operation:'delete'});
        assert.equal(repeated.body.result.status,'unchanged');
        const editDeleted=await invoke(alice,{...base,operation:'edit',text:'Resurrect'});
        assert.equal(editDeleted.body.error?.status,'FAILED_PRECONDITION');
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
