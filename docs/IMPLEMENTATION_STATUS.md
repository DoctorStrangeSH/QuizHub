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
