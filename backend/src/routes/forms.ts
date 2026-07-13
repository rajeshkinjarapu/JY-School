import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  createForm,
  getForms,
  getFormDetails,
  submitFormResponse,
  getFormSubmissions,
  deleteForm
} from '../controllers/forms.controller';

const router = Router();

router.use(authenticate);

router.get('/', getForms);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createForm);
router.get('/:id', getFormDetails);
router.post('/:id/submit', submitFormResponse);
router.get('/:id/submissions', authorize('SUPER_ADMIN', 'ADMIN'), getFormSubmissions);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteForm);

export default router;
