// backend/prisma/seed.cjs
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  /* -----------------------------------------------------
   * 1) ADMIN (your original logic — unchanged)
   * --------------------------------------------------- */
  const ADMIN_EMAIL = "admin@example.com";
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || "admin123";
  const ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);

  const email = ADMIN_EMAIL.toLowerCase(); // avoid case issues
  const hashedPassword = await bcrypt.hash(ADMIN_PASS, ROUNDS);
  const role = "ADMIN"; // force uppercase

  // Upsert and also correct any drift if user already exists
  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      // if you want to keep existing password, comment the next line
      password: hashedPassword,
      name: "System Admin",
      role,
    },
    create: {
      email,
      name: "System Admin",
      password: hashedPassword, // <-- change to passwordHash if your schema uses that name
      role,
    },
    select: { id: true, email: true, name: true, role: true },
  });

  console.log("✅ ADMIN seeded:", admin);

  /* -----------------------------------------------------
   * 2) EXTRA SEED: Teacher + Student (hashed)
   * --------------------------------------------------- */
  const TEACHER_EMAIL = "teacher.seed@example.com";
  const STUDENT_EMAIL = "student.seed@example.com";
  const DEFAULT_PASS = process.env.SEED_DEFAULT_PASSWORD || "seedpass123";

  const hashedSeedPass = await bcrypt.hash(DEFAULT_PASS, ROUNDS);

  // ensure TEACHER
  const teacher = await prisma.user.upsert({
    where: { email: TEACHER_EMAIL },
    update: {}, // keep existing name/pass/role if already present
    create: {
      email: TEACHER_EMAIL,
      name: "Seed Teacher",
      password: hashedSeedPass,
      role: "TEACHER",
    },
    select: { id: true, email: true, name: true, role: true },
  });

  // ensure STUDENT
  const student = await prisma.user.upsert({
    where: { email: STUDENT_EMAIL },
    update: {},
    create: {
      email: STUDENT_EMAIL,
      name: "Seed Student",
      password: hashedSeedPass,
      role: "USER",
    },
    select: { id: true, email: true, name: true, role: true },
  });

  console.log("✅ Users ready:", { teacher, student });

  /* -----------------------------------------------------
   * 3) Courses: ensure at least two exist
   *     - If your DB already has >=2, we’ll just reuse
   *     - Else we create 2 small sample courses
   * --------------------------------------------------- */
  let courses = await prisma.course.findMany({
    take: 2,
    orderBy: { createdAt: "asc" },
  });

  if (courses.length < 2) {
    const need = 2 - courses.length;
    const toCreate = [
      {
        title: "Seed Course A",
        description: "Intro course created by seed script.",
        category: "Seeding",
        price: 0,
        teacherId: teacher.id,
      },
      {
        title: "Seed Course B",
        description: "Second intro course created by seed script.",
        category: "Seeding",
        price: 0,
        teacherId: teacher.id,
      },
    ].slice(0, need);

    await prisma.course.createMany({ data: toCreate });
    // re-fetch the first 2 for downstream relations
    courses = await prisma.course.findMany({
      take: 2,
      orderBy: { createdAt: "asc" },
    });
  }

  const [courseA, courseB] = courses;
  console.log("✅ Courses chosen:", {
    courseA: courseA.id,
    courseB: courseB.id,
  });

  /* -----------------------------------------------------
   * 4) Enrollment: student enrolled in both courses
   *     - Use findFirst + create to avoid duplicates
   * --------------------------------------------------- */
  async function ensureEnrollment(userId, courseId) {
    const exists = await prisma.enrollment.findFirst({
      where: { userId, courseId },
      select: { id: true },
    });
    if (!exists) {
      await prisma.enrollment.create({
        data: { userId, courseId, progress: 0, status: "ACTIVE" },
      });
    }
  }
  await ensureEnrollment(student.id, courseA.id);
  await ensureEnrollment(student.id, courseB.id);

  const enrollCount = await prisma.enrollment.count({
    where: { userId: student.id, courseId: { in: [courseA.id, courseB.id] } },
  });
  console.log("✅ Enrollments ensured for student:", enrollCount);

  /* -----------------------------------------------------
   * 5) Mock Tests for courseA (two tests)
   *     - If none exist for courseA, create two
   * --------------------------------------------------- */
  const existingTests = await prisma.mockTest.findMany({
    where: { courseId: courseA.id },
    select: { id: true },
  });

  let test1, test2;
  if (existingTests.length >= 2) {
    // reuse first two
    [test1, test2] = await prisma.mockTest.findMany({
      where: { courseId: courseA.id },
      orderBy: { createdAt: "asc" },
      take: 2,
    });
  } else {
    // create what’s missing
    const toMake = [];
    if (existingTests.length === 0) {
      toMake.push(
        {
          title: "K8s Basics Quiz",
          scheduledAt: new Date(Date.now() + 24 * 3600 * 1000),
          courseId: courseA.id,
        },
        {
          title: "K8s Deployments Quiz",
          scheduledAt: new Date(Date.now() + 3 * 24 * 3600 * 1000),
          courseId: courseA.id,
        }
      );
    } else if (existingTests.length === 1) {
      toMake.push({
        title: "K8s Deployments Quiz",
        scheduledAt: new Date(Date.now() + 3 * 24 * 3600 * 1000),
        courseId: courseA.id,
      });
    }
    await prisma.mockTest.createMany({ data: toMake });
    [test1, test2] = await prisma.mockTest.findMany({
      where: { courseId: courseA.id },
      orderBy: { createdAt: "asc" },
      take: 2,
    });
  }
  console.log("✅ MockTests ready:", { test1: test1.id, test2: test2.id });

  /* -----------------------------------------------------
   * 6) Mock Attempts by the student (for both tests)
   *     - Avoid duplicates by checking existence
   * --------------------------------------------------- */
  async function ensureAttempt(userId, testId, score) {
    const exists = await prisma.mockAttempt.findFirst({
      where: { userId, testId },
      select: { id: true },
    });
    if (!exists) {
      await prisma.mockAttempt.create({
        data: { userId, testId, score },
      });
    }
  }
  await ensureAttempt(student.id, test1.id, 78);
  await ensureAttempt(student.id, test2.id, 85);

  const attemptsCount = await prisma.mockAttempt.count({
    where: { userId: student.id, testId: { in: [test1.id, test2.id] } },
  });
  console.log("✅ MockAttempts ensured:", attemptsCount);

  /* -----------------------------------------------------
   * 7) Certificate for courseB (one doc)
   *     - Only create if not present for (student, courseB)
   * --------------------------------------------------- */
  const certExists = await prisma.certificate.findFirst({
    where: { userId: student.id, courseId: courseB.id },
    select: { id: true },
  });
  if (!certExists) {
    await prisma.certificate.create({
      data: {
        userId: student.id,
        courseId: courseB.id,
        grade: "A",
        fileUrl:
          "https://example.com/certificates/seed-student-sql-essentials.pdf",
        issuedAt: new Date(),
      },
    });
  }
  const certCount = await prisma.certificate.count({
    where: { userId: student.id, courseId: courseB.id },
  });
  console.log("✅ Certificates ensured:", certCount);

  console.log("🎉 Seed finished successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
