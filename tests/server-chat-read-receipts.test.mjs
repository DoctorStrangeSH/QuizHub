import test from 'node:test';
import assert from 'node:assert/strict';
import { markDirectMessagesRead } from '../server/chat-read-receipts.mjs';

const chatId='dm_'+'a'.repeat(48), messageId='message_1234567890abcd';
const stamp=ms=>({toMillis:()=>ms});
function fixture({actor='alice',recipient='alice',participants=['alice','bob'],previous=null,deleted=false}={}) {
    const chat={participants,...(previous?{readReceipts:{alice:previous}}:{})};
    const message={senderId:'bob',recipientId:recipient,createdAt:stamp(1000),deleted};
    const records=new Map([
        ['chats/'+chatId,chat],
        ['chats/'+chatId+'/messages/'+messageId,message]
    ]);
    const ref=path=>({path,collection(name){return {doc(id){return ref(path+'/'+name+'/'+id)}}}});
    const db={
        collection(name){return {doc(id){return ref(name+'/'+id)}}},
        async runTransaction(callback){
            const writes=[];
            const tx={
                async get(r){const v=records.get(r.path);return {exists:v!==undefined,data:()=>v}},
                update(r,patch){writes.push([r.path,patch])}
            };
            const result=await callback(tx);
            for(const [path,patch] of writes)records.set(path,{...records.get(path),...patch});
            return result;
        }
    };
    return {db,records,actor};
}
const call=(db,overrides={})=>markDirectMessagesRead(db,{
    actorUid:'alice',chatId,upToMessageId:messageId,...overrides
});

test('participant marks an incoming message read and repeated receipt is idempotent',async()=>{
    const {db,records}=fixture();
    assert.equal((await call(db)).status,'updated');
    const receipt=records.get('chats/'+chatId).readReceipts.alice;
    assert.equal(receipt.lastReadMessageId,messageId);
    assert.equal(receipt.lastReadAt.toMillis(),1000);
    assert.ok(receipt.updatedAt instanceof Date);
    assert.equal((await call(db)).status,'unchanged');
});

test('older receipt cannot move a participant cursor backwards',async()=>{
    const {db}=fixture({previous:{lastReadMessageId:'message_abcdefghijkl',lastReadAt:stamp(2000)}});
    assert.equal((await call(db)).status,'unchanged');
});

test('strangers, outgoing messages, deleted messages and malformed targets are rejected',async()=>{
    const stranger=fixture({participants:['alice','charlie']});
    await assert.rejects(call(stranger.db,{actorUid:'mallory'}),/CHAT_MEMBERSHIP_REQUIRED/);
    const outgoing=fixture({recipient:'bob'});
    await assert.rejects(call(outgoing.db),/INVALID_CHAT_READ_TARGET/);
    const deleted=fixture({deleted:true});
    await assert.rejects(call(deleted.db),/INVALID_CHAT_READ_TARGET/);
    const invalid=fixture();
    await assert.rejects(call(invalid.db,{chatId:'bad'}),/INVALID_CHAT_READ_RECEIPT/);
    await assert.rejects(call(invalid.db,{upToMessageId:'short'}),/INVALID_CHAT_READ_RECEIPT/);
});
