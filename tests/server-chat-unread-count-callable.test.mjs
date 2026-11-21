import test from 'node:test';
import assert from 'node:assert/strict';
import { createChatUnreadCountCallableAdapter } from '../server/chat-unread-count-callable-adapter.mjs';

class HttpsError extends Error {constructor(code,message){super(message);this.code=code;}}
const auth={uid:'alice',token:{firebase:{sign_in_provider:'password'}}};
const data={chatId:'dm_'+'a'.repeat(48)};
test('unread count callable derives actor from Auth and validates strict payload',async()=>{
    const calls=[];
    const handler=createChatUnreadCountCallableAdapter({HttpsError,getCount:async args=>(calls.push(args),{unreadCount:2})});
    assert.deepEqual(await handler({auth,data}),{unreadCount:2});
    assert.deepEqual(calls,[{actorUid:'alice',...data}]);
    await assert.rejects(handler({auth,data:{...data,actorUid:'victim'}}),e=>e.code==='invalid-argument');
    await assert.rejects(handler({auth,data:{...data,extra:true}}),e=>e.code==='invalid-argument');
    await assert.rejects(handler({auth,data:{chatId:'bad'}}),e=>e.code==='invalid-argument');
    await assert.rejects(handler({data}),e=>e.code==='unauthenticated');
    assert.equal(calls.length,1);
});
test('unread count callable maps membership denial and hides backend details',async()=>{
    const denied=createChatUnreadCountCallableAdapter({HttpsError,getCount:async()=>{throw new Error('CHAT_MEMBERSHIP_REQUIRED');}});
    await assert.rejects(denied({auth,data}),e=>e.code==='permission-denied');
    const broken=createChatUnreadCountCallableAdapter({HttpsError,getCount:async()=>{throw new Error('private database detail');}});
    await assert.rejects(broken({auth,data}),e=>e.code==='internal'&&e.message==='CHAT_UNREAD_COUNT_FAILED');
});
