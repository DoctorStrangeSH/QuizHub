import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const modes = ['classic', 'survival', 'timetrial', 'duel'];

test('quiz modes delegate economy awards to BaseMode', async () => {
    for (const mode of modes) {
        const source = await readFile(`app/modules/quiz/modes/${mode}.js`, 'utf8');
        assert.match(source, /this\.saveResults\(/, `${mode} should delegate rewards`);
        assert.doesNotMatch(source, /\bupdateDoc\s*\(/, `${mode} must not directly grant rewards`);
        assert.doesNotMatch(source, /\bsetDoc\s*\(/, `${mode} must not directly write reward documents`);
    }
});

test('central client reward write remains visible until server migration', async () => {
    const source = await readFile('app/modules/quiz/modes/base.js', 'utf8');
    assert.match(source, /await updateDoc\(userRef,\s*\{/);
    assert.match(source, /coins:\s*increment\(totalCoins\)/);
    assert.match(source, /experience:\s*increment\(totalXP\)/);
    assert.match(source, /this\.resultsPromise = this\.persistResults\(extraData\)/);
});
