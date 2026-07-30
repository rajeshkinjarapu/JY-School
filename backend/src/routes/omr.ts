import { Router } from 'express';
import { scanOmrSheet } from '../controllers/omr.controller';

const router = Router();

// Process base64 image with Gemini
router.post('/', scanOmrSheet);

export default router;
