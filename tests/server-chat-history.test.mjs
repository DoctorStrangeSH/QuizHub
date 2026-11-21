import test from 'node:test';
import assert from 'node:assert/strict';
import { readDirectMessages } from '../server/chat-history.mjs';

const CHAT_ID = 'dm_' + 'a'.repeat(48);
function fixture({ participants = ['alice', 'bob'], messages = [] } = {}) {
    const chat = { participants };
    const records = new Map(messages.map(message => [message.id, message]));
    const db = {
        collection(name) {
            return { doc(id) {
                if (name !== 'chats') throw new Error('unexpected collection');
                return {
                    async get() { return { exists: true, data: () => chat }; },
                    collection(child) {
                        if (child !== 'messages') throw new Error('unexpected subcollection');
                        return {
                            doc(messageId) {
                                return { async get() {
                                    const value = records.get(messageId);
                                    return { id: messageId, exists: Boolean(value), data: () => value };
                                }};
                            },
                            orderBy(field, direction) {
                                assert.equal(field, 'createdAt');
                                assert.equal(direction, 'desc');
                                let cursorId = null;
                                return {
                                    startAfter(snapshot) { cursorId = snapshot.id; return this; },
                                    limit(count) {
                                        return { async get() {
                                            const sorted = [...records.values()].sort((a,b) => b.createdAt - a.createdAt);
                                            const start = cursorId ? sorted.findIndex(x => x.id === cursorId) + 1 : 0;
                                            const docs = sorted.slice(start, start + count).map(value => ({
                                                id: value.id, data: () => value
                                            }));
                                            return { docs };
                                        }};
                                    }
                                };
                            }
                        };
                    }
                };
            }};
        }
    };
    return { db, records, chat };
}
const message=(id,createdAt,extra={})=>({
    id,senderId:'alice',recipientId:'bob',text:'hello '+id,
    createdAt,edited:false,deleted:false,secretInternalField:'must-not-leak',...extra
});

test('history is participant-scoped, paginated and returns only allowlisted message fields', async () => {
    const {db}=fixture({messages:[message('message_000000000001',1),message('message_000000000002',2),message('message_000000000003',3,{reactions:{like:['alice','bob'],love:['bob']}})]});
    const first=await readDirectMessages(db,{actorUid:'alice',chatId:CHAT_ID,pageSize:2});
    assert.equal(first.peerUid,'bob');
    assert.deepEqual(first.messages.map(x=>x.id),['message_000000000003','message_000000000002']);
    assert.equal(first.nextCursor,'message_000000000002');
    assert.equal('secretInternalField' in first.messages[0],false);
    assert.deepEqual(first.messages[0].reactions,{like:{count:2,reactedByMe:true},love:{count:1,reactedByMe:false}});
    const second=await readDirectMessages(db,{actorUid:'bob',chatId:CHAT_ID,pageSize:2,cursorMessageId:first.nextCursor});
    assert.deepEqual(second.messages.map(x=>x.id),['message_000000000001']);
    assert.equal(second.nextCursor,null);
});

test('deleted messages hide their content and malformed message membership is rejected', async () => {
    const {db}=fixture({messages:[
        message('message_000000000001',2,{deleted:true,text:'secret'}),
        message('message_000000000002',1,{senderId:'charlie'})
    ]});
    const result=await readDirectMessages(db,{actorUid:'alice',chatId:CHAT_ID,pageSize:1});
    assert.equal(result.messages[0].deleted,true);
    assert.equal(result.messages[0].text,null);
    assert.deepEqual(result.messages[0].reactions,{});
    await assert.rejects(readDirectMessages(db,{actorUid:'alice',chatId:CHAT_ID,pageSize:2}),/CHAT_MESSAGE_STATE_CONFLICT/);
});

test('strangers, malformed chat membership, invalid cursors and invalid pagination are rejected', async () => {
    const {db}=fixture({messages:[message('message_000000000001',1)]});
    await assert.rejects(readDirectMessages(db,{actorUid:'charlie',chatId:CHAT_ID}),/CHAT_MEMBERSHIP_REQUIRED/);
    await assert.rejects(readDirectMessages(db,{actorUid:'alice',chatId:'bad'}),/INVALID_CHAT_READ_REQUEST/);
    await assert.rejects(readDirectMessages(db,{actorUid:'alice',chatId:CHAT_ID,pageSize:51}),/INVALID_CHAT_PAGE_SIZE/);
    await assert.rejects(readDirectMessages(db,{actorUid:'alice',chatId:CHAT_ID,cursorMessageId:'not-found-cursor-123'}),/INVALID_CHAT_CURSOR/);
});
