import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PUBLIC_PROFILE_READS_ENABLED } from '../app/modules/profile/profile-read-source.js';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('unmigrated foreign reads and social writes force public-profile cutover to remain off', () => {
    const chat = source('app/modules/chat/chat.js');
    const profile = source('app/modules/profile/public-profile.js');
    const weekly = source('app/modules/reset-weekly.js');
    const unresolved = [
        /getDoc\(doc\(db, 'users', friendId\)\)/.test(chat),
        /updateDoc\(doc\(db, 'users', friendId\)/.test(profile),
        /collection\(db, 'users'\)/.test(weekly)
    ];
    if (unresolved.some(Boolean)) {
        assert.equal(PUBLIC_PROFILE_READS_ENABLED, false, 'Unsafe to cut over while legacy foreign access exists');
    }
    assert.match(source('docs/FIRESTORE_PROFILE_CUTOVER.md'), /NOT READY/);
});
