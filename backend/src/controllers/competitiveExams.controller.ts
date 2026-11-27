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

// Helper to ensure database tables & extended exam columns exist in PostgreSQL
let tablesEnsured = false;
async function ensureTablesExist() {
  if (tablesEnsured) return;
  const statements = [
    `CREATE TABLE IF NOT EXISTS "CompetitiveExam" (
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
    )`,
    `ALTER TABLE "CompetitiveExam" ADD COLUMN IF NOT EXISTS "pattern" TEXT DEFAULT 'CUSTOM'`,
    `ALTER TABLE "CompetitiveExam" ADD COLUMN IF NOT EXISTS "sectionsJson" TEXT`,
    `ALTER TABLE "CompetitiveExam" ADD COLUMN IF NOT EXISTS "marksPerQuestion" DOUBLE PRECISION DEFAULT 4`,
    `ALTER TABLE "CompetitiveExam" ADD COLUMN IF NOT EXISTS "targetClassNames" TEXT`,
    `ALTER TABLE "CompetitiveExam" ADD COLUMN IF NOT EXISTS "allowRetake" BOOLEAN DEFAULT true`,
    `ALTER TABLE "CompetitiveExam" ADD COLUMN IF NOT EXISTS "shuffleQuestions" BOOLEAN DEFAULT false`,
    `ALTER TABLE "CompetitiveExam" ADD COLUMN IF NOT EXISTS "showResultImmediately" BOOLEAN DEFAULT true`,
    `CREATE TABLE IF NOT EXISTS "CompetitiveExamQuestion" (
      "id" TEXT PRIMARY KEY,
      "competitiveExamId" TEXT NOT NULL,
      "masterQuestionId" TEXT,
      "questionText" TEXT NOT NULL,
      "questionType" TEXT NOT NULL DEFAULT 'MCQ',
      "imageUrl" TEXT,
      "options" TEXT,
      "correctAnswer" TEXT NOT NULL,
      "marks" DOUBLE PRECISION NOT NULL DEFAULT 4,
      "chapterName" TEXT,
      "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
      "explanation" TEXT
    )`,
    `ALTER TABLE "CompetitiveExamQuestion" ADD COLUMN IF NOT EXISTS "masterQuestionId" TEXT`,
    `ALTER TABLE "CompetitiveExamQuestion" ADD COLUMN IF NOT EXISTS "explanation" TEXT`,
    `CREATE TABLE IF NOT EXISTS "CompetitiveExamSubmission" (
      "id" TEXT PRIMARY KEY,
      "competitiveExamId" TEXT NOT NULL,
      "studentId" TEXT NOT NULL,
      "marksObtained" DOUBLE PRECISION NOT NULL,
      "totalTimeTaken" INTEGER NOT NULL DEFAULT 0,
      "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CompetitiveExamSubmission_competitiveExamId_studentId_key" UNIQUE ("competitiveExamId", "studentId")
    )`,
    `CREATE TABLE IF NOT EXISTS "CompetitiveExamResponse" (
      "id" TEXT PRIMARY KEY,
      "submissionId" TEXT NOT NULL,
      "questionId" TEXT NOT NULL,
      "selectedOption" TEXT,
      "isCorrect" BOOLEAN NOT NULL,
      "timeTakenSeconds" INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT "CompetitiveExamResponse_submissionId_questionId_key" UNIQUE ("submissionId", "questionId")
    )`,
    `CREATE TABLE IF NOT EXISTS "CompetitiveExamSession" (
      "id" TEXT PRIMARY KEY,
      "competitiveExamId" TEXT NOT NULL,
      "studentId" TEXT NOT NULL,
      "answersJson" TEXT,
      "remainingSeconds" INTEGER,
      "warnings" INTEGER NOT NULL DEFAULT 0,
      "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "lastHeartbeat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CompetitiveExamSession_exam_student_key" UNIQUE ("competitiveExamId", "studentId")
    )`,
  ];
  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt).catch(() => {});
  }
  tablesEnsured = true;
}

// Helper: Match student's chosen answer against both exact text and letter keys (A/B/C/D)
function isAnswerMatch(correctRaw: string, chosenRaw: string | null, rawOptions: any): boolean {
  if (!chosenRaw) return false;
  const chosen = String(chosenRaw).trim();
  const correct = String(correctRaw || '').trim();
  if (!chosen || !correct) return false;
  if (chosen === correct || chosen.toLowerCase() === correct.toLowerCase()) return true;

  let opts: string[] = [];
  if (Array.isArray(rawOptions)) {
    opts = rawOptions.map((o) => String(o ?? '').trim());
  } else if (typeof rawOptions === 'string') {
    try {
      const parsed = JSON.parse(rawOptions);
      if (Array.isArray(parsed)) opts = parsed.map((o) => String(o ?? '').trim());
    } catch {
      opts = [];
    }
  }

  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const correctUpper = correct.toUpperCase();
  const chosenUpper = chosen.toUpperCase();

  // Case 1: Correct key is a letter (e.g., "B") and chosen is the option text
  const letterIdx = letters.indexOf(correctUpper);
  if (letterIdx >= 0 && opts[letterIdx]) {
    if (opts[letterIdx] === chosen || opts[letterIdx].toLowerCase() === chosen.toLowerCase()) {
      return true;
    }
  }

  // Case 2: Chosen is a letter (e.g., "B") and correct key is full text
  const chosenIdx = letters.indexOf(chosenUpper);
  if (chosenIdx >= 0 && opts[chosenIdx]) {
    if (opts[chosenIdx] === correct || opts[chosenIdx].toLowerCase() === correct.toLowerCase()) {
      return true;
    }
  }

  return false;
}

// Helper: Load extended exam metadata columns safely via raw SQL
async function getExamMetaMap(examIds?: string[]): Promise<Record<string, any>> {
  const map: Record<string, any> = {};
  try {
    const rows: any[] = examIds && examIds.length === 1
      ? await prisma.$queryRawUnsafe(
          `SELECT "id", "pattern", "sectionsJson", "marksPerQuestion", "targetClassNames", "allowRetake", "shuffleQuestions", "showResultImmediately" FROM "CompetitiveExam" WHERE "id" = $1`,
          examIds[0]
        )
      : await prisma.$queryRawUnsafe(
          `SELECT "id", "pattern", "sectionsJson", "marksPerQuestion", "targetClassNames", "allowRetake", "shuffleQuestions", "showResultImmediately" FROM "CompetitiveExam"`
        );
    for (const r of rows || []) {
      let sections: any[] = [];
      try {
        if (r.sectionsJson) sections = JSON.parse(r.sectionsJson);
      } catch {}
      let targetClassNames: string[] = [];
      try {
        if (r.targetClassNames) targetClassNames = JSON.parse(r.targetClassNames);
      } catch {}
      map[r.id] = {
        pattern: r.pattern || 'CUSTOM',
        sections,
        marksPerQuestion: Number(r.marksPerQuestion) || 4,
        targetClassNames,
        allowRetake: r.allowRetake !== false,
        shuffleQuestions: Boolean(r.shuffleQuestions),
        showResultImmediately: r.showResultImmediately !== false,
      };
    }
  } catch {}
  return map;
}

// Helper: Load question explanations safely via raw SQL
async function getQuestionExplanationMap(examId: string): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  try {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT "id", "explanation" FROM "CompetitiveExamQuestion" WHERE "competitiveExamId" = $1 AND "explanation" IS NOT NULL`,
      examId
    );
    for (const r of rows || []) {
      if (r.explanation) map[r.id] = r.explanation;
    }
  } catch {}
  return map;
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
      pattern,
      sections,
      marksPerQuestion,
      targetClassNames,
      allowRetake,
      shuffleQuestions,
      showResultImmediately
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

    // Save extended metadata columns safely
    const selectedClassObj = await prisma.class.findUnique({ where: { id: validClassId }, select: { name: true } }).catch(() => null);
    const resolvedTargetClasses = Array.isArray(targetClassNames) && targetClassNames.length > 0
      ? targetClassNames
      : (selectedClassObj?.name ? [selectedClassObj.name] : []);
    await prisma.$executeRawUnsafe(
      `UPDATE "CompetitiveExam" SET "pattern" = $1, "sectionsJson" = $2, "marksPerQuestion" = $3, "targetClassNames" = $4, "allowRetake" = $5, "shuffleQuestions" = $6, "showResultImmediately" = $7 WHERE "id" = $8`,
      String(pattern || 'CUSTOM'),
      Array.isArray(sections) ? JSON.stringify(sections) : null,
      Number(marksPerQuestion) || 4,
      JSON.stringify(resolvedTargetClasses),
      allowRetake !== undefined ? Boolean(allowRetake) : true,
      Boolean(shuffleQuestions),
      showResultImmediately !== undefined ? Boolean(showResultImmediately) : true,
      exam.id
    ).catch(() => {});

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

    const metaMap = await getExamMetaMap([exam.id]);

    return res.status(201).json({ 
      success: true, 
      message: 'Competitive Exam created successfully with questions',
      data: { ...exam, ...(metaMap[exam.id] || {}) },
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

    const metaMap = await getExamMetaMap();
    const enriched = exams.map((ex: any) => ({
      ...ex,
      ...(metaMap[ex.id] || {}),
    }));

    res.json({ success: true, data: enriched });
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
    const metaMap = await getExamMetaMap();
    const enriched = exams.map((ex: any) => ({
      ...ex,
      ...(metaMap[ex.id] || {}),
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch competitive exams' });
  }
};

// Helper: Dual-Save every added question into MasterQuestion so it is NEVER lost
async function saveToMasterBankIfNew(qData: {
  questionText: string;
  questionType?: string;
  imageUrl?: string | null;
  options: string;
  correctAnswer: string;
  marks?: number;
  chapterName?: string;
  difficulty?: string;
}): Promise<string | null> {
  try {
    const cleanText = String(qData.questionText || '').trim();
    if (!cleanText) return null;

    const existing = await prisma.masterQuestion.findFirst({
      where: { questionText: cleanText },
      select: { id: true },
    });
    if (existing) return existing.id;

    const chap = qData.chapterName || 'General';
    const subName = chap.includes(':') ? chap.split(':')[0].trim() : chap;

    let sub = await prisma.subject.findFirst({
      where: { name: { contains: subName, mode: 'insensitive' } },
      select: { id: true },
    }).catch(() => null);
    if (!sub) {
      sub = await prisma.subject.findFirst({ select: { id: true } });
    }
    if (!sub) return null;

    const created = await prisma.masterQuestion.create({
      data: {
        category: 'GENERAL',
        subjectId: sub.id,
        subjectName: subName,
        chapterName: chap,
        questionText: cleanText,
        questionType: qData.questionType || 'MCQ',
        imageUrl: qData.imageUrl || null,
        options: qData.options,
        correctAnswer: qData.correctAnswer || 'Option A',
        marks: Number(qData.marks) || 4,
        negativeMarks: 1,
        difficulty: qData.difficulty || 'MEDIUM',
      },
      select: { id: true },
    });
    return created.id;
  } catch (err) {
    console.warn('saveToMasterBankIfNew warning:', err);
    return null;
  }
}

export const addCompetitiveQuestion = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    const { questionText, questionType, imageUrl, options, correctAnswer, marks, chapterName, difficulty } = req.body;

    const formattedOptions = Array.isArray(options) 
      ? JSON.stringify(options) 
      : (typeof options === 'string' ? options : JSON.stringify(['Option A', 'Option B', 'Option C', 'Option D']));

    const masterQuestionId = await saveToMasterBankIfNew({
      questionText: questionText || '',
      questionType: questionType || 'MCQ',
      imageUrl: imageUrl || null,
      options: formattedOptions,
      correctAnswer: correctAnswer || 'Option A',
      marks: Number(marks) || 4,
      chapterName: chapterName || 'General',
      difficulty: difficulty || 'MEDIUM',
    });

    const q = await prisma.competitiveExamQuestion.create({
      data: {
        competitiveExamId: examId,
        masterQuestionId,
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

      const masterQuestionId = await saveToMasterBankIfNew({
        questionText: q.questionText || '',
        questionType: q.questionType || 'MCQ',
        imageUrl: q.imageUrl || null,
        options: formattedOptions,
        correctAnswer: q.correctAnswer || (Array.isArray(q.options) ? q.options[0] : 'A'),
        marks: Number(q.marks) || 4,
        chapterName: q.chapterName || 'General',
        difficulty: q.difficulty || 'MEDIUM',
      });

      const saved = await prisma.competitiveExamQuestion.create({
        data: {
          competitiveExamId: examId,
          masterQuestionId,
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

export const importFromMasterBank = async (req: Request, res: Response) => {
  try {
    await ensureTablesExist();
    const { examId } = req.params;
    const { masterQuestionIds, sectionName } = req.body;

    if (!Array.isArray(masterQuestionIds) || masterQuestionIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one question to import' });
    }

    const exam = await prisma.competitiveExam.findUnique({ where: { id: examId } });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Competitive exam not found' });
    }

    const metaMap = await getExamMetaMap([examId]);
    const examMarksPerQ = metaMap[examId]?.marksPerQuestion;

    // Avoid duplicating questions already present in this exam
    const existingRows = await prisma.competitiveExamQuestion.findMany({
      where: { competitiveExamId: examId, masterQuestionId: { in: masterQuestionIds } },
      select: { masterQuestionId: true },
    });
    const existingSet = new Set(existingRows.map((x) => x.masterQuestionId).filter(Boolean));

    const masterQuestions = await prisma.masterQuestion.findMany({
      where: { id: { in: masterQuestionIds } },
    });

    const imported = [];
    for (const mq of masterQuestions) {
      if (existingSet.has(mq.id)) continue;
      const chap = sectionName
        ? `${sectionName}: ${mq.topicName || mq.chapterName || 'General'}`
        : (mq.chapterName || mq.subjectName || 'General');

      const created = await prisma.competitiveExamQuestion.create({
        data: {
          competitiveExamId: examId,
          masterQuestionId: mq.id,
          questionText: mq.questionText,
          questionType: mq.questionType || 'MCQ',
          imageUrl: mq.imageUrl || null,
          options: mq.options,
          correctAnswer: mq.correctAnswer,
          marks: examMarksPerQ || mq.marks || 4,
          chapterName: chap,
          difficulty: mq.difficulty || 'MEDIUM',
        },
      });
      if (mq.explanation) {
        await prisma.$executeRawUnsafe(
          `UPDATE "CompetitiveExamQuestion" SET "explanation" = $1 WHERE "id" = $2`,
          mq.explanation,
          created.id
        ).catch(() => {});
      }
      imported.push(created);
    }

    res.status(201).json({
      success: true,
      count: imported.length,
      skippedDuplicates: masterQuestions.length - imported.length,
      message: imported.length > 0
        ? `Added ${imported.length} questions to exam${masterQuestions.length - imported.length > 0 ? ` (${masterQuestions.length - imported.length} already existed)` : ''}`
        : 'All selected questions are already in this exam',
      data: imported,
    });
  } catch (error: any) {
    console.error('importFromMasterBank error:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to import questions' });
  }
};

// ==========================================
// STUDENT ROUTES
// ==========================================

export const getStudentCompetitiveExams = async (req: Request, res: Response) => {
  try {
    await ensureTablesExist();
    const userId = (req as any).user?.id;
    const student = await prisma.student.findUnique({
      where: { userId },
      include: { class: true },
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const allPublished = await prisma.competitiveExam.findMany({
      where: { isPublished: true },
      include: {
        subject: true,
        class: true,
        _count: { select: { questions: true } },
        submissions: { where: { studentId: student.id } },
      },
      orderBy: { startTime: 'desc' },
    });

    const metaMap = await getExamMetaMap();
    const activeSessions = await prisma.$queryRawUnsafe<any[]>(
      `SELECT "competitiveExamId", "remainingSeconds", "status" FROM "CompetitiveExamSession" WHERE "studentId" = $1 AND "status" = 'ACTIVE'`,
      student.id
    ).catch((): any[] => []);
    const sessionSet = new Set((activeSessions || []).map((s: any) => s.competitiveExamId));

    const studentClassName = (student.class?.name || '').trim().toLowerCase();

    const matchingExams = allPublished.filter((e: any) => {
      if (e.classId === student.classId) return true;
      const examClassName = (e.class?.name || '').trim().toLowerCase();
      if (studentClassName && examClassName && studentClassName === examClassName) return true;
      const targets: string[] = metaMap[e.id]?.targetClassNames || [];
      return targets.some((t) => String(t).trim().toLowerCase() === studentClassName);
    });

    const mapped = matchingExams.map((e: any) => ({
      ...e,
      ...(metaMap[e.id] || {}),
      questionsCount: e._count?.questions || 0,
      hasActiveSession: sessionSet.has(e.id),
      submission: e.submissions.length > 0 ? e.submissions[0] : null,
      submissions: undefined,
    }));

    res.json({ success: true, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch student exams' });
  }
};

export const getCompetitiveExamDetails = async (req: Request, res: Response) => {
  try {
    await ensureTablesExist();
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

    const [metaMap, explanationMap] = await Promise.all([
      getExamMetaMap([id]),
      getQuestionExplanationMap(id),
    ]);

    const parsedQuestions = exam.questions.map(q => {
      let parsedOptions: string[] = [];
      try {
        parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []);
      } catch (e) {
        parsedOptions = ['Option A', 'Option B', 'Option C', 'Option D'];
      }
      return {
        ...q,
        options: parsedOptions,
        explanation: explanationMap[q.id] || null,
      };
    });

    res.json({
      success: true,
      data: { ...exam, ...(metaMap[id] || {}), questions: parsedQuestions }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch exam details' });
  }
};

// SECURE STUDENT CBT PAPER ENDPOINT (Never leaks correctAnswer or explanation!)
export const getStudentExamPaper = async (req: Request, res: Response) => {
  try {
    await ensureTablesExist();
    const { id } = req.params;
    const user = (req as any).user;
    const userRole = (user?.role || '').toUpperCase();
    const isStaff = ['SUPER_ADMIN', 'ADMIN', 'TEACHER'].includes(userRole);

    const exam = await prisma.competitiveExam.findUnique({
      where: { id },
      include: { subject: true, class: true, questions: true },
    });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const metaMap = await getExamMetaMap([id]);
    const meta = metaMap[id] || {};

    let savedSession: any = null;
    if (!isStaff) {
      if (!exam.isPublished) {
        return res.status(403).json({ success: false, message: 'This exam is currently in draft mode and not open for students.' });
      }
      const student = await prisma.student.findUnique({ where: { userId: user?.id } });
      if (student) {
        const existingSub = await prisma.competitiveExamSubmission.findUnique({
          where: { competitiveExamId_studentId: { competitiveExamId: id, studentId: student.id } },
        });
        if (existingSub && meta.allowRetake === false) {
          return res.json({
            success: true,
            alreadySubmitted: true,
            submissionId: existingSub.id,
            data: null,
          });
        }

        const sessRows = await prisma.$queryRawUnsafe<any[]>(
          `SELECT * FROM "CompetitiveExamSession" WHERE "competitiveExamId" = $1 AND "studentId" = $2 LIMIT 1`,
          id,
          student.id
        ).catch((): any[] => []);
        if (sessRows && sessRows.length > 0 && sessRows[0].status === 'ACTIVE') {
          let parsedAns = {};
          try {
            if (sessRows[0].answersJson) parsedAns = JSON.parse(sessRows[0].answersJson);
          } catch {}
          savedSession = {
            answers: parsedAns,
            remainingSeconds: Number(sessRows[0].remainingSeconds) || (exam.duration * 60),
            warnings: Number(sessRows[0].warnings) || 0,
            currentQuestionIndex: Number(sessRows[0].currentQuestionIndex) || 0,
          };
        }
      }
    }

    let safeQuestions = exam.questions.map((q) => {
      let parsedOptions: string[] = [];
      try {
        parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []);
      } catch {
        parsedOptions = ['Option A', 'Option B', 'Option C', 'Option D'];
      }
      return {
        id: q.id,
        competitiveExamId: q.competitiveExamId,
        questionText: q.questionText,
        questionType: q.questionType,
        imageUrl: q.imageUrl,
        options: parsedOptions,
        marks: q.marks,
        chapterName: q.chapterName,
        difficulty: q.difficulty,
        // IMPORTANT SECURITY: Strip correctAnswer & explanation from student CBT endpoint!
      };
    });

    if (!isStaff && meta.shuffleQuestions && safeQuestions.length > 1) {
      safeQuestions = [...safeQuestions].sort(() => Math.random() - 0.5);
    }

    res.json({
      success: true,
      data: {
        ...exam,
        ...meta,
        questions: safeQuestions,
        savedSession,
      },
    });
  } catch (error) {
    console.error('getStudentExamPaper error:', error);
    res.status(500).json({ success: false, message: 'Failed to load exam paper' });
  }
};

// REAL-TIME STUDENT EXAM HEARTBEAT & AUTO-SAVE
export const saveExamHeartbeat = async (req: Request, res: Response) => {
  try {
    await ensureTablesExist();
    const { id } = req.params;
    const { answers, remainingSeconds, warnings, currentQuestionIndex } = req.body;
    const user = (req as any).user;
    const userRole = (user?.role || '').toUpperCase();
    if (['SUPER_ADMIN', 'ADMIN', 'TEACHER'].includes(userRole)) {
      return res.json({ success: true, status: 'PREVIEW' });
    }

    const student = await prisma.student.findUnique({ where: { userId: user?.id } });
    if (!student) return res.json({ success: true, status: 'OK' });

    const existing = await prisma.$queryRawUnsafe<any[]>(
      `SELECT "status" FROM "CompetitiveExamSession" WHERE "competitiveExamId" = $1 AND "studentId" = $2 LIMIT 1`,
      id,
      student.id
    ).catch((): any[] => []);

    if (existing && existing.length > 0 && existing[0].status === 'FORCE_SUBMITTED') {
      return res.json({ success: true, status: 'FORCE_SUBMITTED' });
    }

    const sessionId = `${id}_${student.id}`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO "CompetitiveExamSession" ("id", "competitiveExamId", "studentId", "answersJson", "remainingSeconds", "warnings", "currentQuestionIndex", "status", "startedAt", "lastHeartbeat")
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT ("competitiveExamId", "studentId")
       DO UPDATE SET "answersJson" = $4, "remainingSeconds" = $5, "warnings" = $6, "currentQuestionIndex" = $7, "status" = 'ACTIVE', "lastHeartbeat" = CURRENT_TIMESTAMP`,
      sessionId,
      id,
      student.id,
      JSON.stringify(answers || {}),
      Math.max(0, Number(remainingSeconds) || 0),
      Math.max(0, Number(warnings) || 0),
      Math.max(0, Number(currentQuestionIndex) || 0)
    );

    res.json({ success: true, status: 'ACTIVE' });
  } catch (error) {
    res.status(200).json({ success: true, status: 'OK' });
  }
};

// REAL-TIME ADMIN LIVE EXAM MONITOR (100% Real DB Sessions + Submissions)
export const getExamLiveMonitor = async (req: Request, res: Response) => {
  try {
    await ensureTablesExist();
    const { id } = req.params;
    const exam = await prisma.competitiveExam.findUnique({
      where: { id },
      include: {
        class: true,
        subject: true,
        _count: { select: { questions: true, submissions: true } },
      },
    });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const metaMap = await getExamMetaMap([id]);
    const meta = metaMap[id] || {};
    const targetClassNames: string[] = meta.targetClassNames?.length
      ? meta.targetClassNames
      : (exam.class?.name ? [exam.class.name] : []);

    // Total eligible students in matching class/sections
    const eligibleStudents = await prisma.student.findMany({
      where: targetClassNames.length > 0
        ? { class: { name: { in: targetClassNames } } }
        : { classId: exam.classId },
      include: {
        user: { select: { name: true, photoUrl: true } },
        class: { select: { name: true, section: true } },
      },
      orderBy: { rollNo: 'asc' },
    });

    const submissions = await prisma.competitiveExamSubmission.findMany({
      where: { competitiveExamId: id },
      select: { id: true, studentId: true, marksObtained: true, totalTimeTaken: true, submittedAt: true },
    });
    const subMap = new Map(submissions.map((s) => [s.studentId, s]));

    const sessions = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "CompetitiveExamSession" WHERE "competitiveExamId" = $1`,
      id
    ).catch((): any[] => []);
    const sessMap = new Map((sessions || []).map((s: any) => [s.studentId, s]));

    const totalQuestions = exam._count?.questions || 0;
    const rows = eligibleStudents.map((st) => {
      const sub = subMap.get(st.id);
      const sess = sessMap.get(st.id);
      let answeredCount = 0;
      if (sess?.answersJson) {
        try {
          const parsed = JSON.parse(sess.answersJson);
          answeredCount = Object.values(parsed || {}).filter((v: any) => v && String(v.option || '').trim() !== '').length;
        } catch {}
      }

      if (sub) {
        return {
          studentId: st.id,
          submissionId: sub.id,
          name: st.user?.name || 'Student',
          rollNo: st.rollNo || '-',
          className: st.class ? `${st.class.name}${st.class.section ? ` - ${st.class.section}` : ''}` : '-',
          status: 'Submitted',
          progress: 100,
          warnings: Number(sess?.warnings || 0),
          marksObtained: sub.marksObtained,
          lastActivity: sub.submittedAt,
        };
      }

      if (sess && sess.status === 'ACTIVE') {
        const progress = totalQuestions > 0 ? Math.min(100, Math.round((answeredCount / totalQuestions) * 100)) : 0;
        return {
          studentId: st.id,
          name: st.user?.name || 'Student',
          rollNo: st.rollNo || '-',
          className: st.class ? `${st.class.name}${st.class.section ? ` - ${st.class.section}` : ''}` : '-',
          status: 'Active',
          progress,
          answeredCount,
          warnings: Number(sess.warnings || 0),
          remainingSeconds: Number(sess.remainingSeconds || 0),
          lastActivity: sess.lastHeartbeat,
        };
      }

      return {
        studentId: st.id,
        name: st.user?.name || 'Student',
        rollNo: st.rollNo || '-',
        className: st.class ? `${st.class.name}${st.class.section ? ` - ${st.class.section}` : ''}` : '-',
        status: 'Not Started',
        progress: 0,
        warnings: 0,
        lastActivity: null,
      };
    });

    const submittedCount = rows.filter((r) => r.status === 'Submitted').length;
    const activeCount = rows.filter((r) => r.status === 'Active').length;
    const notStartedCount = rows.filter((r) => r.status === 'Not Started').length;

    res.json({
      success: true,
      data: {
        exam: { ...exam, ...meta },
        counts: {
          totalStudents: eligibleStudents.length,
          started: activeCount + submittedCount,
          currentlyWriting: activeCount,
          submitted: submittedCount,
          notStarted: notStartedCount,
        },
        students: rows,
      },
    });
  } catch (error: any) {
    console.error('getExamLiveMonitor error:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to load live monitor' });
  }
};

// FORCE SUBMIT AN ACTIVE STUDENT SESSION BY ADMIN/TEACHER
export const forceSubmitSession = async (req: Request, res: Response) => {
  try {
    await ensureTablesExist();
    const { id, studentId } = req.params;
    await prisma.$executeRawUnsafe(
      `UPDATE "CompetitiveExamSession" SET "status" = 'FORCE_SUBMITTED' WHERE "competitiveExamId" = $1 AND "studentId" = $2`,
      id,
      studentId
    );
    res.json({ success: true, message: 'Force-submit signal sent to student exam session.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to force submit session' });
  }
};

export const submitCompetitiveExam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // examId
    const { answers, totalTimeTaken } = req.body;
    const studentUserId = (req as any).user?.id;

    const exam = await prisma.competitiveExam.findUnique({
      where: { id },
      include: { questions: true }
    });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    let student = await prisma.student.findUnique({ where: { userId: studentUserId } });
    if (!student) {
      student = await prisma.student.findFirst({ where: { userId: studentUserId } });
    }
    if (!student) {
      student = (await prisma.student.findFirst({ where: { classId: exam.classId } })) || (await prisma.student.findFirst());
    }
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

    if (!student) {
      return res.status(400).json({ success: false, message: 'Could not resolve student account for exam submission' });
    }

    await ensureTablesExist();
    const metaMap = await getExamMetaMap([id]);
    const examMeta = metaMap[id] || {};
    const userRole = ((req as any).user?.role || '').toUpperCase();
    const isStaff = ['SUPER_ADMIN', 'ADMIN', 'TEACHER'].includes(userRole);

    // Check existing submission & retake permission
    const existing = await prisma.competitiveExamSubmission.findUnique({
      where: { competitiveExamId_studentId: { competitiveExamId: id, studentId: student.id } }
    });
    if (existing) {
      if (!isStaff && examMeta.allowRetake === false) {
        return res.status(403).json({
          success: false,
          message: 'Retakes are disabled for this examination. Your previous submission is final.',
          submissionId: existing.id,
        });
      }
      await prisma.competitiveExamResponse.deleteMany({ where: { submissionId: existing.id } }).catch(() => {});
      await prisma.competitiveExamSubmission.delete({ where: { id: existing.id } }).catch(() => {});
    }

    let marksObtained = 0;
    const responseRecords = [];
    const ansMap = new Map<string, any>((answers || []).map((a: any) => [a.questionId, a]));

    // Evaluate EVERY question in the exam (including unattempted ones so scorecard shows full breakdown)
    for (const q of exam.questions) {
      const ans = ansMap.get(q.id);
      const rawOpt = ans?.selectedOption !== undefined && ans?.selectedOption !== null ? String(ans.selectedOption).trim() : '';
      const chosenOption = rawOpt !== '' ? rawOpt : null;
      const isCorrect = isAnswerMatch(q.correctAnswer, chosenOption, q.options);

      if (isCorrect) {
        marksObtained += Number(q.marks || examMeta.marksPerQuestion || 4);
      } else if (chosenOption !== null) {
        marksObtained -= Number(exam.negativeMarks || 0);
      }

      responseRecords.push({
        questionId: q.id,
        selectedOption: chosenOption,
        isCorrect,
        timeTakenSeconds: Math.max(0, Number(ans?.timeTakenSeconds) || 0)
      });
    }

    const submission = await prisma.competitiveExamSubmission.create({
      data: {
        competitiveExamId: id,
        studentId: student.id,
        marksObtained,
        totalTimeTaken: Math.max(0, Number(totalTimeTaken) || 0),
        responses: {
          create: responseRecords
        }
      },
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
      }
    });

    // Mark active exam session as SUBMITTED
    await prisma.$executeRawUnsafe(
      `UPDATE "CompetitiveExamSession" SET "status" = 'SUBMITTED', "lastHeartbeat" = CURRENT_TIMESTAMP WHERE "competitiveExamId" = $1 AND "studentId" = $2`,
      id,
      student.id
    ).catch(() => {});

    res.json({ success: true, data: submission, submissionId: submission.id });
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

    let submission: any = null;

    if (submissionId) {
      submission = await prisma.competitiveExamSubmission.findUnique({
        where: { id: submissionId },
        include: {
          student: {
            include: {
              user: { select: { name: true, email: true } },
              class: { select: { name: true, section: true } }
            }
          },
          responses: { include: { question: true } },
          competitiveExam: { include: { questions: true, subject: true, class: true } }
        }
      });
    }

    if (!submission && studentId) {
      submission = await prisma.competitiveExamSubmission.findFirst({
        where: { competitiveExamId: id, studentId },
        orderBy: { submittedAt: 'desc' },
        include: {
          student: {
            include: {
              user: { select: { name: true, email: true } },
              class: { select: { name: true, section: true } }
            }
          },
          responses: { include: { question: true } },
          competitiveExam: { include: { questions: true, subject: true, class: true } }
        }
      });
    }

    if (!submission && !isStaff) {
      const student = await prisma.student.findUnique({ where: { userId: user?.id } });
      if (student) {
        submission = await prisma.competitiveExamSubmission.findFirst({
          where: { competitiveExamId: id, studentId: student.id },
          orderBy: { submittedAt: 'desc' },
          include: {
            student: {
              include: {
                user: { select: { name: true, email: true } },
                class: { select: { name: true, section: true } }
              }
            },
            responses: { include: { question: true } },
            competitiveExam: { include: { questions: true, subject: true, class: true } }
          }
        });
      }
    }

    // For staff preview or fallback: find any recent submission for this exam
    if (!submission && isStaff) {
      submission = await prisma.competitiveExamSubmission.findFirst({
        where: { competitiveExamId: id },
        orderBy: { submittedAt: 'desc' },
        include: {
          student: {
            include: {
              user: { select: { name: true, email: true } },
              class: { select: { name: true, section: true } }
            }
          },
          responses: { include: { question: true } },
          competitiveExam: { include: { questions: true, subject: true, class: true } }
        }
      });
    }

    // Return null cleanly if no submission exists yet (no misleading fake 0-score dummy!)
    if (!submission) {
      const exam = await prisma.competitiveExam.findUnique({ where: { id }, select: { id: true } });
      if (!exam) {
        return res.status(404).json({ success: false, message: "Exam not found" });
      }
      return res.json({ success: true, data: null });
    }

    const [metaMap, explanationMap] = await Promise.all([
      getExamMetaMap([id]),
      getQuestionExplanationMap(id),
    ]);

    const enrichedResponses = (submission.responses || []).map((r: any) => ({
      ...r,
      question: r.question ? { ...r.question, explanation: explanationMap[r.question.id] || null } : r.question,
    }));

    res.json({ 
      success: true, 
      data: { 
        ...submission,
        responses: enrichedResponses,
        exam: { ...(submission.competitiveExam || {}), ...(metaMap[id] || {}) }
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
    await ensureTablesExist();
    const { id } = req.params;
    const {
      title, duration, totalMarks, passMarks, negativeMarks, isPublished,
      pattern, sections, marksPerQuestion, targetClassNames, allowRetake, shuffleQuestions, showResultImmediately
    } = req.body;
    
    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (duration !== undefined) dataToUpdate.duration = Number(duration);
    if (totalMarks !== undefined) dataToUpdate.totalMarks = Number(totalMarks);
    if (passMarks !== undefined) dataToUpdate.passMarks = Number(passMarks);
    if (negativeMarks !== undefined) dataToUpdate.negativeMarks = Number(negativeMarks);
    if (isPublished !== undefined) dataToUpdate.isPublished = Boolean(isPublished);

    const exam = await prisma.competitiveExam.update({
      where: { id },
      data: dataToUpdate
    });

    if (
      pattern !== undefined || sections !== undefined || marksPerQuestion !== undefined ||
      targetClassNames !== undefined || allowRetake !== undefined ||
      shuffleQuestions !== undefined || showResultImmediately !== undefined
    ) {
      const existingMeta = (await getExamMetaMap([id]))[id] || {};
      await prisma.$executeRawUnsafe(
        `UPDATE "CompetitiveExam" SET "pattern" = $1, "sectionsJson" = $2, "marksPerQuestion" = $3, "targetClassNames" = $4, "allowRetake" = $5, "shuffleQuestions" = $6, "showResultImmediately" = $7 WHERE "id" = $8`,
        String(pattern ?? existingMeta.pattern ?? 'CUSTOM'),
        sections !== undefined ? JSON.stringify(sections) : JSON.stringify(existingMeta.sections || []),
        Number(marksPerQuestion ?? existingMeta.marksPerQuestion ?? 4),
        targetClassNames !== undefined ? JSON.stringify(targetClassNames) : JSON.stringify(existingMeta.targetClassNames || []),
        allowRetake !== undefined ? Boolean(allowRetake) : (existingMeta.allowRetake !== false),
        shuffleQuestions !== undefined ? Boolean(shuffleQuestions) : Boolean(existingMeta.shuffleQuestions),
        showResultImmediately !== undefined ? Boolean(showResultImmediately) : (existingMeta.showResultImmediately !== false),
        id
      ).catch(() => {});
    }

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
