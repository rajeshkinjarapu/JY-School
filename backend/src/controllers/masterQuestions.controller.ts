import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { generateQuizQuestions, parseRawExamTextToMCQs } from '../utils/gemini';

// ==========================================
// MASTER QUESTION BANK (PERMANENT DB STORAGE)
// ==========================================

let schemaSyncedPromise: Promise<void> | null = null;

export const ensureMasterQuestionSchema = async (): Promise<void> => {
  if (!schemaSyncedPromise) {
    schemaSyncedPromise = (async () => {
      const statements = [
        `CREATE TABLE IF NOT EXISTS "MasterQuestion" (
          "id" TEXT NOT NULL,
          "subjectId" TEXT NOT NULL,
          "category" TEXT NOT NULL DEFAULT 'GENERAL',
          "subjectName" TEXT,
          "className" TEXT,
          "chapterName" TEXT NOT NULL DEFAULT 'General',
          "topicName" TEXT,
          "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
          "questionType" TEXT NOT NULL DEFAULT 'MCQ',
          "questionText" TEXT NOT NULL,
          "imageUrl" TEXT,
          "options" TEXT NOT NULL,
          "correctAnswer" TEXT NOT NULL,
          "marks" DOUBLE PRECISION NOT NULL DEFAULT 4,
          "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT 1,
          "explanation" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "MasterQuestion_pkey" PRIMARY KEY ("id")
        )`,
        `ALTER TABLE "MasterQuestion" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'GENERAL'`,
        `ALTER TABLE "MasterQuestion" ADD COLUMN IF NOT EXISTS "subjectName" TEXT`,
        `ALTER TABLE "MasterQuestion" ADD COLUMN IF NOT EXISTS "className" TEXT`,
        `ALTER TABLE "MasterQuestion" ADD COLUMN IF NOT EXISTS "topicName" TEXT`,
        `ALTER TABLE "MasterQuestion" ADD COLUMN IF NOT EXISTS "questionType" TEXT NOT NULL DEFAULT 'MCQ'`,
        `ALTER TABLE "MasterQuestion" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT`,
        `ALTER TABLE "MasterQuestion" ADD COLUMN IF NOT EXISTS "explanation" TEXT`,
        `ALTER TABLE "MasterQuestion" ADD COLUMN IF NOT EXISTS "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT 1`,
        `ALTER TABLE "CompetitiveExamQuestion" ADD COLUMN IF NOT EXISTS "masterQuestionId" TEXT`,
      ];
      for (const stmt of statements) {
        await prisma.$executeRawUnsafe(stmt).catch((err) => {
          console.warn('MasterQuestion schema sync notice:', err?.message);
        });
      }
    })();
  }
  return schemaSyncedPromise;
};

export const getMasterQuestions = async (req: Request, res: Response) => {
  try {
    await ensureMasterQuestionSchema();
    const { category, subjectId, subjectName, className, chapterName, difficulty, search } = req.query;
    const filter: any = {};
    if (category && category !== 'ALL') filter.category = String(category);
    if (subjectId && subjectId !== 'ALL') filter.subjectId = String(subjectId);
    if (subjectName && subjectName !== 'ALL') {
      filter.OR = [
        { subjectName: { contains: String(subjectName), mode: 'insensitive' } },
        { chapterName: { contains: String(subjectName), mode: 'insensitive' } },
        { subject: { name: { contains: String(subjectName), mode: 'insensitive' } } },
      ];
    }
    if (className && className !== 'ALL') filter.className = String(className);
    if (chapterName && chapterName !== 'ALL') {
      filter.chapterName = { contains: String(chapterName), mode: 'insensitive' };
    }
    if (difficulty && difficulty !== 'ALL') filter.difficulty = String(difficulty);
    if (search && String(search).trim()) {
      const q = String(search).trim();
      filter.AND = [
        {
          OR: [
            { questionText: { contains: q, mode: 'insensitive' } },
            { chapterName: { contains: q, mode: 'insensitive' } },
            { subjectName: { contains: q, mode: 'insensitive' } },
          ],
        },
      ];
    }

    let questions;
    try {
      questions = await prisma.masterQuestion.findMany({
        where: filter,
        include: {
          subject: true,
          _count: { select: { examQuestions: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (innerErr: any) {
      console.warn('getMasterQuestions primary query fallback:', innerErr?.message);
      questions = await prisma.masterQuestion.findMany({
        where: filter,
        include: { subject: true },
        orderBy: { createdAt: 'desc' },
      });
    }
    res.json({ success: true, data: questions });
  } catch (error: any) {
    console.error('getMasterQuestions error:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to fetch master questions' });
  }
};

// Helper: resolve a valid Subject ID so MasterQuestion never fails FK if user only passes subjectName
async function resolveMasterSubjectId(subjectId?: string | null, subjectName?: string | null): Promise<string> {
  if (subjectId && String(subjectId).trim()) {
    const exists = await prisma.subject.findUnique({ where: { id: String(subjectId) }, select: { id: true } }).catch(() => null);
    if (exists) return exists.id;
  }
  if (subjectName && String(subjectName).trim()) {
    const byName = await prisma.subject.findFirst({
      where: { name: { contains: String(subjectName).trim(), mode: 'insensitive' } },
      select: { id: true },
    }).catch(() => null);
    if (byName) return byName.id;
  }
  const first = await prisma.subject.findFirst({ select: { id: true } });
  if (first) return first.id;
  throw new Error('No subjects found in school database. Please create at least one subject first.');
}

// Safe numeric parser helper that never returns NaN to Prisma
const safeParseFloat = (val: any, fallback: number): number => {
  if (val === undefined || val === null || val === '') return fallback;
  const n = typeof val === 'number' ? val : parseFloat(String(val).trim());
  return isNaN(n) ? fallback : n;
};

// Safe answer key resolver that maps 'A', 'B', 'C', 'D' to the actual option text if needed
const resolveCorrectAnswer = (ans: any, options: string[]): string => {
  if (!ans && options.length > 0) return options[0];
  const strAns = String(ans).trim();
  const letterIdxMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, '1': 0, '2': 1, '3': 2, '4': 3 };
  const idx = letterIdxMap[strAns.toUpperCase()];
  if (idx !== undefined && options[idx]) {
    return options[idx];
  }
  return strAns;
};

export const addMasterQuestion = async (req: Request, res: Response) => {
  try {
    await ensureMasterQuestionSchema();
    const {
      category,
      subjectId,
      subjectName,
      className,
      chapterName,
      topicName,
      difficulty,
      questionType,
      questionText,
      imageUrl,
      options,
      correctAnswer,
      marks,
      negativeMarks,
      explanation,
    } = req.body;

    if (!questionText || !String(questionText).trim()) {
      return res.status(400).json({ success: false, message: 'Question text is required' });
    }

    const optionsArray = Array.isArray(options)
      ? options
      : typeof options === 'string'
      ? (() => { try { return JSON.parse(options); } catch { return ['Option A', 'Option B', 'Option C', 'Option D']; } })()
      : ['Option A', 'Option B', 'Option C', 'Option D'];

    const formattedOptions = JSON.stringify(optionsArray);
    const resolvedSubjectId = await resolveMasterSubjectId(subjectId, subjectName || chapterName);
    const resolvedAnswer = resolveCorrectAnswer(correctAnswer, optionsArray);

    const safeMarks = safeParseFloat(marks, 4);
    const safeNegativeMarks = safeParseFloat(negativeMarks, 0);

    const q = await prisma.masterQuestion.create({
      data: {
        category: category || 'GENERAL',
        subjectId: resolvedSubjectId,
        subjectName: subjectName || (chapterName ? String(chapterName).split(':')[0].trim() : 'General'),
        className: className || null,
        chapterName: chapterName || 'General',
        topicName: topicName || null,
        difficulty: difficulty || 'MEDIUM',
        questionType: questionType || 'MCQ',
        questionText: String(questionText).trim(),
        imageUrl: imageUrl || null,
        options: formattedOptions,
        correctAnswer: resolvedAnswer,
        marks: safeMarks,
        negativeMarks: safeNegativeMarks,
        explanation: explanation || null,
      },
      include: { subject: true, _count: { select: { examQuestions: true } } },
    });
    res.status(201).json({ success: true, data: q });
  } catch (error: any) {
    console.error('addMasterQuestion error:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to add question to master bank' });
  }
};

export const bulkAddMasterQuestions = async (req: Request, res: Response) => {
  try {
    await ensureMasterQuestionSchema();
    const { questions, category, subjectId, subjectName, className } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'No questions provided' });
    }

    const defaultSubjectId = await resolveMasterSubjectId(subjectId, subjectName);

    const savedQuestions = [];
    for (const q of questions) {
      const qText = String(q.questionText || '').trim();
      if (!qText) continue;

      // Skip exact duplicate in Master Bank
      const existing = await prisma.masterQuestion.findFirst({
        where: { questionText: qText },
        select: { id: true },
      });
      if (existing) {
        savedQuestions.push(existing);
        continue;
      }

      const optionsArray: string[] = Array.isArray(q.options)
        ? q.options.map((opt: any) => String(opt ?? '').trim())
        : typeof q.options === 'string'
        ? (() => {
            try {
              const parsed = JSON.parse(q.options);
              return Array.isArray(parsed) ? parsed.map((o: any) => String(o ?? '').trim()) : [q.options];
            } catch {
              return ['Option A', 'Option B', 'Option C', 'Option D'];
            }
          })()
        : ['Option A', 'Option B', 'Option C', 'Option D'];

      const formattedOptions = JSON.stringify(optionsArray);

      // Per-row subject resolution if specified
      const rowSubjectName = q.subjectName || subjectName || (q.chapterName ? String(q.chapterName).split(':')[0].trim() : 'General');
      let rowSubjectId = q.subjectId || defaultSubjectId;
      if (!q.subjectId && q.subjectName && q.subjectName !== subjectName) {
        try {
          rowSubjectId = await resolveMasterSubjectId(undefined, q.subjectName);
        } catch {
          rowSubjectId = defaultSubjectId;
        }
      }

      const resolvedAnswer = resolveCorrectAnswer(q.correctAnswer, optionsArray);
      const safeMarks = safeParseFloat(q.marks, 4);
      const safeNegativeMarks = safeParseFloat(q.negativeMarks, 0);

      const saved = await prisma.masterQuestion.create({
        data: {
          category: q.category || category || 'GENERAL',
          subjectId: rowSubjectId,
          subjectName: rowSubjectName,
          className: q.className || className || null,
          chapterName: q.chapterName || `${rowSubjectName}: ${q.topicName || 'General'}`,
          topicName: q.topicName || null,
          difficulty: q.difficulty || 'MEDIUM',
          questionType: q.questionType || 'MCQ',
          questionText: qText,
          imageUrl: q.imageUrl || null,
          options: formattedOptions,
          correctAnswer: resolvedAnswer,
          marks: safeMarks,
          negativeMarks: safeNegativeMarks,
          explanation: q.explanation || null,
        },
      });
      savedQuestions.push(saved);
    }

    res.status(201).json({
      success: true,
      count: savedQuestions.length,
      message: `Saved ${savedQuestions.length} questions permanently to Master Question Bank`,
      data: savedQuestions,
    });
  } catch (error: any) {
    console.error('bulkAddMasterQuestions error:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to bulk save master questions' });
  }
};

export const parseMasterTextAI = async (req: Request, res: Response) => {
  try {
    const { rawText, defaultMarks = 4, chapterName = 'General', apiKey, autoSolve = true } = req.body;
    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide exam text to parse' });
    }

    const parsedQuestions = await parseRawExamTextToMCQs(
      rawText,
      Number(defaultMarks) || 4,
      chapterName || 'General',
      apiKey,
      autoSolve !== false
    );

    if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
      return res.status(422).json({ success: false, message: 'Could not extract valid questions from the provided text' });
    }

    res.status(200).json({
      success: true,
      count: parsedQuestions.length,
      questions: parsedQuestions,
    });
  } catch (error: any) {
    console.error('parseMasterTextAI error:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to parse text questions' });
  }
};

export const updateMasterQuestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      category,
      subjectId,
      subjectName,
      className,
      chapterName,
      topicName,
      difficulty,
      questionType,
      questionText,
      imageUrl,
      options,
      correctAnswer,
      marks,
      negativeMarks,
      explanation,
    } = req.body;

    const formattedOptions = Array.isArray(options)
      ? JSON.stringify(options)
      : typeof options === 'string'
      ? options
      : undefined;

    const q = await prisma.masterQuestion.update({
      where: { id },
      data: {
        ...(category !== undefined ? { category } : {}),
        ...(subjectId !== undefined ? { subjectId: subjectId || null } : {}),
        ...(subjectName !== undefined ? { subjectName } : {}),
        ...(className !== undefined ? { className } : {}),
        ...(chapterName !== undefined ? { chapterName } : {}),
        ...(topicName !== undefined ? { topicName } : {}),
        ...(difficulty !== undefined ? { difficulty } : {}),
        ...(questionType !== undefined ? { questionType } : {}),
        ...(questionText !== undefined ? { questionText } : {}),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        ...(formattedOptions !== undefined ? { options: formattedOptions } : {}),
        ...(correctAnswer !== undefined ? { correctAnswer } : {}),
        ...(marks !== undefined ? { marks: Number(marks) } : {}),
        ...(negativeMarks !== undefined ? { negativeMarks: Number(negativeMarks) } : {}),
        ...(explanation !== undefined ? { explanation } : {}),
      },
      include: { subject: true, _count: { select: { examQuestions: true } } },
    });
    res.status(200).json({ success: true, data: q });
  } catch (error: any) {
    console.error('updateMasterQuestion error:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to update question in master bank' });
  }
};

export const generateMasterQuestionsAI = async (req: Request, res: Response) => {
  try {
    const { category, subjectId, subjectName, className, chapterName, prompt, count, difficulty, apiKey, previewOnly } = req.body;
    const file = (req as any).file;

    let basePrompt: string;
    if (file) {
      basePrompt = `Extract or generate ${count || 10} ${difficulty === 'MIXED' || !difficulty ? 'well-balanced (EASY, MEDIUM, HARD)' : difficulty} multiple choice questions from the uploaded document/image.
Chapter: ${chapterName || 'General'}.
Additional Instructions: ${prompt || 'Extract all questions accurately with 4 options, correct answer, and explanation.'}.
Return ONLY a valid JSON array. Each object must have: "questionText", "options" (array of 4 strings), "correctAnswer" (must match one option exactly), "difficulty" ("EASY" | "MEDIUM" | "HARD"), "questionType" ("MCQ"), "explanation". Do not include markdown.`;
    } else {
      basePrompt = `Generate ${count || 5} ${difficulty === 'MIXED' || !difficulty ? 'well-balanced (EASY, MEDIUM, HARD)' : difficulty} multiple choice questions.
Class: ${className || '10th'}, Subject: ${subjectName || 'General'}, Chapter: ${chapterName || 'General'}.
Prompt: ${prompt || 'Generate standard MCQ questions'}.
Return ONLY a valid JSON array. Each object must have: "questionText", "options" (array of 4 strings), "correctAnswer" (must match one option exactly), "difficulty" ("EASY" | "MEDIUM" | "HARD"), "questionType" ("MCQ"), "explanation". Do not include markdown.`;
    }

    const generatedArray = await generateQuizQuestions(basePrompt, file, apiKey);

    if (previewOnly === true || previewOnly === 'true') {
      return res.status(200).json({
        success: true,
        count: generatedArray.length,
        questions: generatedArray,
      });
    }

    const resolvedSubjectId = await resolveMasterSubjectId(subjectId, subjectName || chapterName);

    const savedQuestions = [];
    for (const q of generatedArray) {
      const saved = await prisma.masterQuestion.create({
        data: {
          category: category || 'GENERAL',
          subjectId: resolvedSubjectId,
          subjectName: subjectName || (chapterName ? String(chapterName).split(':')[0].trim() : 'General'),
          className: className || null,
          chapterName: chapterName || 'General',
          questionText: q.questionText,
          questionType: q.questionType || 'MCQ',
          options: JSON.stringify(q.options),
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || null,
          marks: 4,
          negativeMarks: 0,
          difficulty: q.difficulty || (difficulty === 'MIXED' ? 'MEDIUM' : difficulty) || 'MEDIUM',
        },
      });
      savedQuestions.push(saved);
    }

    res.status(201).json({ success: true, data: savedQuestions });
  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate master questions with AI' });
  }
};

export const deleteMasterQuestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.masterQuestion.delete({ where: { id } });
    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete question' });
  }
};

export const syncExamQuestionsToMasterBank = async (_req: Request, res: Response) => {
  try {
    await ensureMasterQuestionSchema();
    const examQuestions = await prisma.competitiveExamQuestion.findMany({
      include: {
        competitiveExam: {
          include: {
            class: true,
            subject: true,
          },
        },
      },
    });

    let syncedCount = 0;
    for (const eq of examQuestions) {
      if (eq.masterQuestionId) continue;

      const qText = (eq.questionText || '').trim();
      if (!qText) continue;

      let existing = await prisma.masterQuestion.findFirst({
        where: { questionText: qText },
        select: { id: true },
      });

      if (!existing) {
        const subjectName = eq.competitiveExam?.subject?.name || (eq.chapterName ? eq.chapterName.split(':')[0].trim() : 'General');
        const resolvedSubjectId = await resolveMasterSubjectId(eq.competitiveExam?.subjectId, subjectName);
        const className = eq.competitiveExam?.class?.name || null;
        const examTitleUpper = (eq.competitiveExam?.title || '').toUpperCase();
        const inferredCategory = examTitleUpper.includes('JEE')
          ? 'JEE'
          : examTitleUpper.includes('NEET')
          ? 'NEET'
          : examTitleUpper.includes('NAVODAYA')
          ? 'NAVODAYA'
          : 'SCHOOL';

        existing = await prisma.masterQuestion.create({
          data: {
            category: inferredCategory,
            subjectId: resolvedSubjectId,
            subjectName,
            className,
            chapterName: eq.chapterName || subjectName || 'General',
            difficulty: eq.difficulty || 'MEDIUM',
            questionType: eq.questionType || 'MCQ',
            questionText: qText,
            imageUrl: eq.imageUrl || null,
            options: eq.options || JSON.stringify(['Option A', 'Option B', 'Option C', 'Option D']),
            correctAnswer: eq.correctAnswer || 'A',
            marks: eq.marks || 4,
            negativeMarks: 0,
          },
          select: { id: true },
        });
        syncedCount += 1;
      }

      await prisma.competitiveExamQuestion.update({
        where: { id: eq.id },
        data: { masterQuestionId: existing.id },
      });
    }

    const totalInBank = await prisma.masterQuestion.count();
    res.json({
      success: true,
      syncedCount,
      totalInBank,
      message: syncedCount > 0
        ? `Synced ${syncedCount} exam questions to Master Question Bank`
        : 'All exam questions are already in Master Question Bank',
    });
  } catch (error: any) {
    console.error('syncExamQuestionsToMasterBank error:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to sync exam questions' });
  }
};
