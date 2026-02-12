const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

let products = [
  { id: 1, name: 'LEGO Stranger Things The Upside Down 75810', price: 24999 },
  { id: 2, name: 'LEGO City', price: 5999 },
  { id: 3, name: 'LEGO Star Wars', price: 9999 },
];

app.get('/', (req, res) => {
  res.send('Главная страница');
});

app.get('/products', (req, res) => {
  res.json(products);
});

app.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id == req.params.id);
  res.json(product);
});

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

app.patch('/products/:id', (req, res) => {
  const product = products.find(p => p.id == req.params.id);
  const { name, price } = req.body;

  if (name !== undefined) product.name = name;
  if (price !== undefined) product.price = price;

  res.json(product);
});

app.delete('/products/:id', (req, res) => {
  products = products.filter(p => p.id != req.params.id);
  res.send('Ok');
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
