import test from 'node:test';
import assert from 'node:assert/strict';
import { createChatReadReceiptCallableAdapter } from '../server/chat-read-receipt-callable-adapter.mjs';

class HttpsError extends Error {constructor(code,message){super(message);this.code=code;}}
const auth={uid:'alice',token:{firebase:{sign_in_provider:'password'}}};
const data={chatId:'dm_'+'a'.repeat(48),upToMessageId:'message_1234567890abcd'};
test('read receipt callable derives actor from Auth and validates strict payload',async()=>{
    const calls=[];
    const handler=createChatReadReceiptCallableAdapter({HttpsError,markRead:async args=>(calls.push(args),{status:'updated'})});
    assert.deepEqual(await handler({auth,data}),{status:'updated'});
    assert.deepEqual(calls,[{actorUid:'alice',...data}]);
    for(const payload of [
        {...data,actorUid:'victim'},
        {...data,extra:true},
        {...data,chatId:'bad'},
        {...data,upToMessageId:'short'}
    ]) await assert.rejects(handler({auth,data:payload}),e=>e.code==='invalid-argument');
    await assert.rejects(handler({data}),e=>e.code==='unauthenticated');
    assert.equal(calls.length,1);
});

test('read receipt callable maps membership denial and hides backend details',async()=>{
    const denied=createChatReadReceiptCallableAdapter({HttpsError,markRead:async()=>{throw new Error('CHAT_MEMBERSHIP_REQUIRED');}});
    await assert.rejects(denied({auth,data}),e=>e.code==='permission-denied');
    const broken=createChatReadReceiptCallableAdapter({HttpsError,markRead:async()=>{throw new Error('private database detail');}});
    await assert.rejects(broken({auth,data}),e=>e.code==='internal'&&e.message==='CHAT_READ_RECEIPT_FAILED');
});
