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

test('answer cards can be activated by Enter or Space in every mode', () => {
    const source = readFileSync(new URL('../app/modules/quiz/modes/base.js', import.meta.url), 'utf8')
        .replace(/^import .*;\s*$/gm, '')
        .replace('export class BaseMode', 'class BaseMode');
    const BaseMode = new Function('getState', 'escapeHTML',
        source + '\nreturn BaseMode;'
    )(() => ({ language: 'ru' }), escapeHTML);
    const mode = new BaseMode();
    mode.questions = [{
        questionRU: 'Вопрос', optionsRU: ['Да', 'Нет'],
        questionEN: 'Question', optionsEN: ['Yes', 'No'],
        correctIndex: 0, category: 'science'
    }];
    const classicHTML = mode.renderQuestion(0);
    assert.equal((classicHTML.match(/role="button"/g) || []).length, 2);
    assert.equal((classicHTML.match(/tabindex="0"/g) || []).length, 2);
    assert.match(classicHTML, /onkeydown="if\(event\.key===&#39;Enter&#39;/);
    mode.getAnswerHandler = () => 'duelAnswer(this)';
    assert.match(mode.renderQuestion(0), /window\.duelAnswer\(this\)/);
});
