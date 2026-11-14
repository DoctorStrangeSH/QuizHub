import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildQuestionCatalog, selectQuestions, publicQuestion, canonicalQuestion
} from '../server/question-delivery.mjs';

const makeQuestion = (id, points = 10) => ({
    questionRU: `Вопрос ${id}?`,
    questionEN: `Question ${id}?`,
    optionsRU: ['Да', 'Нет'],
    optionsEN: ['Yes', 'No'],
    correctIndex: 1,
    points
});

const source = {
    history: { easy: [makeQuestion('one'), makeQuestion('two')], medium: [makeQuestion('three', 20)] },
    science: { easy: [makeQuestion('four')], medium: [], hard: [] }
};

test('catalog IDs are deterministic across identical source builds', () => {
    const first = buildQuestionCatalog(source);
    const second = buildQuestionCatalog(source);
    assert.deepEqual([...first.keys()], [...second.keys()]);
    assert.equal(first.size, 4);
});

test('public question payload never includes answer key or reward calculation fields', () => {
    const question = [...buildQuestionCatalog(source).values()][0];
    for (const language of ['ru', 'en']) {
        const publicPayload = publicQuestion(question, language);
        assert.deepEqual(Object.keys(publicPayload).sort(), ['category', 'difficulty', 'id', 'options', 'question']);
        assert.equal(JSON.stringify(publicPayload).includes('correctIndex'), false);
        assert.equal(JSON.stringify(publicPayload).includes('points'), false);
    }
    assert.equal(publicQuestion(question, 'en').options[0], 'Yes');
    assert.equal(canonicalQuestion(question).correctIndex, 1);
});

test('selection obeys category, difficulty and count without repeating questions', () => {
    const catalog = buildQuestionCatalog(source);
    const selected = selectQuestions(catalog, { category: 'history', difficulty: 'easy', count: 2 });
    assert.equal(selected.length, 2);
    assert.equal(new Set(selected.map(q => q.id)).size, 2);
    assert.ok(selected.every(q => q.category === 'history' && q.difficulty === 'easy'));
    assert.throws(() => selectQuestions(catalog, { category: 'science', difficulty: 'hard', count: 1 }), /NOT_ENOUGH_QUESTIONS/);
});

test('malformed answer key and duplicate questions are rejected', () => {
    assert.throws(() => buildQuestionCatalog({
        history: { easy: [{ ...makeQuestion('bad'), correctIndex: 99 }] }
    }), /INVALID_QUESTION/);
    assert.throws(() => buildQuestionCatalog({
        history: { easy: [makeQuestion('duplicate'), makeQuestion('duplicate')] }
    }), /DUPLICATE_QUESTION_ID/);
});
