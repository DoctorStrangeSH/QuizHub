import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../app/styles/midnight-arcade.css', import.meta.url), 'utf8');

function setupWorker(fetchFn) {
  const handlers = new Map();
  const stored = new Map();
  const cache = {
    match: async request => stored.get(typeof request === 'string' ? request : request.url),
    put: async (request, response) => { stored.set(typeof request === 'string' ? request : request.url, response); },
    add: async () => {}
  };
  const context = {
    self: {
      registration: { scope: 'https://example.test/QuizHub/' },
      addEventListener: (type, handler) => handlers.set(type, handler),
      skipWaiting: () => {},
      clients: { claim: async () => {} }
    },
    caches: {
      open: async () => cache,
      match: cache.match,
      keys: async () => []
    },
    fetch: fetchFn,
    URL,
    Response,
    Promise
  };
  vm.runInNewContext(source, context);
  return { handlers, stored };
}

test('PWA activates a fresh cache revision', () => {
  assert.match(source, /CACHE_NAME = 'quizhub-v6'/);
});

test('application styles fetch fresh content, with offline fallback', async () => {
  let calls = 0;
  let offline = false;
  const worker = setupWorker(async () => {
    calls++;
    if (offline) throw new Error('offline');
    return { ok: true, type: 'basic', clone() { return this; }, async text() { return 'new theme'; } };
  });
  const request = { method: 'GET', url: 'https://example.test/QuizHub/app/styles/midnight-arcade.css', mode: 'cors' };
  const runFetch = async () => {
    let responsePromise;
    const pending = [];
    worker.handlers.get('fetch')({
      request,
      respondWith: result => { responsePromise = result; },
      waitUntil: result => pending.push(result)
    });
    const response = await responsePromise;
    await Promise.all(pending);
    return response.text();
  };
  assert.equal(await runFetch(), 'new theme');
  assert.equal(calls, 1);
  offline = true;
  assert.equal(await runFetch(), 'new theme');
  assert.equal(calls, 2);
});

test('mobile chat and event modules override legacy sizing', () => {
  assert.match(css, /\.chat-layout \{ height: auto; max-height: none; \}/);
  assert.match(css, /\.chat-list-panel \{ width: auto; min-width: 0; flex-shrink: 1; \}/);
  assert.match(css, /\.events-section \.event-card \{ flex-direction: row; text-align: left; \}/);
  assert.match(css, /@media \(max-width: 480px\)/);
});
