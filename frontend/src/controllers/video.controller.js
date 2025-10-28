import { prisma } from '../db/prismaClient.js';

export async function addVideo(req, res) {
  try {
    const { title, description, link, views = 0, img, courseId } = req.body;

    // ensure course exists
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const video = await prisma.video.create({
      data: { title, description, link, views: Number(views || 0), img, courseId },
    });

    res.status(201).json(video);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Failed to add video' });
  }
}
