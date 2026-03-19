const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const ACCESS_SECRET = "access_secret_key";
const REFRESH_SECRET = "refresh_secret_key";

const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

// Хранилище в памяти
const users = [
  {
    id: nanoid(),
    email: "admin@mail.com",
    first_name: "Admin",
    last_name: "System",
    passwordHash: bcrypt.hashSync("admin123", 10),
    role: "admin",
    isBlocked: false,
  },
  {
    id: nanoid(),
    email: "seller@mail.com",
    first_name: "Seller",
    last_name: "System",
    passwordHash: bcrypt.hashSync("seller123", 10),
    role: "seller",
    isBlocked: false,
  },
];

const products = [];
const refreshTokens = [];

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
      role: user.role,
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

function getSafeUser(user) {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    isBlocked: user.isBlocked,
  };
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
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired access token",
    });
  }
}

function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied",
      });
    }

    next();
  };
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
      role: "user",
      isBlocked: false,
    };

    users.push(newUser);

    return res.status(201).json(getSafeUser(newUser));
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

    if (user.isBlocked) {
      return res.status(403).json({
        error: "User is blocked",
      });
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    refreshTokens.push(refreshToken);

    return res.status(200).json({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Refresh
app.post("/api/auth/refresh", (req, res) => {
  const refreshToken = req.headers["x-refresh-token"];

  if (!refreshToken) {
    return res.status(401).json({
      error: "Refresh token is required in headers",
    });
  }

  const storedToken = refreshTokens.find((token) => token === refreshToken);

  if (!storedToken) {
    return res.status(403).json({
      error: "Refresh token not found",
    });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = users.find((u) => u.id === payload.sub);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        error: "User is blocked",
      });
    }

    const tokenIndex = refreshTokens.findIndex((token) => token === refreshToken);
    if (tokenIndex !== -1) {
      refreshTokens.splice(tokenIndex, 1);
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    refreshTokens.push(newRefreshToken);

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return res.status(403).json({
      error: "Invalid or expired refresh token",
    });
  }
});

// Текущий пользователь
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const user = users.find((u) => u.id === req.user.sub);

  if (!user) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  if (user.isBlocked) {
    return res.status(403).json({
      error: "User is blocked",
    });
  }

  return res.status(200).json(getSafeUser(user));
});

// =========================
// USERS - ADMIN ONLY
// =========================

// Список пользователей
app.get("/api/users", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
  return res.status(200).json(users.map(getSafeUser));
});

// Пользователь по id
app.get("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
  const user = users.find((u) => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  return res.status(200).json(getSafeUser(user));
});

// Обновить пользователя
app.put("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
  const user = users.find((u) => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  const { email, first_name, last_name, role, isBlocked } = req.body;

  if (email !== undefined) user.email = email;
  if (first_name !== undefined) user.first_name = first_name;
  if (last_name !== undefined) user.last_name = last_name;
  if (role !== undefined) user.role = role;
  if (isBlocked !== undefined) user.isBlocked = Boolean(isBlocked);

  return res.status(200).json(getSafeUser(user));
});

// Заблокировать пользователя
app.delete("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
  const user = users.find((u) => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  user.isBlocked = true;

  return res.status(200).json({
    message: "User blocked successfully",
    user: getSafeUser(user),
  });
});

// =========================
// PRODUCTS
// =========================

// Создать товар - seller/admin
app.post("/api/products", authMiddleware, roleMiddleware(["seller", "admin"]), (req, res) => {
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

// Получить список товаров - user/seller/admin
app.get("/api/products", authMiddleware, roleMiddleware(["user", "seller", "admin"]), (req, res) => {
  return res.status(200).json(products);
});

// Получить товар по id - user/seller/admin
app.get("/api/products/:id", authMiddleware, roleMiddleware(["user", "seller", "admin"]), (req, res) => {
  const product = products.find((p) => p.id === req.params.id);

  if (!product) {
    return res.status(404).json({
      error: "Product not found",
    });
  }

  return res.status(200).json(product);
});

// Обновить товар - seller/admin
app.put("/api/products/:id", authMiddleware, roleMiddleware(["seller", "admin"]), (req, res) => {
  const product = products.find((p) => p.id === req.params.id);

  if (!product) {
    return res.status(404).json({
      error: "Product not found",
    });
  }

  const { title, category, description, price } = req.body;

  if (title !== undefined) product.title = title;
  if (category !== undefined) product.category = category;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = Number(price);

  return res.status(200).json(product);
});

// Удалить товар - admin
app.delete("/api/products/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
  const index = products.findIndex((p) => p.id === req.params.id);

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