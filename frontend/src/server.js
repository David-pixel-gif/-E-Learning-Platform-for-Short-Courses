// server.js (ESM)
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

// Prisma client (adjust path if yours differs)
import { prisma } from "./prisma.js";

// Routers (ensure these export an Express Router as default or named)
import userRoutes from "./routes/users.routes.js";
import courseRoutes from "./routes/course.routes.js";
import videoRoutes from "./routes/video.routes.js";

const app = express();

/* ----------------------------- Middleware -------------------------------- */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests from tools / same-origin / no Origin (like curl/postman)
      if (
        !origin ||
        ALLOWED_ORIGINS.length === 0 ||
        ALLOWED_ORIGINS.includes(origin)
      ) {
        return cb(null, true);
      }
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: false,
  })
);

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

/* ------------------------------ Routes ----------------------------------- */
// Health + base
app.get("/health", (_, res) => res.status(200).json({ ok: true }));
app.get("/", (_, res) =>
  res.status(200).json({ message: "Welcome to SRM's Prisma API" })
);

// Feature routes
app.use("/users", userRoutes); // POST /users/login, /users/register, etc.
app.use("/courses", courseRoutes); // CRUD for courses
app.use("/videos", videoRoutes); // CRUD for videos

/* --------------------------- Not Found / Errors --------------------------- */
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found", path: req.originalUrl });
});

app.use((err, req, res, next) => {
  // Centralized error handler
  console.error("API Error:", err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
  });
});

/* --------------------------- Server & DB start ---------------------------- */
const PORT = process.env.PORT || 8080;

async function start() {
  try {
    // Quick DB ping so we fail fast if DB is unreachable
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Connected to Prisma Database");

    const server = app.listen(PORT, () =>
      console.log(`🚀 API running at http://localhost:${PORT}`)
    );

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log("🧹 Prisma disconnected. Bye!");
        process.exit(0);
      });
      // Force-exit if not closed in time
      setTimeout(() => process.exit(1), 10_000).unref();
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (e) {
    console.error("❌ Failed to start server:", e);
    process.exit(1);
  }
}
s
start();

export default app; // helpful for integration tests
