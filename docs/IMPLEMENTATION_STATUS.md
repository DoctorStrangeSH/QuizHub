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
| REL-01 | Разбор PR #3 | In progress | CI зелёный, но PR крупный, diverged и не имеет review |

## 8. Решение по этапу 0

**Этап 0: IN PROGRESS / BLOCKED ON PRODUCTION EVIDENCE.**

Выполнена source-level инвентаризация main, клиентских write paths, server exports, emulator-only конфигураций, CI и открытого PR. Но этап нельзя закрыть, пока не получены и не проверены:

1. Полный read-only список root/nested collections и документов живой базы.
2. Экспорт фактически развёрнутых Firestore Security Rules и indexes.
3. Подтверждение Auth providers и authorized domains.
4. Production backup с доказанной возможностью восстановления в отдельном безопасном окружении.
5. Решение по PR #3 после ревью и приведения его изменений к этапам ТЗ.

**Запрещено до снятия блокеров:** менять production Rules, включать profile/chat cutover, запускать миграции реальных пользователей, развёртывать новые привилегированные Functions или удалять legacy данные.

## 9. Следующий разрешённый шаг

Продолжить аудит PR #3 без merge: разделить его изменения по Requirement IDs, проверить критичные security-sensitive файлы и определить, какие части должны попасть в этап 2 (profiles), а какие — в этап 3 (friends/chats). Параллельно запросить у владельца необходимые read-only production evidence для завершения этапа 0.

Новые продуктовые функции не добавлять.
