import test from 'node:test';
import assert from 'node:assert/strict';
import { getDirectChatUnreadCount } from '../server/chat-unread-count.mjs';

const chatId='dm_'+'a'.repeat(48), cursorId='message_1234567890abcd';
function fixture({actor='alice',participants=['alice','bob'],receipt=true,count=3,cursorRecipient='alice'}={}) {
    let chat={participants,...(receipt?{readReceipts:{alice:{lastReadMessageId:cursorId}}}:{})};
    const cursor={senderId:'bob',recipientId:cursorRecipient,createdAt:{toMillis:()=>1000}};
    const records=new Map([['chats/'+chatId,chat],['chats/'+chatId+'/messages/'+cursorId,cursor]]);
    let queryState={cursor:null,filters:[]};
    const query={
        where(field,op,value){queryState.filters.push([field,op,value]);return this;},
        orderBy(field,direction){queryState.order=[field,direction];return this;},
        startAfter(snapshot){queryState.cursor=snapshot;return this;},
        count(){return {get:async()=>({data:()=>({count})})};}
    };
    const messages={where:query.where.bind(query),orderBy:query.orderBy.bind(query),startAfter:query.startAfter.bind(query),count:query.count.bind(query),doc(id){return ref('chats/'+chatId+'/messages/'+id)}};
    const ref=path=>({path,async get(){const value=records.get(path);return {exists:value!==undefined,data:()=>value};},collection(name){return {doc(id){return ref(path+'/'+name+'/'+id)},...messages}}});
    const chatRef=ref('chats/'+chatId);
    const db={collection(name){return {doc(id){return ref(name+'/'+id)}}}};
    chatRef.get=async()=>({exists:true,data:()=>chat});
    return {db,queryState,records,setChat(value){chat=value;}};
}

test('unread count uses aggregate query after the participant cursor',async()=>{
    const {db,queryState}=fixture({count:2});
    assert.deepEqual(await getDirectChatUnreadCount(db,{actorUid:'alice',chatId}),{chatId,unreadCount:2});
    assert.deepEqual(queryState.filters,[['recipientId','==','alice'],['deleted','==',false]]);
    assert.deepEqual(queryState.order,['createdAt','asc']);
    assert.ok(queryState.cursor);
});

test('unread count starts from conversation beginning without a receipt',async()=>{
    const {db,queryState}=fixture({receipt:false,count:4});
    assert.equal((await getDirectChatUnreadCount(db,{actorUid:'alice',chatId})).unreadCount,4);
    assert.equal(queryState.cursor,null);
});

test('strangers and malformed receipt cursors fail closed',async()=>{
    const stranger=fixture({participants:['alice','charlie']});
    await assert.rejects(getDirectChatUnreadCount(stranger.db,{actorUid:'mallory',chatId}),/CHAT_MEMBERSHIP_REQUIRED/);
    const malformed=fixture();
    malformed.records.set('chats/'+chatId+'/messages/'+cursorId,{senderId:'bob',recipientId:'charlie',createdAt:{toMillis:()=>1}});
    // Mutate chat's persisted receipt to a cursor belonging to the other participant.
    malformed.setChat({participants:['alice','bob'],readReceipts:{alice:{lastReadMessageId:cursorId}}});
    await assert.rejects(getDirectChatUnreadCount(malformed.db,{actorUid:'alice',chatId}),/CHAT_READ_RECEIPT_STATE_CONFLICT/);
    await assert.rejects(getDirectChatUnreadCount(malformed.db,{actorUid:'alice',chatId:'bad'}),/INVALID_CHAT_UNREAD_REQUEST/);
});
