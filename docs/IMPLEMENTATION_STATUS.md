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
| achievementFacts/{uid} | Доверенные серверные факты прогресса достижений | Запись только через Admin SDK в транзакциях серверных наград; production Rules/cutover отдельно не включены |
| achievementUnlockReceipts/{uid}/unlocks/{achievementId} | Неизменяемые квитанции выдачи достижений | Создаются серверными транзакциями; клиентский доступ не включён |
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


## 28. PR #39 merged; emulator-only shop purchase preview

- PR #39 merged to `main` as `8c6cb249eb419e3efd1ae8cf7d264e5390d33cfe` after Question quality, visual preview and Firebase Emulator integration passed.
- The shop callable derives UID from verified Auth context and server time, rejects client-supplied prices/identity, and is guarded to the isolated demo Auth + Firestore + Functions emulator.
- Production shop writes and Firestore Rules remain unchanged; browser migration remains outstanding.

## 29. Server daily login reward foundation

- Current PR #40 adds a server-owned daily login claim using the existing seven-day reward schedule: 10, 20, 30, 50, 75, 100 and 200 coins.
- Claim eligibility, UTC day boundary, streak continuation/reset and coin balance are computed on the server. A durable per-user/per-day receipt makes retries idempotent.
- Firestore adapter updates only `coins`, `dailyStreak` and `lastDailyClaim`, preserving all other profile fields. It understands legacy Firestore Timestamp values and blocks a same-day repeat even if the new receipt is absent.
- Adds an authenticated callable boundary and `dailyLoginRewardPreview`, guarded to isolated Firebase emulators only.
- Tests cover reward schedule, streak progression/reset, concurrent retries, legacy timestamp compatibility, auth/field validation, callable error mapping and Firestore field preservation.
- Existing browser `app/modules/daily/daily.js` is not yet switched to the callable. No production deployment or live data changes. Production release remains blocked pending client migration, rules review and authenticated acceptance.


## 30. PR #40 merged; emulator-only daily login reward foundation

- PR #40 merged to `main` as `d3a7784daee06a456b9f8104f78f38157dd400e0` after the corrected Question quality, Firebase Emulator and visual preview workflows all passed.
- The server-owned daily claim preserves the existing seven-day reward schedule, computes UTC streak progression, and records immutable per-user/per-day receipts for idempotency.
- The browser daily claim remains unchanged; production Functions/Rules and live user data were not modified.

## 31. Server achievement unlock foundation

- Current PR #41 adds a data-driven achievement catalog and transaction-backed unlock evaluator.
- The first supported definitions use only server-maintained facts: quiz completions, experience and level. Existing definitions that depend on wins, best streak, friends or coin balance are deliberately deferred until their evidence is generated and maintained by trusted server flows.
- Callable requests accept no progress, achievement IDs or user identity from the browser. UID comes from verified Firebase Auth context.
- Firestore reads a separate `achievementFacts/{uid}` document and writes only the profile `achievements` field plus immutable per-achievement unlock receipts.
- The preview is guarded to the isolated Auth + Firestore + Functions emulator. The existing achievement UI and client-side unlock code are not switched in this PR.
- Important integration gap: trusted quiz finalization does not yet populate `achievementFacts`. Therefore the preview is a secure evaluation foundation, not an active unlock pipeline. Do not copy client-maintained profile statistics into this collection or claim the economy is server-authoritative.
- No production deployment, Rules changes, live data migration or browser behavior changes.


## 32. PR #41 merged — achievement unlock foundation

- PR #41 merged into `main` as `8c6773cd73f77aea32bba5fbd3b7b208d6ac8186`.
- All three required checks passed on the final PR head: Question quality, QuizHub visual preview, and Firebase emulator integration.
- Added a data-driven achievement catalog and transaction-backed unlock evaluator.
- The evaluator reads only `achievementFacts/{uid}`; callable input cannot supply identity, progress, or achievement IDs.
- Profile writes are restricted to the `achievements` field. Each new unlock receives an immutable receipt under `achievementUnlockReceipts/{uid}/unlocks/{achievementId}`.
- `achievementUnlockPreview` is restricted to the isolated Auth + Firestore + Functions emulator.
- **Not yet integrated:** trusted quiz finalization does not populate `achievementFacts`. The existing browser achievement logic remains unchanged. No production deployment, live migration, Rules change, or production unlock behavior is implied.
- Next implementation slice: populate achievement facts atomically from trusted quiz reward finalization, and verify the fact-to-unlock path in emulator tests. Do not source facts from browser profile fields or enable production cutover as part of that slice.


## 33. PR #42 merged — trusted achievement facts from server-owned quiz claims

- PR #42 merged into `main` as `322f6d7ad70b8189a9e85a045daebeb05e7fb2dd` after Question quality, Firebase Emulator integration and QuizHub visual preview all passed on the final head.
- Classic and server-owned Duel, Survival and Time Trial reward claims now derive achievement facts from the server-calculated reward inside the same Firestore transaction as the reward/session receipt.
- Facts are stored separately at `achievementFacts/{uid}`: `totalGames`, `experience`, and a server-owned `unlockedIds` ledger. New unlock receipts are created at `achievementUnlockReceipts/{uid}/unlocks/{achievementId}`.
- The profile's existing `achievements` array is preserved and unioned with server-earned IDs for compatibility, but it is **not** trusted as the source of truth for deciding whether a new achievement has already been earned. A forged legacy profile ID cannot suppress the server unlock receipt.
- A first trusted claim starts the server fact baseline at zero. Existing `users/{uid}.stats`, `experience`, and `level` are not copied into the trusted ledger because those fields have historically been writable by the browser. Existing users need a separately reviewed migration/baseline strategy.
- Active server catalog currently covers first/10/50/100 completed quizzes and 1000 XP. Level 5/10, wins, perfect score, social and collector achievements remain deferred until their authoritative evidence/calculation is implemented. The existing profile level is not trusted and no level formula was established in the current code audit.
- The achievement preview evaluator now uses the server-owned `unlockedIds` ledger and persists it with immutable receipts.
- Tests added/extended for classic and mode reward claims, concurrent retries, legacy profile ID spoofing, and trusted fact baselines. CI now runs these claim suites alongside achievement service/callable tests.
- Production remains unchanged: no Functions deployment, Rules migration, browser cutover or live-data migration was part of this PR.
- Next slice: add further achievement facts only where the server already has authoritative evidence (for example verified wins and perfect runs), with catalog-driven thresholds and emulator coverage. Keep existing-user baseline and production client cutover as separate reviewed milestones.


## 34. PR #43 merged — trusted win and perfect-run achievement milestones

- PR #43 merged into `main` as `799a5863ff7e94e348070f678594732dd276ec93` after Question quality, Firebase Emulator integration and QuizHub visual preview all passed on the final head.
- The server achievement ledger now tracks `totalWins` and `perfectGames` in addition to completed games and experience.
- Classic win calculation now matches the existing browser V1 rule: at least 70% correct. The trusted Classic reward transaction now increments `users/{uid}.wins` and `stats.totalWins` as well as the corresponding server-owned achievement fact. This closes a gap in the previous Classic server claim path.
- Duel and Time Trial use their already validated server-owned win result. Survival does not award a win. Draws and losses do not increment win facts.
- `perfect_score` is now based on a server-verified 10/10 result (`totalQuestions === 10` and `correctAnswers === 10`), matching its visible achievement description rather than trusting the browser's legacy streak calculation.
- Active catalog now includes `first_win`, `ten_wins`, and `perfect_score`. Level, social and collector achievements remain deferred until their trusted facts and formulas are implemented.
- Facts are derived only from validated server session results and persisted atomically with reward/session receipts. Existing client-maintained totals are not imported.
- The existing browser `checkAchievements()` path and achievement UI are intentionally not cut over here. Production Functions, Firestore Rules and browser behavior remain unchanged; the emulator-only boundary is preserved.
- CI and Firestore Emulator integration passed on the final PR head.


## 35. Migration preservation inventory includes trusted achievements

- Updated `server/firestore-migration-inventory.mjs` to include `achievementFacts/{uid}` and nested `achievementUnlockReceipts/{uid}/unlocks/{achievementId}`.
- Both paths are marked `preserve: true`; a future migration snapshot must include them and recursively enumerate the nested unlock receipts.
- Extended `tests/firestore-migration-inventory.test.mjs` to assert both paths exist in the source-derived inventory.
- This is a repository manifest update only. It does not enumerate the live database, change deployed Rules, or migrate production documents.

## 37. Local browser integration for trusted daily login claims

- Added a browser callable invoker for `dailyLoginRewardPreview`, requiring localhost/127.0.0.1, both explicit query flags (`firebaseEmulator=1&dailyLoginPreview=1`) and Firebase project `demo-quizhub`.
- The daily reward UI now uses the trusted callable only when that exact local preview is requested. In that path the browser does not calculate eligibility, streak, reward amount or balance; it validates the returned receipt and adapts it for the existing popup.
- Preview transport failures do not fall back to direct Firestore writes. Production behavior is unchanged for now and remains a known client-economy release blocker.
- Added automated tests for host/project/flag gating, callable envelope validation, receipt mapping, duplicate-claim response and malformed receipts. Added the test and syntax check to Question Quality CI.
- No production callable was enabled, no Functions/Rules deployment occurred, and no live data was accessed or changed.
- Next acceptance: run the browser against Auth, Firestore and Functions emulators with a test account; verify first claim, same-day retry, next-day streak continuation/reset and concurrent claims. Keep production cutover blocked pending Phase 0 evidence and full browser acceptance.

## 39. Trusted level milestones — corrected XP derivation

- Level achievements are derived from the same V1 formula used by the existing client progression: `floor(totalTrustedXP / 100) + 1`.
- The level is computed only from `achievementFacts.experience`, which is advanced inside the trusted quiz reward transaction. The client-maintained `users.level` and legacy `users.experience` fields are not imported.
- Threshold tests cover level 5 at 400 XP, level 10 at 900 XP, and rejection of a forged legacy level.
- Updated emulator and reward fixtures to assert the persisted server-owned level.
- This replaces the earlier carry-forward-only approach, which could leave level facts absent and therefore never unlock level milestones for new trusted progress.
- Production migration remains blocked until Phase 0 evidence and an approved baseline strategy for existing users are complete.

## 40. Shop browser integration — emulator acceptance passed

- The browser shop now has an explicitly guarded local transport for `shopPurchasePreview`: localhost/127.0.0.1, both `firebaseEmulator=1&shopPreview=1` flags, and Firebase project `demo-quizhub` are required.
- Cosmetic purchases, bonus purchases and equip actions use the authenticated callable only in that local preview. The client does not submit prices, UID, bonus duration or trusted balance values.
- The server derives the catalog price, checks ownership and balance, computes bonus expiry from server time, applies changes transactionally, and persists idempotent purchase receipts.
- Fixed the Firestore UID validator to accept standard Firebase Auth UIDs. The prior escaped control-character pattern rejected ordinary UIDs and caused the end-to-end purchase request to fail.
- Firebase Auth + Functions + Firestore Emulator integration now passes, including purchase, duplicate retry, equip, ownership rejection, insufficient balance, forged fields and idempotency-key reuse. Browser transport and syntax tests are included in Question Quality CI.
- Production shop behavior remains unchanged. Legacy direct Firestore writes are still a release blocker; no production Functions/Rules deployment, migration or live-data access occurred.
- Next acceptance: merge only after all three required CI checks pass on this branch, then proceed with the remaining economy migration in the V1 specification.


## 42. Local browser preview for trusted profile creation

- Added an emulator-only browser transport for `profileCreatePreview`, requiring localhost/127.0.0.1, `firebaseEmulator=1&profileCreatePreview=1`, Firebase project `demo-quizhub`, and a non-anonymous authenticated account.
- In preview mode the browser submits only the nickname. The callable derives UID and email from verified Firebase Auth and the server transaction creates the private user profile, privacy-safe public profile and unique nickname claim together.
- The browser validates the callable receipt against the signed-in UID and requested nickname. Preview transport errors never fall back to client-side `setDoc`.
- Added transport tests for emulator gating, anonymous/production rejection, nickname validation, minimal request payload and forged receipt rejection. The existing Firebase emulator workflow already exercises the authenticated profile callable, concurrent nickname reservation, duplicate handling, initial balance and public/private field separation.
- Production registration remains unchanged. Existing-user migration, nickname-claim backfill, Rules review and owner acceptance are still required before production cutover.

## 43. Classic server-session preview merged; browser acceptance expanded

- PR #53 merged into `main` as `3ebc948081cb8aa81a1621a30b1a9a4bb0bffaed` after Question Quality, Firebase Emulator and Visual Preview passed.
- Added a dedicated emulator-only browser transport for `quizSessionPreview`, guarded by localhost/127.0.0.1, `firebaseEmulator=1&serverModePreview=1`, and Firebase project `demo-quizhub`.
- The existing server-mode session controller and preview screen now support Classic (10 questions) as well as Duel, Survival and Time Trial. Classic uses the trusted quiz callable's `start`, `answer`, `resume` and `complete` operations; the client adapter maps the shared UI's claim action to `complete`.
- Canonical questions and answer keys remain server-side. The browser submits only session/question identifiers, selected option index and language; it does not submit score, correctness, UID, XP or coins.
- Trusted reward calculation, win/perfect facts, achievement progress and reward receipts remain inside the server's atomic claim transaction.
- Added isolated transport/client tests and CI syntax checks. The existing Auth + Firestore + Functions emulator callable suite covers Classic session ownership, answer validation, retries and reward persistence.
- Added an authenticated Playwright browser acceptance test that creates a test profile, completes ten questions through the real callable transport, claims the result and verifies an idempotent retry against Firestore.
- The production Classic UI still uses its legacy client-computed reward writer. This PR enables local acceptance only; production cutover, existing-user baselines and restrictive Rules remain separate blocked milestones.


## 44. Trusted daily-login reward browser acceptance

- Added an authenticated Playwright browser test using only the `demo-quizhub` Auth, Firestore and Functions emulators.
- The test creates a new test account and profile through the app, then calls the existing `claimDailyReward()` browser entry point with the explicit local `dailyLoginPreview=1` flag.
- The browser verifies the first-day reward, server-returned balance, persisted streak and claim timestamp; a same-day retry must return no reward and leave balance/streak unchanged.
- Added the browser test to Firebase Emulator CI. Existing callable tests continue to cover UTC day boundaries, streak continuation/reset and concurrent claims.
- Production behavior is unchanged: outside the exact local preview gate, the legacy client-side daily reward write remains active. Do not enable restrictive production Rules or claim server-authoritative daily login until browser acceptance, existing-user baseline/migration and release gates are complete.


## 45. Server-owned Daily Challenge browser acceptance

- Added an authenticated Playwright browser test for the existing `dailyChallenge` Firebase callable, using only the `demo-quizhub` Auth, Firestore and Functions emulators.
- The browser signs in through Firebase Auth, starts the server-selected 10-question daily session, submits all answers through the callable, and completes the session.
- The test verifies public question payloads do not expose answer keys, the server receipt contains the canonical score/correct-answer count, a repeated completion returns the original receipt, and resume reports the completed session.
- Added the test to Firebase Emulator CI. The service uses the server's UTC date, canonical question catalog, answer ordering and scoring; no browser score or reward is accepted.
- Important limitation: this is a server-session/score receipt, not a ranked leaderboard or reward payout. The current Daily Challenge UI remains explicitly practice-only and is not yet connected to this callable. Ranking seal, prize claims, browser UI migration and production security cutover remain separate work.


## 46. Daily Challenge server-backed local UI preview

- PR #56 merged the authenticated browser acceptance for the `dailyChallenge` callable. The emulator test verifies the complete ten-question session, answer-key privacy, server-derived score receipt, idempotent completion and resume.
- Added a local-only browser transport for `dailyChallenge`, guarded by localhost/127.0.0.1, `firebaseEmulator=1&dailyChallengePreview=1` and Firebase project `demo-quizhub`.
- The quiz route can now opt into a server-backed Daily Challenge screen. The browser receives only public question text/options, sends selected option indexes, and displays per-answer correctness/points only after the server has accepted the answer.
- The final result is rendered from the server receipt and explicitly remains practice-only: no leaderboard placement, XP, coins or prize claim is implied.
- The server answer response now includes a minimal post-submission feedback object; retries return the same verified feedback without recording a second answer.
- Added client/invoker validation tests and syntax checks to Question Quality CI.
- Added an authenticated browser test for the actual quiz route: it plays all ten questions through the local server preview, verifies the practice-only receipt, reloads the page and confirms the same server-owned result is restored. Production UI remains on the existing practice implementation until a separately reviewed migration, account compatibility plan and Rules release gate are complete.
## 47. Daily ranking and prize claims — real Firestore emulator acceptance

- Added a dedicated Firebase Admin integration test for the existing Daily Challenge ranking seal and prize services.
- The test writes finalized server receipts through the production Firestore adapter, rejects sealing before UTC day close, seals one immutable snapshot under concurrent requests, and verifies repeat sealing is idempotent.
- It simulates a later source-receipt mutation and verifies the sealed snapshot remains unchanged.
- It runs concurrent prize claims against Firestore transactions and verifies exactly one XP/coin credit per player, correct rank tiers, stable retry receipts, and preservation of unrelated private profile fields.
- The test uses unique disposable emulator documents and fails closed unless both FIRESTORE_EMULATOR_HOST and project demo-quizhub are present. It is included in Firebase Emulator CI.
- This is persistence/transaction acceptance only. It does not approve the currently proposed prize amounts, expose a production claim endpoint, enable ranked UI, or authorize a production Rules/Functions deployment.
- PR #58 merged into main (squash commit `464b4df`). Final head passed all three required checks: Question Quality, Visual Preview, and Firebase Emulator integration.
- The real Firestore Emulator workflow also completed its read-only backup capture and server-session Rules checks successfully. No production deployment or live database writes were performed.
## 48. Duel, Survival and Time Trial — authenticated callable emulator acceptance

- Added a real Auth + Functions + Firestore Emulator acceptance test for all three non-Classic V1 modes through the exported, emulator-guarded `quizModePreview` callable.
- The test creates isolated authenticated users, rejects forged UID/score payloads and cross-user access, and verifies public question payloads omit canonical answer keys and point values.
- It plays each mode through server-owned start/answer/claim/resume operations, verifies exact answer retries do not add a second transition, and confirms claim retries return the original receipt without a second XP/coin credit.
- It checks persisted profile balances/statistics and preservation of unrelated profile, preference and social fields.
- The test uses only `demo-quizhub` emulators, disposable user/session documents and cleanup. It is included in Firebase Emulator CI.
- This does not authorize browser cutover, production Rules/Functions deployment, or completion of Stage 1; production release blockers and Phase 0 evidence remain open.
- PR #59 merged into main (squash commit `b9b6732`). Final head passed Question Quality, Visual Preview, and Firebase Emulator integration.
- The real emulator run also completed the read-only backup capture and server-session Rules checks. No production deployment or live database writes were performed.
## 49. Duel, Survival and Time Trial — browser UI preview acceptance

- Added an authenticated Playwright browser test that opens the actual quiz route with the explicit localhost + `firebaseEmulator=1&serverModePreview=1` opt-in.
- The browser signs in through Auth Emulator and renders the existing server-mode preview screen for Duel, Survival and Time Trial.
- It verifies mode-specific UI (Duel scoreboard, Survival lives, Time Trial clock), submits an answer through the real callable transport, checks server feedback, advances to the next question and confirms the accepted progress counter.
- The test fails closed outside project `demo-quizhub` with Auth and Firestore emulators, removes its disposable sessions/account, and is included in Firebase Emulator CI.
- This is one-question UI acceptance only. The complete session/reward lifecycle remains covered by the separate server callable integration test. Production UI and Rules remain unchanged.
- PR #60 merged into main (squash commit `6f0bd4b`). All required checks passed: Question Quality, Visual Preview, and Firebase Emulator integration.
- The authenticated Playwright test verified all three mode-specific preview interfaces and server-backed answer/progress flow on isolated Firebase emulators. This remains an emulator-only preview; no production UI or Rules cutover occurred.
## 50. Daily Challenge callable release guard

- Source audit found `dailyChallenge` was the only game callable exported without the explicit `demo-quizhub` + Auth/Firestore/Functions emulator guard used by the other preview callables.
- Added the same fail-closed guard. It now rejects requests outside the isolated Firebase emulators with `DAILY_CHALLENGE_PREVIEW_DISABLED`.
- Existing authenticated Daily Challenge browser acceptance continues to exercise the callable through the emulators.
- This source change does not prove or change which Functions are currently deployed. Phase 0 still requires the owner/operator to inventory deployed Functions; if an older `dailyChallenge` deployment exists, it remains live until a separately approved deployment updates it.
- No production deployment, Rules change, or live data access was performed.

## 51. Daily Challenge callable emulator guard merged

- PR #61 merged into main (squash commit `b937b03`).
- `dailyChallenge` now has the same fail-closed `demo-quizhub` + Auth/Firestore/Functions Emulator guard as the other preview callables.
- All three required workflows passed: Question Quality, Visual Preview and Firebase Emulator integration.
- No production deployment, Rules change or live data access was performed. This source change does not update a previously deployed Function; Phase 0 deployed Functions inventory remains required.

## 52. Callable emulator guard regression prevention

- PR #62 merged into main (squash commit `9f7fab1`).
- Added `tests/firebase-callable-emulator-guards.test.mjs`, which enumerates all exported `onCall` functions and asserts the project, Auth, Firestore and Functions Emulator checks plus fail-closed behavior.
- Added the test to Question Quality CI so newly exported callables cannot silently omit the emulator guard.
- Final CI passed: Question Quality, Visual Preview and Firebase Emulator integration. No production deployment or live data access.


## 53. Classic server-mode browser acceptance merged (2026-11-21)

- PR #63 merged into `main` as squash commit `4c7b09f8d8529ecadda89852ea6133d8d38e4d39`.
- The shared server-mode session storage adapter now accepts and persists Classic session IDs alongside Survival, Duel and Time Trial; unsupported modes remain rejected.
- The authenticated Playwright browser acceptance now covers all four modes through the actual quiz route and callable transport, checks mode-specific UI, verified answer feedback and one-question progression.
- A locale-sensitive assertion was corrected: Classic acceptance now requires a non-empty mode badge rather than hard-coding the English label, so the test works with the Russian default locale.
- Final required CI checks passed: Firebase Emulator integration, Question Quality and Visual Preview. Emulator integration also completed its isolated read-only Firestore snapshot capture and server-owned session Rules checks.
- All changes remain emulator/test-only. No production client cutover, Firebase deployment, Rules change or live data access occurred.

### Current next step — Phase 0 owner evidence

The only open pull request is the legacy PR #3. It remains intentionally unmerged; do not merge it wholesale.

Development is now blocked on production evidence that cannot be inferred from repository tests:
1. Owner-run read-only live Firestore inventory JSON for project `quizhub-e65f5`.
2. Current deployed Firestore Rules and indexes exports.
3. Firebase Authentication provider and authorized-domain settings.
4. Production backup configuration and a verified restore rehearsal in a safe separate environment.

Until these are reviewed, do not deploy restrictive Rules, migrate live profiles, enable production server-mode cutover, or delete legacy data.


## 54. Phase 0 deployment-boundary source audit (2026-11-21)

- Rechecked `functions/index.mjs`: all seven exported callable endpoints are explicitly guarded to require project `demo-quizhub` and the Auth, Firestore and Functions emulators together. The callable-guard regression test remains in Question Quality CI.
- Source exports: `dailyChallenge`, `quizSessionPreview`, `profileCreatePreview`, `quizModePreview`, `shopPurchasePreview`, `dailyLoginRewardPreview`, and `achievementUnlockPreview`.
- This proves only the current repository source behavior. It does **not** prove which functions, versions or regions are deployed in project `quizhub-e65f5`; deployed inventory remains an owner/operator evidence gate.
- Reconfirmed repository deployment boundary: `firebase.json` configures Functions and local emulators only; no root `.firebaserc`, `firestore.rules`, or `firestore.indexes.json` is present. No production deploy workflow was identified in `.github/workflows/`.
- Reconfirmed that all seven preview callables must remain emulator-only until explicit owner approval, client migration and production Rules release gates are complete. Do not run `firebase deploy` as part of Phase 0.
- No production Firebase resources or user data were accessed or changed.


## 55. Review of legacy social/privacy PR #3 (2026-11-21)

- Reviewed PR #3 at head `6d2ed70141afbacf7aac199515657ead19d7fba1`: 110 commits, 58 changed files, Draft, GitHub reports `mergeable: false`; base SHA predates current main.
- The PR head's last inspected CI set passed: validate-questions, screenshot-and-smoke, emulator-daily. This does not justify merging the full change set.
- The change set mixes independent V1 requirements: public profile viewer projection (PROF-02/PROF-03/RANK-02), trusted friend transitions (FRIEND-01), chat send/actions/read state and legacy migration rehearsal (CHAT-01..04/DATA-03), plus UI/accessibility and emulator workflow changes.
- Added `docs/PR3_REVIEW_PLAN.md` with the file-scope assessment, safe decomposition, acceptance gates and recommended order.
- Decision: do not merge PR #3 wholesale. Integrate selected changes as small PRs based on current main, preserving `PUBLIC_PROFILE_READS_ENABLED=false`, `CHAT_SERVER_TRANSPORT_ENABLED=false`, and emulator-only callable/rules guards.
- No production data, Rules, Functions or client cutover changed.


## 56. Public profile privacy slice merged; FRIEND-01 service opened (2026-11-21)

- PR #64 merged into `main` as squash commit `61817fc3f2801345e261b6adb5335f53bba34817`.
- All three required PR #64 checks passed: Question Quality, Firebase Emulator Integration and Visual Preview.
- Foreign profile cards now pass through the strict public allowlist; document path UID overrides any stored UID; private fields remain available only to the owner renderer.
- `PUBLIC_PROFILE_READS_ENABLED` remains `false`. This is application-layer minimization only; active production Rules still require independent verification and no network-level privacy claim is made.
- PR #65 (`feat/friendship-service-v1`) introduces the pure symmetric friendship transition service, trusted transactional Firestore adapter and strict Auth-derived callable input adapter, with unit tests in Question Quality CI.
- PR #65 deliberately does not export/deploy a callable, change the browser friend UI, modify Rules or touch production data. It is the first isolated FRIEND-01 server slice.
- PR #65 checks are running; merge only after Question Quality, Firebase Emulator Integration and Visual Preview all pass.
- The legacy PR #3 remains Draft and is not to be merged wholesale.


## 57. FRIEND-01 trusted relationship core merged (2026-11-21)

- PR #65 merged into `main` as squash commit `410456c8cb8cba78d3debda43043ef960f40328f`.
- All required checks passed: Question Quality, Firebase Emulator Integration and Visual Preview.
- Added pure symmetric relationship transitions for send, accept, decline, cancel and remove; a Firestore transaction adapter that reads both profiles before writing; and a strict callable input adapter that derives actor UID from verified Firebase Auth.
- Tests cover symmetric transitions, idempotency, inconsistent legacy relationship arrays, forged identity/payload rejection, anonymous users, and preservation of unrelated profile/economy fields.
- This is service/core only: no callable export, browser integration, Rules change or production deployment. The next isolated slice adds an emulator-only callable and two-account integration tests.


## 58. FRIEND-01 emulator callable integration opened (2026-11-21)

- PR #66 adds `friendRelationshipPreview`, wired to the merged trusted friendship transaction service and callable adapter.
- The new callable uses the same fail-closed guard as all other preview endpoints: project must be `demo-quizhub` and Auth, Firestore and Functions emulators must all be active.
- Added a two-account emulator test covering unauthenticated/forged/self requests, send and duplicate send, conflicting reverse request, accept, remove, decline and cancel. It verifies relationship symmetry and that coins, XP, level and email remain unchanged.
- Added the callable to the source-level fail-closed guard regression test and emulator CI command.
- PR #66 is awaiting all three CI checks. No browser client, production Rules, production Functions or live Firestore data are changed.


## 59. FRIEND-01 browser preview integration opened (2026-11-21)

- PR #66 merged into `main` as squash commit `c2b44a7437bab88d37d59ae2959b21a657aa063d`. All required Question Quality, Firebase Emulator Integration and Visual Preview checks passed.
- PR #67 adds the browser-side callable invoker and client contract for send, accept, decline, cancel and remove. The Friends screen uses it only when both `firebaseEmulator=1` and `friendshipPreview=1` are present on localhost/127.0.0.1 and the active Firebase project is `demo-quizhub`.
- Firebase Functions emulator is connected only inside the existing local emulator configuration. The invoker rejects production hosts/projects, anonymous users, malformed operations, unexpected payload fields and self-targets.
- The existing production friend mutation path remains unchanged and is still a legacy client-side Firestore write. This PR does not claim to remediate the live production Rules risk or enable a production rollout.
- Added client transport, invoker and source-guard tests to Question Quality CI. PR #67 awaits all three checks.
- Next: accept PR #67 after CI, then complete the separate legacy-data/read migration and Rules acceptance before any production client cutover. Production Rules, Functions deployment and live user data remain untouched.


## 60. FRIEND-01 browser preview merged; CHAT-01 send service opened (2026-11-21)

- PR #67 merged into `main` as squash commit `67d543a3ac1d56851f891b6921ee6c4adc04a62c`. Question Quality, Firebase Emulator Integration and Visual Preview all passed.
- The Friends UI now has an opt-in local emulator preview transport for send, accept, decline, cancel and remove. The production path remains the legacy client-side mutation and is not considered secure or migrated.
- CHAT-01 begins with a trusted server-side direct-message send service. It requires symmetric friendship, derives sender identity from verified Auth, validates target/text/message ID, creates a deterministic pair chat and message atomically, and makes exact retries idempotent.
- New message records use server-authored sender/recipient IDs, timestamps, text, edited/deleted flags and reactions container. Existing user profile/economy documents are not mutated by send.
- `chatSendPreviewCallable` is exported only behind the demo project + Auth/Firestore/Functions emulator guard. A two-account + non-friend third-account emulator acceptance test and unit tests are added to CI.
- This slice does not yet migrate chat history reads, editing, deletion, reactions, unread/read cursors, online presence, Firestore Rules or production traffic. Those remain separate acceptance gates.
- PR #68 is opened for CHAT-01 send backend; merge only after Question Quality, Firebase Emulator Integration and Visual Preview all pass.


## 61. CHAT-01 trusted message sending merged; CHAT-02 history read opened (2026-11-21)

- PR #68 merged into `main` as squash commit `c1d7d769b474509a5b640dd787d863ac855844e1`. Question Quality, Firebase Emulator Integration and Visual Preview all passed.
- CHAT-01 now provides transactional, idempotent direct-message sending for mutually connected friends through an emulator-only callable. The three-account emulator acceptance passed, including a non-friend stranger, duplicate retry and profile/economy preservation.
- CHAT-02 adds a separate trusted history read service and callable. It verifies the caller is one of exactly two participants in the server-owned chat document, paginates newest-first with a bounded page size (max 50), validates cursor IDs, allowlists returned fields and hides deleted message text.
- Existing chat membership is based on the persisted chat participant list, so removing a friendship does not silently erase access to an already-created conversation. Both participants retain access; strangers do not.
- The history callable is restricted to the demo project with Auth, Firestore and Functions emulators active. No production Rules or chat UI is changed.
- Added unit/callable tests plus a three-account emulator acceptance test for participant-only reads, cursor pagination, forged actor rejection and anonymous access denial.
- PR #69 is opened for CHAT-02; acceptance requires Question Quality, Firebase Emulator Integration and Visual Preview.
- Production chat reads remain on the existing legacy path until the broader Rules and data migration is completed. No production deployment or live data changes.


## 62. CHAT-02 history reads merged; CHAT-03 edit/delete opened (2026-11-21)

- PR #69 merged into `main` as squash commit `c4e5aeeab6b9fa24ee8799ac303d912c51afb061`. Question Quality, Firebase Emulator Integration and Visual Preview all passed after correcting a test-fixture ordering issue.
- CHAT-02 now provides authenticated, participant-only, newest-first history pagination with a maximum page size of 50 and explicit message-field projection.
- CHAT-03 adds transactional message edit/delete. Only the original sender may mutate a message; recipients and non-participants are denied. Editing validates 1–2000 characters, sets `edited` and `editedAt`, and updates the conversation preview when the edited message is the latest.
- Deletion is a soft-delete state for history/UI compatibility but clears the stored message body (`text: null`), records `deletedAt`, and updates the latest preview to a deleted-message marker. Repeated deletion is idempotent; deleted messages cannot be edited/restored through this endpoint.
- Added strict Auth-derived callable validation, safe error mapping, a demo-project + Auth/Firestore/Functions emulator guard, unit tests, and a three-account emulator acceptance test covering author, recipient and stranger access.
- History serialization was adjusted to safely project both legacy deleted messages and newly body-erased deleted messages.
- PR #70 is opened for CHAT-03. Merge only after Question Quality, Firebase Emulator Integration and Visual Preview pass.
- No browser chat mutation UI, production Rules, Functions deployment or live Firestore data is changed. Production chat still uses legacy paths pending the broader security and migration release gates.


## 63. CHAT-03 author-only edit/delete merged; CHAT-04 reactions opened (2026-11-21)

- PR #70 merged into `main` as squash commit `3c48a4ede5b5fc6188c2361b70039092256768ba`. Question Quality, Firebase Emulator Integration and Visual Preview all passed.
- CHAT-03 now provides trusted transactional author-only message editing and deletion. Edits set `edited`/ `editedAt`; deletion clears the stored text body, records deletion time and remains idempotent. Recipients and non-participants cannot mutate messages.
- CHAT-04 adds a transactional reaction toggle service with six stable allowlisted types: `like`, `love`, `laugh`, `wow`, `sad`, `fire`. Each of the two participants can independently add/remove their own reaction. The service rejects strangers, malformed reaction state and deleted messages.
- Reaction identity is derived from Firebase Auth; clients cannot submit a user ID or arbitrary emoji/string. The callable is restricted to the isolated demo project with Auth, Firestore and Functions emulators active.
- CHAT-02 history projection now returns only per-type counts and whether the requesting participant reacted. It never exposes the underlying participant UID arrays. Deleted messages project no reactions.
- Added service/callable tests and a three-account emulator acceptance test covering both participants, stranger/forged identity denial, toggle behavior, deleted-message denial and reaction projection in history.
- Added the new callable to the fail-closed source guard and both CI workflows. No production Rules, Functions deployment, browser UI or live Firestore data is changed.
- PR #71 is opened for CHAT-04; merge only after Question Quality, Firebase Emulator Integration and Visual Preview pass.

## 64. CHAT-04 reactions merged; CHAT-05 read receipts opened (2026-11-21)

- PR #71 merged into `main` as squash commit `37d8086da69328223e2974c1c89121607465c05c`. Question Quality, Firebase Emulator Integration and Visual Preview passed.
- CHAT-05 adds a trusted transactional read-receipt service. Authenticated participant identity is derived from Firebase Auth; client-supplied actor IDs and extra payload fields are rejected.
- A participant can advance only their own read cursor to a valid, non-deleted incoming message in the conversation. Outgoing messages, deleted messages, strangers and malformed targets are rejected.
- Receipt cursors are monotonic: a delayed/older request cannot move the cursor backwards. Repeated requests are idempotent.
- The callable is restricted to the `demo-quizhub` project with Auth, Firestore and Functions emulators active. Added unit, callable-boundary and three-account emulator acceptance tests; updated fail-closed guard and both CI workflows.
- This backend milestone stores per-participant `readReceipts` on the server-owned chat document. Unread counters, message-level read indicators, browser integration and production migration are not yet implemented; do not describe CHAT-05 as complete until those pieces are accepted.
- No production Rules, Functions deployment, browser UI or live Firestore data is changed.
- PR #72 is opened for CHAT-05 backend read-receipt cursor. Merge only after Question Quality, Firebase Emulator Integration and Visual Preview pass.

### CHAT-05 extension — unread counters

- Added an authenticated per-conversation unread-count callable using Firestore count aggregation. It counts only incoming, non-deleted messages after the requesting participant's own read cursor.
- Cursor is read from the server-owned conversation document; caller cannot choose another user's cursor or submit an arbitrary timestamp.
- Added strict callable validation, fail-closed emulator guard, unit tests and emulator acceptance for 2 → 1 → 0 unread transitions, stranger denial and read-cursor synchronization.
- Added the required Firestore composite index (`recipientId`, `deleted`, `createdAt`) and configured it in `firebase.json`.
- Global inbox badge aggregation and browser UI binding remain outstanding; this PR currently delivers per-conversation unread counts only.

## 65. CHAT-05 read indicators opened (2026-11-21)

- PR #72 merged into `main` as squash commit `52c97021d82373648f5c89765302e84787b0eefa`. Question Quality, Firebase Emulator Integration and Visual Preview all passed.
- CHAT-05 backend now includes per-participant read cursors and per-conversation unread counts through authenticated, emulator-only callables. The unread count uses Firestore aggregation and the required composite index.
- PR #73 adds a trusted history projection field `readByRecipient` for messages authored by the requesting participant. The projection validates the peer's stored read cursor against an actual message addressed to that peer and computes read state using timestamp plus message-ID tie-break.
- Added service tests for read/unread projection and invalid cursor state, plus emulator acceptance verifying one read and one unread outgoing message.
- Chat message renderer now supports the server-projected status with a single/double check indicator. The existing production chat data listener still reads the legacy underscore chat path; the new hashed server transport is not wired into production UI. Indicator is therefore only shown when a trusted history payload supplies the boolean field.
- Global inbox badge, explicit opt-in browser transport and full chat UI migration remain outstanding. All callables remain guarded to the isolated demo project. No production Rules, Functions deployment or live data changes.

## 66. CHAT-05 read indicators opened (2026-11-21)

- PR #72 merged into `main` as squash commit `52c97021d82373648f5c89765302e84787b0eefa`. All three required checks passed.
- Trusted chat history now projects `readByRecipient` only for messages authored by the requesting participant. It derives the state from the peer's server-owned read cursor and validates that cursor points to a message authored by the viewer and addressed to the peer.
- Read state is determined by message timestamp plus document-ID tie-break, matching the monotonic receipt cursor ordering. A malformed or unrelated peer cursor fails closed.
- Chat message rendering now supports accessible single-check (delivered/unread) and double-check (read) states, but only when the trusted history payload provides an explicit boolean. Legacy client snapshots do not gain an inferred read state.
- Added unit tests for read-state projection, invalid cursor handling and indicator rendering. Added emulator history acceptance that advances Bob's receipt and verifies Alice sees only the covered outgoing message as read.
- All read/unread callables remain emulator-only. The production chat listener and legacy underscore chat path are unchanged; full UI transport migration, inbox badge and production Rules/data migration remain outstanding.
- PR #73 is opened for CHAT-05 read indicator projection and rendering. Merge only after Question Quality, Firebase Emulator Integration and Visual Preview pass.

## 67. CHAT-05 read indicators merged; browser transport foundation opened (2026-11-21)

- PR #73 merged into `main` as squash commit `6ea9a275dba584b370ff95f5bd8b5c98d9abdb5e`. Question Quality, Firebase Emulator Integration and Visual Preview all passed after correcting the emulator acceptance fixture.
- CHAT-05 trusted history now exposes recipient read state for own messages, and the chat renderer supports accessible single/double-check indicators. This is a server-projected state only; legacy snapshots do not fabricate read status.
- Next slice adds a dedicated browser transport wrapper for trusted send, history, read receipt and unread-count callables. It is strictly opt-in on localhost with both `firebaseEmulator=1` and `chatPreview=1`, and both Auth and Functions clients must target `demo-quizhub`.
- The wrapper validates exact payload keys and message/chat identifiers, derives identity exclusively from Firebase Auth, and exposes no production fallback. It is a transport foundation; existing production chat UI and legacy Firestore paths are not switched.
- PR #74 covers this isolated browser transport and unit tests. Full UI cutover, per-chat inbox badges, production Rules/index review and legacy data migration remain outstanding.
## 68. CHAT-05 local inbox unread badges opened (2026-11-21)

- PR #75 adds per-friend unread badges and an inbox total in the chat list, powered by the trusted per-conversation unread-count callable.
- Deterministic direct-chat IDs are derived in the browser with Web Crypto using the exact server algorithm (sorted UIDs, NUL separator, SHA-256, 48 hex characters); tests verify the result against Node Web Crypto.
- The UI queries unread counts only when both local preview flags are present and the authenticated Firebase Auth/Functions clients target `demo-quizhub`. Production UI and legacy Firestore paths remain unchanged.
- Missing conversations and preview failures render no badge; counts are bounded to safe non-negative integers and display as `99+` above 99.
- This slice does not mark messages read or switch the conversation message listener. Opening/reading conversations and trusted history/send integration remain separate follow-up work.
- No production Rules, Functions deployment or live user data is changed.
## 69. CHAT-05 trusted history/read browser preview opened (2026-11-21)

- PR #75 merged into `main` as squash commit `a42455f688c832eb3925f0f2cac0608149ff476e`; Question Quality, Firebase Emulator Integration and Visual Preview passed.
- PR #76 adds an explicitly local-only chat preview path: direct-chat IDs are derived with the server-compatible SHA-256 algorithm, message history is loaded through the authenticated history callable, and incoming messages in the visible newest page are marked read through the trusted receipt callable.
- History pages are normalized and rendered chronologically, older pages can be loaded with the server cursor, duplicate IDs are removed, and the view preserves scroll position when older messages are prepended.
- The local preview sends through the trusted send callable and refreshes history/unread badges. It polls the trusted history endpoint while a preview conversation is open so a second emulator account can see new messages and have them marked read.
- Legacy production chat listener, direct Firestore writes, message actions and production routes remain unchanged. Preview message actions that still require legacy client writes are hidden rather than routed to the new hashed chat document.
- No production Rules, Functions deployment, live user data or migration is performed. CHAT-05 remains open until two-account browser acceptance and final UI/transport review pass.
## 70. CHAT-06 trusted message actions preview opened (2026-11-21)

- PR #76 merged into `main` as squash commit `089fce38ce26c420199c236ab6ca0ce96cc074f8`; Question Quality, Firebase Emulator Integration and Visual Preview passed.
- PR #77 merged into `main` as squash commit `8b2a9d1059600a453bae2e9c0a9807c1a6fc26ba`; Question Quality, Firebase Emulator Integration and Visual Preview passed.
- PR #77 connects the existing authenticated message mutation and reaction callables to the local chat preview transport.
- Preview message actions now use trusted edit/delete and reaction toggle endpoints. The legacy production UI continues using its existing path; no direct writes are sent to the hashed preview conversation.
- Transport validation rejects extra identity fields, malformed message/chat IDs, unsupported reactions, blank edit text and delete requests containing text.
- Backend mutation/reaction emulator tests already run in the Firebase integration workflow; this PR extends browser transport unit coverage and keeps all preview guards intact.
- Production Rules, deployed Functions, live conversations and migration are unchanged.

## 71. CHAT-06 two-account lifecycle acceptance (2026-11-21)

- Added a single end-to-end Firebase Emulator scenario using two separately authenticated accounts.
- The scenario creates a mutual-friend direct conversation, sends a message, verifies unread count, reads history as the recipient, advances the recipient read cursor, and verifies the sender's projected read indicator.
- Both participants add the same reaction; history must expose only the aggregate count and the current viewer's own reaction state, never the other participant's UID.
- The author edits the message; the recipient's attempt to edit is denied. The author then deletes it and the recipient sees a tombstone with a cleared body and no reactions.
- The test cleans up both emulator users, profiles, chat document and message subcollection.
- The test is added to the required Firebase Emulator Integration workflow. This is emulator acceptance only; it does not certify production Rules, deployed Functions or legacy-chat migration.


## 73. V1 scope gate: CHAT-07 deferred (2026-11-21)

- Rechecked `docs/PRODUCT_SPECIFICATION_V1.md`: the approved chat scope covers direct text messaging, edit/delete, reactions, unread/read state and multi-device synchronization. Reply-to-message previews are not an explicit V1 acceptance requirement.
- PR #79 (trusted reply previews) passed the three required CI workflows, but passing CI does not authorize scope expansion.
- CHAT-07 is therefore deferred beyond V1. Its implementation remains preserved on its feature branch for a future, explicitly approved Change Request; it is not merged into `main` and is not a V1 blocker.
- The PR is closed as deferred to keep the V1 queue limited to approved requirements. No production Firebase configuration, Rules, Functions, or live data are changed.
- Next V1 priority remains completion of Stage 0 evidence: live read-only Firestore inventory, deployed Rules/index export, Auth provider/domain confirmation, and a verified production backup/restore rehearsal in a disposable environment. These steps require owner-side Firebase access and must not be simulated with emulator results.


## 74. Public profile privacy PR reviewed; isolated follow-up required (2026-11-21)

- PR #3 exact head `6d2ed70141afbacf7aac199515657ead19d7fba1` has successful Question Quality (#980), QuizHub Visual Preview (#265), and Firebase Emulator Integration (#579) runs.
- Despite green CI, PR #3 is not safe to merge as-is: its branch is 110 commits ahead and 103 commits behind current `main`, and the PR changes 58 files (3,860 additions / 107 deletions), mixing profile projection with broad chat, friendship, workflow and migration work.
- PR #3 was retitled `[Needs rebase]` and its description now records the review decision. It remains open as a draft; no code from it was merged.
- Current `main` already contains the public-field allowlist (`public-profile-data.js`), viewer projection (`projectProfileForViewer`) and focused projection tests. The public read gate remains disabled.
- Important limitation: UI-side projection does not prevent the browser from downloading legacy private `users/{uid}` documents. Friends-list and search paths still read legacy user documents while the gate is off. This is not network-level privacy and must not be described as such.
- Next code task: create a small, current-main-based PR that applies the existing public projection consistently to foreign friend/search/directory data and tests that no private fields reach renderers. Keep the read gate disabled; this task is defense-in-depth only, not a replacement for deployed Rules.
- Production privacy cutover remains blocked on Stage 0 evidence: live Firestore inventory, deployed Rules/index export, Auth provider/domain confirmation and a verified restorable backup. No production Firebase settings, Rules, Functions or live data were changed.


## 75. Foreign friend-directory projection PR opened (2026-11-21)

- The first attempt, PR #80, passed all three required CI workflows but GitHub reported a merge conflict after `main` advanced. It was closed without merging.
- The focused change applies the existing public-profile allowlist before friend lists, incoming/outgoing requests and player-search results reach UI renderers.
- Added tests for removal of email, coins, friend lists, admin flags, stats and forged document identity, plus coverage that all four foreign-directory render paths use the projection.
- PR diff is limited to three files; no unrelated chat, migration or workflow changes.
- A clean replacement PR #81 was recreated from the latest `main`; its compare is now strictly ahead by three commits with zero commits behind. Question Quality is queued; Firebase Emulator Integration and Visual Preview are expected to run. Do not merge until all three pass and the final diff is reviewed.
- This remains client-side data minimization only: with `PUBLIC_PROFILE_READS_ENABLED=false`, Firestore still sends legacy private user documents to the browser. It does not close the network-level privacy issue.
- No Production Rules, Functions, read gates, or live data were changed.


## 76. Clean-base profile projection follow-up (2026-11-21)

- PR #80 was closed without merging after GitHub reported a mergeability conflict. Its three-file patch had passed Question Quality, Firebase Emulator Integration and Visual Preview.
- Recreated the same focused patch on `fix/public-directory-projection-v1-clean`, branched from the then-current `main`, and opened PR #81.
- PR #81 compare is cleanly ahead by 3 commits and behind by 0; diff remains exactly the three intended files.
- Question Quality run #1262 is queued at the time of this status update. Firebase Emulator Integration and Visual Preview are not yet reported for this new head.
- PR #81 is not merged. Wait for all required checks and verify the mergeability state before merge.
- No production Firebase Rules, Functions, public-profile read gate, or live data changed.


## 77. Дополнительный privacy finding: профиль собеседника в чате (2026-11-21)

- Повторный аудит `app/modules/chat/chat.js` выявил, что `loadChatFriends()` напрямую читает `users/{friendId}` и передаёт полный `friendDoc.data()` в `chatFriendsCache` и рендер списка чатов.
- Этот путь обходит централизованный `profileCollectionForViewer()` и публичную проекцию. В результате браузер получает приватные поля друзей, хотя в интерфейсе чата нужен только минимальный публичный набор (как минимум UID и nickname).
- Текущий PR #82 закрывает аналогичные пути в разделе «Друзья», но не меняет чат.
- Следующий отдельный privacy patch после проверки/объединения PR #82: импортировать `profileCollectionForViewer` и `projectDirectoryProfile` в chat module, читать профиль друга через viewer-aware source и передавать в UI только allowlist-проекцию. Собственный документ пользователя остаётся приватным и может читаться владельцем.
- Это клиентская минимизация. Network-level privacy появится только после завершения миграции и включения проверенных Firestore Rules/publicProfiles cutover.
- Никакие production Rules, Functions, данные или флаги доступа не менялись.


## 78. Friend-directory projection merged; chat profile read is next (2026-11-21)

- PR #82 merged successfully with squash commit `a172239fb14d50649953abdca398f0a7390f8749`.
- All required checks passed on the merged head: Question Quality, Firebase Emulator Integration and QuizHub Visual Preview.
- The merged change projects friend lists, incoming/outgoing requests and player-search results through the public-profile allowlist before UI rendering.
- The production public-profile read gate remains disabled. This change is client-side data minimization and does not provide network-level privacy while legacy `users/{uid}` documents remain readable.
- Next focused patch: update `app/modules/chat/chat.js` so foreign friend profiles are loaded via `profileCollectionForViewer(viewerUid, targetUid)` and passed through `projectDirectoryProfile` before entering `chatFriendsCache` or rendering. Keep the owner's own profile read private.
- No production Firebase Rules, Functions, data or feature flags were changed.


## 79. Chat foreign-profile projection merged (2026-11-21)

- PR #83 merged successfully with squash commit `df85996385e24f6d9245a7e628895e4ef364d6a9`.
- All three required CI workflows passed: Question Quality, Firebase Emulator Integration and QuizHub Visual Preview.
- Chat friend cards now resolve foreign profile collection through `profileCollectionForViewer(viewerUid, targetUid)` and project the record through `projectDirectoryProfile` before adding it to `chatFriendsCache` or rendering.
- The signed-in user's own `users/{uid}` document remains the source for private profile state and friend IDs.
- Additional source audit: leaderboard uses `directoryCollection()` plus `buildPublicProfile()`; public profile view uses `profileCollectionForViewer()` plus `projectProfileForViewer()`. No additional raw foreign-profile spread was found in those reviewed modules.
- Remaining critical boundary: all these protections are client-side data minimization while `PUBLIC_PROFILE_READS_ENABLED=false`; they do not prevent the browser from receiving legacy private documents when legacy Firestore Rules permit those reads.
- Next V1 security task: complete a source-to-Rules audit using the exact deployed Firestore Rules and a live read-only inventory, then document the release gate and backup/restore evidence. Do not change production Rules, Functions, live data or public-profile gate until evidence is complete.


## 80. Firestore Rules source-of-truth gap identified (2026-11-21)

- Repository audit found that root `firebase.json` declares the Firestore indexes file but does not declare a `firestore.rules` path.
- A root `firestore.rules` file is not present at the checked `main` ref. The likely deployment Rules source is therefore not represented by the currently inspected repository config; do not assume the rules deployed in Firebase match any rules pasted in older chat messages.
- This is a release blocker for the privacy cutover and any claim of network-level profile privacy. Before proposing Rules changes, obtain the exact deployed Rules export from Firebase Console/CLI and establish its provenance/version.
- Next Stage 0 evidence request: exact deployed Firestore Rules text, Firestore indexes export, live collection inventory, Auth provider/domain configuration, and a tested restorable backup. Then add the approved Rules file and explicit `firestore.rules` mapping to repository configuration in a separate reviewed change, after reconciling it with the live deployed state.
- No Production Firebase Rules, Functions, indexes, live data or access flags were changed in this audit.


## 81. Callable Functions production guard audit (2026-11-21)

- Reviewed the complete root `functions/index.mjs` export surface: 14 callable exports are present.
- All 14 exported callables check both the Firebase project ID (`demo-quizhub`) and the presence of Firestore, Auth and Functions emulator environment markers before invoking their handler; every non-isolated/non-demo request fails with a callable-specific `failed-precondition`.
- Coverage includes quiz and daily challenge sessions, profile creation, quiz modes, shop purchase, daily login rewards, achievements, friendship operations, and chat send/history/mutation/reaction/read-receipt/unread-count.
- This is a source-level guard audit, not a substitute for verifying deployed Functions configuration and IAM. No production deployment was attempted.
- The root `firebase.json` currently configures Functions and Firestore indexes but has no `firestore.rules` mapping; the root Rules file is absent. The deployed Rules source remains unknown until the owner provides the exact current export.
- Stage 0 remains blocked on verified deployed Firestore Rules and indexes, live collection/schema inventory, Auth provider/domain settings, and tested backup/restore evidence.
- No production Rules, Functions, indexes, live data, Auth configuration or feature flags were changed.


## 82. Production Firebase Stage 0 runbook and deployment-target findings (2026-11-21)

- Added `docs/PRODUCTION_FIREBASE_STAGE0.md` with the evidence checklist, guarded optional read-only inventory instructions, release gates and explicit no-deploy boundary.
- Confirmed root `.firebaserc` is absent. The Firebase CLI deployment target is therefore not pinned in repository configuration; the browser Firebase config alone does not establish the CLI deployment target.
- Confirmed `firebase.rules-preview.json` references `tests/fixtures/quiz-sessions.rules`, a narrow emulator preview for quiz-session access, not a complete production Ruleset.
- CI backup/restore tests use disposable `demo-quizhub` emulators only. No production backup or production restore evidence has been supplied or verified.
- README and `docs/ECONOMY_SECURITY.md` explicitly state that the browser still writes economy fields directly to `users/{uid}`; server reward endpoints are preparation only and remain emulator-guarded. This remains a V1 release blocker until the complete client migration and production Rules are verified.
- No live Firestore reads were initiated by this audit. No Production Rules, Functions, indexes, Auth settings, live data or access flags were changed.
- Next action: collect the exact published Rules/index exports and Auth configuration from the owner; only after approval, run the guarded read-only inventory and review a production backup/restore plan.


## 83. Active client write-path audit (2026-11-21)

- Added `docs/CLIENT_WRITE_PATH_AUDIT.md` after tracing default browser mutation paths on `main`.
- Confirmed the normal Production client still writes quiz XP/coins/stats directly from `app/modules/quiz/modes/base.js`; the trusted quiz callable remains emulator-only.
- Confirmed shop purchases/equips, achievements, friend transitions and chat message send/edit/delete/reactions still have direct Firestore fallback paths in the normal browser flow. Their trusted callable previews are activated only by explicit local-emulator flags.
- Profile creation still defaults to direct `setDoc(users/{uid})`; its trusted callable is a local-emulator preview. Chat presence also writes `online/{uid}` directly and needs explicit Rules/ownership review.
- These source findings establish a migration gap, not the current success/failure of Production writes: deployed Firestore Rules remain unknown.
- This is a V1 release blocker. The cutover must migrate each active client flow and deploy compatible Rules together; do not tighten Production Rules before the currently published client has a compatible trusted path.
- No Production Rules, Functions, indexes, Auth settings, user/chat documents, economy values or feature flags were changed.


## 84. Firestore read/write map and inventory gap correction (2026-11-21)

- Added `docs/FIRESTORE_READ_WRITE_MAP_V1.md` with source-derived browser read/query paths, active default client writes, server-side collection paths, index observations and release blockers.
- Extended `server/firestore-migration-inventory.mjs` and its regression test to include `dailyLoginClaims/{date}/users/{uid}` and `shopPurchaseRequests/{uid}/requests/{operationId}` as protected idempotency receipt collections.
- Corrected the first client-write audit: `app/modules/daily/daily.js` also directly increments coins/streak and sets `lastDailyClaim` in the default browser path; its trusted callable is emulator-preview-only.
- This source-derived map does not establish which Production operations currently succeed. Exact deployed Rules and indexes remain unknown.
- No live Firebase reads/writes, deploys, Auth changes, data migrations or feature-gate changes were performed.


## 85. Daily-login UTC boundary acceptance completed (2026-11-21)

- PR #85 merged into `main` as `f28da00e597096657c580322c2a123a16f88544a`: browser claim availability now uses the same UTC date boundary as the trusted server reward service, with coverage for Firestore Timestamp, Date, numeric legacy timestamps and invalid/out-of-range values.
- PR #86 merged into `main` as `870d21ce82db2141e159d9b78be279e9f3f9fa45`: authenticated browser acceptance verifies the trusted daily-login callable, same-day retry idempotency and both local-calendar boundary failure modes (UTC-10 premature availability and UTC+14 delayed availability).
- Required CI passed on the final PR #86 head: Question Quality, Firebase Emulator Integration (including network/browser suite, complete read-only emulator snapshot capture and server-owned session Rules denial), and QuizHub Visual Preview.
- The timezone test is emulator-only and uses a controlled local-date shim; it does not connect to or mutate Production Firebase.
- Important: this closes the UTC availability correctness issue, **not** the Production mutation migration. The normal Production `claimDailyReward()` path still directly updates `users/{uid}`; `dailyLoginRewardPreview` remains guarded to the isolated emulator.
- Next: prepare a complete daily-login Production cutover plan only after exact deployed Rules/index exports, Auth configuration, live inventory and a verified recoverable Production backup are supplied. Do not remove callable guards or change Rules/client gates yet.
- No Production Firebase data, Rules, Functions, indexes, Auth settings or feature flags were changed.


## 86. Quiz Rewards trusted-cutover audit (2026-11-21)

- Added `docs/QUIZ_REWARDS_CUTOVER_V1.md` after tracing the default browser reward path and the isolated trusted Classic flow.
- Confirmed the default `BaseMode.persistResults()` still calculates rewards from browser score and directly updates `users/{uid}`; Classic also submits browser-authored win increments and separately updates the profile level.
- Confirmed the trusted Classic preview calculates score from server-owned question keys and answer logs, then atomically writes the claim receipt, XP/coins, weekly XP, quiz totals, wins, stats and achievement progress. Its callable remains restricted to isolated `demo-quizhub` emulators.
- Identified two progression gaps before cutover: trusted claims currently award base rewards only while legacy event multipliers are evaluated in player-local time; and `achievementFacts` has a separate server-owned level ledger that cannot safely overwrite legacy `users.level` until an audited baseline is migrated.
- Classic browser acceptance exists in `tests/firebase-classic-server-browser.test.mjs` and verifies a ten-question authenticated emulator run, one reward claim and an idempotent retry. It does not prove Production cutover or other modes.
- Next: define authoritative event-time/timezone semantics and a lossless legacy progression baseline before changing trusted reward writes. Keep all Production callables guarded and the existing client path unchanged.
- No Production Firebase data, Rules, Functions, indexes, Auth settings or feature flags were changed.


## 87. Server-authoritative quiz event rewards (2026-11-21)

- Added `server/quiz-event-rewards.mjs`: V1 event multipliers are derived from the trusted callable server timestamp and a validated IANA timezone stored on the user's private profile. No client clock or client multiplier is accepted.
- Preserved existing active event semantics: weekend XP x2, Night Owl XP x2, Monday Motivation XP x1.5 and Happy Hour coins x1.5. Overlapping XP boosts use the strongest multiplier, not a product. Holiday events remain inactive because their source definitions are inactive.
- Integrated the resolver into the atomic Classic reward claim. The receipt records the effective multipliers and event IDs so a claim can be audited and retries return the exact original receipt.
- New profiles store the browser-detected IANA timezone; the trusted profile callable validates the preference. The public profile projection does not expose the timezone.
- Legacy profiles without `timeZone` deliberately use UTC. This is a compatibility limitation, not an approved Production cutover: existing users need an explicit timezone preference/backfill path before enabling event-based trusted rewards for them.
- Added deterministic tests for IANA validation, UTC fallback, Berlin local event hours, daylight-saving handling, overlapping boosts, inactive holidays, profile persistence and claim transaction integration.
- Production callables remain emulator-only. No deployed Firebase settings, Rules, live user documents, reward balances or feature flags were changed.


## 88. Existing-account timezone preference backend (2026-11-21)

- Added `server/profile-timezone-update.mjs`: an authenticated profile preference update changes exactly `users/{uid}.timeZone` inside a Firestore transaction. It preserves all other profile fields and rejects missing profiles or invalid IANA zones.
- Added `server/profile-timezone-callable-adapter.mjs`: UID is derived only from verified Firebase Auth; anonymous users, malformed payloads and extra fields (including a caller-supplied UID) are rejected.
- Exported `profileTimeZonePreview` from Functions with the same strict `demo-quizhub` + Auth/Firestore/Functions emulator guard as other preview callables. It is not enabled in Production.
- Added regression tests for exact-field updates, preservation of XP/level/coins/stats, missing profile, invalid timezone, Auth ownership and payload allowlisting.
- This is the trusted backend contract only. A user-facing settings control, existing-account migration/backfill and live deployment are not included. Existing profiles without a saved preference continue to use UTC in the event resolver.
- No Production Firebase reads/writes, Rules, Functions deployments, indexes, Auth settings, live data, rewards or feature flags were changed.


## 89. Profile timezone preference UI preview (2026-11-21)

- Added a bilingual timezone settings card to the owner's profile only. Other players' public cards never render this control.
- The input uses the browser's supported IANA timezone list with a compact fallback for older browsers. It displays the saved preference when present, otherwise suggests the browser-detected zone without writing it automatically.
- A user must explicitly select/confirm the value before saving. The UI validates the IANA identifier and verifies the callable receipt belongs to the signed-in UID.
- The update transport is enabled only on localhost/127.0.0.1 with `firebaseEmulator=1`, `profileTimeZonePreview=1`, the `demo-quizhub` project and a non-anonymous signed-in user.
- On Production and every non-opted-in host, the save button is disabled with a clear explanation. There is no direct Firestore fallback.
- Added unit coverage for localization, owner-only rendering contract, IANA validation, emulator opt-in, payload/receipt validation and absence of direct client timezone writes.
- Production callable enablement, real-account opt-in, migration/backfill, and release acceptance remain blocked on Stage 0 evidence and explicit approval.
- No deployed Firebase Rules/Functions, live Firestore data, indexes, Auth settings, balances or feature flags were changed.


## 90. Profile timezone UI merged; legacy progression baseline audit started (2026-11-22)

- PR #91 was merged into `main` as `a92a230f4accda215bf75be7fdd34c3fe70d782c`. Question Quality, Firebase Emulator Integration and QuizHub Visual Preview all passed on the final PR head.
- The owner-only bilingual timezone settings card is now in `main`. Its write action remains restricted to the isolated `demo-quizhub` emulator preview. No Production callable, Rules or data changes were made.
- Added a read-only legacy progression audit in `server/legacy-progression-audit.mjs`. It snapshots the legacy counters and achievement IDs, reports cross-field inconsistencies, and deliberately never creates or proposes trusted `achievementFacts`.
- The audit calls out a real semantic incompatibility: legacy `perfect_score` used `stats.bestStreak >= 10`, while the trusted catalog uses a server-scored perfect 10/10 game. Legacy best streak must not be converted to trusted `perfectGames`.
- All legacy user profile fields remain untrusted until provenance is independently established. A clean audit is only a review candidate; it is not authorization to import.
- Next: extend the dry-run audit to a complete, immutable account migration manifest and verify field-level preservation across all profile fields. Then design an explicit owner-approved baseline reconciliation. Do not run any Production reads/writes or imports.


## 91. Trusted-vs-legacy progression comparison (2026-11-22)

- Extended the read-only progression audit to compare legacy XP, game counts, wins and level with an independently supplied server-owned `achievementFacts` document.
- Comparisons report only field names and whether values are equal/different; they do not expose another copy of private values or infer which side is authoritative.
- A difference is not automatically an anomaly: trusted facts may cover only the period after the server ledger was introduced. Every available comparison emits an explicit coverage/provenance warning.
- Equality is not proof of provenance. Reports remain `review_required`, `eligibleForAutomaticImport: false`; no merged facts, overwrite plan, Firestore transport or account migration is produced.
- Added regression tests for equal counters, divergent counters, and the invariant that neither side is selected automatically.
- No Production Firebase reads/writes, imports, deployments, Rules changes or feature-gate changes were performed.


## 92. Legacy wallet and cosmetic inventory audit (2026-11-22)

- PR #93 merged into `main` as `32927598d97d1d6c15ac093012eb231d20a015d7`. Question Quality, Firebase Emulator Integration and Visual Preview passed.
- Added `auditLegacyEconomyProfile`, a pure in-memory audit for legacy coin balances, owned themes/frames/particles, equipped cosmetics, active bonuses and an optional purchase-receipt snapshot.
- The audit flags unsafe balances, malformed/duplicate item IDs and equipped items absent from the corresponding owned list. Unknown historical item IDs are preserved rather than discarded, so retired cosmetics are not silently lost.
- Receipt references are checked for matching UID, unique operation ID, item ID, purchase kind and safe non-negative coin debit/resulting balance. This is structural validation only: it does not prove payment, purchase legitimacy or entitlement. Legacy wallet and inventory fields remain untrusted and every report stays `review_required` / `eligibleForAutomaticImport: false`.
- Added unit tests and CI coverage. No Firestore reads/writes, imports, Production deployment, Rules changes or feature-gate changes.


## 93. Append-only account ledger event contract (2026-11-22)

- PR #94 merged into `main` as `e3391f10711bbc57244d315100308e1a362f3257`. Question Quality, Firebase Emulator Integration and Visual Preview passed after correcting the duplicate-receipt assertion.
- Added `server/account-ledger-entry.mjs` with a canonical V1 schema for quiz rewards, daily login rewards, shop purchases, refunds and achievement unlocks.
- Entry IDs are deterministic from event type + source operation, so transaction retries resolve to the same document identity. The validator enforces owner, event-specific delta direction, safe integer amounts, timestamp and required item/achievement references.
- This PR defines the event contract only. It does not yet write ledger entries, expose a history endpoint/UI, backfill old account activity or change Firestore Rules. Existing receipts remain the current sources of truth.
- Next: wire ledger document creation into each existing reward/purchase transaction (same atomic transaction as the balance mutation), then add an owner-scoped paginated read adapter and tests. Keep legacy client-side history clearly separate and unverified.



## 94. Atomic shop purchase ledger integration (2026-11-22)

- PR #95 merged into `main` as `83b7703acbfe2cfd7a4d84df85f46f06e4ae05ac`. Question Quality, Firebase Emulator Integration and Visual Preview passed (3/3 checks).
- Added a create-only Firestore ledger writer under the owning account's `accountLedger/{uid}/entries/{entryId}` path. The writer validates the canonical V1 event before scheduling a Firestore `create`.
- Shop purchases now append a deterministic `shop_purchase` event in the same Firestore transaction as the coin debit, ownership update and purchase receipt. A retry uses the same event ID; it cannot silently overwrite an existing ledger event.
- Added unit coverage for event validation, deterministic identity, forged identity rejection, create-only writer behavior and atomic shop purchase integration.
- Scope remains intentionally partial: quiz rewards, daily login rewards, refunds and achievement unlocks are not yet wired to the ledger; no history endpoint/UI or backfill is included.
- No Production Firebase reads/writes, Rules/index changes, Functions deployment, migration/import, Auth changes or feature-flag changes were made.
- Next: wire the existing trusted quiz-reward, daily-login and achievement-unlock transactions to the same append-only ledger contract (each in the exact balance/reward transaction), then implement and test an owner-scoped paginated history reader. Preserve legacy activity as explicitly unverified.


## 95. Achievement unlock account ledger integration (2026-11-22)

- Added canonical `achievement_unlock` ledger events to the trusted achievement evaluation transaction.
- Each newly unlocked achievement creates one deterministic per-account event keyed by achievement ID; existing unlock receipts and profile achievement IDs remain intact.
- Ledger event records zero coin/XP delta and the achievement ID, so unlock history is auditable without implying a currency grant.
- Firestore writer uses create-only semantics in the same native transaction as achievement facts, profile projection and immutable unlock receipts.
- Added unit and Firestore adapter coverage for exact event count, event shape and idempotent concurrent evaluations.
- No Production Firebase reads/writes, Rules/index changes, deployments, migrations, Auth changes or backfills.
- Account ledger rollout remains incomplete until quiz modes, refunds (if supported in V1) and the owner-scoped paginated history reader are audited/integrated. Legacy activity remains unverified.


## 96. Duel, Survival and Time Trial account ledger integration (2026-11-22)

- PR #100 merged into `main` as `738356ce665ad2e94d6af04bee645dce44dc0ca0`. Question Quality, Firebase Emulator Integration and Visual Preview passed (3/3 checks).
- Added one canonical `quiz_reward` event for every successfully claimed Duel, Survival and Time Trial session.
- Added one `achievement_unlock` event per newly unlocked achievement in those mode reward claims.
- Ledger events are created in the same Firestore transaction as profile reward fields, achievement facts/receipts and the finalized session receipt.
- Deterministic identity uses the session ID for mode rewards and achievement ID for unlocks; retries return the stored receipt and do not append duplicates.
- Added adapter-level tests for mode reward deltas, achievement event metadata, zero-value unlock events and no ledger writes after invalid/corrupted claims.
- Existing win thresholds, streak behavior, score calculation and reward amounts are unchanged.
- No Production Firebase reads/writes, Rules/index changes, deployments, migrations, Auth changes or backfills. Legacy activity remains unverified.

## 97. Owner-scoped account ledger history API (2026-11-22)

- Added a read-only history service for `accountLedger/{auth.uid}/entries`; caller identity is derived from Firebase Auth and no UID field is accepted from the client.
- Added stable cursor pagination ordered by `occurredAt DESC, entryId DESC`, with page sizes capped at 50 and an optional allowlisted event-type filter.
- Cursor tokens are versioned and bound to the active filter; malformed tokens, forged owners and corrupt/foreign ledger documents are rejected.
- Responses project only approved event fields and never expose raw Firestore documents or internal metadata.
- Added a callable adapter and an emulator-only `accountLedgerHistoryPreviewCallable`; it refuses non-isolated/non-demo Firebase environments.
- Added unit/callable tests for owner derivation, UID injection, filtering, equal-timestamp page boundaries, empty history, malformed cursors and data-integrity checks.
- Production indexes/rules, Functions deployment, browser UI, backfill and client cutover remain NOT DONE. Legacy client-side activity is not merged into verified ledger history.

## 98. Repository documentation and hygiene (2026-11-22)

- Reworked the root README with a concise product overview, workflow badges, repository map, local setup, test commands and explicit Production safety boundaries.
- Added a documentation index at `docs/README.md` to distinguish product requirements, roadmap, implementation evidence, architecture contracts and dated audits.
- Added `CONTRIBUTING.md` with branch, PR, testing, security and comment-maintenance conventions.
- Added `scripts/README.md` describing the question validator and both browser preview scripts, including generated artifact locations.
- Expanded `.gitignore` for local environment files, Firebase state, dependencies, browser artifacts and generated test output.
- Audited GitHub code search for `DeepSeek`, `deepseek` and related spellings; no matching source comments or references were returned. No useful technical comments were bulk-deleted.
- Kept existing source paths and preview scripts in place because the visual-preview workflow still invokes them. No unverified legacy files or remote branches were deleted.
- No application behavior, Firebase Production configuration, Rules, deployed indexes, Functions deployment or user data were changed.

## 99. Account ledger history profile UI (2026-11-22)

- Added an owner-only activity-history panel to the private profile; public profile cards do not render the panel.
- Added Russian and English copy, operation-type filters, date/time display, separate coin and XP deltas, empty/loading/error/retry states and cursor-based "load more" pagination.
- Added responsive layouts for narrow screens and accessible labels/status announcements.
- Client calls only the authenticated `accountLedgerHistoryPreviewCallable`; the invoker validates response fields and strips unapproved identifiers before rendering.
- History reads remain opt-in only on localhost with the demo Firebase project, explicit emulator and feature query flags, and a signed-in non-anonymous account.
- Production currently displays a clear locked state; no Production callable is invoked and no unverified legacy client activity is presented as verified history.
- Added client boundary/response validation tests, including bounded JavaScript date validation and disabled filters during in-flight requests. Production Functions deployment, index/Rules review, production browser cutover and legacy import remain NOT DONE.

## 100. Account ledger history UI and V1 economy audit (2026-11-22)

- PR #102 merged to `main` as `179fab0`.
- The final PR head `f1e11bd` passed Question Quality, Firebase Emulator Integration and Visual Preview (3/3).
- Added owner-only localized responsive history UI with filter, cursor pagination, empty/loading/error/retry states and bounded response validation.
- Added a fail-closed local demo emulator preview guard; Production remains locked and no Production callable is invoked.
- Reviewed the V1 economy source paths and recorded current client writes, trusted preview coverage and cutover blockers in `docs/audits/ECONOMY_V1_CUTOVER_AUDIT_2026-11-22.md`.
- Confirmed remaining production browser writes for quiz rewards, profile bootstrap, shop, daily login and achievements. Server callable previews remain emulator-only.
- Identified a progression consistency gap: server reward claims compute `achievementFacts.level`, but the trusted user projection does not update `users/{uid}.level`. Achievement facts intentionally start at zero and do not trust legacy client XP; define a safe baseline before syncing to avoid downgrading existing accounts. Fix and regression tests are NOT DONE.
- Production Functions/Rules/index deployment, client cutover, legacy backfill, refund flow and daily competitive prize callable remain NOT DONE.


## 101. Trusted progression baseline and atomic level projection (2026-11-22)

- Started implementation on `feat/trusted-progression-baseline`; PR and final CI evidence are pending.
- Trusted profile creation now initializes `achievementFacts/{uid}` in the same Firestore transaction as the private/public profile and nickname claim. The baseline is zero XP / level 1 and carries a server-created `baselineTrusted: true` marker.
- The marker is preserved only when it already exists in trusted facts. Existing profiles with no marker are not automatically promoted, and their legacy `users/{uid}.level` is never overwritten by a lower trusted-from-zero level.
- Classic and Duel / Survival / Time Trial reward claims now include the XP-derived level in the same transaction only when the trusted baseline marker is present.
- The Firestore user projection allowlists the level field, and the optional public-profile projection receives the same level in that transaction.
- Added unit and emulator coverage for trusted baseline creation, 99 → 100 XP threshold progression, legacy-level preservation and public-profile level sync.
- This is a server-side emulator-preview contract only. Production Rules must explicitly deny client writes to `achievementFacts`; no Production callable, Rules, indexes, migration or client cutover was changed.
- Existing-account baseline/backfill remains NOT DONE and requires separate provenance review. Production deployment and browser cutover remain NOT DONE.


## 102. Trusted progression baseline and atomic level sync — merged (2026-11-22)

- PR #104 merged to `main` as `e77a0f94eb77bf2afc205a5dcc98b45c67066815`.
- Final-head CI passed: Question Quality, Firebase Emulator Integration and QuizHub Visual Preview (3/3).
- New trusted profile creation writes the zero-XP `achievementFacts` baseline in the same transaction as private/public profile and nickname claim.
- Classic and Duel / Survival / Time Trial claims mirror server-derived level to the private profile only when the server-created `baselineTrusted` marker exists; optional public-profile sync uses the same transaction.
- Regression tests cover trusted and legacy profiles, threshold crossing and public projection.
- This remains emulator-preview implementation. Production Rules, Functions deployment, client cutover and existing-account migration remain NOT DONE.


## 103. Shop purchase retry safety (2026-11-22)

- Confirmed PR #104 is merged and its final-head Question Quality, Firebase Emulator Integration and Visual Preview workflows all passed.
- Audited the existing shop preview contract: server catalog prices, authenticated UID, atomic balance/ownership/equipment mutation, operation receipts, append-only purchase ledger event and ownership-checked equip are already implemented and covered by unit + emulator tests.
- Found a browser retry gap: each click generated a fresh operation ID. If the server committed a purchase but the response was lost, a manual retry could use a new key and return ITEM_ALREADY_OWNED instead of the original receipt. The balance was protected, but recovery UX was poor.
- Added a small browser helper that persists one pending operation ID per account/item and reuses it after network ambiguity. The key is cleared only after a structurally valid server receipt; storage failures fall back to same-tab memory.
- Added tests for retry reuse, module reload persistence, account/item isolation, invalid stored keys, receipt clearing and storage failure.
- Work is on `fix/shop-retry-idempotency`; PR and CI evidence are pending.
- This only improves the explicit local emulator preview path. Production still uses the legacy direct Firestore writes; no production client cutover, Rules change or deployment was made.


## 104. Shop retry idempotency merged (2026-11-22)

- PR #105 merged to `main` as `2525025f5af6fc3fd27d1925b677ce45906eee5d`.
- Final-head CI passed: Question Quality, Firebase Emulator Integration and QuizHub Visual Preview (3/3).
- Browser preview now persists a pending operation ID per signed-in account and item, reuses it after ambiguous network failures and clears it only after validating a server receipt.
- Retry keys survive a browser module reload through local storage; same-tab memory fallback is retained when storage is unavailable.
- This behavior is only active in the explicit local shop preview. Legacy production direct-write path remains unchanged.

## 105. Staged production shop callable (2026-11-22)

- Added `shopPurchase` as a production-callable source export using the same authenticated handler, server catalog and Firestore transaction service as `shopPurchasePreview`.
- The preview callable remains guarded to the isolated `demo-quizhub` Auth + Firestore + Functions emulator environment.
- Firebase shop integration test now targets the staged `shopPurchase` export, covering forged fields, authoritative catalog price, atomic debit/ownership, idempotent retry, equip ownership and insufficient balance.
- Source implementation only: no Firebase Functions deployment, client cutover, production Rules/index change, live database access or migration was performed.
- Next gate: validate the production callable in emulator CI, review deployed production Rules/indexes and complete a full shop client migration plan before owner-approved deployment.


## 106. Staged production shop callable merged (2026-11-22)

- PR #106 merged to `main` as `38f24870e8acc6940afcadc1a02a70c4c3937b14`.
- Final-head CI passed: Question Quality, Firebase Emulator Integration and QuizHub Visual Preview (3/3).
- `shopPurchase` is now an exported callable source endpoint. It delegates to the existing authenticated handler and the server-authoritative catalog-priced Firestore transaction service.
- The end-to-end Firebase emulator test now calls `shopPurchase` and verifies forged payload rejection, catalog price, atomic balance/ownership mutation, idempotent retry, equip ownership and insufficient balance.
- `shopPurchasePreview` remains separately guarded to the isolated `demo-quizhub` Auth + Firestore + Functions emulators.
- Important: source merge is not deployment. No Production Functions deployment, browser client cutover, Firestore Rules/index change, migration, or live database operation was performed. Production direct-write shop path remains active until a separately reviewed cutover.


## 107. Production shop browser transport preparation (2026-11-22)

- Added a dedicated production callable transport targeting `shopPurchase`; it requires a signed-in Firebase user and sends only allowlisted `purchase` / `equip` payloads.
- Extracted shared client payload validation so the emulator preview and production transport reject client-authored prices, UIDs, durations, effects and unexpected fields consistently.
- Added tests for production callable selection, signed-out callers, malformed item IDs and forged economy fields.
- This is transport preparation only. The live shop UI remains on its existing production direct-write path; the production transport is not wired or feature-enabled because Functions have not been deployed.
- No Production Functions, Firestore Rules, indexes, live data or feature gates were changed. Coordinated cutover remains blocked on owner-approved environment/Rules evidence, deployed callable availability, migration and rollback review.
