import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const categories = [
  'science', 'history', 'sports', 'movies', 'geography', 'technology',
  'art', 'music', 'it', 'literature', 'food', 'animals', 'space'
];
const difficulties = ['easy', 'medium', 'hard'];
const errors = [];
const warnings = [];
const seen = new Map();
let total = 0;

const normalized = value => typeof value === 'string'
  ? value.trim().toLocaleLowerCase('ru-RU').replace(/\s+/g, ' ')
  : '';

for (const category of categories) {
  const modulePath = resolve('app', 'data', 'questions', `${category}.js`);
  let bank;
  try {
    ({ default: bank } = await import(pathToFileURL(modulePath).href));
  } catch (error) {
    errors.push(`${category}: cannot import questions (${error.message})`);
    continue;
  }

  for (const difficulty of difficulties) {
    const questions = bank?.[difficulty];
    if (!Array.isArray(questions) || questions.length === 0) {
      errors.push(`${category}/${difficulty}: expected a nonempty question array`);
      continue;
    }

    questions.forEach((question, index) => {
      total++;
      const label = `${category}/${difficulty}/${index + 1}`;
      if (!question || typeof question !== 'object') {
        errors.push(`${label}: expected an object`);
        return;
      }
      for (const field of ['questionRU', 'questionEN']) {
        if (!normalized(question[field])) errors.push(`${label}: missing ${field}`);
      }
      for (const field of ['optionsRU', 'optionsEN']) {
        if (!Array.isArray(question[field]) || question[field].length < 2 ||
            question[field].some(option => !normalized(option))) {
          errors.push(`${label}: ${field} must contain at least two nonempty answers`);
        }
      }
      if (Array.isArray(question.optionsRU) && Array.isArray(question.optionsEN) &&
          question.optionsRU.length !== question.optionsEN.length) {
        errors.push(`${label}: translated option counts differ`);
      }
      if (!Number.isInteger(question.correctIndex) ||
          !Array.isArray(question.optionsRU) ||
          question.correctIndex < 0 || question.correctIndex >= question.optionsRU.length) {
        errors.push(`${label}: invalid correctIndex`);
      }
      if (!Number.isFinite(question.points) || question.points <= 0) {
        errors.push(`${label}: points must be positive`);
      }
      for (const field of ['explanationRU', 'explanationEN']) {
        if (question[field] !== undefined && !normalized(question[field])) {
          errors.push(`${label}: empty ${field}`);
        }
      }
      if (Boolean(question.explanationRU) !== Boolean(question.explanationEN)) {
        warnings.push(`${label}: explanation is not translated in both languages`);
      }

      const key = normalized(question.questionRU);
      if (key) {
        if (seen.has(key)) warnings.push(`${label}: duplicate of ${seen.get(key)}`);
        else seen.set(key, label);
      }
    });
  }
}

for (const warning of warnings) console.warn(`WARNING: ${warning}`);
for (const error of errors) console.error(`ERROR: ${error}`);
console.log(`Validated ${total} questions; ${errors.length} errors; ${warnings.length} warnings.`);
if (errors.length) process.exitCode = 1;
