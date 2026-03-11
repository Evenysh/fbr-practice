const express = require("express");
const cors = require("cors");
const { nanoid } = require("nanoid");

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

let products = [
  {
    id: nanoid(),
    name: "LEGO Stranger Things The Upside Down 75810",
    category: "Ideas / Licensed",
    description: "Двусторонняя модель дома Байерсов и Upside Down.",
    price: 24999,
    stock: 3,
  },
  {
    id: nanoid(),
    name: "LEGO Star Wars Millennium Falcon 75192",
    category: "Star Wars",
    description: "Коллекционный Сокол тысячелетия Ultimate Collector Series.",
    price: 79999,
    stock: 1,
  },
  {
    id: nanoid(),
    name: "LEGO Harry Potter Hogwarts Castle 71043",
    category: "Harry Potter",
    description: "Хогвартс в масштабе микрофигурок, UCS-набор.",
    price: 42999,
    stock: 2,
  },
  {
    id: nanoid(),
    name: "LEGO Technic Bugatti Chiron 42083",
    category: "Technic",
    description: "Суперкар Technic с детализацией и коробкой передач.",
    price: 35999,
    stock: 4,
  },
  {
    id: nanoid(),
    name: "LEGO City Police Station 60316",
    category: "City",
    description: "Полицейский участок City с транспортом и минифигурками.",
    price: 8999,
    stock: 8,
  },
  {
    id: nanoid(),
    name: "LEGO Creator Expert Volkswagen Beetle 10252",
    category: "Creator Expert",
    description: "Классический Beetle с деталями и аксессуарами.",
    price: 13999,
    stock: 5,
  },
  {
    id: nanoid(),
    name: "LEGO NINJAGO City Gardens 71741",
    category: "NINJAGO",
    description: "Большой модульный набор NINJAGO City Gardens.",
    price: 34999,
    stock: 2,
  },
  {
    id: nanoid(),
    name: "LEGO Marvel Daily Bugle 76178",
    category: "Marvel",
    description: "Здание Daily Bugle с минифигурками персонажей Marvel.",
    price: 39999,
    stock: 1,
  },
  {
    id: nanoid(),
    name: "LEGO Architecture Statue of Liberty 21042",
    category: "Architecture",
    description: "Статуя Свободы из серии Architecture.",
    price: 10999,
    stock: 6,
  },
  {
    id: nanoid(),
    name: "LEGO Ideas Tree House 21318",
    category: "Ideas",
    description: "Дом на дереве с модулями и сменными листьями.",
    price: 21999,
    stock: 3,
  },
];

// health-check
app.get("/", (req, res) => {
  res.send("Server is running");
});

// READ all
app.get("/api/products", (req, res) => {
  res.json(products);
});

// READ by id
app.get("/api/products/:id", (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
});

// CREATE
app.post("/api/products", (req, res) => {
  const { name, category, description, price, stock } = req.body;

  const newProduct = {
    id: nanoid(),
    name,
    category,
    description,
    price,
    stock,
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

// UPDATE (partial)
app.patch("/api/products/:id", (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const { name, category, description, price, stock } = req.body;

  if (name !== undefined) product.name = name;
  if (category !== undefined) product.category = category;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = price;
  if (stock !== undefined) product.stock = stock;

  res.json(product);
});

// DELETE
app.delete("/api/products/:id", (req, res) => {
  const before = products.length;
  products = products.filter((p) => p.id !== req.params.id);

  if (products.length === before) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.send("Ok");
});

app.listen(PORT, () => {
  console.log(`Server started: http://localhost:${PORT}`);
});