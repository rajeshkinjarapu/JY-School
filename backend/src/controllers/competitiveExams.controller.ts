import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { generateQuizQuestions } from '../utils/gemini';

// ==========================================
// ADMIN / TEACHER ROUTES
// ==========================================

export const createCompetitiveExam = async (req: Request, res: Response) => {
  try {
    const { title, classId, subjectId, teacherId, duration, startTime, endTime, totalMarks, passMarks, negativeMarks, isPublished } = req.body;
    
    let validClassId = classId;
    if (!validClassId) {
      let cls = await prisma.class.findFirst();
      if (!cls) {
        cls = await prisma.class.create({
          data: { name: '10th', section: 'A', academicYear: '2024-2025', capacity: 50 }
        });
      }
      validClassId = cls?.id;
    }
    let validSubjectId = subjectId;
    if (!validSubjectId) {
      let sub = await prisma.subject.findFirst();
      if (!sub) {
        sub = await prisma.subject.create({
          data: { name: 'Mathematics', code: 'MTH-101', type: 'THEORY' }
        });
      }
      validSubjectId = sub?.id;
    }

    const exam = await prisma.competitiveExam.create({
      data: {
        title: title || 'JEE / NEET Mock Exam',
        classId: validClassId,
        subjectId: validSubjectId,
        teacherId: teacherId || null,
        duration: Number(duration) || 180, 
        startTime: startTime ? new Date(startTime) : new Date(), 
        endTime: endTime ? new Date(endTime) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 
        totalMarks: Number(totalMarks) || 300,
        passMarks: Number(passMarks) || 100,
        negativeMarks: Number(negativeMarks) || 1,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true
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
      include: { 
        subject: true, 
        class: true, 
        _count: { select: { questions: true, submissions: true } },
        submissions: {
          select: { marksObtained: true } // Fetch marks to calculate average/highest/lowest
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: exams });
  } catch (error) {
    console.error('getAllCompetitiveExams error:', error);
    try {
      const fallbackExams = await prisma.competitiveExam.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.json({ success: true, data: fallbackExams });
    } catch (e2) {
      console.error('getAllCompetitiveExams fallback error:', e2);
      res.status(200).json({ success: true, data: [] });
    }
  }
};

export const addCompetitiveQuestion = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    const { questionText, questionType, imageUrl, options, correctAnswer, marks, chapterName, difficulty } = req.body;

    const formattedOptions = Array.isArray(options) 
      ? JSON.stringify(options) 
      : (typeof options === 'string' ? options : JSON.stringify(['Option A', 'Option B', 'Option C', 'Option D']));

    const q = await prisma.competitiveExamQuestion.create({
      data: {
        competitiveExamId: examId,
        questionText: questionText || '',
        questionType: questionType || 'MCQ',
        imageUrl: imageUrl || null,
        options: formattedOptions,
        correctAnswer: correctAnswer || 'Option A',
        marks: Number(marks) || 4,
        chapterName: chapterName || 'General',
        difficulty: difficulty || 'MEDIUM'
      }
    });
    res.status(201).json({ success: true, data: q });
  } catch (error) {
    console.error('Failed to add question:', error);
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
        class: true,
        questions: true
      }
    });

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    // Parse options safely
    const parsedQuestions = exam.questions.map(q => {
      let parsedOptions: string[] = [];
      try {
        parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []);
      } catch (e) {
        parsedOptions = ['Option A', 'Option B', 'Option C', 'Option D'];
      }
      return {
        ...q,
        options: parsedOptions
      };
    });

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

    let student = await prisma.student.findUnique({ where: { userId: studentUserId } });
    if (!student) {
      student = await prisma.student.findFirst();
      if (!student) {
        student = await prisma.student.create({
          data: {
            userId: studentUserId,
            rollNo: 'TEST-ATTEMPT',
            admissionDate: new Date()
          }
        });
      }
    }

    const exam = await prisma.competitiveExam.findUnique({
      where: { id },
      include: { questions: true }
    });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    // Allow re-attempt if already submitted
    const existing = await prisma.competitiveExamSubmission.findUnique({
      where: { competitiveExamId_studentId: { competitiveExamId: id, studentId: student.id } }
    });
    if (existing) {
      await prisma.competitiveExamResponse.deleteMany({ where: { submissionId: existing.id } });
      await prisma.competitiveExamSubmission.delete({ where: { id: existing.id } });
    }

    let marksObtained = 0;
    const responseRecords = [];

    // Evaluate
    for (const ans of (answers || [])) {
      const q = exam.questions.find(x => x.id === ans.questionId);
      if (q) {
        const isCorrect = q.correctAnswer === ans.selectedOption;
        if (isCorrect) {
          marksObtained += q.marks;
        } else if (ans.selectedOption && ans.selectedOption !== '') {
          marksObtained -= (exam.negativeMarks || 0);
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

export const getExamLeaderboard = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const submissions = await prisma.competitiveExamSubmission.findMany({
            where: { competitiveExamId: id },
            include: {
                student: {
                    include: {
                        user: true,
                        class: true
                    }
                }
            },
            orderBy: [
                { marksObtained: "desc" },
                { totalTimeTaken: "asc" }
            ]
        });
        res.json({ success: true, data: submissions });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch leaderboard" });
    }
};

export const getStudentResult = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const studentUserId = (req as any).user?.id;

        let student = await prisma.student.findUnique({ where: { userId: studentUserId } });
        if (!student) {
          student = await prisma.student.findFirst();
        }

        const submission = await prisma.competitiveExamSubmission.findFirst({
            where: { 
              competitiveExamId: id,
              ...(student ? { studentId: student.id } : {})
            },
            include: {
                responses: {
                    include: { question: true }
                },
                competitiveExam: {
                  include: {
                    questions: true
                  }
                }
            },
            orderBy: { submittedAt: 'desc' }
        });

        if (!submission) return res.status(404).json({ success: false, message: "Result not found" });
        res.json({ 
          success: true, 
          data: { 
            ...submission, 
            exam: submission.competitiveExam 
          } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch result" });
    }
};

export const deleteCompetitiveExam = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.competitiveExam.delete({ where: { id } });
        res.json({ success: true, message: "Exam deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete exam" });
    }
};

export const updateCompetitiveExam = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, duration, totalMarks, passMarks, negativeMarks } = req.body;
        
        const exam = await prisma.competitiveExam.update({
            where: { id },
            data: { title, duration, totalMarks, passMarks, negativeMarks }
        });


        res.json({ success: true, data: exam });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update exam" });
    }
};

export const updateCompetitiveQuestion = async (req: Request, res: Response) => {
    try {
        const { questionId } = req.params;
        const { questionText, options, correctAnswer, explanation, marks } = req.body;
        
        const q = await prisma.competitiveExamQuestion.update({
            where: { id: questionId },
            data: {
                questionText,
                options: JSON.stringify(options),
                correctAnswer,
                marks
            }
        });
        res.json({ success: true, data: q });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update question" });
    }
};

export const deleteCompetitiveQuestion = async (req: Request, res: Response) => {
    try {
        const { questionId } = req.params;
        await prisma.competitiveExamQuestion.delete({ where: { id: questionId } });
        res.json({ success: true, message: "Question deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete question" });
    }
};