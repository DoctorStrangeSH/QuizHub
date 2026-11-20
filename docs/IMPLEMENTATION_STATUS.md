# QuizHub — инвентаризация и статус реализации

Дата проверки: 2026-11-20  
Базовая ветка: main  
Базовый commit: 68f41925346dbbe93d3b5a0a73c89abe90c30f4a  
Связанное ТЗ: PRODUCT_SPECIFICATION_V1.md

> Это аудит исходников и GitHub-конфигурации. Он не является аудитом живой базы Firestore, развёрнутых Security Rules, Auth providers или production backup. Наличие тестов и серверных адаптеров не означает, что соответствующий путь включён в production.

## 1. Состояние репозитория

- Default branch: main.
- На проверенном commit в дереве репозитория — 187 файлов.
- Основные каталоги: app/, functions/, server/, tests/, scripts/, docs/, .github/workflows/.
- Root package.json отсутствует; Functions package и Node.js 22 build/check находятся в functions/package.json.
- Основные workflows:
  - firebase-emulator.yml — Firebase Emulator integration;
  - question-quality.yml — проверка UI-контрактов, вопросов и серверных unit tests;
  - visual-preview.yml — browser screenshot/smoke;
  - verify-gcp-oidc.yml — проверка конфигурации OIDC.
- После объединения PR #4 проверки commit 68f4192 завершились успешно: build, deploy, report-build-status и validate-questions.
- PR #4 содержал только документацию и объединён в main.

## 2. Инвентарь Firestore по исходникам

Источник: server/firestore-migration-inventory.mjs. Сам файл явно помечает этот список как repository-derived inventory, NOT a live database enumeration.

| Путь | Назначение по исходникам | Защита/состояние |
|---|---|---|
| users/{uid} | Приватный профиль, прогресс, экономика, друзья, косметика, достижения и статистика | Один документ смешивает приватные и публично используемые поля; клиентские чтения/записи остаются |
| chats/{chatId} | Родительский документ личного чата | Legacy client path |
| chats/{chatId}/messages/{messageId} | История сообщений, edits, deleted markers, reactions | Legacy client path |
| online/{uid} | Presence и lastSeen | Клиентская запись из chat module |
| dailyAttempts/{date}/users/{uid} | Попытки Daily Challenge | Серверный Firestore adapter |
| dailyPrizes/{date}/users/{uid} | Награды Daily Challenge | Серверный Firestore adapter |
| dailyReceipts/{date}/users/{uid} | Идемпотентные receipts наград | Серверный Firestore adapter |
| dailyRankings/{date} | Дневной рейтинг | Серверный Firestore adapter |
| quizSessions/{sessionId} | Серверные игровые сессии | Adapter и emulator tests есть; production rules и deployed path не подтверждены |
| publicProfiles/{uid} | Публичная проекция профиля | Backfill/sync code есть; read cutover выключен |
| nicknameClaims/{normalized} | Уникальность нормализованного никнейма | Серверная подготовка и emulator tests есть |

**Ограничение полноты:** этот список подтверждён только анализом репозитория. Он не доказывает отсутствие других root collections, orphan subcollections, старых или вручную созданных документов в живой базе. Перед закрытием этапа 0 нужна авторизованная read-only инвентаризация реального (default) database с рекурсивным обходом nested collections.

## 3. Клиентские чтения и записи, обнаруженные в main

### 3.1. Профиль и регистрация

Файл: app/modules/profile/profile.js.

При создании профиля браузер напрямую записывает в users/{uid}:
- nickname, nicknameLower, email;
- createdAt, level, experience, coins;
- quizzesCompleted, wins;
- friends, friendRequests, sentRequests;
- achievements, dailyStreak, lastDailyClaim;
- equippedTheme, equippedFrame, equippedParticles;
- ownedThemes, ownedFrames, ownedParticles, activeBonuses;
- stats: totalGames, totalWins, totalQuestions, correctAnswers, bestStreak.

Проверка никнейма выполняется запросом к коллекции, выбранной directoryCollection(). В main PUBLIC_PROFILE_READS_ENABLED = false, поэтому directory collection пока остаётся users.

### 3.2. Друзья

Файл: app/modules/friends/friends.js.

- Читает текущий users/{uid} и профили других пользователей.
- Поиск использует directory collection.
- Клиент напрямую обновляет документы обеих сторон: friendRequests, sentRequests, friends.
- Серверная транзакционная модель дружбы в main не экспортирована и не подключена.

### 3.3. Чаты и присутствие

Файл: app/modules/chat/chat.js.

- Читает друзей и их профили из users.
- Слушает online/{uid}.
- Записывает online/{uid} с online и lastSeen.
- Слушает chats/{chatId}/messages.
- Клиент напрямую создаёт сообщения, редактирует/мягко удаляет их и обновляет reactions.
- Серверный транспорт чатов и read cursor в main отсутствуют.
- Исторический ID чата строится из отсортированных UID через underscore join.

### 3.4. Игровые награды и экономика

Файлы: app/modules/quiz/modes/base.js, app/modules/quiz/modes/classic.js, app/modules/daily/daily.js, app/modules/shop/shop.js, app/modules/achievements/achievements.js, app/modules/reset-weekly.js.

Найденные клиентские операции:
- завершение квиза напрямую обновляет experience, weeklyExperience, coins, quizzesCompleted и статистику пользователя через updateDoc и increment;
- Classic дополнительно передаёт клиентские win counters;
- ежедневная награда напрямую увеличивает coins и dailyStreak, устанавливает lastDailyClaim;
- магазин напрямую списывает coins, добавляет ownership и меняет equipped items/bonuses;
- достижения вычисляются в браузере и записываются в users/{uid};
- weekly reset выполняется клиентским модулем, который читает коллекцию users и обновляет документы пользователей.

Следствие: пока эти пути не мигрированы и production Rules не проверены, клиентские значения экономики не являются доверенными. Нельзя включать restrictive owner-only rules отдельно от миграции этих сценариев.

### 3.5. Рейтинги

Файл: app/modules/leaderboard/leaderboard.js.

- Источник данных выбирается через profile read source.
- При выключенном публичном cutover запрос остаётся привязан к users.
- Публичная карточка и рейтинг не должны использовать полный приватный документ после перехода на public projection.

## 4. Backend и Firebase deployment boundary

### 4.1. Что находится в main

functions/index.mjs экспортирует:
- dailyChallenge — callable для Daily Challenge;
- quizSessionPreview — намеренно закрыт вне изолированного проекта demo-quizhub и локальных Auth/Firestore/Functions emulators;
- profileCreatePreview — намеренно закрыт вне того же изолированного emulator окружения.

В main нет экспортированных friend/chat callables. Серверные модули в server/ — подготовленные контракты/адаптеры и тестируемые компоненты; их наличие само по себе не означает подключение к браузеру или production.

Functions используют Node.js 22. functions/package.json содержит build/check scripts. Документ FIREBASE_FUNCTIONS_HANDOFF.md помечает Functions как prepared/compiled, NOT deployed.

### 4.2. Firebase config и Rules

Проверено:
- firebase.json содержит Functions source/runtime и emulator ports.
- В firebase.json нет Firestore rules или indexes deployment mapping.
- Root firestore.rules в main отсутствует.
- firebase.rules-preview.json указывает на tests/fixtures/quiz-sessions.rules для изолированного emulator теста.
- Preview rules нельзя считать production rules.
- В репозитории нет проверенного экспорта активных production Rules и indexes.

Документ FIREBASE_FUNCTIONS_HANDOFF.md указывает Firebase project ID quizhub-e65f5, database (default), Standard edition и region eur3. Это зафиксированная документация проекта, а не свежая независимая проверка консоли на дату данного аудита.



### 4.3. Ранее предоставленные владельцем сведения из Firebase Console

В предыдущем обсуждении QuizHub владелец предоставил скриншоты и текстовый снимок конфигурации:

- Firebase project ID: quizhub-e65f5; project number: 144587612719.
- Firestore: (default), Standard edition, Native mode, region eur3; база отмечена как активная.
- В сведениях от 2026-11-15 указано, что PITR и delete protection выключены.
- На скриншоте от 2026-11-19 scheduled backups выглядели выключенными.
- Предоставленный владельцем текст Rules snapshot содержал широкие authenticated read/write разрешения для users, chats, achievements, dailyRewards, shopItems, events и settings; проверки владельца присутствовали только для отдельных путей.

**Уровень достоверности:** это ранее предоставленные владельцем сведения и снимок, но не независимо полученный и криптографически/операционно подтверждённый экспорт активного release ruleset. Поэтому нельзя утверждать, что именно эти правила сейчас развернуты. Тем не менее снимок указывает на потенциально чрезмерно широкие права и должен рассматриваться как security warning до получения актуального экспорта.

Скриншоты подтверждают выбор базы и отдельные настройки, но не доказывают наличие полного backup или возможность восстановления. До отдельной restore rehearsal production data recovery остаётся неподтверждённым.

## 5. Открытый PR #3

PR #3 — https://github.com/DoctorStrangeSH/QuizHub/pull/3

- Статус: open.
- Изменено: 58 файлов, около 3 860 добавлений и 107 удалений.
- Три проверки PR на его head завершились успешно: emulator integration, question quality, visual preview.
- Review submissions и inline review threads на момент аудита отсутствуют.
- Ветка PR расходится с текущим main: общий предок — cb9a332; main содержит один последующий commit, ветка PR — около 110 commits относительно общего предка.
- PR включает не только redaction карточек, но и friend/chat server previews, chat migration rehearsal, read-state и расширения тестов/документации.
- Из-за масштаба, устаревшей базы и широкого состава изменений PR нельзя объединять автоматически по одному зелёному CI. Требуется пофайловое ревью, проверка соответствия Requirement IDs и перенос/разделение изменений по этапам ТЗ.

## 6. CI и публикация

На merge commit PR #4:
- Build — success.
- Deploy — success.
- Report build status — success.
- Validate questions — success.

У PR #4 все три PR checks также прошли. Это подтверждает успешную сборку/публикацию документационного изменения, но не заменяет сквозную приёмку V1.

## 7. Блокеры закрытия этапа 0

| ID | Проверка | Статус | Почему |
|---|---|---|---|
| DATA-01 | Полный live Firestore inventory | Blocked | В репозитории есть только source-derived inventory; нет read-only inventory из живой БД |
| SEC-02 | Экспорт и аудит активных Firestore Rules | Blocked | Нет подтверждённого экспорта deployed Rules; preview конфиги не подходят |
| SEC-02 | Активные Firestore indexes | Blocked | Нет подтверждённого production export |
| AUTH-01 | Проверка Auth providers и authorized domains | Blocked | Исходники не подтверждают текущие настройки Firebase Console |
| DATA-02 | Production backup/restore rehearsal | Blocked | Emulator backup tests не подтверждают полный и восстанавливаемый production backup |
| DATA-03 | Инвентарь legacy данных и orphan subcollections | Blocked | Нет подтверждённого live snapshot и рекурсивной сверки |
| REL-01 | Разбор PR #3 | Done (not merged) | Security-sensitive review выполнен; PR оставлен вне main до разделения и закрытия найденных требований |

## 8. Решение по этапу 0

**Этап 0: IN PROGRESS / BLOCKED ON PRODUCTION EVIDENCE.**

Выполнена source-level инвентаризация main, клиентских write paths, server exports, emulator-only конфигураций, CI и открытого PR. Но этап нельзя закрыть, пока не получены и не проверены:

1. Полный read-only список root/nested collections и документов живой базы.
2. Экспорт фактически развёрнутых Firestore Security Rules и indexes.
3. Подтверждение Auth providers и authorized domains.
4. Production backup с доказанной возможностью восстановления в отдельном безопасном окружении.
5. Ревью PR #3 завершено: не объединять целиком; будущие изменения разнести по этапам 2–3 и исправить найденные несоответствия.

**Запрещено до снятия блокеров:** менять production Rules, включать profile/chat cutover, запускать миграции реальных пользователей, развёртывать новые привилегированные Functions или удалять legacy данные.

## 9. Следующий разрешённый шаг

Попросить владельца запустить подготовленный read-only inventory collector с учётной записью Firestore Viewer и передать JSON. Отдельно получить актуальный опубликованный Firestore Rules export и indexes export, подтвердить Auth providers/domains и согласовать production backup/restore rehearsal. PR #3 не объединять целиком: его изменения остаются кандидатами для этапов 2–3 после разделения по Requirement IDs и устранения CHAT-03/DATA-01 gaps.

Новые продуктовые функции не добавлять.


## 10. Дополнительный source review PR #3 (2026-11-20)

Проверены server friendship transitions, friend callable adapter, chat send/actions/read-state adapters, chat migration preflight/chunked emulator copy, privacy preview rules, Functions exports и связанные тесты.

Положительные свойства preview-кода:
- Actor UID берётся из Firebase Auth context, а не из payload.
- Callable adapters используют строгие allowlists полей и отклоняют anonymous Auth.
- Дружба обновляет обе стороны в одной транзакции и сохраняет несоциальные поля.
- Отправка сообщения проверяет взаимную дружбу, immutable memberUids, длину/формат текста и идемпотентный clientMessageId.
- Редактирование/удаление ограничено автором; реакция — только собственным ключом участника.
- Preview Functions явно закрыты вне изолированных Auth/Firestore/Functions emulators.
- Миграционный copy ограничен disposable emulator, требует явного confirmation, сохраняет legacy source и сверяет скопированные сообщения.

Найденные несоответствия/незакрытые требования:
1. **CHAT-03 — unread reconciliation не завершён.** markDirectChatRead сохраняет lastReadMessageId/lastReadAt, но намеренно не пересчитывает unreadCount. Тест явно подтверждает, что счётчик остаётся прежним. Это cursor prototype, не завершённая read/unread система.
2. **DATA-01 — inventory не расширен под новую схему чата.** sendDirectMessage создаёт chats/{chatId}/members/{uid}, но server/firestore-migration-inventory.mjs не включает members subcollection. Backup/migration inventory должен учитывать её до принятия схемы.
3. **RANK-02 / PROF-02 — redaction не является сетевой приватностью.** Пока PUBLIC_PROFILE_READS_ENABLED выключен, directory reads всё ещё получают users documents с клиента; projectProfileForViewer лишь фильтрует поля перед передачей UI. Это не заменяет publicProfiles и owner-only Rules.
4. **CHAT-04 — миграция только emulator rehearsal.** Capture/copy не является production snapshot, не даёт point-in-time guarantee и не доказывает resumable rollout на живых данных.
5. **SEC-02 / REL-01 — production Rules и Functions deployment не подтверждены.** Preview rules/functions должны оставаться изолированными; их нельзя включать на production без полной миграции клиентов и отдельного release gate.
6. PR объединяет профильную приватность, friend transitions, chat transport, read-state, миграцию и визуальные изменения в одном крупном изменении. Для управляемой поставки эти области следует разделить на небольшие PR по этапам ТЗ.

### Решение по PR #3

**Не объединять сейчас.** Зелёный CI подтверждает только описанные тестовые сценарии; он не снимает перечисленные архитектурные и release blockers. Сначала разделить изменения по Requirement IDs, добавить недостающий members inventory, довести unread reconciliation до acceptance criteria и провести повторное ревью. Любое production cutover остаётся запрещённым до закрытия DATA-01, SEC-02 и DATA-02.


## 11. Подготовлен безопасный сбор live inventory

Добавлен read-only collector:
- server/firestore-live-inventory.mjs — рекурсивно обходит root и nested collections, включая subcollections под отсутствующими parent documents;
- functions/scripts/firestore-live-inventory.mjs — CLI, жёстко привязанный к Firebase project quizhub-e65f5 и database (default);
- tests/firestore-live-inventory.test.mjs — проверяет nested/orphan paths, схему полей без значений и abort при превышении лимита.

Collector возвращает только шаблоны путей коллекций, counts, имена полей и типы. Он не включает document IDs и значения полей. Он читает snapshots документов для определения существования и схемы, поэтому чтение может тарифицироваться. Максимум по умолчанию — 5 000 document references; абсолютный предел конфигурации — 20 000. При превышении лимита или глубины он прерывает выполнение и не выдаёт неполный отчёт.

### Запуск владельцем проекта

1. Установить зависимости Functions: npm install --prefix functions.
2. Выполнить gcloud auth application-default login под учётной записью с read-only доступом к Firestore.
3. В PowerShell задать явное подтверждение и project ID:

   ```powershell
   $env:QUIZHUB_CONFIRM_READ_ONLY_INVENTORY = "YES"
   $env:QUIZHUB_PROJECT_ID = "quizhub-e65f5"
   ```

4. Запустить:

   ```powershell
   node functions/scripts/firestore-live-inventory.mjs > quizhub-firestore-inventory.json
   ```
5. Передать полученный JSON для сверки с repository-derived inventory.

Скрипт не содержит write-операций и не выполняется автоматически CI. Его запуск против production должен делать владелец/уполномоченный оператор после проверки IAM и предполагаемого объёма чтений. Не помещать service-account keys или ADC credentials в репозиторий.


## 12. Owner-provided Firestore Rules snapshot and security review (2026-11-20)

The owner supplied a Rules text snapshot and identified it as the current console Rules. Exact text and detailed findings are preserved in [FIRESTORE_RULES_OWNER_SNAPSHOT_2026-11-20.md](audits/FIRESTORE_RULES_OWNER_SNAPSHOT_2026-11-20.md).

**Assessment: HIGH RISK.** The supplied Rules allow any authenticated user to read every `users/{uid}` document, read/create/update any chat parent, read/create any chat message, create notifications under any UID, create friend requests with unvalidated sender/recipient fields, delete any friend request, and write achievements, dailyRewards, shopItems, events and settings. Owners can update arbitrary fields in their own user document, including client-stored economy/progress fields. Question authors can change authorId during an otherwise authorized update. Transaction creation does not bind userId to the caller.

This is a source-text review of the owner-provided snapshot, **not an independently verified export of the active deployed Ruleset**. Obtain the active Rules and indexes export and compare it with the snapshot before treating it as production evidence.

### SEC-02 status

| Requirement | Status | Evidence |
|---|---|---|
| Owner-provided Rules text reviewed | Done | Exact snapshot and rule-by-rule review saved in docs/audits |
| Active deployed Ruleset independently exported and compared | Blocked | Requires Firebase Console/CLI export |
| Production indexes export | Blocked | Requires Firebase Console/CLI export |
| Least-privilege replacement Rules | Not started | Must follow migration of existing client write/read paths |
| Emulator security matrix for replacement Rules | Not started | Must include owner, stranger, anonymous, forged identity, non-member chat, malformed fields |
| Production deployment | Prohibited | No Rules deployment is authorized by this audit |

**Do not deploy restrictive Rules as a standalone change.** Current client code still writes profile/economy, daily rewards, shop state, achievements, friend arrays, chat messages and presence directly. A premature lock-down would break live product flows. The migration sequence and exact findings are documented in the audit file.

The owner-provided Rules snapshot increases the priority of SEC-02, but does not close Phase 0: DATA-01 live inventory, active Rules/indexes export, AUTH-01 console verification and DATA-02 backup/restore rehearsal remain open.


### 12.1. Статус инструмента live inventory после PR #6

Read-only collector и guarded CLI объединены в main через PR #6 (squash commit `4ee10fdeaf70acbabe56ae4930ac6d94acd9f513`). Все три PR checks прошли: Question quality, visual preview и Firebase emulator integration. Collector пока не запускался против production; DATA-01 остаётся открытым до получения отчёта от владельца/уполномоченного оператора.


## 13. Обновление после PR #5–#7 и повторная проверка Firebase deployment boundary (2026-11-20)

### Объединённые изменения
- PR #5 — source inventory, ТЗ V1 и синхронизация документации: merged.
- PR #6 — guarded read-only live Firestore inventory collector + tests: merged; commit `4ee10fdeaf70acbabe56ae4930ac6d94acd9f513`. Три проверки PR прошли.
- PR #7 — точный owner-provided Rules snapshot, rule-by-rule security assessment и уточнение критериев этапа 0: merged; commit `2a1ca51d59bdee5545afd65fc21e576ef0e496e7`. Все три проверки PR прошли.

### Повторно проверенные Firebase config файлы в main
- `firebase.json` содержит только Functions source/codebase/runtime и emulator ports. В нём нет `firestore.rules` и `firestore.indexes` deployment mapping.
- Root `.firebaserc` отсутствует.
- Root `firestore.rules` и проверенный production indexes export отсутствуют.
- Firebase emulator workflow запускает локальные Auth/Firestore/Functions emulators. Отдельный Rules preview workflow использует `firebase.rules-preview.json` и fixture для server-owned quiz sessions; это не production Rules deployment.
- В `.github/workflows/` обнаружены только firebase-emulator, question-quality, verify-gcp-oidc и visual-preview workflows; отдельного Firebase production deploy workflow в этом каталоге нет.

**Вывод:** repository evidence не подтверждает автоматический deploy Firestore Rules/indexes из main. Нельзя считать, что изменения локальных preview rules влияют на production. Активный production Ruleset и indexes необходимо получить из Firebase Console/CLI независимо.

### Обновлённый статус PR #7
PR #7 объединён после успешного завершения Question quality, Firebase emulator integration и Visual preview. Изменение документационное; никаких production Firebase ресурсов не меняло.

### Что остаётся единственным безопасным следующим шагом разработки
Не создавать и не публиковать новые production Rules на основании неполного inventory. Сначала получить live inventory JSON от owner-run collector, активный Rules/indexes export и backup/restore evidence. Затем подготовить отдельный emulator-only Rules candidate и полную матрицу регрессии против текущих клиентских сценариев. Production rollout — только после серверной миграции всех зависимых client write paths.


## 14. PR #8 merged and extension-readiness decision (2026-11-20)

PR #8 merged to main as commit `f60a8a8ba799a14b047a7dc2fda5bd5d67ad6af9` after all three checks passed: visual preview, question quality and Firebase emulator integration. The change documents the repository's Firebase deployment boundary; it did not deploy or change production Firebase resources.

### Architecture decision: finish V1 without blocking future versions

The owner explicitly requires that, after V1, new ideas can be added without repeatedly rebuilding the foundation. The V1 specification now contains section **10.2.1 — Готовность к расширению после V1**. It establishes:
- modular domain boundaries and explicit contracts;
- trusted backend as the sole authority for game results, rewards, purchases and permissions;
- versioned API/document schemas and backward-compatible additive data evolution;
- content/catalog-driven additions where appropriate;
- controlled feature flags for rollout, never as a replacement for authorization;
- separate CRs and migration plans for breaking changes;
- no speculative plugin framework or unnecessary abstractions.

This is an architecture quality requirement, not scope expansion. It does not add new V1 features or postpone V1 acceptance. V1 remains frozen to the approved feature list; future ideas enter V1.1 backlog and require owner-approved CRs after release.

### Current execution focus

Continue closing Phase 0 evidence gates. PR #8 is merged, but DATA-01 live inventory, independently exported production Rules/indexes, AUTH-01 Console verification and DATA-02 production backup/restore rehearsal remain blocked pending owner/operator evidence. Do not deploy Rules or migrate production data while these gates are open.


## 15. Stage 1 server game integrity source audit (2026-11-20)

A source-level audit against QUIZ-01..07 and ECON-01 is recorded in [STAGE_1_SERVER_GAME_INTEGRITY_2026-11-20.md](audits/STAGE_1_SERVER_GAME_INTEGRITY_2026-11-20.md).

**Result: Stage 1 NOT DONE.** The browser still determines answer correctness and writes XP, coins, game statistics and level directly to `users/{uid}`. Survival additionally writes bestStreak from the browser; Duel calculates the player/AI result client-side. The trusted `quizService` currently supports Classic only. Its `quizSessionPreview` callable is deliberately restricted to isolated emulators. The Daily Challenge callable is exported without that guard, but the repository cannot establish whether it is deployed; its current completion receipt does not grant competitive rewards, and no prize-claim callable is exported.

The implementation order must therefore be: complete Phase 0 production evidence; verify deployed Functions inventory; implement trusted state/scoring for all approved V1 modes; prove atomic idempotent rewards; switch browser flows behind tested adapters; then prepare the separate Rules/Functions release. No production cutover is authorized by this source audit.


## 16. PR #10 merged and Phase 0 owner evidence runbook (2026-11-20)

PR #10 (Stage 1 source audit + implementation-status link) merged to main as squash commit 7a9fc27388cd34ae3dbf82bec0c7fea3a559393c. All three checks passed: Question quality, visual preview and Firebase emulator integration. The detailed source audit is docs/audits/STAGE_1_SERVER_GAME_INTEGRITY_2026-11-20.md. Stage 1 remains NOT DONE.

Added docs/PHASE_0_OWNER_EVIDENCE_RUNBOOK.md with the exact owner/operator steps for the guarded read-only Firestore inventory, active Rules/indexes verification, Auth provider/domain verification and isolated production backup/restore rehearsal. The runbook does not execute production reads, write data, deploy resources or change application behavior.

### Current blockers

- DATA-01: live inventory has not been run against the production project by an authorized operator.
- SEC-02: the active published Ruleset and indexes still need independent Console export and comparison with the owner-provided snapshot.
- AUTH-01: production Auth providers and authorized domains still need Console verification.
- DATA-02: production backup has not yet been restored into an isolated recovery environment.
- PR #3: all three CI checks passed on its head at last review, but the branch is behind/conflicted with current main; it is not merged. Its own description correctly states that profile projection is UI/data-flow redaction, not network-level privacy. Do not enable public-profile cutover from this PR alone.

No production resources or user data were accessed or changed during this update.


## 17. PR #27–#28 merged; isolated browser preview for server-owned modes

- PR #27 merged: the browser mode-session controller can claim a session restored in `ready_to_complete`, fixing the resume/claim state mismatch.
- PR #28 merged as `b1e686cbe7eca394516622a00a860398fa2bc40b`: added the Firebase Functions SDK invoker for `quizModePreview`, restricted to localhost + explicit `firebaseEmulator=1` + the `demo-quizhub` project. All three CI checks passed.
- The callable remains guarded by the backend against non-emulator execution. No production Functions, Firestore Rules, indexes or user data were changed.

### Current browser integration work

PR #29 introduces a separate browser screen for the server-owned Survival, Duel and Time Trial preview. It is reachable only when all of these are true:
- browser host is localhost or 127.0.0.1;
- `firebaseEmulator=1` is present;
- `serverModePreview=1` is present;
- selected mode is Survival, Duel or Time Trial.

The screen uses the Firebase callable transport and existing server-mode session controller. The existing production game flow remains unchanged. This is an emulator integration surface, not a production rollout and not evidence that Stage 1 is complete.

### Remaining acceptance work

- Exercise the preview in a real browser against Auth, Firestore and Functions emulators with an authenticated test account.
- Verify Survival end-to-end first: start, server question, answer, lives/streak, finish, atomic receipt, refresh/retry.
- Add browser-level assertions for the preview screen and its error/retry states.
- Then validate Duel and Time Trial, including server AI outcome and server-enforced per-question deadlines.
- Continue Phase 0 owner evidence gates. No production cutover or Rules deployment is authorized.


## 18. PR #29 merged; browser session resume follow-up

- PR #29 merged to main as `a2078468f63db2fcb1ef4b84d4e2ee7dc4ee7b17` after Question quality, visual preview and Firebase emulator integration all passed.
- The emulator-only browser preview now has an explicit local integration route for Survival, Duel and Time Trial. It is not a production mode switch and does not complete Stage 1 acceptance by itself.

### Follow-up implementation

PR #30 adds browser-side persistence of only the opaque server session ID in `sessionStorage`, partitioned by mode. On re-entry/refresh the preview asks the authenticated server to resume that session rather than silently starting a fresh run. Missing sessions are cleared and restarted; network/auth failures are not silently discarded. Sessions are cleared from browser storage only after a successful reward claim.

The preview now renders resumable states explicitly:
- `in_progress`: continue with the server-delivered question;
- `ready_to_complete` / `expired`: offer the server claim operation;
- `completed`: show the server receipt/result.

Only the session identifier is stored in browser session storage; scores, correctness, answer keys and reward values remain server-owned.

### Acceptance still required

- Run an authenticated browser session against the local Auth, Firestore and Functions emulators.
- Confirm refresh in the middle of Survival restores the same session and current question.
- Confirm refresh after completion allows one idempotent claim and does not duplicate rewards.
- Verify Duel and Time Trial resume behavior, including server deadlines.
- Do not deploy production Functions/Rules or switch production gameplay until the Phase 0 owner evidence gates and full Stage 1 acceptance are complete.


### Server-owned progress projection (PR #30 follow-up)

The server mode session service now returns a deliberately limited `progress` projection on start, resume and accepted-answer responses:
- Survival: answered/total, score, lives, current streak and best streak;
- Duel: answered/total, player score, opponent score and correct-answer counts;
- Time Trial: answered/total, score and correct-answer count.

The browser session controller carries this projection without deriving competitive state locally. The preview renders Survival lives/streak and mode score information from this server response. Canonical answer keys remain excluded from all public question and progress payloads.

The persisted session lifecycle and progress projection are still emulator-preview work; authenticated browser acceptance and the Phase 0 production evidence gates remain outstanding.


## 19. PR #30 merged; Time Trial countdown UI

- PR #30 merged to `main` as `917ae48f540309e8df108e81e8f96bb3f790dbeb`. Question quality, visual preview and Firebase Emulator integration all passed for the final PR head.
- Server-owned session IDs now survive refresh in sessionStorage; public progress is returned by the session service and carried by the browser controller.

### Current follow-up: Time Trial clock

PR #31 adds a localized live countdown and progress bar for the Time Trial browser preview, driven by the server-provided `questionDeadlineAt`. It updates locally for presentation only. At zero, answer choices remain available so the server can authoritatively decide whether the submission arrived before or after the deadline; the browser never awards/denies points or marks a timeout itself.

The clock calculation is a pure helper with unit tests for formatting, urgency, expiry and invalid timestamps. Question quality CI runs those tests and syntax-checks the preview screen. Styling follows the existing Midnight Arcade timer components.

### Acceptance still required

- Validate the Time Trial clock in an authenticated browser against the local Firebase emulators.
- Confirm a timely answer and a late answer are resolved by server time, not the browser countdown.
- Confirm refresh resumes the same deadline rather than resetting the 15-second question timer.
- Continue full Survival and Duel browser acceptance, then the broader Stage 1 gates. Production Functions/Rules remain untouched.


## 20. PR #31 merged; Survival feedback follow-up

- PR #31 merged to `main` as `9a665dc45a8eb7c2ce8b0d44c201e934e9bfbfc4` after Question quality, visual preview and Firebase Emulator integration all passed.
- Time Trial preview now displays a localized countdown and progress bar based on the server-owned question deadline. The browser does not make timeout or scoring decisions.

### Current follow-up: Survival lives and feedback

PR #32 presents the existing server-owned Survival rules more clearly:
- Three lives are rendered as filled/empty hearts with an accessible count.
- Current streak and best streak remain visible as server-provided progress.
- When a wrong answer reduces the life count, the feedback screen explicitly communicates the lost life; the final-life warning is localized in Russian and English.
- Visual motion respects `prefers-reduced-motion`.
- Server lifecycle coverage verifies that the third lost life ends the run immediately, returns zero lives and no next question, and permits result finalization.

This is a presentation and acceptance-coverage improvement; it does not change Survival scoring, life count, reward rules or production Firebase behavior.


## 21. PR #33 merged; Duel round presentation follow-up

- PR #33 merged to `main` as `54322e18c62577800e366a426d5b2412bf4d1d82` after Question quality, visual preview and Firebase Emulator integration passed.
- Survival now displays the three server-owned lives as accessible hearts, with localized life-loss and final-life feedback. The third lost life is covered by a server lifecycle test.

### Current follow-up: Duel round and final result UI

PR #33 adds a compact head-to-head scoreboard with both server-owned scores and round progress, a per-round comparison of the player's answer and the simulated opponent's outcome, and a final win/loss/draw presentation using the server-confirmed result.

The UI does not simulate the opponent, calculate points, or determine the winner. It only displays `aiCorrect`, score totals and `outcome` returned by the trusted session service. The existing V1 Duel rules and difficulty probabilities are unchanged.

Automated UI contract tests cover the scoreboard, round feedback, localized labels and final result presentation. Authenticated browser acceptance for all server-owned modes remains outstanding; production Functions/Rules remain untouched.


## 22. Mode reward claim edge-case coverage

- PR #33 is merged. Duel now shows both server-owned scores, per-round outcomes and the final win/loss/draw result.
- Added focused regression coverage for reward finalization:
  - Duel draws and losses never increment player win counters.
  - Survival can claim immediately after the third lost life and preserves the profile's previous best streak with max semantics.
  - Time Trial's win boundary is exactly 7 correct answers out of 10; 6/10 is not a win.
- These tests exercise the existing atomic mode reward claim transaction. No reward formula, mode rule, production callable or Firestore Rules behavior is changed.
- Next release work remains gated by authenticated browser acceptance and the Phase 0 operator evidence in `V1_SERVER_MODE_INTEGRATION_CONTRACT.md`. Do not enable production mode callables or deploy production Functions/Rules as part of this test-only follow-up.


## 23. PR #35 merged; terminal Survival replay hardening

- PR #35 merged to `main` as `98ee636cd5f41bde1b56141c341be19779850adf` after Question quality, visual preview and Firebase Emulator integration passed.
- Reward-claim regression coverage now includes Duel draw/loss counters, Survival zero-life claims and preserved best streak, and the exact 70% Time Trial win threshold.
- A follow-up source review found that replaying the accepted answer which consumed Survival's final life could return the next question in the response even though the run was already terminal. The server already marked the replay as finished and did not persist another transition, but the response contradicted the terminal state.
- PR #35 fixes the replay response to return `nextQuestion: null` whenever the mode is finished, and adds a regression test that retries the third lost life and verifies the session remains terminal through resume.
- This is a server response consistency fix only; no Survival rules, scoring, reward calculation, or production deployment behavior changes.


## 24. PR #36 merged; concurrent answer retry hardening

- PR #36 merged to `main` as `81b47182aa334bcc56ab483b9c991262562a0723` after Question quality, visual preview and Firebase Emulator integration passed.
- Added a concurrent identical-answer Duel regression test: overlapping requests commit one round, use one opponent random roll, return identical authoritative progress and produce exactly one replay response.
- This validates the server session service contract; it does not imply that the existing browser app has been switched to the server path.

## 25. Client economy write audit

- Current PR #37 adds a source-derived inventory of direct browser writes to quiz rewards, profile bootstrap, shop purchases/bonuses, daily claims and achievements.
- The audit confirms the client-side economy migration is still incomplete. The server reward/session services are not yet wired into the production browser flow.
- Release remains BLOCKED until each economic write is migrated to a trusted, idempotent transaction, production Rules/Functions/data evidence is reviewed, and authenticated browser acceptance passes.
- No production configuration, data, Rules, Functions or browser behavior is changed by this documentation-only follow-up.


## 26. PR #38 merged; transactional shop purchase foundation

- PR #38 merged to `main` as `fea5b8014320173ae5e7e6359a2d2aca78256fb6` after Question quality, visual preview and Firebase Emulator integration passed.
- The server purchase service reads authoritative item price/effect/duration from the shared shop catalog, validates balance and ownership, and applies cosmetic/bonus changes in one transaction.
- Purchase receipts are immutable and keyed by a per-user idempotency key; retrying the same operation returns the original receipt without a second debit.
- The Firestore adapter writes only the approved economy/shop fields and preserves unrelated profile data.
- This backend foundation is not yet connected to the production browser shop. Existing client writes remain a release blocker.

## 27. Emulator-only shop callable preview

- Current PR #39 wires the shop purchase service through an authenticated handler and Firebase callable transport, deriving UID from verified Firebase Auth context and time on the server.
- Adds `shopPurchasePreview`, guarded to the isolated Auth + Firestore + Functions emulator project only. Non-emulator projects fail closed; no production callable is enabled.
- Adds handler and callable tests for authentication, rejection of client UID/extra fields, server clock, business error mapping and private internal error suppression.
- Browser shop migration, Firestore Rules changes and production deployment remain explicitly out of scope. No live user data is changed.
