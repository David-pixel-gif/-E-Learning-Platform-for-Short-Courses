import { prisma } from '../db/prismaClient.js';

export async function listCourses(req, res) {
  try {
    const {
      page = 1,
      limit = 6,
      search = '',
      order = 'asc', // "asc" or "desc" by price
    } = req.query;

    const where = search
      ? { title: { contains: String(search), mode: 'insensitive' } }
      : {};

    const [items, total] = await Promise.all([
      prisma.course.findMany({
        where,
        orderBy: { price: order === 'desc' ? 'desc' : 'asc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          teacher: { select: { id: true, name: true } },
          _count: { select: { videos: true, enrollments: true } },
        },
      }),
      prisma.course.count({ where }),
    ]);

    res.json({
      data: items,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
}

export async function createCourse(req, res) {
  try {
    const { title, description, category, price, teacherId } = req.body;
    const course = await prisma.course.create({
      data: { title, description, category, price: Number(price || 0), teacherId },
    });
    res.status(201).json(course);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Failed to create course' });
  }
}
