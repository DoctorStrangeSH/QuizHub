# Документация QuizHub

Этот каталог содержит продуктовые требования, архитектурные контракты, технические handoff-документы и аудиты. Актуальное состояние реализации фиксируется отдельно от планов.

## С чего начать

| Документ | Для чего нужен |
|---|---|
| [PRODUCT_SPECIFICATION_V1.md](PRODUCT_SPECIFICATION_V1.md) | Единое ТЗ: объём V1, требования, критерии приёмки и границы релиза |
| [../ROADMAP.md](../ROADMAP.md) | Этапы V1, статусы DONE / IN PROGRESS / NOT DONE и release gates |
| [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) | Фактически реализованные изменения и подтверждения |
| [ECONOMY_SECURITY.md](ECONOMY_SECURITY.md) | Границы доверия, защита наград и миграция экономики |
| [FIREBASE_FUNCTIONS_HANDOFF.md](FIREBASE_FUNCTIONS_HANDOFF.md) | Локальная разработка и передача Firebase Functions |
| [AUTH_RELEASE_CHECKLIST.md](AUTH_RELEASE_CHECKLIST.md) | Проверки авторизации перед выпуском |

## Архитектура

Документы в `architecture/` описывают стабильные контракты между игровыми режимами, клиентом и сервером.

- [V1_SERVER_MODE_INTEGRATION_CONTRACT.md](architecture/V1_SERVER_MODE_INTEGRATION_CONTRACT.md) — границы серверной интеграции игровых режимов.
- [V1_SERVER_MODE_SCORING_CONTRACTS.md](architecture/V1_SERVER_MODE_SCORING_CONTRACTS.md) — правила подсчёта и валидации результатов.

## Аудиты и миграции

Материалы в `audits/` и документы с префиксами `PHASE`, `PRODUCTION`, `CUTOVER`, `BACKFILL` фиксируют отдельные проверки и этапы миграции.

| Документ | Назначение |
|---|---|
| [CLIENT_WRITE_PATH_AUDIT.md](CLIENT_WRITE_PATH_AUDIT.md) | Клиентские пути записи и границы доверия |
| [FIRESTORE_READ_WRITE_MAP_V1.md](FIRESTORE_READ_WRITE_MAP_V1.md) | Карта чтения и записи Firestore |
| [PHASE_0_OWNER_EVIDENCE_RUNBOOK.md](PHASE_0_OWNER_EVIDENCE_RUNBOOK.md) | Безопасный сбор подтверждений владельцем |
| [PRODUCTION_FIREBASE_STAGE0.md](PRODUCTION_FIREBASE_STAGE0.md) | Подготовительный этап проверки Production Firebase |
| [QUIZ_REWARDS_CUTOVER_V1.md](QUIZ_REWARDS_CUTOVER_V1.md) | План перехода начислений на доверенную серверную сторону |

Снимки аудитов являются историческими свидетельствами на дату создания. Они не заменяют повторную проверку актуального Production-конфига.

## Правило актуальности

- ТЗ определяет, **что должно войти** в V1.
- ROADMAP показывает, **что осталось сделать**.
- IMPLEMENTATION_STATUS показывает, **что действительно сделано**.
- Архитектурные документы определяют, **как должны взаимодействовать компоненты**.
- Аудиты фиксируют, **что было проверено на конкретную дату**.

Если документы расходятся, не объявляйте функцию готовой автоматически: сначала сверяйте дату, ветку, commit SHA и результаты CI.
