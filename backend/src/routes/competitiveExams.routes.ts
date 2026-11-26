
import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth";
import {
  createCompetitiveExam,
  getCompetitiveExamsByClass,
  getAllCompetitiveExams,
  clearDummyExams,
  addCompetitiveQuestion,
  generateCompetitiveQuestionsAI,
  getStudentCompetitiveExams,
  getCompetitiveExamDetails,
  getStudentExamPaper,
  saveExamHeartbeat,
  getExamLiveMonitor,
  forceSubmitSession,
  submitCompetitiveExam,
  getExamLeaderboard,
  getStudentResult,
  deleteCompetitiveExam,
  updateCompetitiveExam,
  deleteCompetitiveQuestion,
  updateCompetitiveQuestion,
  parseTextQuestionsAI,
  bulkAddQuestions,
  importFromMasterBank,
  populateSampleQuestions
} from "../controllers/competitiveExams.controller";

const router = Router();

// Student Routes
router.get("/student", authenticate, getStudentCompetitiveExams);
router.get("/:id/student", authenticate, getStudentExamPaper);
router.post("/:id/heartbeat", authenticate, saveExamHeartbeat);
router.post("/:id/submit", authenticate, submitCompetitiveExam);
router.get("/:id/result", authenticate, getStudentResult);

// Admin/Teacher Routes
router.get("/admin", authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getAllCompetitiveExams);
router.delete("/purge-dummy/all", authenticate, authorize('SUPER_ADMIN', 'ADMIN'), clearDummyExams);
router.get("/:id/live-monitor", authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getExamLiveMonitor);
router.post("/:id/force-submit/:studentId", authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), forceSubmitSession);
router.get("/:id", authenticate, getCompetitiveExamDetails);
router.post("/", authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), createCompetitiveExam);
router.put("/:id", authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), updateCompetitiveExam);
router.delete("/:id", authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), deleteCompetitiveExam);

router.get("/class/:classId", authenticate, getCompetitiveExamsByClass);
router.get("/:id/leaderboard", authenticate, getExamLeaderboard);

router.post("/:id/populate-sample", authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), populateSampleQuestions);
router.post("/:examId/questions", authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), addCompetitiveQuestion);
router.post("/:examId/generate-ai", authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), generateCompetitiveQuestionsAI);
router.post("/:examId/ai-parse-text", authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), parseTextQuestionsAI);
router.post("/:examId/bulk-add-questions", authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), bulkAddQuestions);
router.post("/:examId/import-from-bank", authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), importFromMasterBank);
router.put("/question/:questionId", authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), updateCompetitiveQuestion);
router.delete("/question/:questionId", authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), deleteCompetitiveQuestion);

export default router;

