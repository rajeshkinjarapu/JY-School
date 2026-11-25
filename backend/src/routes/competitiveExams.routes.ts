
import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import {
  createCompetitiveExam,
  getCompetitiveExamsByClass,
  getAllCompetitiveExams,
  clearDummyExams,
  addCompetitiveQuestion,
  generateCompetitiveQuestionsAI,
  getStudentCompetitiveExams,
  getCompetitiveExamDetails,
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
router.get("/:id/student", authenticate, getCompetitiveExamDetails);
router.post("/:id/submit", authenticate, submitCompetitiveExam);
router.get("/:id/result", authenticate, getStudentResult);

// Admin/Teacher Routes
router.get("/admin", authenticate, getAllCompetitiveExams);
router.delete("/purge-dummy/all", authenticate, clearDummyExams);
router.get("/:id", authenticate, getCompetitiveExamDetails);
router.post("/", authenticate, createCompetitiveExam);
router.put("/:id", authenticate, updateCompetitiveExam);
router.delete("/:id", authenticate, deleteCompetitiveExam);

router.get("/class/:classId", authenticate, getCompetitiveExamsByClass);
router.get("/:id/leaderboard", authenticate, getExamLeaderboard);

router.post("/:id/populate-sample", authenticate, populateSampleQuestions);
router.post("/:examId/questions", authenticate, addCompetitiveQuestion);
router.post("/:examId/generate-ai", authenticate, generateCompetitiveQuestionsAI);
router.post("/:examId/ai-parse-text", authenticate, parseTextQuestionsAI);
router.post("/:examId/bulk-add-questions", authenticate, bulkAddQuestions);
router.post("/:examId/import-from-bank", authenticate, importFromMasterBank);
router.put("/question/:questionId", authenticate, updateCompetitiveQuestion);
router.delete("/question/:questionId", authenticate, deleteCompetitiveQuestion);

export default router;

