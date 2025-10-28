// backend/prismaClient.js
// Single Prisma client instance for the whole app (CJS)

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

// Read comma-separated log levels from env, default minimal noise.
// Examples: PRISMA_LOG=query,info,warn,error
const LOG_LEVELS = (process.env.PRISMA_LOG || "error")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Singleton across hot reloads (dev)
const globalKey = "__PRISMA_SINGLETON__";

const prisma =
  global[globalKey] ||
  new PrismaClient({
    log: LOG_LEVELS, // e.g., ['query','info','warn','error'] or just ['error']
  });

if (process.env.NODE_ENV !== "production") {
  global[globalKey] = prisma;
}

// Optional: graceful disconnect if this module is the only manager.
// Your index.js already disconnects on SIGINT/SIGTERM; this is a safe fallback.
process.once("beforeExit", async () => {
  try {
    await prisma.$disconnect();
  } catch {
    // ignore
  }
});

module.exports = { prisma };
