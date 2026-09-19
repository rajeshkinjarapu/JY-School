import { Router } from 'express';
import fs from 'fs';
import { upload, getFileUrl } from '../utils/upload';
import { authenticate } from '../middlewares/auth';
import { successResponse } from '../utils/response';

const router = Router();

router.use(authenticate);

router.post('/image', (req, res) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    const uploadedFile = (req.files && Array.isArray(req.files) && req.files.length > 0)
      ? (req.files[0] as Express.Multer.File)
      : req.file;

    if (!uploadedFile) {
      return res.status(400).json({ success: false, message: 'No file uploaded or invalid format' });
    }
    
    try {
      // Read the uploaded file
      const fileBuffer = fs.readFileSync(uploadedFile.path);
      const base64Str = fileBuffer.toString('base64');
      const mimeType = uploadedFile.mimetype || 'image/jpeg';
      const url = `data:${mimeType};base64,${base64Str}`;
      
      // Clean up the local file since we are saving it as base64
      if (fs.existsSync(uploadedFile.path)) {
        fs.unlinkSync(uploadedFile.path);
      }
      
      successResponse(res, { url }, 'Image uploaded successfully');
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to process image' });
    }
  });
});

// /share: saves file to disk and returns a public URL (used for WhatsApp sharing on HTTP origins)
router.post('/share', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file uploaded or invalid format' });
    return;
  }
  const url = getFileUrl(req.file.filename);
  successResponse(res, { url }, 'File uploaded successfully');
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
