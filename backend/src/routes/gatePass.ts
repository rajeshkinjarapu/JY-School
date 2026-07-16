import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { createGatePass, getGatePassById, listGatePasses, updateGatePass, printGatePass, printGatePassPdf } from '../controllers/gatePass.controller';

const router = Router();
router.use(authenticate);

router.get('/', listGatePasses);
router.post('/', createGatePass);
router.get('/:id', getGatePassById);
router.get('/:id/print', printGatePass);
router.get('/:id/print/pdf', printGatePassPdf);
router.patch('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateGatePass);

export default router;
