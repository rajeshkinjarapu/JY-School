
import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import {
  createCompetitiveExam,
  getCompetitiveExamsByClass,
  getAllCompetitiveExams,
  addCompetitiveQuestion,
  generateCompetitiveQuestionsAI,
  getStudentCompetitiveExams,
  getCompetitiveExamDetails,
  submitCompetitiveExam,
  getExamLeaderboard,
  getStudentResult,
  deleteCompetitiveExam,
  updateCompetitiveExam,
  updateCompetitiveQuestion,
  deleteCompetitiveQuestion,
  linkMasterQuestionsToExam
} from "../controllers/competitiveExams.controller";

const router = Router();

// Student Routes
router.get("/student", authenticate, getStudentCompetitiveExams);
router.get("/:id/student", authenticate, getCompetitiveExamDetails);
router.post("/:id/submit", authenticate, submitCompetitiveExam);
router.get("/:id/result", authenticate, getStudentResult);

// Admin/Teacher Routes
router.get("/admin", authenticate, getAllCompetitiveExams);
router.post("/", authenticate, createCompetitiveExam);
router.put("/:id", authenticate, updateCompetitiveExam);
router.delete("/:id", authenticate, deleteCompetitiveExam);

router.get("/class/:classId", authenticate, getCompetitiveExamsByClass);
router.get("/:id/leaderboard", authenticate, getExamLeaderboard);

router.post("/:examId/questions", authenticate, addCompetitiveQuestion);
router.post("/:examId/questions/link", authenticate, linkMasterQuestionsToExam);
router.post("/:examId/generate-ai", authenticate, generateCompetitiveQuestionsAI);
router.put("/question/:questionId", authenticate, updateCompetitiveQuestion);
router.delete("/question/:questionId", authenticate, deleteCompetitiveQuestion);

export default router;

