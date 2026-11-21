import test from 'node:test';
import assert from 'node:assert/strict';
import { createChatHistoryCallableAdapter } from '../server/chat-history-callable-adapter.mjs';

class HttpsError extends Error { constructor(code,message){super(message);this.code=code;} }
const chatId='dm_'+'a'.repeat(48);
const auth={uid:'alice',token:{firebase:{sign_in_provider:'password'}}};
test('history callable derives actor from Auth and accepts only bounded cursor contract',async()=>{
    const calls=[];
    const handler=createChatHistoryCallableAdapter({HttpsError,read:async args=>(calls.push(args),{chatId,peerUid:'bob',messages:[],nextCursor:null})});
    assert.deepEqual(await handler({auth,data:{chatId}}),{chatId,peerUid:'bob',messages:[],nextCursor:null});
    assert.deepEqual(calls,[{actorUid:'alice',chatId,pageSize:30,cursorMessageId:null}]);
    for(const data of [
        {chatId,actorUid:'victim'},
        {chatId,pageSize:51},
        {chatId,cursorMessageId:'bad'},
        {chatId,unexpected:true},
        {},
        null
    ]) await assert.rejects(handler({auth,data}),e=>e.code==='invalid-argument');
    await assert.rejects(handler({data:{chatId}}),e=>e.code==='unauthenticated');
});

test('history callable maps membership errors and hides unexpected backend details',async()=>{
    const handler=createChatHistoryCallableAdapter({HttpsError,read:async()=>{throw new Error('CHAT_MEMBERSHIP_REQUIRED');}});
    await assert.rejects(handler({auth,data:{chatId}}),e=>e.code==='permission-denied');
    const broken=createChatHistoryCallableAdapter({HttpsError,read:async()=>{throw new Error('private database detail');}});
    await assert.rejects(broken({auth,data:{chatId}}),e=>e.code==='internal'&&e.message==='CHAT_READ_FAILED');
});
