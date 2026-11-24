import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { generateQuizQuestions, parseRawExamTextToMCQs } from '../utils/gemini';

// ==========================================
// SAMPLE QUESTIONS REPOSITORY (NTA / EDURACLE PATTERNS)
// ==========================================
const SAMPLE_JEE_QUESTIONS = [
  {
    questionText: 'A particle moves along the x-axis such that its position is given by $x(t) = 3t^3 - 6t^2 + 4t$. The acceleration of the particle at the instant when its velocity is zero is:',
    options: ['12 m/s²', '6 m/s²', '0 m/s²', '18 m/s²'],
    correctAnswer: '6 m/s²',
    marks: 4,
    chapterName: 'Physics: Kinematics & Motion',
    difficulty: 'MEDIUM',
  },
  {
    questionText: 'A block of mass $m = 2\\text{ kg}$ is resting on a rough horizontal surface with coefficient of friction $\\mu = 0.4$. A horizontal force of $F = 6\\text{ N}$ is applied. The frictional force acting on the block is ($g = 10\\text{ m/s}^2$):',
    options: ['6 N', '8 N', '2 N', '0 N'],
    correctAnswer: '6 N',
    marks: 4,
    chapterName: "Physics: Newton's Laws & Friction",
    difficulty: 'EASY',
  },
  {
    questionText: 'Two point charges $+q$ and $-q$ are placed at a distance $2a$ apart. The electric potential at the midpoint of the line joining the two charges is:',
    options: ['0', '\\frac{1}{4\\pi\\varepsilon_0}\\frac{q}{a}', '\\frac{1}{4\\pi\\varepsilon_0}\\frac{2q}{a}', '\\frac{1}{4\\pi\\varepsilon_0}\\frac{q}{a^2}'],
    correctAnswer: '0',
    marks: 4,
    chapterName: 'Physics: Electrostatics & Potential',
    difficulty: 'EASY',
  },
  {
    questionText: 'The oxidation state of Chromium in Potassium Dichromate ($\\text{K}_2\\text{Cr}_2\\text{O}_7$) is:',
    options: ['+6', '+3', '+4', '+2'],
    correctAnswer: '+6',
    marks: 4,
    chapterName: 'Chemistry: Redox Reactions',
    difficulty: 'EASY',
  },
  {
    questionText: 'Which of the following molecules has a permanent non-zero dipole moment ($\mu \\neq 0$)?',
    options: ['\\text{NH}_3', '\\text{BF}_3', '\\text{CO}_2', '\\text{CCl}_4'],
    correctAnswer: '\\text{NH}_3',
    marks: 4,
    chapterName: 'Chemistry: Chemical Bonding & Molecular Structure',
    difficulty: 'MEDIUM',
  },
  {
    questionText: 'According to IUPAC nomenclature, the correct name for the compound $\\text{CH}_3-\\text{CH}(\\text{CH}_3)-\\text{CHO}$ is:',
    options: ['2-Methylpropanal', 'Isobutyraldehyde', '2-Methylpropan-1-one', 'Butanal'],
    correctAnswer: '2-Methylpropanal',
    marks: 4,
    chapterName: 'Chemistry: Organic Aldehydes & Ketones',
    difficulty: 'MEDIUM',
  },
  {
    questionText: 'The value of the definite integral $\\int_{0}^{\\pi/2} \\frac{\\sqrt{\\sin x}}{\\sqrt{\\sin x} + \\sqrt{\\cos x}} \\, dx$ is equal to:',
    options: ['\\frac{\\pi}{4}', '\\frac{\\pi}{2}', '\\pi', '0'],
    correctAnswer: '\\frac{\\pi}{4}',
    marks: 4,
    chapterName: 'Mathematics: Definite Integrals',
    difficulty: 'MEDIUM',
  },
  {
    questionText: 'If the matrix $A = \\begin{pmatrix} 2 & k \\\\ 4 & 6 \\end{pmatrix}$ is singular (non-invertible), then the value of $k$ is:',
    options: ['3', '4', '2', '0'],
    correctAnswer: '3',
    marks: 4,
    chapterName: 'Mathematics: Matrices & Determinants',
    difficulty: 'EASY',
  },
  {
    questionText: 'The length of the latus rectum of the parabola $y^2 = 16x$ is:',
    options: ['16', '4', '8', '32'],
    correctAnswer: '16',
    marks: 4,
    chapterName: 'Mathematics: Coordinate Geometry & Conics',
    difficulty: 'EASY',
  },
  {
    questionText: 'The number of terms in the algebraic expansion of $(2x + 3y)^{10}$ is equal to:',
    options: ['11', '10', '12', '9'],
    correctAnswer: '11',
    marks: 4,
    chapterName: 'Mathematics: Binomial Theorem',
    difficulty: 'EASY',
  }
];

const SAMPLE_NEET_QUESTIONS = [
  {
    questionText: 'The site of cellular respiration and ATP synthesis in aerobic eukaryotic organisms is:',
    options: ['Mitochondria', 'Chloroplast', 'Endoplasmic Reticulum', 'Golgi Apparatus'],
    correctAnswer: 'Mitochondria',
    marks: 4,
    chapterName: 'Biology: Cell Biology',
    difficulty: 'EASY',
  },
  {
    questionText: 'In DNA double helix structure, Adenine (A) always pairs with Thymine (T) through:',
    options: ['Two Hydrogen bonds', 'Three Hydrogen bonds', 'Phosphodiester bond', 'Glycosidic bond'],
    correctAnswer: 'Two Hydrogen bonds',
    marks: 4,
    chapterName: 'Biology: Molecular Basis of Inheritance',
    difficulty: 'EASY',
  },
  {
    questionText: 'The functional and structural filtration unit of the human mammalian kidney is:',
    options: ['Nephron', 'Neuron', 'Glomerulus', 'Ureter'],
    correctAnswer: 'Nephron',
    marks: 4,
    chapterName: 'Biology: Excretory Products & Elimination',
    difficulty: 'EASY',
  },
  {
    questionText: 'What is the SI unit of Magnetic Flux?',
    options: ['Weber (Wb)', 'Tesla (T)', 'Henry (H)', 'Gauss (G)'],
    correctAnswer: 'Weber (Wb)',
    marks: 4,
    chapterName: 'Physics: Magnetism & Matter',
    difficulty: 'MEDIUM',
  },
  {
    questionText: 'Which vitamin is essential for the normal process of human blood clotting?',
    options: ['Vitamin K', 'Vitamin A', 'Vitamin C', 'Vitamin D'],
    correctAnswer: 'Vitamin K',
    marks: 4,
    chapterName: 'Biology: Body Fluids & Circulation',
    difficulty: 'EASY',
  }
];

// Helper to ensure database tables exist in PostgreSQL
async function ensureTablesExist() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CompetitiveExam" (
      "id" TEXT PRIMARY KEY,
      "title" TEXT NOT NULL,
      "classId" TEXT NOT NULL,
      "subjectId" TEXT NOT NULL,
      "teacherId" TEXT,
      "duration" INTEGER NOT NULL DEFAULT 180,
      "startTime" TIMESTAMP(3) NOT NULL,
      "endTime" TIMESTAMP(3) NOT NULL,
      "totalMarks" DOUBLE PRECISION NOT NULL DEFAULT 300,
      "passMarks" DOUBLE PRECISION NOT NULL DEFAULT 100,
      "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT 1,
      "isPublished" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "CompetitiveExamQuestion" (
      "id" TEXT PRIMARY KEY,
      "competitiveExamId" TEXT NOT NULL,
      "questionText" TEXT NOT NULL,
      "questionType" TEXT NOT NULL DEFAULT 'MCQ',
      "imageUrl" TEXT,
      "options" TEXT,
      "correctAnswer" TEXT NOT NULL,
      "marks" DOUBLE PRECISION NOT NULL DEFAULT 4,
      "chapterName" TEXT,
      "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM'
    );

    CREATE TABLE IF NOT EXISTS "CompetitiveExamSubmission" (
      "id" TEXT PRIMARY KEY,
      "competitiveExamId" TEXT NOT NULL,
      "studentId" TEXT NOT NULL,
      "marksObtained" DOUBLE PRECISION NOT NULL,
      "totalTimeTaken" INTEGER NOT NULL DEFAULT 0,
      "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CompetitiveExamSubmission_competitiveExamId_studentId_key" UNIQUE ("competitiveExamId", "studentId")
    );

    CREATE TABLE IF NOT EXISTS "CompetitiveExamResponse" (
      "id" TEXT PRIMARY KEY,
      "submissionId" TEXT NOT NULL,
      "questionId" TEXT NOT NULL,
      "selectedOption" TEXT,
      "isCorrect" BOOLEAN NOT NULL,
      "timeTakenSeconds" INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT "CompetitiveExamResponse_submissionId_questionId_key" UNIQUE ("submissionId", "questionId")
    );
  `).catch(() => {});
}

// ==========================================
// ADMIN / TEACHER ROUTES
// ==========================================

export const createCompetitiveExam = async (req: Request, res: Response) => {
  try {
    await ensureTablesExist();

    const { 
      title, 
      classId, 
      subjectId, 
      teacherId, 
      duration, 
      startTime, 
      endTime, 
      totalMarks, 
      passMarks, 
      negativeMarks, 
      isPublished,
      questions,
      autoPopulateSample,
      pattern
    } = req.body;
    
    // 1. Resolve valid class safely (ensuring it exists in database)
    let validClassId = classId;
    if (validClassId) {
      const checkCls = await prisma.class.findUnique({ where: { id: validClassId } }).catch(() => null);
      if (!checkCls) validClassId = null;
    }
    if (!validClassId) {
      let cls = await prisma.class.findFirst({
        where: { name: { in: ['10th', '10', '9th', '9', '8th', '8', '5th', '5'] } },
        orderBy: { name: 'desc' }
      }).catch(() => null);

      if (!cls) {
        cls = await prisma.class.findFirst({ orderBy: { name: 'asc' } }).catch(() => null);
      }
      if (!cls) {
        cls = await prisma.class.create({
          data: { name: '10th', section: 'A', academicYear: '2026-2027', capacity: 50 }
        }).catch(async () => {
          return await prisma.class.findFirst();
        });
      }
      validClassId = cls?.id;
    }

    if (!validClassId) {
      return res.status(400).json({ success: false, message: 'No valid school class found. Please create a class first.' });
    }

    // 2. Resolve valid subject safely
    let validSubjectId = subjectId;
    if (validSubjectId) {
      const checkSub = await prisma.subject.findUnique({ where: { id: validSubjectId } }).catch(() => null);
      if (!checkSub) validSubjectId = null;
    }
    if (!validSubjectId) {
      let sub = await prisma.subject.findFirst({
        where: { classId: validClassId }
      }).catch(() => null);

      if (!sub) {
        sub = await prisma.subject.findFirst({
          where: { name: { in: ['Mathematics', 'Physics', 'Science', 'Maths'] } }
        }).catch(() => null);
      }

      if (!sub) {
        sub = await prisma.subject.findFirst().catch(() => null);
      }

      if (!sub) {
        const uniqueCode = `SUB_${Date.now().toString().slice(-6)}`;
        sub = await prisma.subject.create({
          data: { name: 'General Studies', code: uniqueCode, classId: validClassId }
        }).catch(async () => {
          return await prisma.subject.findFirst();
        });
      }
      validSubjectId = sub?.id;
    }

    if (!validSubjectId) {
      return res.status(400).json({ success: false, message: 'No valid subject found for this exam.' });
    }

    // 3. Create the Exam Record
    const exam = await prisma.competitiveExam.create({
      data: {
        title: title || 'School Online Practice Exam',
        classId: validClassId,
        subjectId: validSubjectId,
        teacherId: teacherId || null,
        duration: Number(duration) || 120, 
        startTime: startTime ? new Date(startTime) : new Date(), 
        endTime: endTime ? new Date(endTime) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 
        totalMarks: Number(totalMarks) || 100,
        passMarks: Number(passMarks) || 35,
        negativeMarks: Number(negativeMarks) || 0,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true
      }
    });

    // Populate questions if provided directly in payload
    let createdQuestionsCount = 0;
    if (Array.isArray(questions) && questions.length > 0) {
      for (const q of questions) {
        const formattedOptions = Array.isArray(q.options) 
          ? JSON.stringify(q.options) 
          : (typeof q.options === 'string' ? q.options : JSON.stringify(['A', 'B', 'C', 'D']));

        await prisma.competitiveExamQuestion.create({
          data: {
            competitiveExamId: exam.id,
            questionText: q.questionText || '',
            questionType: q.questionType || 'MCQ',
            imageUrl: q.imageUrl || null,
            options: formattedOptions,
            correctAnswer: q.correctAnswer || (Array.isArray(q.options) ? q.options[0] : 'A'),
            marks: Number(q.marks) || 4,
            chapterName: q.chapterName || 'General',
            difficulty: q.difficulty || 'MEDIUM'
          }
        }).catch(() => {});
        createdQuestionsCount++;
      }
    } else if (Boolean(autoPopulateSample)) {
      // Auto-populate sample questions ONLY if explicitly requested
      const sampleSet = (pattern === 'NEET' || (title && title.toUpperCase().includes('NEET')))
        ? SAMPLE_NEET_QUESTIONS
        : SAMPLE_JEE_QUESTIONS;

      for (const q of sampleSet) {
        await prisma.competitiveExamQuestion.create({
          data: {
            competitiveExamId: exam.id,
            questionText: q.questionText,
            questionType: 'MCQ',
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
            marks: q.marks || 4,
            chapterName: q.chapterName,
            difficulty: q.difficulty || 'MEDIUM'
          }
        }).catch(() => {});
        createdQuestionsCount++;
      }
    }

    return res.status(201).json({ 
      success: true, 
      message: 'Competitive Exam created successfully with questions',
      data: exam,
      questionsCount: createdQuestionsCount 
    });

  } catch (error: any) {
    console.error('Final createCompetitiveExam error:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to create competitive exam' });
  }
};

export const getAllCompetitiveExams = async (req: Request, res: Response) => {
  try {
    await ensureTablesExist();

    const exams = await prisma.competitiveExam.findMany({
      include: { 
        subject: true, 
        class: true, 
        _count: { select: { questions: true, submissions: true } },
        submissions: {
          select: {
            id: true,
            studentId: true,
            marksObtained: true,
            totalTimeTaken: true,
            submittedAt: true,
            student: {
              select: {
                id: true,
                rollNo: true,
                user: { select: { name: true, photoUrl: true } },
                class: { select: { name: true, section: true } }
              }
            }
          },
          orderBy: { marksObtained: 'desc' }
        },
        questions: {
          select: {
            id: true,
            questionText: true,
            questionType: true,
            imageUrl: true,
            options: true,
            correctAnswer: true,
            marks: true,
            chapterName: true,
            difficulty: true
          }
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
    return res.status(201).json({ success: true, data: q });
  } catch (error: any) {
    console.error('Failed to add question:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to add question' });
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
          marks: 4,
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

export const parseTextQuestionsAI = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    const { rawText, defaultMarks = 4, chapterName = 'General', previewOnly = true } = req.body;

    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide exam text to parse' });
    }

    const exam = await prisma.competitiveExam.findUnique({ where: { id: examId } });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Competitive exam not found' });
    }

    const parsedQuestions = await parseRawExamTextToMCQs(
      rawText, 
      Number(defaultMarks) || 4, 
      chapterName || 'General'
    );

    if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
      return res.status(422).json({ success: false, message: 'Could not extract valid questions from the provided text' });
    }

    // If previewOnly is true, return parsed questions for user review/editing in the UI
    if (previewOnly) {
      return res.status(200).json({
        success: true,
        count: parsedQuestions.length,
        questions: parsedQuestions
      });
    }

    // Otherwise, immediately insert into database
    const savedList = [];
    for (const q of parsedQuestions) {
      const formattedOptions = Array.isArray(q.options) 
        ? JSON.stringify(q.options) 
        : (typeof q.options === 'string' ? q.options : JSON.stringify(['A', 'B', 'C', 'D']));

      const saved = await prisma.competitiveExamQuestion.create({
        data: {
          competitiveExamId: examId,
          questionText: q.questionText || '',
          questionType: 'MCQ',
          options: formattedOptions,
          correctAnswer: q.correctAnswer || (Array.isArray(q.options) ? q.options[0] : 'A'),
          marks: Number(q.marks) || Number(defaultMarks) || 4,
          chapterName: q.chapterName || chapterName || 'General',
          difficulty: q.difficulty || 'MEDIUM'
        }
      });
      savedList.push(saved);
    }

    res.status(201).json({
      success: true,
      message: `Successfully parsed and saved ${savedList.length} questions`,
      count: savedList.length,
      data: savedList
    });
  } catch (error: any) {
    console.error('parseTextQuestionsAI error:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to parse text questions' });
  }
};

export const bulkAddQuestions = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'No questions provided' });
    }

    const exam = await prisma.competitiveExam.findUnique({ where: { id: examId } });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Competitive exam not found' });
    }

    const savedQuestions = [];
    for (const q of questions) {
      const formattedOptions = Array.isArray(q.options) 
        ? JSON.stringify(q.options) 
        : (typeof q.options === 'string' ? q.options : JSON.stringify(['A', 'B', 'C', 'D']));

      const saved = await prisma.competitiveExamQuestion.create({
        data: {
          competitiveExamId: examId,
          questionText: q.questionText || '',
          questionType: q.questionType || 'MCQ',
          imageUrl: q.imageUrl || null,
          options: formattedOptions,
          correctAnswer: q.correctAnswer || (Array.isArray(q.options) ? q.options[0] : 'A'),
          marks: Number(q.marks) || 4,
          chapterName: q.chapterName || 'General',
          difficulty: q.difficulty || 'MEDIUM'
        }
      });
      savedQuestions.push(saved);
    }

    res.status(201).json({
      success: true,
      message: `Successfully added ${savedQuestions.length} questions to exam`,
      count: savedQuestions.length,
      data: savedQuestions
    });
  } catch (error: any) {
    console.error('bulkAddQuestions error:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to bulk add questions' });
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
    const { answers, totalTimeTaken } = req.body;
    const studentUserId = (req as any).user?.id;

    let student = await prisma.student.findUnique({ where: { userId: studentUserId } });
    if (!student) {
      student = await prisma.student.findFirst({ where: { userId: studentUserId } });
      if (!student) {
        const defaultClass = await prisma.class.findFirst();
        student = await prisma.student.create({
          data: {
            userId: studentUserId,
            classId: defaultClass?.id || '',
            rollNo: `ATTEMPT-${Date.now().toString().slice(-4)}`,
            admissionDate: new Date()
          }
        }).catch(async () => {
          return await prisma.student.findFirst();
        });
      }
    }

    if (!student) {
      return res.status(400).json({ success: false, message: 'Could not resolve student account for exam submission' });
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
      await prisma.competitiveExamResponse.deleteMany({ where: { submissionId: existing.id } }).catch(() => {});
      await prisma.competitiveExamSubmission.delete({ where: { id: existing.id } }).catch(() => {});
    }

    let marksObtained = 0;
    const responseRecords = [];

    // Evaluate
    for (const ans of (answers || [])) {
      const q = exam.questions.find(x => x.id === ans.questionId);
      if (q) {
        const isCorrect = String(q.correctAnswer).trim() === String(ans.selectedOption).trim();
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
  } catch (error: any) {
    console.error('submitCompetitiveExam error:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to submit exam' });
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
    const { submissionId, studentId } = req.query as { submissionId?: string; studentId?: string };
    const user = (req as any).user;
    const userRole = (user?.role || '').toUpperCase();
    const isStaff = ['SUPER_ADMIN', 'ADMIN', 'TEACHER'].includes(userRole);

    let whereClause: any = { competitiveExamId: id };

    if (submissionId) {
      whereClause = { id: submissionId };
    } else if (studentId) {
      whereClause = { competitiveExamId: id, studentId };
    } else if (!isStaff) {
      // Regular student
      const student = await prisma.student.findUnique({ where: { userId: user?.id } });
      if (student) {
        whereClause = { competitiveExamId: id, studentId: student.id };
      }
    } else {
      // Staff member: first check if this staff user has their own test submission
      const staffStudent = await prisma.student.findUnique({ where: { userId: user?.id } });
      if (staffStudent) {
        const staffSub = await prisma.competitiveExamSubmission.findFirst({
          where: { competitiveExamId: id, studentId: staffStudent.id },
          orderBy: { submittedAt: 'desc' }
        });
        if (staffSub) {
          whereClause = { id: staffSub.id };
        }
      }
    }

    let submission = await prisma.competitiveExamSubmission.findFirst({
      where: whereClause,
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            class: { select: { name: true, section: true } }
          }
        },
        responses: {
          include: { question: true }
        },
        competitiveExam: {
          include: {
            questions: true,
            subject: true,
            class: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    // Fallback: If not found and user is staff, show the most recent submission on this exam
    if (!submission && isStaff) {
      submission = await prisma.competitiveExamSubmission.findFirst({
        where: { competitiveExamId: id },
        include: {
          student: {
            include: {
              user: { select: { name: true, email: true } },
              class: { select: { name: true, section: true } }
            }
          },
          responses: {
            include: { question: true }
          },
          competitiveExam: {
            include: {
              questions: true,
              subject: true,
              class: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' }
      });
    }

    if (!submission) {
      const exam = await prisma.competitiveExam.findUnique({
        where: { id },
        include: { subject: true, class: true }
      });
      return res.status(404).json({ 
        success: false, 
        message: "Result not found. Did you submit the exam?",
        exam: exam || null
      });
    }

    res.json({ 
      success: true, 
      data: { 
        ...submission, 
        exam: submission.competitiveExam 
      } 
    });
  } catch (error: any) {
    console.error('getStudentResult error:', error);
    res.status(500).json({ success: false, message: error?.message || "Failed to fetch result" });
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
    const { questionText, options, correctAnswer, marks } = req.body;
    
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

export const clearDummyExams = async (req: Request, res: Response) => {
  try {
    // Find all mock/sample/dummy exams by keyword
    const dummyExams = await prisma.competitiveExam.findMany({
      where: {
        OR: [
          { title: { contains: 'Mock', mode: 'insensitive' } },
          { title: { contains: 'Speed Practice', mode: 'insensitive' } },
          { title: { contains: 'Sample', mode: 'insensitive' } },
          { title: { contains: 'Dummy', mode: 'insensitive' } },
          { title: { contains: 'Test #', mode: 'insensitive' } },
          { title: { contains: 'Grand Mock', mode: 'insensitive' } },
          { title: { contains: 'All India', mode: 'insensitive' } },
        ]
      },
      select: { id: true }
    });

    const dummyIds = dummyExams.map(e => e.id);

    if (dummyIds.length > 0) {
      for (const id of dummyIds) {
        await prisma.competitiveExamResponse.deleteMany({
          where: { submission: { competitiveExamId: id } }
        }).catch(() => {});
        await prisma.competitiveExamSubmission.deleteMany({
          where: { competitiveExamId: id }
        }).catch(() => {});
        await prisma.competitiveExamQuestion.deleteMany({
          where: { competitiveExamId: id }
        }).catch(() => {});
        await prisma.competitiveExam.delete({
          where: { id }
        }).catch(() => {});
      }
    }

    return res.json({
      success: true,
      message: `Cleared ${dummyIds.length} dummy/mock exam records. Database is now 100% clean.`,
      deletedCount: dummyIds.length
    });
  } catch (error: any) {
    console.error('clearDummyExams error:', error);
    return res.status(500).json({ success: false, message: error?.message || 'Failed to clear dummy exams' });
  }
};

export const populateSampleQuestions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const exam = await prisma.competitiveExam.findUnique({ where: { id } });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const isNeet = exam.title && (exam.title.toUpperCase().includes('NEET') || exam.title.toUpperCase().includes('BIO'));
    const sampleSet = isNeet ? SAMPLE_NEET_QUESTIONS : SAMPLE_JEE_QUESTIONS;

    const created = [];
    for (const q of sampleSet) {
      const saved = await prisma.competitiveExamQuestion.create({
        data: {
          competitiveExamId: id,
          questionText: q.questionText,
          questionType: 'MCQ',
          options: JSON.stringify(q.options),
          correctAnswer: q.correctAnswer,
          marks: q.marks || 4,
          chapterName: q.chapterName,
          difficulty: q.difficulty || 'MEDIUM'
        }
      });
      created.push(saved);
    }

    res.json({
      success: true,
      message: `Successfully populated ${created.length} sample NTA questions!`,
      data: created
    });
  } catch (error: any) {
    console.error('populateSampleQuestions error:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to populate sample questions' });
  }
};
