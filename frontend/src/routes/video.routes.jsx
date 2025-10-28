import { Router } from 'express';
import { addVideo } from '../controllers/video.controller.js';
const router = Router();

router.post('/', addVideo); // POST /videos

export default router;
