import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { toggleChatReaction } from '../app/modules/chat/chat-reactions.js';

const chat = readFileSync(new URL('../app/modules/chat/chat.js', import.meta.url), 'utf8');

test('reaction toggling preserves other users and does not modify source data', () => {
    const original = { alice: '👍', bob: '❤️' };
    assert.deepEqual(toggleChatReaction(original, 'alice', '😂'), { alice: '😂', bob: '❤️' });
    assert.deepEqual(toggleChatReaction(original, 'alice', '👍'), { bob: '❤️' });
    assert.deepEqual(toggleChatReaction(undefined, 'alice', '👍'), { alice: '👍' });
    assert.deepEqual(original, { alice: '👍', bob: '❤️' });
});

test('reaction changes reject malformed inputs and do not mutate deleted messages', () => {
    assert.throws(() => toggleChatReaction({}, 'alice', '💣'), /INVALID_REACTION/);
    assert.throws(() => toggleChatReaction({}, 'a/b', '👍'), /INVALID_REACTION_USER/);
    assert.throws(() => toggleChatReaction([], 'alice', '👍'), /INVALID_REACTIONS_DATA/);
    assert.match(chat, /await runTransaction\(db, async transaction =>/);
    assert.match(chat, /await transaction\.get\(msgRef\)/);
    assert.match(chat, /msgSnap\.data\(\)\.deleted/);
    assert.match(chat, /transaction\.update\(msgRef, \{ reactions \}\)/);
    assert.match(chat, /Не удалось изменить реакцию/);
});
