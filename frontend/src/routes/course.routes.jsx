// backend/routes/courses.routes.js
// Express Router for Courses — thoroughly annotated, ESM style

import { Router } from "express";
import { prisma } from "../prismaClient.js";
import { auth, requires } from "../middlewares/users.middleware.js";

const router = Router();

/* ──────────────────────────────────────────────────────────────────────────
   Small utilities (pure & reusable)
   ────────────────────────────────────────────────────────────────────────── */
const clamp = (n, min, max) => Math.min(Math.max(Number(n) || 0, min), max);

// tiny slugifier to avoid extra deps (slug must be unique in schema)
const slugify = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

/**
 * Resolve the current user (id, email, role) from the request.
 * - If auth middleware populates req.user.id → use it
 * - If only email exists, fetch the user via email (unique)
 * Throws 401/404 with a .status property so callers can use res.status(err.status).
 */
async function getCurrentUserOrThrow(req) {
  const u = req.user || {};
  const id = u.id || u.userId || u.sub || null;
  const email = u.email ? String(u.email).toLowerCase() : null;

  if (id) {
    const me = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, name: true },
    });
    if (!me) throw Object.assign(new Error("User not found"), { status: 404 });
    return me;
  }

  if (!email) {
    throw Object.assign(new Error("Unauthorized: missing user identity"), {
      status: 401,
    });
  }

  const me = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, name: true },
  });
  if (!me) throw Object.assign(new Error("User not found"), { status: 404 });
  return me;
}

/* ──────────────────────────────────────────────────────────────────────────
   GET /api/courses
   List courses with filters, order & pagination
   Query:
     - search: string (matches title/description)
     - category: string
     - teacherId: string
     - minPrice,maxPrice: numbers
     - order: createdAt|price|title:[asc|desc]  e.g. "createdAt:desc"
     - page,limit
   Response: { data, page, limit, total, totalPages }
   ────────────────────────────────────────────────────────────────────────── */
router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      category = "",
      teacherId = "",
      minPrice,
      maxPrice,
      order = "createdAt:desc",
      page = 1,
      limit = 12,
    } = req.query;

    const pageNum = clamp(page, 1, 10_000);
    const limitNum = clamp(limit, 1, 100);
    const skip = (pageNum - 1) * limitNum;

    // WHERE
    const whereAND = [];
    if (search) {
      whereAND.push({
        OR: [
          { title: { contains: String(search), mode: "insensitive" } },
          { description: { contains: String(search), mode: "insensitive" } },
        ],
      });
    }
    if (category) whereAND.push({ category: String(category) });
    if (teacherId) whereAND.push({ teacherId: String(teacherId) });

    const priceFilter = {};
    if (minPrice != null && minPrice !== "") priceFilter.gte = Number(minPrice);
    if (maxPrice != null && maxPrice !== "") priceFilter.lte = Number(maxPrice);
    if (Object.keys(priceFilter).length) whereAND.push({ price: priceFilter });

    const where = whereAND.length ? { AND: whereAND } : {};

    // ORDER BY
    const [ordField = "createdAt", ordDir = "desc"] = String(order).split(":");
    const orderBy = [{ [ordField]: ordDir === "asc" ? "asc" : "desc" }];

    // QUERY
    const [total, data] = await Promise.all([
      prisma.course.count({ where }),
      prisma.course.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          price: true,
          createdAt: true,
          teacher: { select: { id: true, name: true } },
          slug: true,
        },
      }),
    ]);

    return res.json({
      data,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("GET /courses error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});

/* ──────────────────────────────────────────────────────────────────────────
   GET /api/courses/:id
   Fetch a single course by id (or slug if you prefer; change where accordingly)
   Includes teacher and a thin list of videos
   ────────────────────────────────────────────────────────────────────────── */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id }, // change to { slug: id } if you want slug URLs
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        price: true,
        createdAt: true,
        updatedAt: true,
        slug: true,
        teacher: { select: { id: true, name: true } },
        videos: {
          select: { id: true, title: true, img: true, link: true, views: true },
          orderBy: [{ createdAt: "asc" }],
        },
      },
    });

    if (!course) return res.status(404).json({ msg: "Course not found" });
    return res.json(course);
  } catch (err) {
    console.error("GET /courses/:id error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});

/* ──────────────────────────────────────────────────────────────────────────
   POST /api/courses
   Create course (TEACHER or ADMIN). teacherId is taken from the logged-in user.
   Body: { title, description, category?, price? (int), slug? }
   ────────────────────────────────────────────────────────────────────────── */
router.post("/", auth, requires("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const me = await getCurrentUserOrThrow(req);

    const { title, description, category, price, slug } = req.body || {};
    if (!title || !description) {
      return res
        .status(400)
        .json({ msg: "title and description are required" });
    }

    // generate/normalize slug and ensure unique
    let nextSlug = slug ? slugify(slug) : slugify(title);
    if (nextSlug) {
      let i = 1;
      // ensure it’s unique against the Course.slug unique index
      while (await prisma.course.findUnique({ where: { slug: nextSlug } })) {
        i += 1;
        nextSlug = `${slugify(title)}-${i}`;
      }
    } else {
      nextSlug = null;
    }

    const created = await prisma.course.create({
      data: {
        title: String(title),
        description: String(description),
        category: category ? String(category) : null,
        price: price != null ? Number(price) : 0,
        slug: nextSlug,
        teacherId: me.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        price: true,
        slug: true,
        teacherId: true,
        createdAt: true,
      },
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error("POST /courses error:", err);
    const status = err.status || 500;
    return res.status(status).json({ msg: err.message || "Server error" });
  }
});

/* ──────────────────────────────────────────────────────────────────────────
   PUT /api/courses/:id
   Update course (ADMIN or owning TEACHER).
   Body may include: { title?, description?, category?, price?, slug? }
   ────────────────────────────────────────────────────────────────────────── */
router.put("/:id", auth, requires("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const me = await getCurrentUserOrThrow(req);

    // ensure exists
    const existing = await prisma.course.findUnique({
      where: { id },
      select: { id: true, teacherId: true, title: true },
    });
    if (!existing) return res.status(404).json({ msg: "Course not found" });

    // only ADMIN or owner teacher
    if (me.role !== "ADMIN" && existing.teacherId !== me.id) {
      return res.status(403).json({ msg: "Forbidden" });
    }

    const { title, description, category, price, slug } = req.body || {};
    const data = {};
    if (title) data.title = String(title);
    if (description) data.description = String(description);
    if (category != null) data.category = String(category);
    if (price != null) data.price = Number(price);

    if (slug != null) {
      let nextSlug = slugify(slug);
      if (nextSlug) {
        // ensure uniqueness except for this course
        const clash = await prisma.course.findUnique({
          where: { slug: nextSlug },
          select: { id: true },
        });
        if (clash && clash.id !== id) {
          return res.status(409).json({ msg: "Slug already in use" });
        }
        data.slug = nextSlug;
      } else {
        data.slug = null;
      }
    }

    const updated = await prisma.course.update({
      where: { id },
      data,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        price: true,
        slug: true,
        updatedAt: true,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error("PUT /courses/:id error:", err);
    const status = err.status || 500;
    return res.status(status).json({ msg: err.message || "Server error" });
  }
});

/* ──────────────────────────────────────────────────────────────────────────
   DELETE /api/courses/:id
   Delete course (ADMIN only by default; flip the check to allow owner delete)
   ────────────────────────────────────────────────────────────────────────── */
router.delete("/:id", auth, requires("ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;

    // Confirm it exists (optional but gives 404 instead of silent no-op)
    const existing = await prisma.course.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ msg: "Course not found" });

    await prisma.course.delete({ where: { id } });
    return res.json({ msg: "Course deleted successfully" });
  } catch (err) {
    console.error("DELETE /courses/:id error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});

export default router;
