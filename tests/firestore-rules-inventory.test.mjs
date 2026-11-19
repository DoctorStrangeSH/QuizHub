import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const at = path => new URL('../' + path, import.meta.url);
const config = JSON.parse(readFileSync(at('firebase.json'), 'utf8'));
const preview = JSON.parse(readFileSync(at('firebase.rules-preview.json'), 'utf8'));
const cutover = readFileSync(at('docs/FIRESTORE_PROFILE_CUTOVER.md'), 'utf8');

test('preview-only emulator rules are never mistaken for deployed production rules', () => {
    assert.equal(preview.firestore?.rules, 'tests/fixtures/quiz-sessions.rules');
    assert.ok(existsSync(at(preview.firestore.rules)));
    assert.equal(config.emulators?.firestore?.port, 8080);

    if (!config.firestore?.rules) {
        assert.match(cutover, /effective rules published[\s\S]*?UNKNOWN/i);
        assert.match(cutover, /NOT READY/);
        return;
    }

    // A future explicit production configuration must name an existing,
    // separately reviewed file, never the preview emulator fixture.
    assert.notEqual(config.firestore.rules, preview.firestore.rules);
    assert.ok(existsSync(at(config.firestore.rules)));
});
