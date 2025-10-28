// backend/routes/users.routes.js
// Thoroughly annotated and email-centric profile lookup

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { prisma } = require("../prismaClient");
const { auth, requires } = require("../middlewares/users.middleware");

const router = express.Router();

/* ===========================================
   ⚙️ Environment & Config (centralized)
   - Prefer env vars; fall back to safe dev defaults
=========================================== */
const ACCESS_SECRET = process.env.JWT_SECRET || "arivu";
const REFRESH_SECRET = process.env.JWT_REFRESH || "ARIVU";
const ACCESS_TTL = process.env.JWT_ACCESS_TTL || "1d";
const REFRESH_TTL = process.env.JWT_REFRESH_TTL || "7d";
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);
const ALLOWED_ROLES = ["USER", "TEACHER", "ADMIN"];

/* ===========================================
   🔧 Small, reusable helpers
=========================================== */
const up = (v) => (v ? String(v).trim().toUpperCase() : "");
const okEmail = (e) => typeof e === "string" && e.includes("@");

/**
 * Resolve the current user from the request.
 * - We prefer req.user.id if the auth middleware already put it there.
 * - If only email exists (your current setup), we fetch the user to get a stable ID.
 * - Throws 401 if nothing usable is on the request.
 * - Throws 404 if the user does not exist.
 */
async function getCurrentUserOrThrow(req) {
  const tokenUser = req.user || {};
  const email = tokenUser.email && String(tokenUser.email).toLowerCase();
  const idFromToken = tokenUser.id || tokenUser.userId || tokenUser.sub || null;

  // Fast-path: if we already have id, try to read the user by id
  if (idFromToken) {
    const user = await prisma.user.findUnique({
      where: { id: idFromToken },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        age: true,
        place: true,
        createdAt: true,
      },
    });
    if (!user)
      throw Object.assign(new Error("User not found"), { status: 404 });
    return user;
  }

  // Email-centric path (your current use case)
  if (!okEmail(email)) {
    throw Object.assign(new Error("Unauthorized: missing user email"), {
      status: 401,
    });
  }

  const user = await prisma.user.findUnique({
    where: { email }, // <- critical: findUnique must get a unique field (email)
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      age: true,
      place: true,
      createdAt: true,
      // DO NOT select password here
    },
  });

  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  return user;
}

/* ===========================================
   🧍 Register
   - Requires: name, valid email, password
   - Ensures role is one of allowed values
   - Ensures email uniqueness
=========================================== */
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, role, age, place } = req.body || {};
    if (!okEmail(email) || !password || !name) {
      return res
        .status(400)
        .json({ msg: "Name, valid email, and password required" });
    }

    const normEmail = email.toLowerCase();
    const userRole = up(role) || "USER";
    if (!ALLOWED_ROLES.includes(userRole)) {
      return res.status(400).json({ msg: "Invalid role selected" });
    }

    const exists = await prisma.user.findUnique({
      where: { email: normEmail },
    });
    if (exists) return res.status(409).json({ msg: "User already exists" });

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        email: normEmail,
        password: hash,
        name,
        role: userRole,
        age: age != null ? Number(age) : null,
        place: place ?? null,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return res.status(201).json({ msg: "Registration successful", user });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});

/* ===========================================
   🔐 Login
   - Looks up by email
   - Compares hash
   - Issues access + refresh tokens
   - NOTE: We include BOTH id and email in the JWT payload
     so you can gradually migrate to id-based lookups later.
=========================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!okEmail(email) || !password) {
      return res.status(400).json({ msg: "Email and password required" });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) return res.status(401).json({ msg: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password || "");
    if (!valid) return res.status(401).json({ msg: "Invalid credentials" });

    const payload = {
      // keep both for flexibility
      id: user.id,
      email: user.email.toLowerCase(),
      role: up(user.role),
      name: user.name,
    };

    const token = jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, {
      expiresIn: REFRESH_TTL,
    });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: up(user.role),
    };

    return res.json({
      msg: "Login successful",
      user: safeUser,
      token,
      refreshToken,
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});

/* ===========================================
   🚪 Logout (stateless JWT: client discards tokens)
=========================================== */
router.post("/logout", (_req, res) =>
  res.json({ msg: "Logged out successfully" })
);

/* ===========================================
   👤 Profile (email-centric)
   - Uses getCurrentUserOrThrow(), which prioritizes id if present,
     otherwise queries by email with findUnique({ where: { email } }).
=========================================== */
router.get("/profile", auth, async (req, res) => {
  try {
    const me = await getCurrentUserOrThrow(req);
    return res.json(me);
  } catch (err) {
    console.error("profile error:", err);
    const status = err.status || 500;
    return res.status(status).json({ msg: err.message || "Server error" });
  }
});

/* ===========================================
   📚 Enrolled Courses (Student)
   - Needs userId for foreign key lookups.
   - We derive id from email if necessary.
=========================================== */
router.get("/enrolled", auth, async (req, res) => {
  try {
    const currentUser = await getCurrentUserOrThrow(req);

    const enrolled = await prisma.enrollment.findMany({
      where: { userId: currentUser.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            category: true,
            teacher: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Return only the course objects for simplicity
    return res.json(enrolled.map((e) => e.course));
  } catch (err) {
    console.error("enrolled error:", err);
    const status = err.status || 500;
    return res.status(status).json({ msg: err.message || "Server error" });
  }
});

/* ===========================================
   📈 Progress (video/test tracking)
=========================================== */
router.get("/progress", auth, async (req, res) => {
  try {
    const currentUser = await getCurrentUserOrThrow(req);

    const progress = await prisma.enrollment.findMany({
      where: { userId: currentUser.id },
      select: { id: true, courseId: true, progress: true, status: true },
    });

    return res.json(progress);
  } catch (err) {
    console.error("progress error:", err);
    const status = err.status || 500;
    return res.status(status).json({ msg: err.message || "Server error" });
  }
});

/* ===========================================
   🎓 Certificates
=========================================== */
router.get("/certificates", auth, async (req, res) => {
  try {
    const currentUser = await getCurrentUserOrThrow(req);

    const certificates = await prisma.certificate.findMany({
      where: { userId: currentUser.id },
      select: {
        id: true,
        courseId: true,
        grade: true,
        fileUrl: true,
        issuedAt: true,
        course: { select: { title: true } },
      },
    });

    return res.json(certificates);
  } catch (err) {
    console.error("certificates error:", err);
    const status = err.status || 500;
    return res.status(status).json({ msg: err.message || "Server error" });
  }
});

/* ===========================================
   🧮 Admin & Teacher Management
=========================================== */

// List all users (ADMIN)
router.get("/", auth, requires("ADMIN"), async (req, res) => {
  try {
    const { search = "", role = "" } = req.query;

    const where = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: String(search), mode: "insensitive" } },
                {
                  email: {
                    contains: String(search).toLowerCase(),
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {},
        role ? { role: up(role) } : {},
      ],
    };

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        age: true,
        place: true,
        createdAt: true,
      },
    });

    return res.json(users);
  } catch (err) {
    console.error("GET /users error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});

// Get single user (ADMIN, TEACHER)
router.get("/:id", auth, requires("ADMIN", "TEACHER"), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id }, // <- id is unique; do not pass undefined
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        age: true,
        place: true,
        createdAt: true,
      },
    });

    if (!user) return res.status(404).json({ msg: "User not found" });
    return res.json(user);
  } catch (err) {
    console.error("GET /users/:id error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});

// Update user (ADMIN or self)
router.put("/:id", auth, requires("ADMIN", "USER"), async (req, res) => {
  try {
    const { id } = req.params;
    const requester = await getCurrentUserOrThrow(req); // ensures we have a stable id

    // Only ADMIN or the resource owner can update
    if (requester.role !== "ADMIN" && requester.id !== id) {
      return res.status(403).json({ msg: "Forbidden" });
    }

    const { name, email, age, place, role } = req.body || {};
    const nextData = {};

    if (name) nextData.name = String(name);
    if (email) nextData.email = String(email).toLowerCase();
    if (age != null) nextData.age = Number(age);
    if (place != null) nextData.place = String(place);

    // Only ADMIN can change role; normalize and validate
    if (role && requester.role === "ADMIN") {
      const nextRole = up(role);
      if (!ALLOWED_ROLES.includes(nextRole)) {
        return res.status(400).json({ msg: "Invalid role selected" });
      }
      nextData.role = nextRole;
    }

    // Guard against duplicate email on update
    if (nextData.email) {
      const existing = await prisma.user.findUnique({
        where: { email: nextData.email },
        select: { id: true },
      });
      if (existing && existing.id !== id) {
        return res.status(409).json({ msg: "Email already in use" });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: nextData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        age: true,
        place: true,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error("PUT /users/:id error:", err);
    const status = err.status || 500;
    return res.status(status).json({ msg: err.message || "Server error" });
  }
});

// Delete user (ADMIN only)
router.delete("/:id", auth, requires("ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    return res.json({ msg: "User deleted successfully" });
  } catch (err) {
    console.error("DELETE /users/:id error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});

module.exports = { userRouter: router };
