# PR #3 — технический разбор и безопасный план интеграции

Дата: 2026-11-21  
PR: https://github.com/DoctorStrangeSH/QuizHub/pull/3  
Ветка: `feat/public-profile-viewer-projection`  
Head на момент аудита: `6d2ed70141afbacf7aac199515657ead19d7fba1`  
База PR: устаревший SHA `cb9a3327179d248d377b9e2a196c4e8f42e2317e`  
Текущая main на момент аудита: `c5938e1f27369bf13c7392329df2eded7067b75b`

## Решение

**Не объединять PR #3 целиком.** Он открыт как Draft, содержит 110 коммитов и 58 изменённых файлов, а GitHub сообщает `mergeable: false`. На head последнего проверенного commit три CI job завершились успешно: validate-questions, screenshot-and-smoke, emulator-daily. Зелёный CI не отменяет устаревшую базу и слишком широкий объём.

Цель PR полезная и соответствует V1: не отдавать чужие приватные поля в карточки игроков и подготовить безопасные серверные переходы друзей/чатов. Но один PR смешивает несколько независимых миграций и тестовых слоёв.

## Состав PR

### A. Публичная проекция профиля — PROF-02 / PROF-03 / RANK-02

- Viewer projection для чужих карточек по allowlist.
- Скрытие coin badge на чужом профиле.
- Централизованный источник чтения профилей и флаг переключения.
- Backfill/readiness tests для `publicProfiles` и `nicknameClaims`.
- Важное ограничение: `PUBLIC_PROFILE_READS_ENABLED` остаётся выключенным; это UI/data-flow redaction, а не гарантия сетевой приватности.

**Условие интеграции:** отдельный небольшой PR, read cutover остаётся выключенным; тесты доказывают, что приватные поля не рендерятся. Не заявлять о сетевой защите до подтверждения active Rules и реального браузерного теста с двумя аккаунтами.

### B. Друзья — FRIEND-01 / SEC-01

- Серверный relationship service и callable adapter.
- Эмуляторная проверка авторизации, взаимности и подделанных UID.
- Клиентский preview gate.

**Условие интеграции:** отдельный PR; production UI остаётся на legacy пути до серверного deployment, миграции профилей и согласованных Rules. Нельзя считать friend preview production-функцией.

### C. Чаты — CHAT-01..04 / DATA-03

- Серверные отправка, edit/delete/reaction и read cursor.
- Новая однозначная схема ID чата.
- Пагинация/real-time UI и защита от устаревших async результатов.
- Preflight и emulator rehearsal копирования legacy сообщений, включая orphan subcollections под отсутствующими chat parent documents.
- Preview-only Firestore Rules и отдельный emulator workflow.

**Условие интеграции:** делить на небольшие PR: сначала pure services + unit tests; затем callable/emulator tests; затем UI improvements за выключенным transport gate; затем migration rehearsal. `CHAT_SERVER_TRANSPORT_ENABLED` остаётся false. Не менять legacy chat IDs и не переключать отправку/чтение до полного backup, полного live inventory, resumable migration, двух устройств и проверенного rollback.

### D. UI, accessibility и тестовая инфраструктура

- Улучшения мобильной прокрутки, async guards, retry/error состояния, escaping и ARIA tabs.
- Расширение emulator CI.
- `social-club-design.test.mjs` проверяет существующий экран друзей/его брендирование и доступность; это не реализация клубов или гильдий. Клубы остаются вне V1.

**Условие интеграции:** брать только изменения, привязанные к V1 и имеющие отдельные тесты; не добавлять клубную функциональность.

## Обязательные проверки до любого merge

1. Перебазировать/перенести выбранный узкий набор изменений на актуальную `main`; не разрешать конфликты массовым принятием одной стороны.
2. Для каждого PR указать Requirement IDs, поведение, тесты, риски и rollback.
3. Сохранить emulator-only guards у всех новых Callable Functions.
4. Сохранить отдельные preview Rules config; не подключать их к production `firebase.json`.
5. Сохранить выключенными `PUBLIC_PROFILE_READS_ENABLED` и `CHAT_SERVER_TRANSPORT_ENABLED`.
6. Не выполнять production writes, migration, Rules/Functions deployment или удаление legacy данных.
7. Проверить RU/EN, desktop/mobile, два аккаунта и два устройства на эмуляторах.
8. Повторно прогнать полный CI на head каждого отдельного PR.

## Рекомендуемый порядок

1. PROF-02: viewer projection / приватные поля (без read cutover).
2. FRIEND-01: серверная модель дружбы и emulator-only callable.
3. CHAT-01: отправка сообщений и membership checks.
4. CHAT-02/03: edit/delete/reactions/read cursor.
5. CHAT-04: миграция истории — только после DATA-01 и DATA-02.
6. UI/QA: браузерная приёмка с двумя аккаунтами и двумя устройствами.
7. Production cutover — только после Phase 0, отдельного approval и rollback rehearsal.

## Неизменяемые ограничения

- Не менять UID существующих аккаунтов.
- Не терять историю чатов, друзей, достижения, XP или coins.
- Не включать public profile/chat transport флаги до полного подтверждения миграции.
- Не деплоить preview Rules или preview Functions в production.
- Не считать успешные emulator tests подтверждением реальной конфигурации Firebase.

**Статус PR #3: Draft / не объединять целиком / интегрировать только отдельными проверяемыми PR.**
