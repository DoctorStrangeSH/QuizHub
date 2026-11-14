import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHTML } from '../app/modules/quiz/escape-html.js';
import { readFileSync } from 'node:fs';

test('quiz text escapes HTML metacharacters but preserves regular text', () => {
    assert.equal(escapeHTML('2 < 3 & 5 > 4'), '2 &lt; 3 &amp; 5 &gt; 4');
    assert.equal(escapeHTML('"yes" and \'no\''), '&quot;yes&quot; and &#39;no&#39;');
    assert.equal(escapeHTML(null), '');
    assert.equal(escapeHTML('Привет, мир!'), 'Привет, мир!');
});

test('markup from question content is neutralized', () => {
    const untrusted = '<img src=x onerror="alert(1)">';
    const escaped = escapeHTML(untrusted);
    assert.ok(!escaped.includes('<img'));
    assert.ok(escaped.includes('&lt;img'));
});

test('quiz renderer escapes the visible question, options and category name', () => {
    const source = readFileSync(new URL('../app/modules/quiz/modes/base.js', import.meta.url), 'utf8');
    assert.match(source, /escapeHTML\(qText\)/);
    assert.match(source, /escapeHTML\(opt\.text\)/);
    assert.match(source, /escapeHTML\(catName\)/);
});
