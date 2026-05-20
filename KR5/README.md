# Контрольная работа №5
## Практические работы 25–27

В рамках контрольной работы №5 последовательно отрабатывались подходы к **оптимизации фронтенда**, построению **GraphQL API** и организации **асинхронной обработки задач** через брокер сообщений **RabbitMQ** (паттерн Producer–Consumer, retry с экспоненциальной задержкой, Dead Letter Queue, несколько воркеров).

Контрольная работа №5 объединяет результаты практических заданий **25–27** и сопровождается данным `README.md`.

---

## Используемые технологии

В рамках выполнения практических работ использовались:

- **React**, **React DOM**
- **React Router**
- **Vite**, **@vitejs/plugin-react**
- **rollup-plugin-visualizer** — анализ размера бандла
- **Node.js**
- **Apollo Server**, **GraphQL**
- **Express**
- **RabbitMQ**, библиотека **amqplib**
- **Docker**, **Docker Compose**

---

## Практическая работа 25

На данном этапе реализовано клиентское приложение на **React (Vite)** с маршрутизацией и **ленивой загрузкой** отдельных страниц для уменьшения начального объёма JavaScript.

### Выполненные доработки

- создано SPA на **React** с **React Router** (`/` — главная, `/about` — «О нас»);
- страница **«О нас»** подключается через **`React.lazy()`** и отображается внутри **`Suspense`** с fallback «Загрузка...»;
- главная страница загружается сразу, код второй страницы выносится в **отдельный chunk**;
- в **`vite.config.js`** подключён **`rollup-plugin-visualizer`**: после сборки формируется отчёт **`bundle-report.html`** с размерами модулей (в т.ч. gzip).

### Результат

В результате практики №25 закреплены приёмы **code splitting** на уровне маршрутов: пользователь быстрее получает первый экран, а тяжёлые части подгружаются по требованию. Отчёт visualizer позволяет оценить вклад каждого модуля в итоговый бандл.

**Каталог:** [`fbr-practice_25`](./fbr-practice_25).

---

## Практическая работа 26

На данном этапе реализован **GraphQL-сервер** на **Apollo Server** с типами **Author** и **Book**, запросами и мутациями для учебного каталога книг.

### Выполненные доработки

- описана схема GraphQL: типы **`Author`**, **`Book`**, связи автор ↔ книги;
- **Query**:
  - `books` — список всех книг;
  - `book(id)` — книга по идентификатору;
  - `authors` — список авторов;
- **Mutation**:
  - `createAuthor(name)` — добавление автора;
  - `createBook(title, authorId)` — добавление книги;
- данные хранятся **в памяти** (массивы `authors`, `books`), резолверы связывают сущности по `authorId`;
- сервер запускается через **`@apollo/server/standalone`** на порту **4000**.

### Результат

В результате практики №26 получен компактный **GraphQL API**: один эндпоинт вместо множества REST-маршрутов, клиент запрашивает только нужные поля, мутации изменяют связанные сущности в единой схеме.

**Каталог:** [`fbr-practice_26`](./fbr-practice_26).

---

## Практическая работа 27

На данном этапе реализована система **асинхронной обработки задач** на базе **RabbitMQ**: Express принимает задачи, воркеры обрабатывают их из очереди с повторными попытками и перенаправлением «мёртвых» сообщений в **DLQ**.

### Выполненные доработки

- **RabbitMQ** поднимается через **Docker Compose** (`rabbitmq:3-management`, порты **5672** / **15672**);
- **Producer** — Express API, маршрут **`POST /tasks`**: тело `{ type, payload }` (например, `{ type: "email", payload: { ... } }`), задача помещается в очередь **`task_queue`** с `persistent: true`;
- **Consumer** — скрипт **`worker.js`**, идентификатор воркера через **`WORKER_ID`**; обработка имитируется выводом в консоль и задержкой ~1.5 с;
- **Retry Logic** — модуль **`retry.js`**, функция **`processWithRetry`**: экспоненциальная задержка с джиттером, минимум **3** попытки;
- **Dead Letter Queue** — exchange **`dlx_exchange`**, очередь **`dead_letter_queue`**, основная очередь с аргументами `x-dead-letter-exchange` / `x-dead-letter-routing-key`; при исчерпании попыток — **`nack`** без requeue, сообщение уходит в DLQ;
- настройка очередей вынесена в **`setup-queues.js`** (также выполняется при старте **`server.js`**);
- для проверки распределения нагрузки запускаются **не менее двух** воркеров с разными **`WORKER_ID`**.

### Результат

В результате практики №27 продемонстрированы **слабая связанность** сервисов через очередь, буферизация задач, устойчивость к сбоям (retry + DLQ) и **горизонтальное масштабирование** обработчиков за счёт нескольких воркеров на одной очереди.

**Каталог:** [`fbr-practice_27`](./fbr-practice_27).

---

## Структура итоговых материалов (КР5)

В рамках контрольной работы №5 представлены:

- React-приложение с **lazy loading** маршрутов и отчётом по бандлу (практика 25);
- **GraphQL**-сервер на Apollo Server (практика 26);
- асинхронная обработка задач через **RabbitMQ** (практика 27).

```
KR5/
├── README.md
├── fbr-practice_25/
│   ├── src/
│   ├── bundle-report.html   # после npm run build
│   └── vite.config.js
├── fbr-practice_26/
│   ├── server.js
│   └── images/              # скриншоты для отчёта
└── fbr-practice_27/
    ├── docker-compose.yml
    ├── server.js            # Producer (Express)
    ├── worker.js            # Consumer
    ├── retry.js
    └── setup-queues.js
```

---

## Запуск проекта

### Практика 25

```bash
cd fbr-practice_25
npm install
npm run dev
```

```bash
cd KR5/fbr-practice_25
npm install
npm run dev
```

Приложение: адрес из вывода Vite (обычно **`http://localhost:5173`**). Переход на **«О нас»** подгружает отдельный chunk (в DevTools → Network виден динамический импорт).

Сборка и отчёт по размеру бандла:

```bash
npm run build
```

После сборки откройте **`bundle-report.html`** в корне `fbr-practice_25` (файл генерируется плагином visualizer).

### Практика 26

```bash
cd fbr-practice_26
npm install
npm start
```

```bash
cd KR5/fbr-practice_26
npm install
npm start
```
освободить порт и запустить снова:
```bash
kill 26786
npm start
```

GraphQL: **`http://localhost:4000`**. Примеры запросов в Playground или через `curl`:

```bash
curl -X POST http://localhost:4000 \
  -H "Content-Type: application/json" \
  -d '{"query":"{ books { id title author { name } } }"}'
```

### Практика 27

**1. RabbitMQ и очереди** (из каталога `fbr-practice_27`):

```bash
docker compose up -d
npm install
npm run setup
```

```bash
cd KR5/fbr-practice_27
docker compose up -d
npm install
npm run setup
```

**2. Producer** (терминал 1):

```bash
npm start
```

API: **`http://localhost:3000`**, маршрут **`POST /tasks`**.

Если порт 3000 занят (`EADDRINUSE`), завершите старый процесс:

```bash
lsof -i :3000 -sTCP:LISTEN
kill <PID>
```

**3. Воркеры** (терминалы 2 и 3, обязательно из `fbr-practice_27`):

```bash
WORKER_ID=1 npm run worker
```
```bash
cd KR5/fbr-practice_27
WORKER_ID=1 npm run worker
```

```bash
WORKER_ID=2 npm run worker
```

```bash
cd KR5/fbr-practice_27
WORKER_ID=2 npm run worker
```

**4. Отправка задач** (терминал 4):

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"type":"email","payload":{"to":"user@example.com","subject":"Тест"}}'
```

Несколько запросов подряд — в логах воркеров видно **распределение** задач между **Worker 1** и **Worker 2**.

```bash
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"type":"email","payload":{"to":"a@test.com","subject":"1"}}'
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"type":"email","payload":{"to":"b@test.com","subject":"2"}}'
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"type":"email","payload":{"to":"c@test.com","subject":"3"}}'
```

**Порядок запуска:** Docker → `npm run setup` → `npm start` → два воркера → `curl`.

---

## Примечания

- Практики **25** и **26** не зависят друг от друга и от RabbitMQ; их можно запускать отдельно.
- Для практики **27** все команды `npm` выполняются из каталога **`fbr-practice_27`**, иначе npm не найдёт `package.json`.
- Веб-интерфейс RabbitMQ (`http://localhost:15672`, `guest` / `guest`) в задании не требуется; он доступен как часть образа `rabbitmq:3-management` при необходимости просмотра очередей.
- Скриншоты для отчёта по практике **26** могут храниться в [`fbr-practice_26/images`](./fbr-practice_26/images).
