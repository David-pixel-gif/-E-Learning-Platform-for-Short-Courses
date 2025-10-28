// backend/routes/videos.route.js
const express = require("express");
const { prisma } = require("../prismaClient");
const { auth, requires } = require("../middlewares/users.middleware");

const router = express.Router();

// ====================================================
// 🎞️ GET /videos?courseId=&search=&page=&limit=
// ====================================================
router.get("/", async (req, res) => {
  try {
    const { courseId = "", search = "", page = "1", limit = "10" } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const take = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (pageNum - 1) * take;

    const where = {
      AND: [
        courseId ? { courseId: String(courseId) } : {},
        search
          ? { title: { contains: String(search), mode: "insensitive" } }
          : {},
      ],
    };

    const [items, total] = await Promise.all([
      prisma.video.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          title: true,
          link: true,
          views: true,
          img: true,
          description: true,
          courseId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.video.count({ where }),
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
    console.error("GET /videos error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ====================================================
// 🎬 GET /videos/:id → single video details
// ====================================================
router.get("/:id", async (req, res) => {
  try {
    const id = String(req.params.id);
    const video = await prisma.video.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        link: true,
        views: true,
        img: true,
        description: true,
        courseId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!video) return res.status(404).json({ msg: "video not found" });
    res.json(video);
  } catch (err) {
    console.error("GET /videos/:id error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ====================================================
// 🎥 POST /videos  (TEACHER: own course only; ADMIN: any)
// ====================================================
router.post("/", auth, requires("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const { title, link, views, img, courseId, description = "" } = req.body;
    if (!title || !link || !courseId) {
      return res.status(400).json({ msg: "title, link, courseId required" });
    }

    const role = String(req.user?.role || "").toUpperCase();
    const requesterId = String(req.user?.id || req.body.userId || "");

    const course = await prisma.course.findUnique({
      where: { id: String(courseId) },
      select: { id: true, teacherId: true },
    });
    if (!course) return res.status(404).json({ msg: "course not found" });

    if (role === "TEACHER" && course.teacherId !== requesterId) {
      return res.status(403).json({ msg: "forbidden: not your course" });
    }

    const video = await prisma.video.create({
      data: {
        title: String(title),
        link: String(link),
        views: Number(views) || 0,
        img: img ? String(img) : "",
        description: String(description),
        courseId: course.id,
      },
      select: {
        id: true,
        title: true,
        link: true,
        views: true,
        img: true,
        description: true,
        courseId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json(video);
  } catch (err) {
    console.error("POST /videos error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ====================================================
// 🧾 PUT /videos/:id (TEACHER: own; ADMIN: any)
// ====================================================
router.put("/:id", auth, requires("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const id = String(req.params.id);
    const { title, link, views, img, description } = req.body;

    const video = await prisma.video.findUnique({
      where: { id },
      select: { id: true, courseId: true },
    });
    if (!video) return res.status(404).json({ msg: "video not found" });

    const course = await prisma.course.findUnique({
      where: { id: video.courseId },
      select: { id: true, teacherId: true },
    });
    if (!course) return res.status(404).json({ msg: "course not found" });

    const role = String(req.user?.role || "").toUpperCase();
    const requesterId = String(req.user?.id || req.body.userId || "");
    if (role === "TEACHER" && course.teacherId !== requesterId) {
      return res.status(403).json({ msg: "forbidden: not your course" });
    }

    const updated = await prisma.video.update({
      where: { id: video.id },
      data: {
        ...(title !== undefined ? { title: String(title) } : {}),
        ...(link !== undefined ? { link: String(link) } : {}),
        ...(views !== undefined ? { views: Number(views) || 0 } : {}),
        ...(img !== undefined ? { img: img ? String(img) : "" } : {}),
        ...(description !== undefined
          ? { description: String(description) }
          : {}),
      },
      select: {
        id: true,
        title: true,
        link: true,
        views: true,
        img: true,
        description: true,
        courseId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("PUT /videos/:id error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ====================================================
// ❌ DELETE /videos/:id (TEACHER: own; ADMIN: any)
// ====================================================
router.delete("/:id", auth, requires("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const id = String(req.params.id);

    const video = await prisma.video.findUnique({
      where: { id },
      select: { id: true, courseId: true, title: true },
    });
    if (!video) return res.status(404).json({ msg: "video not found" });

    const course = await prisma.course.findUnique({
      where: { id: video.courseId },
      select: { id: true, teacherId: true },
    });
    if (!course) return res.status(404).json({ msg: "course not found" });

    const role = String(req.user?.role || "").toUpperCase();
    const requesterId = String(req.user?.id || req.body.userId || "");
    if (role === "TEACHER" && course.teacherId !== requesterId) {
      return res.status(403).json({ msg: "forbidden: not your course" });
    }

    await prisma.video.delete({ where: { id: video.id } });
    res.json({ msg: "deleted" });
  } catch (err) {
    console.error("DELETE /videos/:id error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ====================================================
// ✅ POST /videos/:id/watched → Mark as watched (Student)
// ====================================================
router.post("/:id/watched", auth, async (req, res) => {
  try {
    const videoId = String(req.params.id);
    const userId = req.user.userId;

    // Ensure video exists
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) return res.status(404).json({ msg: "Video not found" });

    // Record or update watch progress
    const progress = await prisma.videoProgress.upsert({
      where: { userId_videoId: { userId, videoId } },
      update: { watched: true },
      create: { userId, videoId, watched: true },
    });

    res.json({ msg: "Video marked as watched", progress });
  } catch (err) {
    console.error("POST /videos/:id/watched error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ====================================================
// 📈 GET /videos/:id/progress → Check if watched (Student)
// ====================================================
router.get("/:id/progress", auth, async (req, res) => {
  try {
    const videoId = String(req.params.id);
    const userId = req.user.userId;

    const progress = await prisma.videoProgress.findUnique({
      where: { userId_videoId: { userId, videoId } },
      select: { watched: true, updatedAt: true },
    });

    res.json({
      videoId,
      watched: progress?.watched || false,
      updatedAt: progress?.updatedAt || null,
    });
  } catch (err) {
    console.error("GET /videos/:id/progress error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = { videoRoute: router };
