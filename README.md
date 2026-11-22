<div align="center">

  <img src="app/assets/quizhub-mark.svg" alt="QuizHub" width="88" height="88">

  # QuizHub

  **Quiz Empire — мир викторин, соревнований и коллекционирования**

  [Играть](https://doctorstrangesh.github.io/QuizHub/) ·
  [Техническое задание V1](docs/PRODUCT_SPECIFICATION_V1.md) ·
  [Дорожная карта](ROADMAP.md) ·
  [Документация](docs/README.md)

  ![Question quality](https://github.com/DoctorStrangeSH/QuizHub/actions/workflows/question-quality.yml/badge.svg)
  ![Firebase emulator integration](https://github.com/DoctorStrangeSH/QuizHub/actions/workflows/firebase-emulator.yml/badge.svg)
  ![Visual preview](https://github.com/DoctorStrangeSH/QuizHub/actions/workflows/visual-preview.yml/badge.svg)

</div>

---

## О проекте

QuizHub — адаптивная браузерная игра-викторина. Игрок отвечает на вопросы из тематических категорий, соревнуется в разных режимах, развивает профиль, открывает достижения и взаимодействует с другими игроками.

Проект построен на JavaScript ES Modules и Firebase. Интерфейс поддерживает русский и английский языки.

> **Статус продукта:** разработка ведётся по фиксированному объёму V1. Наличие модуля, preview callable или успешных тестов в эмуляторе не означает, что функция уже включена в Production. Точный статус и ограничения указаны в [ROADMAP.md](ROADMAP.md) и [IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md).

## Возможности проекта

| Раздел | Назначение |
|---|---|
| Викторины | Тематические вопросы, уровни сложности и результаты раундов |
| Игровые режимы | Classic, Duel, Survival и Time Trial |
| Ежедневное испытание | Ежедневный набор вопросов и отдельный игровой сценарий |
| Профиль и прогресс | Уровень, опыт, достижения и настройки игрока |
| Социальные функции | Друзья, рейтинги и чат |
| Коллекция | Внутриигровой магазин и косметические предметы |
| PWA | Установка на устройство, manifest и service worker |

Доступность отдельных серверных функций зависит от стадии миграции. См. [статус реализации](docs/IMPLEMENTATION_STATUS.md).

## Быстрый запуск

### Требования

- Git
- Python 3 (для локального HTTP-сервера)
- Современный браузер
- Node.js 22 — для тестов и сборки Firebase Functions

### Запуск клиента

```bash
git clone https://github.com/DoctorStrangeSH/QuizHub.git
cd QuizHub
python -m http.server 8000
```

Откройте [http://localhost:8000](http://localhost:8000).

Не открывайте `index.html` напрямую через `file://`: приложению необходим HTTP-сервер для ES-модулей и сетевых запросов.

### Firebase Functions

```bash
npm install --prefix functions
npm run --prefix functions build
npm run --prefix functions check
```

Для локальных интеграционных проверок используются Firebase Emulator Suite и отдельный demo project. Инструкции и защитные ограничения описаны в [Firebase Functions handoff](docs/FIREBASE_FUNCTIONS_HANDOFF.md).

## Структура репозитория

```text
QuizHub/
├── app/                  # Браузерное приложение
│   ├── assets/           # Логотип и графические ресурсы
│   ├── data/             # Категории и банк вопросов
│   ├── locales/          # Переводы RU / EN
│   ├── modules/          # Игровые и пользовательские модули
│   ├── store/            # Клиентское состояние
│   └── styles/           # Общая дизайн-система
├── server/               # Серверные сервисы и доверенные границы
├── functions/            # Firebase Cloud Functions и emulator tests
├── tests/                # Unit, UI, security и integration tests
├── scripts/              # Проверка вопросов и browser previews
├── docs/                 # ТЗ, архитектура, аудиты и handoff
├── ROADMAP.md            # План и критерии выпуска V1
├── firebase.json         # Firebase и Emulator Suite
└── index.html            # Точка входа PWA
```

Подробная карта документов и назначение основных файлов: [docs/README.md](docs/README.md).

## Проверки и качество

Основные команды:

```bash
# Проверить банк вопросов
node --experimental-default-type=module scripts/validate-questions.mjs

# Запустить тесты приложения
node --experimental-default-type=module --test tests/*.test.mjs

# Проверить и собрать Cloud Functions
npm install --prefix functions
npm run --prefix functions build
npm run --prefix functions check
```

Firebase Emulator tests запускаются workflow `Firebase emulator integration`. Не направляйте тестовые сценарии на Production Firebase.

## Безопасность и данные

- Клиентская конфигурация Firebase не является административным секретом. Не добавляйте в репозиторий service-account keys, приватные ключи или токены.
- Серверные preview callable должны оставаться закрытыми вне изолированного demo emulator environment.
- Не меняйте Production Firestore Rules, индексы или Functions в рамках обычной разработки без отдельного аудита и согласованного плана миграции.
- Исторические клиентские операции нельзя выдавать за проверенные серверные ledger-события.
- Не выполнять backfill, миграции и массовые изменения пользовательских данных без отдельного плана восстановления и явного разрешения.

Подробности: [ECONOMY_SECURITY.md](docs/ECONOMY_SECURITY.md), [Production Firebase Stage 0](docs/PRODUCTION_FIREBASE_STAGE0.md).

## Как вносить изменения

1. Сверяйте задачу с [ТЗ V1](docs/PRODUCT_SPECIFICATION_V1.md) и [дорожной картой](ROADMAP.md).
2. Делайте небольшие изменения в отдельной ветке.
3. Добавляйте или обновляйте тесты вместе с кодом.
4. Для PR указывайте область изменений, проверенные сценарии, ограничения и способ отката.
5. Считайте задачу завершённой только после прохождения необходимых CI-проверок и обновления статуса реализации.

Подробные правила: [CONTRIBUTING.md](CONTRIBUTING.md).

---

<div align="center">

  **QuizHub — играй, развивайся, соревнуйся.**

  <sub>Документация и статус должны отражать реальное состояние кода, а не запланированные возможности.</sub>

</div>
