import test from 'node:test';
import assert from 'node:assert/strict';
import { mutateDirectMessage } from '../server/chat-message-mutations.mjs';

const chatId='dm_'+'a'.repeat(48), messageId='message_1234567890abcd';
function fixture({actor='alice',deleted=false,lastMessageId=messageId}={}) {
    const records=new Map([
        ['chats/'+chatId,{participants:['alice','bob'],lastMessageId,lastMessagePreview:'Original',updatedAt:new Date(0)}],
        ['chats/'+chatId+'/messages/'+messageId,{
            senderId:actor,recipientId:actor==='alice'?'bob':'alice',
            text:deleted?null:'Original',edited:false,deleted
        }]
    ]);
    const ref=path=>({
        path,
        collection(name){return {doc(id){return ref(path+'/'+name+'/'+id)}}}
    });
    const db={
        collection(name){return {doc(id){return ref(name+'/'+id)}}},
        async runTransaction(callback){
            const writes=[];
            const tx={
                async get(r){const v=records.get(r.path);return {exists:v!==undefined,data:()=>v}},
                update(r,patch){writes.push([r.path,patch])}
            };
            const result=await callback(tx);
            for(const [path,patch] of writes) records.set(path,{...records.get(path),...patch});
            return result;
        }
    };
    return {db,records};
}
const call=(db,overrides={})=>mutateDirectMessage(db,{
    actorUid:'alice',chatId,messageId,operation:'edit',text:'Updated text',...overrides
});

test('author can edit message atomically and latest-message preview follows the edit',async()=>{
    const {db,records}=fixture();
    const result=await call(db);
    assert.equal(result.status,'updated');
    assert.equal(records.get('chats/'+chatId+'/messages/'+messageId).text,'Updated text');
    assert.equal(records.get('chats/'+chatId+'/messages/'+messageId).edited,true);
    assert.ok(records.get('chats/'+chatId+'/messages/'+messageId).editedAt instanceof Date);
    assert.equal(records.get('chats/'+chatId).lastMessagePreview,'Updated text');
    assert.equal((await call(db)).status,'unchanged');
});

test('author can soft-delete and erase stored text; retries are idempotent',async()=>{
    const {db,records}=fixture();
    const result=await call(db,{operation:'delete'});
    assert.equal(result.status,'deleted');
    const message=records.get('chats/'+chatId+'/messages/'+messageId);
    assert.equal(message.text,null);
    assert.equal(message.deleted,true);
    assert.ok(message.deletedAt instanceof Date);
    assert.equal(records.get('chats/'+chatId).lastMessagePreview,'Сообщение удалено');
    assert.equal((await call(db,{operation:'delete'})).status,'unchanged');
});

test('recipient, stranger and non-member cannot mutate; deleted messages cannot be edited',async()=>{
    const {db}=fixture();
    await assert.rejects(call(db,{actorUid:'bob'}),/MESSAGE_AUTHOR_REQUIRED/);
    await assert.rejects(call(db,{actorUid:'charlie'}),/CHAT_MEMBERSHIP_REQUIRED/);
    const deleted=fixture({deleted:true});
    await assert.rejects(call(deleted.db),/MESSAGE_ALREADY_DELETED/);
});

test('invalid IDs, operation and message text are rejected',async()=>{
    const {db}=fixture();
    await assert.rejects(call(db,{operation:'restore'}),/INVALID_CHAT_MESSAGE_MUTATION/);
    await assert.rejects(call(db,{chatId:'bad'}),/INVALID_CHAT_MESSAGE_MUTATION/);
    await assert.rejects(call(db,{messageId:'short'}),/INVALID_CHAT_MESSAGE_MUTATION/);
    await assert.rejects(call(db,{text:'  '}),/INVALID_MESSAGE_TEXT/);
    await assert.rejects(call(db,{text:'x'.repeat(2001)}),/INVALID_MESSAGE_TEXT/);
});
