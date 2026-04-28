const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const { createClient } = require("redis");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const ACCESS_SECRET = "access_secret_key";
const REFRESH_SECRET = "refresh_secret_key";

const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

// TTL кэша (в секундах)
const USERS_CACHE_TTL = 60; // 1 минута
const PRODUCTS_CACHE_TTL = 600; // 10 минут

// Создаём uploads, если папки нет
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Настройка multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${nanoid()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

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
// Redis + кэширование
// =========================
const redisClient = createClient({
  url: "redis://127.0.0.1:6379",
  socket: {
    reconnectStrategy: (retries) => {
      if (retries >= 3) return new Error("Redis reconnect disabled");
      return 500;
    },
  },
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

async function initRedis() {
  try {
    if (!redisClient.isOpen) {
      await Promise.race([
        redisClient.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Redis connect timeout")), 4000)
        ),
      ]);
    }
    console.log("Redis connected");
  } catch (err) {
    console.error("Redis connection failed, cache disabled:", err);
  }
}

function canUseCache() {
  return redisClient.isOpen;
}

function cacheMiddleware(keyBuilder, ttl, options = {}) {
  return async (req, res, next) => {
    if (!canUseCache()) return next();

    try {
      const key = keyBuilder(req);
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        let parsed;
        try {
          parsed = JSON.parse(cachedData);
        } catch {
          await redisClient.del(key);
          return next();
        }

        if (typeof options.validate === "function" && !options.validate(parsed)) {
          // В Redis могли остаться старые данные в другом формате.
          // Удаляем и считаем кэш промахом, чтобы вернуть корректный ответ.
          await redisClient.del(key);
          return next();
        }

        res.set("X-Cache", "HIT");
        return res.status(200).json(parsed);
      }

      req.cacheKey = key;
      req.cacheTTL = ttl;
      return next();
    } catch (err) {
      console.error("Cache read error:", err);
      return next();
    }
  };
}

async function saveToCache(key, data, ttl) {
  if (!canUseCache() || !key || !ttl) return;

  try {
    await redisClient.set(key, JSON.stringify(data), { EX: ttl });
  } catch (err) {
    console.error("Cache save error:", err);
  }
}

async function invalidateUsersCache(userId = null) {
  if (!canUseCache()) return;

  try {
    await redisClient.del("users:all");
    if (userId) await redisClient.del(`users:${userId}`);
  } catch (err) {
    console.error("Users cache invalidate error:", err);
  }
}

async function invalidateProductsCache(productId = null) {
  if (!canUseCache()) return;

  try {
    await redisClient.del("products:all");
    if (productId) await redisClient.del(`products:${productId}`);
  } catch (err) {
    console.error("Products cache invalidate error:", err);
  }
}

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

app.get(
  "/api/users",
  authMiddleware,
  roleMiddleware(["admin"]),
  cacheMiddleware(() => "users:all", USERS_CACHE_TTL, { validate: Array.isArray }),
  async (req, res) => {
    const data = users.map(getSafeUser);
    await saveToCache(req.cacheKey, data, req.cacheTTL);
    res.set("X-Cache", "MISS");
    return res.status(200).json(data);
  }
);

app.get(
  "/api/users/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  cacheMiddleware((req) => `users:${req.params.id}`, USERS_CACHE_TTL, {
    validate: (v) => v && typeof v === "object" && !Array.isArray(v),
  }),
  async (req, res) => {
    const user = users.find((u) => u.id === req.params.id);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const data = getSafeUser(user);
    await saveToCache(req.cacheKey, data, req.cacheTTL);
    res.set("X-Cache", "MISS");
    return res.status(200).json(data);
  }
);

app.put("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
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

  await invalidateUsersCache(user.id);
  return res.status(200).json(getSafeUser(user));
});

app.delete("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  const user = users.find((u) => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  user.isBlocked = true;
  await invalidateUsersCache(user.id);

  return res.status(200).json({
    message: "User blocked successfully",
    user: getSafeUser(user),
  });
});

// =========================
// PRODUCTS
// =========================

app.post(
  "/api/products",
  authMiddleware,
  roleMiddleware(["seller", "admin"]),
  upload.single("image"),
  async (req, res) => {
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
      image: req.file ? `/uploads/${req.file.filename}` : "",
    };

    products.push(newProduct);
    await invalidateProductsCache(newProduct.id);

    return res.status(201).json(newProduct);
  }
);

app.get(
  "/api/products",
  authMiddleware,
  roleMiddleware(["user", "seller", "admin"]),
  cacheMiddleware(() => "products:all", PRODUCTS_CACHE_TTL, { validate: Array.isArray }),
  async (req, res) => {
    const data = products;
    await saveToCache(req.cacheKey, data, req.cacheTTL);
    res.set("X-Cache", "MISS");
    return res.status(200).json(data);
  }
);

app.get(
  "/api/products/:id",
  authMiddleware,
  roleMiddleware(["user", "seller", "admin"]),
  cacheMiddleware((req) => `products:${req.params.id}`, PRODUCTS_CACHE_TTL, {
    validate: (v) => v && typeof v === "object" && !Array.isArray(v),
  }),
  async (req, res) => {
    const product = products.find((p) => p.id === req.params.id);

    if (!product) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    const data = product;
    await saveToCache(req.cacheKey, data, req.cacheTTL);
    res.set("X-Cache", "MISS");
    return res.status(200).json(data);
  }
);

app.put(
  "/api/products/:id",
  authMiddleware,
  roleMiddleware(["seller", "admin"]),
  upload.single("image"),
  async (req, res) => {
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
    if (req.file) product.image = `/uploads/${req.file.filename}`;

    await invalidateProductsCache(product.id);
    return res.status(200).json(product);
  }
);

app.delete(
  "/api/products/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    const index = products.findIndex((p) => p.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    const deletedProduct = products[index];
    products.splice(index, 1);
    await invalidateProductsCache(deletedProduct.id);

    return res.status(200).json({
      message: "Product deleted successfully",
      product: deletedProduct,
    });
  }
);

initRedis().then(() => {
  app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
  });
});