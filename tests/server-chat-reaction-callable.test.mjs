import test from 'node:test';
import assert from 'node:assert/strict';
import { createChatReactionCallableAdapter } from '../server/chat-reaction-callable-adapter.mjs';

class HttpsError extends Error {constructor(code,message){super(message);this.code=code;}}
const auth={uid:'alice',token:{firebase:{sign_in_provider:'password'}}};
const common={chatId:'dm_'+'a'.repeat(48),messageId:'message_1234567890abcd'};
test('reaction callable derives actor from Auth and accepts only allowlisted fields',async()=>{
    const calls=[];
    const handler=createChatReactionCallableAdapter({HttpsError,toggle:async args=>(calls.push(args),{status:'added'})});
    assert.deepEqual(await handler({auth,data:{...common,reactionType:'love'}}),{status:'added'});
    assert.deepEqual(calls,[{actorUid:'alice',...common,reactionType:'love'}]);
    for(const data of [
        {...common,reactionType:'love',actorUid:'victim'},
        {...common,reactionType:'<script>'},
        {...common,reactionType:'love',unexpected:true},
        {...common,reactionType:'like',messageId:'short'},
        {...common,reactionType:'like',chatId:'bad'},
        {chatId:common.chatId,messageId:common.messageId}
    ])await assert.rejects(handler({auth,data}),e=>e.code==='invalid-argument');
    await assert.rejects(handler({data:{...common,reactionType:'like'}}),e=>e.code==='unauthenticated');
    assert.equal(calls.length,1);
});

test('reaction callable maps membership errors and hides internal details',async()=>{
    const denied=createChatReactionCallableAdapter({HttpsError,toggle:async()=>{throw new Error('CHAT_MEMBERSHIP_REQUIRED');}});
    await assert.rejects(denied({auth,data:{...common,reactionType:'like'}}),e=>e.code==='permission-denied');
    const broken=createChatReactionCallableAdapter({HttpsError,toggle:async()=>{throw new Error('private database detail');}});
    await assert.rejects(broken({auth,data:{...common,reactionType:'like'}}),e=>e.code==='internal'&&e.message==='CHAT_REACTION_FAILED');
});
