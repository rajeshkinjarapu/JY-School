import { Router } from 'express';
import { upload, getFileUrl } from '../utils/upload';
import { authenticate } from '../middlewares/auth';
import { successResponse } from '../utils/response';

const router = Router();

router.use(authenticate);

import fs from 'fs';

router.post('/image', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file uploaded or invalid format' });
    return;
  }
  
  try {
    // Read the uploaded file
    const fileBuffer = fs.readFileSync(req.file.path);
    const base64Str = fileBuffer.toString('base64');
    const mimeType = req.file.mimetype;
    const url = `data:${mimeType};base64,${base64Str}`;
    
    // Clean up the local file since we are saving it as base64
    fs.unlinkSync(req.file.path);
    
    successResponse(res, { url }, 'Image uploaded successfully');
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to process image' });
  }
});

router.post('/document', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file uploaded or invalid format' });
    return;
  }
  const url = getFileUrl(req.file.filename);
  successResponse(res, { url }, 'Document uploaded successfully');
});

export default router;
