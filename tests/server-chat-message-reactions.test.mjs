import test from 'node:test';
import assert from 'node:assert/strict';
import { toggleDirectMessageReaction, CHAT_REACTION_TYPES } from '../server/chat-message-reactions.mjs';

const chatId='dm_'+'a'.repeat(48), messageId='message_1234567890abcd';
function fixture({participants=['alice','bob'],message={}}={}) {
    const records=new Map([
        ['chats/'+chatId,{participants}],
        ['chats/'+chatId+'/messages/'+messageId,{
            senderId:'alice',recipientId:'bob',text:'hello',deleted:false,reactions:{},...message
        }]
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
    return {db,records};
}
const toggle=(db,overrides={})=>toggleDirectMessageReaction(db,{
    actorUid:'alice',chatId,messageId,reactionType:'like',...overrides
});

test('participants can toggle their own reactions and retries do not duplicate users',async()=>{
    const {db,records}=fixture();
    assert.equal((await toggle(db)).status,'added');
    assert.deepEqual(records.get('chats/'+chatId+'/messages/'+messageId).reactions,{like:['alice']});
    assert.equal((await toggle(db,{actorUid:'bob'})).status,'added');
    assert.deepEqual(records.get('chats/'+chatId+'/messages/'+messageId).reactions,{like:['alice','bob']});
    assert.equal((await toggle(db)).status,'removed');
    assert.deepEqual(records.get('chats/'+chatId+'/messages/'+messageId).reactions,{like:['bob']});
    assert.equal((await toggle(db)).status,'added');
    assert.deepEqual(records.get('chats/'+chatId+'/messages/'+messageId).reactions,{like:['bob','alice']});
});

test('reaction types are allowlisted and malformed stored reaction state fails closed',async()=>{
    const {db}=fixture();
    for(const type of CHAT_REACTION_TYPES)assert.equal((await toggle(db,{reactionType:type})).status,'added');
    await assert.rejects(toggle(db,{reactionType:'<script>'}),/INVALID_CHAT_REACTION/);
    const malformed=fixture({message:{reactions:{like:['alice','alice']}}});
    await assert.rejects(toggle(malformed.db),/CHAT_REACTION_STATE_CONFLICT/);
    const unknown=fixture({message:{reactions:{unknown:['alice']}}});
    await assert.rejects(toggle(unknown.db),/CHAT_REACTION_STATE_CONFLICT/);
});

test('strangers, deleted messages and malformed chat/message state are rejected',async()=>{
    const deleted=fixture({message:{deleted:true,text:null}});
    await assert.rejects(toggle(deleted.db),/MESSAGE_ALREADY_DELETED/);
    const stranger=fixture();
    await assert.rejects(toggle(stranger.db,{actorUid:'charlie'}),/CHAT_MEMBERSHIP_REQUIRED/);
    const badChat=fixture({participants:['alice','alice']});
    await assert.rejects(toggle(badChat.db),/CHAT_MEMBERSHIP_REQUIRED/);
    const badMessage=fixture({message:{recipientId:'charlie'}});
    await assert.rejects(toggle(badMessage.db),/CHAT_MESSAGE_STATE_CONFLICT/);
});
