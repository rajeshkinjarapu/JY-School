import { Router } from 'express';
import {
  scanOmrSheet,
  bulkScanOmrSheets,
  saveAnswerKey,
  getAnswerKeys,
  saveOmrResults,
  getOmrResults,
} from '../controllers/omr.controller';

const router = Router();

// Single sheet scan (existing, keep compatible)
router.post('/', scanOmrSheet);

// Bulk scan multiple sheets
router.post('/bulk-scan', bulkScanOmrSheets);

// Answer key management
router.post('/answer-key', saveAnswerKey);
router.get('/answer-keys', getAnswerKeys);

// Results management
router.post('/results', saveOmrResults);
router.get('/results/:examId', getOmrResults);

export default router;
