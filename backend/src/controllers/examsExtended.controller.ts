import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';

// ==========================================
// EXAM PLAN
// ==========================================

export const getExamPlans = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { examId } = req.query as { examId?: string };
  if (!examId) return next(createError('examId is required', 400));

  const plans = await prisma.examPlan.findMany({
    where: { examId },
    include: {
      subject: { select: { id: true, name: true, code: true } }
    },
    orderBy: { examDate: 'asc' }
  });
  successResponse(res, plans, 'Exam plans fetched');
};

export const createExamPlan = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { examId, subjectId, examDate, startTime, endTime, room, maxMarks, passingMarks } = req.body;

  const plan = await prisma.examPlan.create({
    data: {
      examId,
      subjectId,
      examDate: new Date(examDate),
      startTime,
      endTime,
      room,
      maxMarks: Number(maxMarks || 100),
      passingMarks: Number(passingMarks || 40)
    },
    include: {
      subject: { select: { id: true, name: true, code: true } }
    }
  });
  successResponse(res, plan, 'Exam plan created', 201);
};

export const updateExamPlan = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const { examDate, startTime, endTime, room, maxMarks, passingMarks } = req.body;

  const plan = await prisma.examPlan.update({
    where: { id },
    data: {
      examDate: examDate ? new Date(examDate) : undefined,
      startTime,
      endTime,
      room,
      maxMarks: maxMarks ? Number(maxMarks) : undefined,
      passingMarks: passingMarks ? Number(passingMarks) : undefined
    },
    include: {
      subject: { select: { id: true, name: true, code: true } }
    }
  });
  successResponse(res, plan, 'Exam plan updated');
};

export const deleteExamPlan = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  await prisma.examPlan.delete({ where: { id } });
  successResponse(res, null, 'Exam plan deleted');
};

// ==========================================
// QUESTION GROUP
// ==========================================

export const getQuestionGroups = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const groups = await prisma.questionGroup.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { questions: true } } }
  });
  successResponse(res, groups, 'Question groups fetched');
};

export const createQuestionGroup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { name, description } = req.body;
  const group = await prisma.questionGroup.create({
    data: { name, description }
  });
  successResponse(res, group, 'Question group created', 201);
};

export const deleteQuestionGroup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  await prisma.questionGroup.delete({ where: { id } });
  successResponse(res, null, 'Question group deleted');
};

// ==========================================
// QUESTION BANK
// ==========================================

export const getQuestions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { groupId } = req.query as { groupId?: string };
  const questions = await prisma.questionBank.findMany({
    where: groupId ? { groupId } : undefined,
    orderBy: { createdAt: 'desc' }
  });
  successResponse(res, questions, 'Questions fetched');
};

export const createQuestion = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { groupId, questionText, questionType, options, correctAnswer, marks } = req.body;

  const question = await prisma.questionBank.create({
    data: {
      groupId,
      questionText,
      questionType,
      options: options ? JSON.stringify(options) : null,
      correctAnswer: String(correctAnswer),
      marks: Number(marks || 1)
    }
  });
  successResponse(res, question, 'Question created', 201);
};

export const updateQuestion = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const { questionText, questionType, options, correctAnswer, marks } = req.body;

  const question = await prisma.questionBank.update({
    where: { id },
    data: {
      questionText,
      questionType,
      options: options ? JSON.stringify(options) : undefined,
      correctAnswer: correctAnswer !== undefined ? String(correctAnswer) : undefined,
      marks: marks ? Number(marks) : undefined
    }
  });
  successResponse(res, question, 'Question updated');
};

export const deleteQuestion = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  await prisma.questionBank.delete({ where: { id } });
  successResponse(res, null, 'Question deleted');
};

// ==========================================
// ONLINE EXAMS
// ==========================================

export const getOnlineExams = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { classId } = req.query as { classId?: string };

  const exams = await prisma.onlineExam.findMany({
    where: classId ? { classId } : undefined,
    include: {
      class: { select: { name: true, section: true } },
      subject: { select: { name: true } },
      questions: { include: { question: true } },
      submissions: { select: { studentId: true, marksObtained: true } }
    },
    orderBy: { startTime: 'desc' }
  });

  successResponse(res, exams, 'Online exams fetched');
};

export const createOnlineExam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { title, classId, subjectId, duration, startTime, endTime, totalMarks, passMarks, questionIds } = req.body;

  const exam = await prisma.onlineExam.create({
    data: {
      title,
      classId,
      subjectId,
      duration: Number(duration),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      totalMarks: Number(totalMarks),
      passMarks: Number(passMarks),
      isPublished: true,
      questions: {
        create: (questionIds || []).map((qId: string) => ({
          questionId: qId
        }))
      }
    }
  });

  successResponse(res, exam, 'Online exam created', 201);
};

export const deleteOnlineExam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  await prisma.onlineExam.delete({ where: { id } });
  successResponse(res, null, 'Online exam deleted');
};

// Get single online exam for taking (hides correctAnswer)
export const getOnlineExamForTake = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;

  const exam = await prisma.onlineExam.findUnique({
    where: { id },
    include: {
      class: { select: { name: true, section: true } },
      subject: { select: { name: true } },
      questions: {
        include: {
          question: {
            select: {
              id: true,
              questionText: true,
              questionType: true,
              options: true,
              marks: true
            }
          }
        }
      }
    }
  });

  if (!exam) return next(createError('Online exam not found', 404));

  // Check if student has already submitted
  if (req.user?.role === 'STUDENT') {
    const student = await prisma.student.findFirst({ where: { userId: req.user.id } });
    if (student) {
      const submission = await prisma.onlineExamSubmission.findFirst({
        where: { onlineExamId: id, studentId: student.id }
      });
      if (submission) {
        successResponse(res, { exam, completed: true, marksObtained: submission.marksObtained }, 'Already submitted');
        return;
      }
    }
  }

  successResponse(res, { exam, completed: false }, 'Online exam details fetched');
};

// Submit Answers
export const submitOnlineExam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const { answers } = req.body; // map of questionId -> selected answer

  const student = await prisma.student.findFirst({ where: { userId: req.user!.id } });
  if (!student) return next(createError('Student profile not found', 404));

  // Check if already submitted
  const existingSubmission = await prisma.onlineExamSubmission.findUnique({
    where: { onlineExamId_studentId: { onlineExamId: id, studentId: student.id } }
  });
  if (existingSubmission) return next(createError('You have already submitted this exam', 400));

  // Fetch full exam details with correct answers to compute score
  const exam = await prisma.onlineExam.findUnique({
    where: { id },
    include: {
      questions: {
        include: {
          question: true
        }
      }
    }
  }) as any;
  if (!exam) return next(createError('Exam not found', 404));

  // Grade test automatically for MCQ
  let totalScore = 0;
  for (const eq of exam.questions) {
    const q = eq.question;
    const studentAnswer = answers[q.id];
    if (studentAnswer !== undefined && String(studentAnswer).trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
      totalScore += q.marks;
    }
  }

  const submission = await prisma.onlineExamSubmission.create({
    data: {
      onlineExamId: id,
      studentId: student.id,
      answers: JSON.stringify(answers),
      marksObtained: totalScore
    }
  });

  successResponse(res, submission, 'Exam submitted successfully');
};

// View Submissions for Admin/Teacher
export const getOnlineExamSubmissions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const submissions = await prisma.onlineExamSubmission.findMany({
    where: { onlineExamId: id },
    include: {
      student: {
        include: {
          user: { select: { name: true } }
        }
      }
    },
    orderBy: { submittedAt: 'desc' }
  });
  successResponse(res, submissions, 'Submissions fetched');
};
