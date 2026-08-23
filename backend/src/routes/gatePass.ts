import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { createGatePass, getGatePassById, listGatePasses, updateGatePass, printGatePass, printGatePassPdf, getLiveStats, scanGatePass } from '../controllers/gatePass.controller';

const router = Router();
router.use(authenticate);

router.get('/stats', authorize('SUPER_ADMIN', 'ADMIN', 'SECURITY'), getLiveStats);
router.post('/scan', authorize('SUPER_ADMIN', 'ADMIN', 'SECURITY'), scanGatePass);

router.get('/', listGatePasses);
router.post('/', createGatePass);
router.get('/:id', getGatePassById);
router.get('/:id/print', printGatePass);
router.get('/:id/print/pdf', printGatePassPdf);
router.patch('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'SECURITY'), updateGatePass);

export default router;
