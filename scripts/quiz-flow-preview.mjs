import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';

const baseUrl = process.env.QUIZHUB_PREVIEW_URL || 'http://127.0.0.1:8765/';
const baseSource = readFileSync(new URL('../app/modules/quiz/modes/base.js', import.meta.url), 'utf8');
const classicSource = readFileSync(new URL('../app/modules/quiz/modes/classic.js', import.meta.url), 'utf8');
const outputDir = 'artifacts/quizhub-preview';
mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
let failed = false;
try {
  for (const viewport of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: 'reduce',
      serviceWorkers: 'block'
    });
    const page = await context.newPage();
    try {
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.locator('#initial-splash.hidden').waitFor({ timeout: 30000 });
      await page.evaluate(async ({ baseSource, classicSource }) => {
        // Load the actual UI mode methods with isolated collaborators; no sign-in,
        // writes, real rewards or network-side account operations in this test.
        const source = (baseSource + '\n' + classicSource)
          .replace(/^import\s+.*;\s*$/gm, '')
          .replace(/export class /g, 'class ');
        const getState = () => ({ language: 'ru' });
        const escapeHTML = value => String(value).replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;').replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
        const getClasses = new Function('getState', 'escapeHTML', 'increment',
          source + '\nreturn { ClassicMode };');
        const { ClassicMode } = getClasses(getState, escapeHTML, x => x);
        const questions = [1, 2, 3].map(index => ({
          id: 'smoke-' + index, category: 'science', points: 10,
          questionRU: 'Тестовый вопрос ' + index + '?',
          questionEN: 'Test question ' + index + '?',
          optionsRU: ['Верный ответ', 'Неверный ответ'],
          optionsEN: ['Right answer', 'Wrong answer'],
          correctIndex: 0,
          explanationRU: 'Объяснение тестового ответа.'
        }));
        const mode = new ClassicMode();
        await mode.init(questions, { mode: 'classic' });
        mode.saveStatus = 'saved';
        mode.earnedCoins = 12;
        mode.earnedXP = 25;
        mode.finishQuiz = async () => {
          mode.isFinished = true;
          mode.showResults();
        };
        const root = document.querySelector('#app-root');
        root.innerHTML = mode.renderQuestion(0);
        window.selectAnswer = el => mode.handleAnswer(el);
        window.nextQuestion = () => mode.nextQuestion();
        window.__quizSmoke = mode;
      }, { baseSource, classicSource });

      for (let round = 0; round < 3; round++) {
        await page.locator('.answer-card').first().waitFor();
        const choice = page.locator('.answer-card[data-correct="' + (round < 2 ? 'true' : 'false') + '"]').first();
        await choice.click();
        await page.locator('#answer-feedback:not([hidden])').waitFor();
        const result = await page.locator('#answer-feedback').getAttribute('data-result');
        assert.equal(result, round < 2 ? 'correct' : 'wrong');
        if (round === 1) {
          assert.match(await page.locator('.answer-feedback-combo').innerText(), /2 подряд/);
        }
        await page.locator('#next-btn-container button').click();
        if (round < 2) {
          await page.locator('.answer-card:not(.answered)').first().waitFor({ timeout: 8000 });
        }
      }

      await page.locator('.arcade-result').waitFor({ timeout: 8000 });
      assert.match(await page.locator('.arcade-accuracy-heading strong').innerText(), /67%/);
      assert.match(await page.locator('.arcade-streak-summary').innerText(), /2/);
      assert.match(await page.locator('.arcade-xp-reward').innerText(), /\+25/);
      assert.match(await page.locator('.result-stats').innerText(), /\+12/);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2);
      assert.equal(overflow, false, 'no horizontal overflow');

      await page.screenshot({ path: outputDir + '/quiz-round-' + viewport.name + '.png', fullPage: true });
      console.log(viewport.name + ': 3 real mode questions, combo, finale, mock rewards — PASS');
    } catch (error) {
      failed = true;
      console.error(viewport.name + ': ' + error.stack);
      await page.screenshot({ path: outputDir + '/quiz-round-' + viewport.name + '-failed.png', fullPage: true }).catch(() => {});
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
if (failed) process.exitCode = 1;
