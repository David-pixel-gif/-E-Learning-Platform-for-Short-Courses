// backend/index.js (CommonJS + Prisma) — minimally improved, single Prisma client

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

// ---- Prisma (use the singleton to avoid multiple clients)
const { prisma } = require("./prismaClient");

// ---- Routers
const { userRouter } = require("./routes/users.routes");
const { courseRoute } = require("./routes/courses.route");
const { videoRoute } = require("./routes/videos.route");
const { adminRouter } = require("./routes/admin.routes"); // NEW

// ---- App
const app = express();
app.locals.prisma = prisma; // available to route handlers if needed

// ---- CORS (dev-friendly, explicit)
const CORS_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim());

const corsOptions = {
  origin: CORS_ORIGINS,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ---- Parsers
app.use(express.json({ limit: "1mb" }));

// ---- Simple request log (dev only)
if ((process.env.NODE_ENV || "development") !== "production") {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// ---- Health & Welcome
app.get("/health", (_req, res) => res.status(200).json({ ok: true }));
app.get("/", (_req, res) =>
  res.status(200).json({ message: "Welcome to SRM's Backend" })
);

// ---- Routes
app.use("/users", userRouter);
app.use("/courses", courseRoute);
app.use("/videos", videoRoute);
app.use("/admin", adminRouter); // NEW
// If you add these later, uncomment the lines below and ensure the files exist.
// const { teacherRouter } = require("./routes/teacher.routes");
// const { promoRouter } = require("./routes/promos.routes");
// app.use("/teacher", teacherRouter);
// app.use("/promos", promoRouter);

// ---- Dev route listing (prints and exposes /__routes)
if ((process.env.NODE_ENV || "development") !== "production") {
  const listEndpoints = require("express-list-endpoints");

  // 1) Log all routes at startup
  const routes = listEndpoints(app);
  console.log("=== Registered Endpoints ===");
  for (const r of routes) {
    // r = { path: string, methods: string[], middlewares: string[] }
    console.log(`${r.methods.join(", ").padEnd(18)} ${r.path}`);
  }

  // 2) Optional JSON endpoint to view routes in browser/Postman
  app.get("/__routes", (_req, res) => {
    res.json({ routes });
  });
}

// ---- Token refresh (kept, with env secrets + try/catch)
const ACCESS_SECRET = process.env.JWT_SECRET || "arivu";
const REFRESH_SECRET = process.env.JWT_REFRESH || "ARIVU";
const ACCESS_TTL = process.env.JWT_ACCESS_TTL || "7d";

app.get("/regenerateToken", (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const rToken = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!rToken) return res.status(400).json({ msg: "Refresh token required" });

    const decoded = jwt.verify(rToken, REFRESH_SECRET);
    const token = jwt.sign(
      { userId: decoded.userId, role: decoded.role, user: decoded.user },
      ACCESS_SECRET,
      { expiresIn: ACCESS_TTL }
    );
    return res.status(201).json({ msg: "token created", token });
  } catch (err) {
    return res.status(400).json({ msg: "not a valid Refresh Token" });
  }
});

// ---- Central error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  const code = err.status || 500;
  const message = err.message || "Server error";
  res.status(code).json({ message });
});

// ---- Start / Shutdown
const PORT = Number(process.env.PORT || process.env.port || 8080);

async function start() {
  try {
    await prisma.$connect();
    console.log("✅ Prisma connected");
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

async function shutdown(signal) {
  try {
    console.log(`\n${signal} received. Shutting down...`);
    await prisma.$disconnect();
    console.log("✅ Prisma disconnected");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during shutdown:", err);
    process.exit(1);
  }
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start();
