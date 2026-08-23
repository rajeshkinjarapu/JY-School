import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { createGatePass, getGatePassById, listGatePasses, updateGatePass, printGatePass, printGatePassPdf, getLiveStats, scanGatePass } from '../controllers/gatePass.controller';

const router = Router();
router.use(authenticate);

// @ts-ignore
router.get('/stats', authorize('SUPER_ADMIN', 'ADMIN', 'SECURITY' as any), getLiveStats);
// @ts-ignore
router.post('/scan', authorize('SUPER_ADMIN', 'ADMIN', 'SECURITY' as any), scanGatePass);

router.get('/', listGatePasses);
router.post('/', createGatePass);
router.get('/:id', getGatePassById);
router.get('/:id/print', printGatePass);
router.get('/:id/print/pdf', printGatePassPdf);
// @ts-ignore
router.patch('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'SECURITY' as any), updateGatePass);

export default router;
