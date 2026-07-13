import { Router } from 'express';
import { upload, getFileUrl } from '../utils/upload';
import { authenticate } from '../middlewares/auth';
import { successResponse } from '../utils/response';

const router = Router();

router.use(authenticate);

router.post('/image', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file uploaded or invalid format' });
    return;
  }
  const url = getFileUrl(req.file.filename);
  successResponse(res, { url }, 'Image uploaded successfully');
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
