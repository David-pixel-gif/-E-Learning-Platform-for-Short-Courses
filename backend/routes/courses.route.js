// backend/routes/courses.route.js
const express = require("express");
const { prisma } = require("../prismaClient");
const { auth, requires } = require("../middlewares/users.middleware");

const router = express.Router();

// ====================================================
// 📚 GET /courses?search=&order=&page=&limit=&category=&minPrice=&maxPrice=
// ====================================================
router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      order = "",
      page = "1",
      limit = "6",
      category = "",
      minPrice = "",
      maxPrice = "",
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const take = Math.max(parseInt(limit, 10) || 6, 1);
    const skip = (pageNum - 1) * take;

    const where = {
      AND: [
        search
          ? {
              OR: [
                { title: { contains: String(search), mode: "insensitive" } },
                {
                  description: {
                    contains: String(search),
                    mode: "insensitive",
                  },
                },
                { category: { contains: String(search), mode: "insensitive" } },
              ],
            }
          : {},
        category
          ? { category: { equals: String(category), mode: "insensitive" } }
          : {},
        minPrice !== "" ? { price: { gte: Number(minPrice) || 0 } } : {},
        maxPrice !== "" ? { price: { lte: Number(maxPrice) || 1e12 } } : {},
      ],
    };

    const orderBy =
      order === "asc"
        ? { price: "asc" }
        : order === "desc"
        ? { price: "desc" }
        : { createdAt: "desc" };

    const [items, total] = await Promise.all([
      prisma.course.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          teacher: {
            select: { id: true, name: true, email: true, role: true },
          },
          _count: { select: { videos: true, enrollments: true } },
        },
      }),
      prisma.course.count({ where }),
    ]);

    res.json({
      data: items,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        pages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    console.error("GET /courses error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ====================================================
// 🎓 GET /courses/:id  → Get full course details
// ====================================================
router.get("/:id", async (req, res) => {
  try {
    const id = String(req.params.id);
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { videos: true, enrollments: true } },
        videos: {
          select: {
            id: true,
            title: true,
            link: true,
            img: true,
            views: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!course) return res.status(404).json({ msg: "course not found" });
    res.json(course);
  } catch (err) {
    console.error("GET /courses/:id error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ====================================================
// ✏️ POST /courses  (TEACHER: self only; ADMIN: any)
// ====================================================
router.post("/", auth, requires("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const {
      title,
      description = "",
      category = "",
      price = 0,
      teacherId,
    } = req.body;
    if (!title) return res.status(400).json({ msg: "title required" });

    const role = String(req.user?.role || "").toUpperCase();
    const requesterId = String(req.user?.id || req.body.userId || "");

    let ownerId = String(teacherId || "");
    if (role === "TEACHER") ownerId = requesterId;
    if (!ownerId) return res.status(400).json({ msg: "teacherId required" });

    const teacher = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { id: true, role: true },
    });
    if (!teacher) return res.status(404).json({ msg: "teacher not found" });
    const tRole = String(teacher.role || "").toUpperCase();
    if (!["TEACHER", "ADMIN"].includes(tRole)) {
      return res
        .status(400)
        .json({ msg: "teacherId must belong to a TEACHER/ADMIN" });
    }

    const course = await prisma.course.create({
      data: {
        title: String(title),
        description: String(description),
        category: String(category),
        price: Number(price) || 0,
        teacherId: teacher.id,
      },
    });

    res.status(201).json(course);
  } catch (err) {
    console.error("POST /courses error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ====================================================
// 🧾 PUT /courses/:id  (TEACHER: own; ADMIN: any)
// ====================================================
router.put("/:id", auth, requires("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const id = String(req.params.id);
    const { title, description, category, price } = req.body;

    const existing = await prisma.course.findUnique({
      where: { id },
      select: { id: true, teacherId: true },
    });
    if (!existing) return res.status(404).json({ msg: "course not found" });

    const role = String(req.user?.role || "").toUpperCase();
    const requesterId = String(req.user?.id || req.body.userId || "");
    if (role === "TEACHER" && existing.teacherId !== requesterId) {
      return res.status(403).json({ msg: "forbidden: not your course" });
    }

    const updated = await prisma.course.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: String(title) } : {}),
        ...(description !== undefined
          ? { description: String(description) }
          : {}),
        ...(category !== undefined ? { category: String(category) } : {}),
        ...(price !== undefined ? { price: Number(price) } : {}),
      },
    });
    res.json(updated);
  } catch (err) {
    console.error("PUT /courses/:id error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ====================================================
// ❌ DELETE /courses/:id  (TEACHER: own; ADMIN: any)
// ====================================================
router.delete("/:id", auth, requires("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const id = String(req.params.id);

    const existing = await prisma.course.findUnique({
      where: { id },
      select: { id: true, teacherId: true },
    });
    if (!existing) return res.status(404).json({ msg: "course not found" });

    const role = String(req.user?.role || "").toUpperCase();
    const requesterId = String(req.user?.id || req.body.userId || "");
    if (role === "TEACHER" && existing.teacherId !== requesterId) {
      return res.status(403).json({ msg: "forbidden: not your course" });
    }

    await prisma.$transaction([
      prisma.video.deleteMany({ where: { courseId: id } }),
      prisma.enrollment.deleteMany({ where: { courseId: id } }),
      prisma.mockTest.deleteMany({ where: { courseId: id } }),
      prisma.certificate.deleteMany({ where: { courseId: id } }),
      prisma.course.delete({ where: { id } }),
    ]);

    res.json({ msg: "deleted" });
  } catch (err) {
    console.error("DELETE /courses/:id error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ====================================================
// 🧑‍🎓 POST /courses/:id/enroll → Student enrolls in a course
// ====================================================
router.post("/:id/enroll", auth, async (req, res) => {
  try {
    const courseId = String(req.params.id);
    const userId = req.user.userId;

    // Check course exists
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ msg: "Course not found" });

    // Check duplicate enrollment
    const existing = await prisma.enrollment.findFirst({
      where: { userId, courseId },
    });
    if (existing)
      return res.status(400).json({ msg: "Already enrolled in this course" });

    const enrollment = await prisma.enrollment.create({
      data: { userId, courseId },
    });

    res.status(201).json({ msg: "Enrolled successfully", enrollment });
  } catch (err) {
    console.error("POST /courses/:id/enroll error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ====================================================
// 📊 GET /courses/:id/progress → View user's progress in a course
// ====================================================
router.get("/:id/progress", auth, async (req, res) => {
  try {
    const courseId = String(req.params.id);
    const userId = req.user.userId;

    // Find all course videos and user progress
    const [videos, watched] = await Promise.all([
      prisma.video.findMany({
        where: { courseId },
        select: { id: true, title: true },
      }),
      prisma.videoProgress.findMany({
        where: { userId },
        select: { videoId: true, watched: true },
      }),
    ]);

    const watchedIds = new Set(
      watched.filter((v) => v.watched).map((v) => v.videoId)
    );

    const progress = videos.map((v) => ({
      ...v,
      watched: watchedIds.has(v.id),
    }));

    const completedCount = progress.filter((v) => v.watched).length;
    const totalCount = videos.length;
    const completionRate =
      totalCount > 0 ? ((completedCount / totalCount) * 100).toFixed(1) : "0.0";

    res.json({ courseId, completionRate, progress });
  } catch (err) {
    console.error("GET /courses/:id/progress error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = { courseRoute: router };
