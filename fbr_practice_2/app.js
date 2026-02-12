const express = require('express');
const app = express();
const port = 3000;

// Middleware для парсинга JSON
app.use(express.json());

// Товары (в памяти)
let products = [
  { id: 1, name: 'LEGO Stranger Things The Upside Down 75810', price: 24999 },
  { id: 2, name: 'LEGO City', price: 5999 },
  { id: 3, name: 'LEGO Star Wars', price: 9999 },
];

// Главная страница
app.get('/', (req, res) => {
  res.send('Главная страница');
});

// READ: просмотр всех товаров
app.get('/products', (req, res) => {
  res.json(products);
});

// READ: просмотр товара по id
app.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id == req.params.id);
  res.json(product);
});

// CREATE: добавление товара
app.post('/products', (req, res) => {
  const { name, price } = req.body;

  const newProduct = {
    id: Date.now(),
    name,
    price,
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

// UPDATE: редактирование товара по id
app.patch('/products/:id', (req, res) => {
  const product = products.find(p => p.id == req.params.id);
  const { name, price } = req.body;

  if (name !== undefined) product.name = name;
  if (price !== undefined) product.price = price;

  res.json(product);
});

// DELETE: удаление товара по id
app.delete('/products/:id', (req, res) => {
  products = products.filter(p => p.id != req.params.id);
  res.send('Ok');
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
