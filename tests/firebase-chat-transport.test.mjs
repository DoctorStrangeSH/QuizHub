import test from 'node:test';
import assert from 'node:assert/strict';
import { createFirebaseChatTransport } from '../app/modules/chat/firebase-chat-transport.js';

const chatId='dm_'+'a'.repeat(48);
const messageId='message_00000000000001';
function fixture(overrides={}) {
    const calls=[];
    const auth={app:{options:{projectId:'demo-quizhub'}},currentUser:{uid:'alice',isAnonymous:false}};
    const functions={app:{options:{projectId:'demo-quizhub'}}};
    const httpsCallable=(_functions,name)=>async payload=>{calls.push({name,payload});return {data:{ok:true,name}};};
    const location={hostname:'localhost',search:'?firebaseEmulator=1&chatPreview=1'};
    const transport=createFirebaseChatTransport({auth,functions,httpsCallable,location,...overrides});
    return {transport,calls,auth,functions,httpsCallable,location};
}

test('chat transport refuses production hosts, projects and missing preview opt-in',()=>{
    const base=fixture();
    assert.throws(()=>createFirebaseChatTransport({...base,location:{hostname:'quizhub.example',search:'?firebaseEmulator=1&chatPreview=1'}}),/CHAT_PREVIEW_EMULATOR_REQUIRED/);
    assert.throws(()=>createFirebaseChatTransport({...base,location:{hostname:'localhost',search:'?firebaseEmulator=1'}}),/CHAT_PREVIEW_EMULATOR_REQUIRED/);
    const prodAuth={...base.auth,app:{options:{projectId:'quizhub-e65f5'}}};
    assert.throws(()=>createFirebaseChatTransport({...base,auth:prodAuth}),/CHAT_PREVIEW_EMULATOR_REQUIRED/);
});

test('chat transport requires a signed-in non-anonymous account',()=>{
    const f=fixture();f.auth.currentUser={uid:'alice',isAnonymous:true};
    assert.throws(()=>createFirebaseChatTransport(f),/SIGNED_IN_ACCOUNT_REQUIRED/);
});

test('send, history, read receipt and unread count call only their trusted preview endpoints',async()=>{
    const {transport,calls}=fixture();
    assert.deepEqual(await transport.sendMessage({targetUid:'bob',messageId,text:' hello '}),{ok:true,name:'chatSendPreviewCallable'});
    assert.deepEqual(await transport.readHistory({chatId,pageSize:20}),{ok:true,name:'chatHistoryPreviewCallable'});
    assert.deepEqual(await transport.markRead({chatId,upToMessageId:messageId}),{ok:true,name:'chatReadReceiptPreviewCallable'});
    assert.deepEqual(await transport.getUnreadCount({chatId}),{ok:true,name:'chatUnreadCountPreviewCallable'});
    assert.deepEqual(await transport.mutateMessage({operation:'edit',chatId,messageId,text:'updated'}),{ok:true,name:'chatMessageMutationPreviewCallable'});
    assert.deepEqual(await transport.mutateMessage({operation:'delete',chatId,messageId}),{ok:true,name:'chatMessageMutationPreviewCallable'});
    assert.deepEqual(await transport.toggleReaction({chatId,messageId,reactionType:'love'}),{ok:true,name:'chatReactionPreviewCallable'});
    assert.deepEqual(calls.map(x=>x.name),[
        'chatSendPreviewCallable','chatHistoryPreviewCallable',
        'chatReadReceiptPreviewCallable','chatUnreadCountPreviewCallable',
        'chatMessageMutationPreviewCallable','chatMessageMutationPreviewCallable','chatReactionPreviewCallable'
    ]);
    assert.deepEqual(calls[0].payload,{targetUid:'bob',messageId,text:' hello '});
});

test('transport rejects forged identity fields, extra keys and malformed cursors',async()=>{
    const {transport}=fixture();
    await assert.rejects(transport.sendMessage({targetUid:'bob',messageId,text:'hi',actorUid:'alice'}),/INVALID_CHAT_SEND_REQUEST/);
    await assert.rejects(transport.readHistory({chatId,actorUid:'alice'}),/INVALID_CHAT_HISTORY_REQUEST/);
    await assert.rejects(transport.markRead({chatId,upToMessageId:messageId,actorUid:'bob'}),/INVALID_CHAT_READ_RECEIPT/);
    await assert.rejects(transport.getUnreadCount({chatId,uid:'alice'}),/INVALID_CHAT_UNREAD_REQUEST/);
    await assert.rejects(transport.mutateMessage({operation:'delete',chatId,messageId,text:'forged'}),/INVALID_CHAT_MESSAGE_MUTATION/);
    await assert.rejects(transport.mutateMessage({operation:'edit',chatId,messageId,text:'   '}),/INVALID_CHAT_MESSAGE_MUTATION/);
    await assert.rejects(transport.mutateMessage({operation:'edit',chatId,messageId,text:'hi',actorUid:'alice'}),/INVALID_CHAT_MESSAGE_MUTATION/);
    await assert.rejects(transport.toggleReaction({chatId,messageId,reactionType:'evil'}),/INVALID_CHAT_REACTION/);
    await assert.rejects(transport.toggleReaction({chatId,messageId,reactionType:'like',actorUid:'alice'}),/INVALID_CHAT_REACTION/);
    await assert.rejects(transport.readHistory({chatId,pageSize:51}),/INVALID_CHAT_HISTORY_REQUEST/);
});
