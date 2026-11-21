import test from 'node:test';
import assert from 'node:assert/strict';
import { createChatMessageMutationCallableAdapter } from '../server/chat-message-mutation-callable-adapter.mjs';

class HttpsError extends Error {constructor(code,message){super(message);this.code=code;}}
const auth={uid:'alice',token:{firebase:{sign_in_provider:'password'}}};
const common={chatId:'dm_'+'a'.repeat(48),messageId:'message_1234567890abcd'};
test('mutation callable derives author from Auth and validates edit/delete payloads',async()=>{
    const calls=[];
    const handler=createChatMessageMutationCallableAdapter({HttpsError,mutate:async args=>(calls.push(args),{status:'updated'})});
    assert.deepEqual(await handler({auth,data:{...common,operation:'edit',text:'new'}}),{status:'updated'});
    assert.deepEqual(await handler({auth,data:{...common,operation:'delete'}}),{status:'updated'});
    assert.deepEqual(calls,[
        {actorUid:'alice',...common,operation:'edit',text:'new'},
        {actorUid:'alice',...common,operation:'delete'}
    ]);
    for(const data of [
        {...common,operation:'edit',text:'x',actorUid:'victim'},
        {...common,operation:'delete',text:'forged'},
        {...common,operation:'edit',text:' '},
        {...common,operation:'restore'},
        {...common,operation:'delete',extra:true},
        {...common,operation:'edit',text:'x'.repeat(2001)}
    ]) await assert.rejects(handler({auth,data}),e=>e.code==='invalid-argument');
    await assert.rejects(handler({data:{...common,operation:'delete'}}),e=>e.code==='unauthenticated');
    assert.equal(calls.length,2);
});

test('mutation callable maps author denial and hides backend details',async()=>{
    const denied=createChatMessageMutationCallableAdapter({HttpsError,mutate:async()=>{throw new Error('MESSAGE_AUTHOR_REQUIRED');}});
    await assert.rejects(denied({auth,data:{...common,operation:'delete'}}),e=>e.code==='permission-denied');
    const broken=createChatMessageMutationCallableAdapter({HttpsError,mutate:async()=>{throw new Error('private database detail');}});
    await assert.rejects(broken({auth,data:{...common,operation:'delete'}}),e=>e.code==='internal'&&e.message==='CHAT_MESSAGE_MUTATION_FAILED');
});
