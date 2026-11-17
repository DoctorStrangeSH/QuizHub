import test from 'node:test';
import assert from 'node:assert/strict';
import questionBank, { getCategoriesList, getQuestions } from '../app/data/questions/index.js';
import {
    buildQuestionCatalog, selectQuestions, publicQuestion
} from '../server/question-delivery.mjs';

test('server catalog accepts the actual QuizHub question bank', () => {
    const catalog = buildQuestionCatalog(questionBank);
    const expected = Object.values(questionBank).reduce((sum, group) =>
        sum + ['easy', 'medium', 'hard'].reduce((count, difficulty) =>
            count + group[difficulty].length, 0), 0);
    assert.equal(catalog.size, expected);
    assert.ok(catalog.size > 500, 'The production question bank looks incomplete');

    for (const [category, group] of Object.entries(questionBank)) {
        for (const difficulty of ['easy', 'medium', 'hard']) {
            assert.equal(
                [...catalog.values()].filter(q => q.category === category && q.difficulty === difficulty).length,
                group[difficulty].length,
                `Question count mismatch for ${category}/${difficulty}`
            );
        }
    }
});

test('real questions selected for the client never expose private answer fields', () => {
    const catalog = buildQuestionCatalog(questionBank);
    for (const difficulty of ['easy', 'medium', 'hard']) {
        const selected = selectQuestions(catalog, { difficulty, count: 10 });
        assert.equal(new Set(selected.map(question => question.id)).size, 10);
        for (const question of selected) {
            for (const language of ['ru', 'en']) {
                const payload = publicQuestion(question, language);
                assert.deepEqual(Object.keys(payload).sort(), [
                    'category', 'difficulty', 'id', 'options', 'question'
                ]);
                assert.ok(payload.question.length > 0);
                assert.ok(payload.options.length >= 2);
                assert.equal(Object.hasOwn(payload, 'correctIndex'), false);
                assert.equal(Object.hasOwn(payload, 'points'), false);
            }
        }
    }
});


test('video games category is available in both languages and all difficulty levels', () => {
    const russian = getCategoriesList('ru').find(category => category.id === 'gaming');
    const english = getCategoriesList('en').find(category => category.id === 'gaming');
    assert.deepEqual(russian, { id: 'gaming', name: 'Видеоигры', icon: '🎮' });
    assert.deepEqual(english, { id: 'gaming', name: 'Video Games', icon: '🎮' });

    for (const difficulty of ['easy', 'medium', 'hard']) {
        const questions = getQuestions('gaming', difficulty);
        assert.equal(questions.length, 6);
        assert.ok(questions.every(question => question.category === 'gaming'));
    }
});
