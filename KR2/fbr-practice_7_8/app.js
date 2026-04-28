const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const JWT_SECRET = "my_super_secret_key";
const ACCESS_EXPIRES_IN = "15m";

// Хранилище в памяти
const users = [];
const products = [];

/*
users = [
  {
    id,
    email,
    first_name,
    last_name,
    passwordHash
  }
]

products = [
  {
    id,
    title,
    category,
    description,
    price
  }
]
*/

// =========================
// Вспомогательные функции
// =========================
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Missing or invalid Authorization header",
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}

// =========================
// AUTH
// =========================

// Регистрация
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, first_name, last_name, password } = req.body;

    if (!email || !first_name || !last_name || !password) {
      return res.status(400).json({
        error: "email, first_name, last_name, password are required",
      });
    }

    const existingUser = users.find((user) => user.email === email);
    if (existingUser) {
      return res.status(409).json({
        error: "User with this email already exists",
      });
    }

    const passwordHash = await hashPassword(password);

    const newUser = {
      id: nanoid(),
      email,
      first_name,
      last_name,
      passwordHash,
    };

    users.push(newUser);

    return res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Логин
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "email and password are required",
      });
    }

    const user = users.find((u) => u.email === email);

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const accessToken = generateAccessToken(user);

    return res.status(200).json({
      accessToken,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Текущий пользователь
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const userId = req.user.sub;
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  return res.status(200).json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
  });
});

// =========================
// PRODUCTS
// =========================

// Создать товар
app.post("/api/products", (req, res) => {
  const { title, category, description, price } = req.body;

  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({
      error: "title, category, description, price are required",
    });
  }

  const newProduct = {
    id: nanoid(),
    title,
    category,
    description,
    price: Number(price),
  };

  products.push(newProduct);

  return res.status(201).json(newProduct);
});

// Получить список товаров
app.get("/api/products", (req, res) => {
  return res.status(200).json(products);
});

// Получить товар по id — защищённый
app.get("/api/products/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const product = products.find((p) => p.id === id);

  if (!product) {
    return res.status(404).json({
      error: "Product not found",
    });
  }

  return res.status(200).json(product);
});

// Обновить товар — защищённый
app.put("/api/products/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const { title, category, description, price } = req.body;

  const product = products.find((p) => p.id === id);

  if (!product) {
    return res.status(404).json({
      error: "Product not found",
    });
  }

  if (title !== undefined) product.title = title;
  if (category !== undefined) product.category = category;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = Number(price);

  return res.status(200).json(product);
});

// Удалить товар — защищённый
app.delete("/api/products/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const index = products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: "Product not found",
    });
  }

  const deletedProduct = products[index];
  products.splice(index, 1);

  return res.status(200).json({
    message: "Product deleted successfully",
    product: deletedProduct,
  });
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});