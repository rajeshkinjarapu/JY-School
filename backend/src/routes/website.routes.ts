import { Router } from 'express';
import {
  getWebsiteData,
  updateSettings,
  createStat,
  updateStat,
  deleteStat,
  createProgram,
  updateProgram,
  deleteProgram,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  createNews,
  updateNews,
  deleteNews,
  lookupPublicResult,
  lookupPublicHallTicket,
  lookupAdmissionStatus,
  lookupPublicFeeStatus,
  submitPublicFeePayment,
  getAdminExamsForWebsite,
  toggleWebsiteExamPublish,
  createNavLink,
  deleteNavLink,
  upsertCustomPage,
  deleteCustomPage,
  createMedia,
  deleteMedia,
  createDownload,
  deleteDownload,
  createTopper,
  deleteTopper,
} from '../controllers/website.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Public Website CMS & Self-Service Student Portals (No auth required)
router.get('/data', getWebsiteData);
router.post('/public/results', lookupPublicResult);
router.post('/public/hall-ticket', lookupPublicHallTicket);
router.get('/public/admission-status', lookupAdmissionStatus);
router.post('/public/fees/lookup', lookupPublicFeeStatus);
router.post('/public/fees/pay', submitPublicFeePayment);

// Protected Admin Routes
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN'));

router.put('/settings', updateSettings);
router.get('/admin/exams', getAdminExamsForWebsite);
router.put('/admin/exams/:id/publish', toggleWebsiteExamPublish);

router.post('/stats', createStat);
router.put('/stats/:id', updateStat);
router.delete('/stats/:id', deleteStat);

router.post('/programs', createProgram);
router.put('/programs/:id', updateProgram);
router.delete('/programs/:id', deleteProgram);

router.post('/testimonials', createTestimonial);
router.put('/testimonials/:id', updateTestimonial);
router.delete('/testimonials/:id', deleteTestimonial);

router.post('/news', createNews);
router.put('/news/:id', updateNews);
router.delete('/news/:id', deleteNews);

router.post('/nav-links', createNavLink);
router.delete('/nav-links/:id', deleteNavLink);

router.post('/custom-pages', upsertCustomPage);
router.delete('/custom-pages/:id', deleteCustomPage);

router.post('/media', createMedia);
router.delete('/media/:id', deleteMedia);

router.post('/downloads', createDownload);
router.delete('/downloads/:id', deleteDownload);

router.post('/toppers', createTopper);
router.delete('/toppers/:id', deleteTopper);

export default router;
