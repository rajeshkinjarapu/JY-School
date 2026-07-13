import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionMeta,
} from '../controllers/latexQuestion.controller';
import {
  getPapers,
  getPaperById,
  createPaper,
  updatePaper,
  deletePaper,
  getScrambledPaperSet,
} from '../controllers/latexPaper.controller';
import {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../controllers/latexTemplate.controller';
import { importQuestionFile } from '../controllers/latexImport.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { generatePdfFromHtml } from '../utils/pdf.utils'; // I will need to copy this util!

const router = Router();

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ================= QUESTION BANK ROUTES =================
router.get('/questions', authenticate, getQuestions);
router.get('/questions/meta', authenticate, getQuestionMeta);
router.get('/questions/:id', authenticate, getQuestionById);
router.post('/questions', authenticate, createQuestion);
router.put('/questions/:id', authenticate, updateQuestion);
router.delete('/questions/:id', authenticate, deleteQuestion);
router.post('/questions/import', authenticate, upload.single('file'), importQuestionFile);

router.post('/questions/upload', authenticate, upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No image file provided' });
    return;
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, imageUrl, message: 'Image uploaded successfully' });
});

// ================= QUESTION PAPER ROUTES =================
router.get('/papers', authenticate, getPapers);
router.get('/papers/:id', authenticate, getPaperById);
router.get('/papers/:id/scramble', authenticate, getScrambledPaperSet);
router.post('/papers', authenticate, createPaper);
router.put('/papers/:id', authenticate, updatePaper);
router.delete('/papers/:id', authenticate, deletePaper);

// Server-side PDF Export Endpoint
router.post('/papers/export-pdf', authenticate, async (req, res) => {
  try {
    const { html } = req.body;
    if (!html) {
      res.status(400).json({ success: false, message: 'HTML content is required for PDF generation' });
      return;
    }

    const pdfBuffer = await generatePdfFromHtml(html);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=jee-mains-paper.pdf');
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate PDF. Puppeteer renderer issue.' });
  }
});

// ================= BLUEPRINT TEMPLATE ROUTES =================
router.get('/templates', authenticate, getTemplates);
router.get('/templates/:id', authenticate, getTemplateById);
router.post('/templates', authenticate, createTemplate);
router.put('/templates/:id', authenticate, updateTemplate);
router.delete('/templates/:id', authenticate, deleteTemplate);

export default router;
