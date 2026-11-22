import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccountLedgerHistoryCallableAdapter } from '../server/account-ledger-history-callable-adapter.mjs';

class HttpsError extends Error { constructor(code,message){super(message);this.code=code;} }
const auth={uid:'alice',token:{firebase:{sign_in_provider:'password'}}};

test('callable derives owner from Auth and forwards bounded history filters',async()=>{
    const calls=[];
    const handler=createAccountLedgerHistoryCallableAdapter({
        HttpsError,
        read:async args=>(calls.push(args),{entries:[],nextCursor:null})
    });
    assert.deepEqual(await handler({auth,data:{pageSize:10,type:'quiz_reward',cursor:null}}),{entries:[],nextCursor:null});
    assert.deepEqual(calls,[{actorUid:'alice',pageSize:10,type:'quiz_reward',cursor:null}]);
});

test('callable accepts Firebase UID characters while rejecting path traversal and malformed identities',async()=>{\n    const calls=[];\n    const handler=createAccountLedgerHistoryCallableAdapter({HttpsError,read:async args=>(calls.push(args),{entries:[],nextCursor:null})});\n    await handler({auth:{...auth,uid:'account.name:region'},data:{}});\n    assert.equal(calls[0].actorUid,'account.name:region');\n    for(const uid of ['../victim','.', '..','bad\\u0000uid','x'.repeat(129)]) {\n        await assert.rejects(handler({auth:{...auth,uid},data:{}}),error=>error.code==='unauthenticated');\n    }\n});\n\ntest('callable rejects UID injection, unknown fields, bad filters, cursors and anonymous users',async()=>{
    const handler=createAccountLedgerHistoryCallableAdapter({HttpsError,read:async()=>({entries:[],nextCursor:null})});
    for(const data of [{uid:'victim'},{actorUid:'victim'},{pageSize:51},{type:'unknown'},{cursor:'x'.repeat(1025)},{unexpected:true}]) {
        await assert.rejects(handler({auth,data}),error=>error.code==='invalid-argument');
    }
    await assert.rejects(handler({data:{}}),error=>error.code==='unauthenticated');
    await assert.rejects(handler({auth:{uid:'anon',token:{firebase:{sign_in_provider:'anonymous'}}},data:{}}),error=>error.code==='unauthenticated');
});

test('callable hides unexpected storage errors',async()=>{
    const handler=createAccountLedgerHistoryCallableAdapter({HttpsError,read:async()=>{throw new Error('private db detail');}});
    await assert.rejects(handler({auth,data:{}}),error=>error.code==='internal'&&error.message==='LEDGER_HISTORY_READ_FAILED');
});
