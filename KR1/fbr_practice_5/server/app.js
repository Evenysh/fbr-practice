const express = require("express");
const cors = require("cors");
const { nanoid } = require("nanoid");

// Подключаем Swagger
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const PORT = 3001;

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

// Массив товаров LEGO
let products = [
  { id: nanoid(), name: "LEGO Stranger Things The Upside Down 75810", category: "Ideas / Licensed", description: "Двусторонняя модель дома Байерсов и Upside Down", price: 24999, stock: 3 },
  { id: nanoid(), name: "LEGO Star Wars Millennium Falcon 75192", category: "Star Wars", description: "Коллекционный Сокол тысячелетия Ultimate Collector Series", price: 79999, stock: 1 },
  { id: nanoid(), name: "LEGO Harry Potter Hogwarts Castle 71043", category: "Harry Potter", description: "Хогвартс в масштабе микрофигурок, UCS-набор", price: 42999, stock: 2 },
  { id: nanoid(), name: "LEGO Technic Bugatti Chiron 42083", category: "Technic", description: "Суперкар Technic с детализацией и коробкой передач", price: 35999, stock: 4 },
  { id: nanoid(), name: "LEGO City Police Station 60316", category: "City", description: "Полицейский участок City с транспортом и минифигурками", price: 8999, stock: 8 },
  { id: nanoid(), name: "LEGO Creator Expert Volkswagen Beetle 10252", category: "Creator Expert", description: "Классический Beetle с деталями и аксессуарами", price: 13999, stock: 5 },
  { id: nanoid(), name: "LEGO NINJAGO City Gardens 71741", category: "NINJAGO", description: "Большой модульный набор NINJAGO City Gardens", price: 34999, stock: 2 },
  { id: nanoid(), name: "LEGO Marvel Daily Bugle 76178", category: "Marvel", description: "Здание Daily Bugle с минифигурками персонажей Marvel", price: 39999, stock: 1 },
  { id: nanoid(), name: "LEGO Architecture Statue of Liberty 21042", category: "Architecture", description: "Статуя Свободы из серии Architecture", price: 10999, stock: 6 },
  { id: nanoid(), name: "LEGO Ideas Tree House 21318", category: "Ideas", description: "Дом на дереве с модулями и сменными листьями", price: 21999, stock: 3 },
];

// Swagger конфигурация
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LEGO Store API",
      version: "1.0.0",
      description: "CRUD API для товаров LEGO",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Локальный сервер",
      },
    ],
  },
  apis: ["./app.js"], // Путь к файлу с описанием
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - description
 *         - category
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный идентификатор товара
 *         name:
 *           type: string
 *           description: Название товара
 *         price:
 *           type: number
 *           description: Цена товара
 *         description:
 *           type: string
 *           description: Описание товара
 *         category:
 *           type: string
 *           description: Категория товара
 *       example:
 *         id: "123456"
 *         name: "LEGO Stranger Things"
 *         price: 24999
 *         description: "Модель дома Байерсов"
 *         category: "Ideas"
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить все товары
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список всех товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get("/api/products", (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Информация о товаре
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 */
app.get("/api/products/:id", (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
app.post("/api/products", (req, res) => {
  const { name, price, description, category } = req.body;
  const newProduct = {
    id: nanoid(),
    name,
    price,
    description,
    category
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Обновить данные товара
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Обновлённый товар
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Нет данных для обновления
 *       404:
 *         description: Товар не найден
 */
app.patch("/api/products/:id", (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const { name, price, description, category } = req.body;
  if (name !== undefined) product.name = name;
  if (price !== undefined) product.price = price;
  if (description !== undefined) product.description = description;
  if (category !== undefined) product.category = category;

  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID товара
 *     responses:
 *       204:
 *         description: Товар удалён
 */
app.delete("/api/products/:id", (req, res) => {
  const productIndex = products.findIndex(p => p.id === req.params.id);
  if (productIndex === -1) return res.status(404).json({ message: "Product not found" });
  products.splice(productIndex, 1);
  res.status(204).send();
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server started: http://localhost:${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
});