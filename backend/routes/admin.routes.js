// backend/routes/admin.routes.js
const express = require("express");
const { prisma } = require("../prismaClient");
const { auth, requires } = require("../middlewares/users.middleware");

const router = express.Router();

/**
 * Small helper: return daily counts (createdAt) between [startISO, endISO)
 * for a given table name using SQLite date() truncation.
 *
 * NOTE:
 * - We use $queryRawUnsafe ONLY to interpolate the TABLE NAME (Prisma won't
 *   parameterize identifiers). Values still go in as bound parameters (?).
 * - If you migrate to Postgres, switch this to date_trunc('day', createdAt)
 *   or build a provider-specific helper.
 */
async function dailyCountSQLite(table, startISO, endISO) {
  const rows = await prisma.$queryRawUnsafe(
    `
    SELECT date(createdAt) AS d, COUNT(*) AS c
    FROM ${table}
    WHERE createdAt >= ? AND createdAt < ?
    GROUP BY date(createdAt)
    ORDER BY d ASC
    `,
    startISO,
    endISO
  );
  return rows.map((r) => ({ date: r.d, value: Number(r.c) || 0 }));
}

/**
 * GET /admin/stats
 * ADMIN-only dashboard stats + (NEW) time-series.
 *
 * Returns:
 *  - totals: { totalUsers, totalCourses, totalVideos, totalEnrollments }
 *    (Optionally you can also add totalWatchTime later.)
 *  - byCategory: [{ category, count }]
 *  - topCoursesByVideos: [{ id, title, videos, enrollments }]
 *  - series: {
 *      users: [{ date: 'YYYY-MM-DD', value: number }],
 *      courses: [...],
 *      videos: [...],
 *      enrollments: [...]
 *    }
 *
 * Query:
 *  - windowDays?: number (1..180, default 30) — rolling window for series
 */
router.get("/stats", auth, requires("ADMIN"), async (req, res) => {
  try {
    // ---- Totals (as before)
    const [totalUsers, totalCourses, totalVideos, totalEnrollments] =
      await Promise.all([
        prisma.user.count(),
        prisma.course.count(),
        prisma.video.count(),
        prisma.enrollment.count(),
      ]);

    // Pull courses for category aggregation + top list
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        category: true,
        _count: { select: { videos: true, enrollments: true } },
      },
    });

    // ---- Category breakdown
    const catMap = new Map();
    for (const c of courses) {
      const key = (c.category || "Uncategorized").trim() || "Uncategorized";
      catMap.set(key, (catMap.get(key) || 0) + 1);
    }
    const byCategory = Array.from(catMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    // ---- Top 5 courses by videos (include enrollments for secondary context)
    const topCoursesByVideos = courses
      .map((c) => ({
        id: c.id,
        title: c.title,
        videos: c._count.videos || 0,
        enrollments: c._count.enrollments || 0,
      }))
      .sort((a, b) => b.videos - a.videos)
      .slice(0, 5);

    // ---- NEW: time-series
    const rawWindow = Number(req.query.windowDays);
    const windowDays = Number.isFinite(rawWindow)
      ? Math.max(1, Math.min(180, rawWindow))
      : 30;

    // Build [start, end) at date precision (local midnight boundary)
    const end = new Date();
    end.setHours(0, 0, 0, 0); // today 00:00
    const start = new Date(end);
    start.setDate(start.getDate() - windowDays + 1);

    const startISO = start.toISOString(); // inclusive
    const endISO = new Date(end.getTime() + 24 * 60 * 60 * 1000).toISOString(); // exclusive

    // Table names must match Prisma model names
    const [usersSeries, coursesSeries, videosSeries, enrollmentsSeries] =
      await Promise.all([
        dailyCountSQLite("User", startISO, endISO),
        dailyCountSQLite("Course", startISO, endISO),
        dailyCountSQLite("Video", startISO, endISO),
        dailyCountSQLite("Enrollment", startISO, endISO),
      ]);

    // ---- OPTIONAL: watch time (requires Video.avgLengthMinutes in schema)
    // const videoAgg = await prisma.video.findMany({
    //   select: { views: true, avgLengthMinutes: true },
    // });
    // const totalWatchTime = videoAgg.reduce(
    //   (acc, v) => acc + (v.views || 0) * (v.avgLengthMinutes || 0),
    //   0
    // );

    res.json({
      totals: {
        totalUsers,
        totalCourses,
        totalVideos,
        totalEnrollments,
        // totalWatchTime, // uncomment if you added avgLengthMinutes
      },
      byCategory,
      topCoursesByVideos,
      series: {
        users: usersSeries,
        courses: coursesSeries,
        videos: videosSeries,
        enrollments: enrollmentsSeries,
      },
    });
  } catch (err) {
    console.error("GET /admin/stats error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = { adminRouter: router };
