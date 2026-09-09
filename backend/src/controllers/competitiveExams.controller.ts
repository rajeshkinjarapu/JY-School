import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { generateQuizQuestions } from '../utils/gemini';

// ==========================================
// ADMIN / TEACHER ROUTES
// ==========================================

export const createCompetitiveExam = async (req: Request, res: Response) => {
  try {
    const { title, classId, subjectId, teacherId, duration, startTime, endTime, totalMarks, passMarks, negativeMarks, isPublished } = req.body;
    
    const exam = await prisma.competitiveExam.create({
      data: {
        title, classId, subjectId, teacherId, duration, 
        startTime: new Date(startTime), 
        endTime: new Date(endTime), 
        totalMarks, passMarks, negativeMarks, isPublished
      }
    });
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create competitive exam' });
  }
};

export const getCompetitiveExamsByClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const exams = await prisma.competitiveExam.findMany({
      where: { classId },
      include: { subject: true, _count: { select: { questions: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch competitive exams' });
  }
};

export const getAllCompetitiveExams = async (req: Request, res: Response) => {
  try {
    const exams = await prisma.competitiveExam.findMany({
      include: { subject: true, class: true, _count: { select: { questions: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch all competitive exams' });
  }
};

export const addCompetitiveQuestion = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    const { questionText, questionType, imageUrl, options, correctAnswer, marks, chapterName, difficulty } = req.body;

    const q = await prisma.competitiveExamQuestion.create({
      data: {
        competitiveExamId: examId,
        questionText, questionType, imageUrl, options: JSON.stringify(options), correctAnswer, marks, chapterName, difficulty
      }
    });
    res.status(201).json({ success: true, data: q });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add question' });
  }
};

export const generateCompetitiveQuestionsAI = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    const { prompt, count, chapterName, difficulty } = req.body;

    const basePrompt = `Generate ${count} ${difficulty} level multiple choice questions for the chapter '${chapterName || 'General'}'. Focus: ${prompt}.
Return ONLY a valid JSON array of objects with keys: "questionText", "options" (array of 4 strings), "correctAnswer" (must match one option exactly). Do not include markdown code block formatting.`;

    const questionsData = await generateQuizQuestions(basePrompt);
    
    const savedQuestions = [];
    for (const q of questionsData) {
      const saved = await prisma.competitiveExamQuestion.create({
        data: {
          competitiveExamId: examId,
          questionText: q.questionText,
          questionType: 'MCQ',
          options: JSON.stringify(q.options),
          correctAnswer: q.correctAnswer,
          marks: 4, // Default marks for competitive like JEE
          chapterName: chapterName,
          difficulty: difficulty || 'MEDIUM'
        }
      });
      savedQuestions.push(saved);
    }
    
    res.status(201).json({ success: true, data: savedQuestions });
  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate competitive questions with AI' });
  }
};

// ==========================================
// STUDENT ROUTES
// ==========================================

export const getStudentCompetitiveExams = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user?.id; 
    const student = await prisma.student.findUnique({ where: { userId: studentId } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const exams = await prisma.competitiveExam.findMany({
      where: { classId: student.classId, isPublished: true },
      include: { 
        subject: true,
        submissions: { where: { studentId: student.id } }
      },
      orderBy: { startTime: 'desc' }
    });

    const mapped = exams.map(e => ({
      ...e,
      submission: e.submissions.length > 0 ? e.submissions[0] : null,
      submissions: undefined
    }));

    res.json({ success: true, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch student exams' });
  }
};

export const getCompetitiveExamDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const exam = await prisma.competitiveExam.findUnique({
      where: { id },
      include: {
        subject: true,
        questions: { select: { id: true, questionText: true, questionType: true, imageUrl: true, options: true, marks: true } }
      }
    });

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    // Parse options
    const parsedQuestions = exam.questions.map(q => ({
      ...q,
      options: q.options ? JSON.parse(q.options) : []
    }));

    res.json({ success: true, data: { ...exam, questions: parsedQuestions } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch exam details' });
  }
};

export const submitCompetitiveExam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // examId
    const { answers, totalTimeTaken } = req.body; // array of { questionId, selectedOption, timeTakenSeconds }
    const studentUserId = (req as any).user?.id;

    const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const exam = await prisma.competitiveExam.findUnique({
      where: { id },
      include: { questions: true }
    });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    // Check existing
    const existing = await prisma.competitiveExamSubmission.findUnique({
      where: { competitiveExamId_studentId: { competitiveExamId: id, studentId: student.id } }
    });
    if (existing) return res.status(400).json({ success: false, message: 'Already submitted' });

    let marksObtained = 0;
    const responseRecords = [];

    // Evaluate
    for (const ans of answers) {
      const q = exam.questions.find(x => x.id === ans.questionId);
      if (q) {
        const isCorrect = q.correctAnswer === ans.selectedOption;
        if (isCorrect) {
          marksObtained += q.marks;
        } else if (ans.selectedOption && ans.selectedOption !== '') {
          // Negative marking if answered incorrectly
          marksObtained -= exam.negativeMarks;
        }
        
        responseRecords.push({
          questionId: q.id,
          selectedOption: ans.selectedOption,
          isCorrect,
          timeTakenSeconds: ans.timeTakenSeconds || 0
        });
      }
    }

    const submission = await prisma.competitiveExamSubmission.create({
      data: {
        competitiveExamId: id,
        studentId: student.id,
        marksObtained,
        totalTimeTaken: totalTimeTaken || 0,
        responses: {
          create: responseRecords
        }
      },
      include: {
        responses: {
          include: { question: true }
        }
      }
    });

    res.json({ success: true, data: submission });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to submit exam' });
  }
};
