# Scripts

Утилиты репозитория разделены по назначению. Скрипты не должны обращаться к Production Firebase без отдельного защищённого сценария и явного разрешения.

| Файл | Назначение | Запуск |
|---|---|---|
| `validate-questions.mjs` | Проверяет структуру, переводы, варианты ответов, правильные индексы и дубликаты банка вопросов | `node --experimental-default-type=module scripts/validate-questions.mjs` |
| `browser-preview.mjs` | Проверяет гостевой запуск приложения в Chromium на desktop и mobile, фиксирует ошибки JS и горизонтальный overflow | `node scripts/browser-preview.mjs` |
| `quiz-flow-preview.mjs` | Проверяет реальный Classic mode UI на тестовых вопросах и изолированных collaborators, без входа и реальных наград | `node scripts/quiz-flow-preview.mjs` |

## Browser previews

Для обоих browser preview scripts нужны Playwright и локальный HTTP-сервер:

```bash
npm install --no-save playwright
npx playwright install chromium
python -m http.server 8765
```

В другом терминале:

```bash
node scripts/browser-preview.mjs
node scripts/quiz-flow-preview.mjs
```

Можно указать другой адрес через `QUIZHUB_PREVIEW_URL`. Скриншоты и отчёты создаются в `artifacts/quizhub-preview/`; эта папка является генерируемым результатом и не должна попадать в Git.

## Правила

- Не храните в скриптах реальные UID, токены, email или production project IDs.
- Эмуляторные проверки должны создавать собственные тестовые аккаунты и очищать тестовые данные.
- Не удаляйте preview script, пока его вызовы не исключены из GitHub Actions и документации.
