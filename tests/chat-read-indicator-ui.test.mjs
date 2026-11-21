import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMessageReadState } from '../app/modules/chat/chat-read-indicator.js';

test('only own messages with trusted boolean state render a read indicator',()=>{
    assert.equal(renderMessageReadState({isMine:false,readByRecipient:true}),'');
    assert.equal(renderMessageReadState({isMine:true,readByRecipient:undefined}),'');
    assert.equal(renderMessageReadState({isMine:true,readByRecipient:null}),'');
});
test('unread and read states render distinct accessible indicators',()=>{
    const sent=renderMessageReadState({isMine:true,readByRecipient:false});
    const read=renderMessageReadState({isMine:true,readByRecipient:true});
    assert.match(sent,/is-sent/);assert.match(sent,/Доставлено/);assert.match(sent,/✓/);
    assert.match(read,/is-read/);assert.match(read,/Прочитано/);assert.match(read,/✓✓/);
});
