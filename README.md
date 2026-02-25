LEGO Store API (React + Express)
Описание проекта
Проект представляет собой интернет-магазин LEGO, использующий React для фронтенда и Express для бэкенда. В проекте реализованы CRUD операции для товаров и документация через Swagger.

Запуск проекта
1. Сервер (Express)

Перейти в папку fbr_practice_5/server:

cd fbr_practice_5/server

Установить зависимости:

npm install

Запустить сервер:

node app.js

Сервер будет доступен по адресу: http://localhost:3000.

2. Клиент (React)

Перейти в папку fbr_practice_5/client:

cd fbr_practice_5/client

Установить зависимости:

npm install

Запустить React:

npm start

Клиент будет доступен по адресу: http://localhost:3001.

Технологии

Frontend:

React

Axios

Sass

Backend:

Express

Swagger UI (для документации)

nanoid (для генерации уникальных ID)

Описание функционала
Backend (Express)

CRUD API для товаров LEGO:

GET /api/products — все товары

GET /api/products/:id — товар по ID

POST /api/products — добавление товара

PATCH /api/products/:id — обновление товара

DELETE /api/products/:id — удаление товара

Swagger для автоматической документации API доступно по /api-docs.

Frontend (React)

Отображение товаров с возможностью добавления, редактирования и удаления.

Все данные загружаются с сервера через Axios.

Стилизация через Sass.

Swagger UI

Для тестирования API, открой:

http://localhost:3000/api-docs
Примечание

Данные о товарах хранятся в памяти (при перезапуске сервера данные будут сброшены).

Заключение

Этот проект демонстрирует fullstack-приложение с React и Express, с использованием Swagger для документирования API.
