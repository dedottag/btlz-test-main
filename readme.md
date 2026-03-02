# WB Tariffs Sync Service

Сервис собирает тарифы Wildberries для коробов, сохраняет их в PostgreSQL и регулярно выгружает актуальные данные в Google Sheets.

## Что делает сервис
- По расписанию запрашивает WB API `GET /api/v1/tariffs/box`.
- Накапливает тарифы в БД по дням.
- В пределах одного дня обновляет запись по тому же складу (upsert).
- Публикует актуальный срез в одну или несколько Google-таблиц (лист `stocks_coefs`).
- Сортирует выгрузку по возрастанию коэффициента.

## Технологии
- `Node.js` + `TypeScript`
- `PostgreSQL`
- `knex.js`
- `googleapis`
- `node-cron`
- `Docker Compose`

## Слои приложения
- `services/*` — инфраструктурные операции (DB, WB API, Google API, locks, mapper).
- `jobs/*` — прикладные задачи (`FetchTariffsJob`, `SyncSheetsJob`) с dependency injection.
- `services/scheduler.ts` — orchestration cron-расписания без доменной логики внутри.

## Структура данных
Основные таблицы:
- `warehouses` — справочник складов.
- `tariffs_box_daily` — дневные тарифы, привязанные к `warehouse_key`.
- `spreadsheets` — список целевых Google Spreadsheet ID.

Ключевые правила:
- Уникальность дневной записи: `(day_date, warehouse_key)`.
- Дневной апдейт выполняется через `onConflict(...).merge(...)`.
- В выгрузку попадает текущий день в таймзоне `APP_TIMEZONE`.
- Cron-задачи защищены `pg advisory lock`, поэтому параллельные инстансы не дублируют обработку.

## Конфигурация
Создайте `.env` на основе `example.env`:

```bash
cp example.env .env
```

Обязательные значения для боевого запуска:
- `WB_API_TOKEN`
- `GOOGLE_SERVICE_ACCOUNT_JSON`
- `GOOGLE_SHEETS_IDS`

Поддерживается два формата `GOOGLE_SERVICE_ACCOUNT_JSON`:
- JSON строка
- Base64 от JSON

## Запуск

```bash
docker compose up --build
```

После старта приложение автоматически:
- применяет миграции;
- выполняет seed;
- запускает cron-планировщик;
- поднимает HTTP endpoint.

Проверка состояния:

```bash
curl http://localhost:5000/health
```

## Расписания
- `FETCH_CRON` (по умолчанию `0 * * * *`) — запрос WB и запись в БД.
- `SHEETS_CRON` (по умолчанию `10 * * * *`) — синхронизация в Google Sheets.

## Google Sheets
Требования:
- лист `stocks_coefs` существует;
- сервис-аккаунт имеет роль `Editor` в каждой таблице из `GOOGLE_SHEETS_IDS`.

Механика обновления:
- сервис записывает актуальный диапазон;
- затем очищает только хвост старых строк;
- избегается сценарий “лист очищен, запись не дошла”.

Тестовая таблица:
- https://docs.google.com/spreadsheets/d/10VRG3Hcrjjgtu0iIVr_2kv15Q-YEBdCwb9dgR83-N5g/edit?usp=sharing

## Проверка работы
Минимальный сценарий:
- запустить `docker compose up --build`;
- убедиться, что контейнеры `app` и `postgres` в статусе `Up`;
- проверить `GET /health`;
- проверить логи `app` на сообщения:
  - `WB tariffs fetched`
  - `Tariffs upserted`
  - `Google sheet updated`

## Локальные команды
Миграции:

```bash
npm run knex:dev migrate latest
```

Тесты:

```bash
npm test
```

Проверка типов:

```bash
npm run tsc:check
```

## CI
Workflow: `.github/workflows/ci.yml`

Этапы:
- `npm ci`
- `npm run tsc:check`
- `npm test`
- `docker compose build app`

## Troubleshooting
- `403 The caller does not have permission` в Google API: сервис-аккаунту не выдан доступ к таблице.
- `401` от WB API: невалидный/просроченный `WB_API_TOKEN`.
- Пустой результат в таблице: проверить `GOOGLE_SHEETS_COEF_FIELD` и payload WB API.

## Безопасность
- Не коммитьте `.env` и любые ключи.
- Для публичной демонстрации используйте только `example.env` с заглушками.
