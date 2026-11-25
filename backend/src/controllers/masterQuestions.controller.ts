import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { generateQuizQuestions, parseRawExamTextToMCQs } from '../utils/gemini';

// ==========================================
// MASTER QUESTION BANK (PERMANENT DB STORAGE)
// ==========================================

export const getMasterQuestions = async (req: Request, res: Response) => {
  try {
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

    const questions = await prisma.masterQuestion.findMany({
      where: filter,
      include: {
        subject: true,
        _count: { select: { examQuestions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: questions });
  } catch (error) {
    console.error('getMasterQuestions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch master questions' });
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

export const addMasterQuestion = async (req: Request, res: Response) => {
  try {
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

    const formattedOptions = Array.isArray(options)
      ? JSON.stringify(options)
      : typeof options === 'string'
      ? options
      : JSON.stringify(['Option A', 'Option B', 'Option C', 'Option D']);

    const resolvedSubjectId = await resolveMasterSubjectId(subjectId, subjectName || chapterName);

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
        correctAnswer: correctAnswer || 'Option A',
        marks: Number(marks) || 4,
        negativeMarks: Number(negativeMarks) ?? 1,
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

      const formattedOptions = Array.isArray(q.options)
        ? JSON.stringify(q.options)
        : typeof q.options === 'string'
        ? q.options
        : JSON.stringify(['A', 'B', 'C', 'D']);

      const saved = await prisma.masterQuestion.create({
        data: {
          category: q.category || category || 'GENERAL',
          subjectId: q.subjectId || defaultSubjectId,
          subjectName: q.subjectName || subjectName || (q.chapterName ? String(q.chapterName).split(':')[0].trim() : 'General'),
          className: q.className || className || null,
          chapterName: q.chapterName || 'General',
          topicName: q.topicName || null,
          difficulty: q.difficulty || 'MEDIUM',
          questionType: q.questionType || 'MCQ',
          questionText: qText,
          imageUrl: q.imageUrl || null,
          options: formattedOptions,
          correctAnswer: q.correctAnswer || (Array.isArray(q.options) ? q.options[0] : 'A'),
          marks: Number(q.marks) || 4,
          negativeMarks: Number(q.negativeMarks) ?? 1,
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
    const { rawText, defaultMarks = 4, chapterName = 'General' } = req.body;
    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide exam text to parse' });
    }

    const parsedQuestions = await parseRawExamTextToMCQs(
      rawText,
      Number(defaultMarks) || 4,
      chapterName || 'General'
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
    const { category, subjectId, subjectName, className, chapterName, prompt, count, difficulty } = req.body;
    const file = (req as any).file;

    let basePrompt: string;
    if (file) {
      basePrompt = `Generate ${count || 5} ${difficulty || 'MEDIUM'} level multiple choice questions from the uploaded document/image.
Chapter: ${chapterName || 'General'}.
Additional Instructions: ${prompt || 'Generate standard MCQ questions based on the content.'}.
Return ONLY a valid JSON array. Each object must have: "questionText", "options" (array of 4 strings), "correctAnswer" (must match one option exactly), "explanation". Do not include markdown.`;
    } else {
      basePrompt = `Generate ${count || 5} ${difficulty || 'MEDIUM'} level multiple choice questions.
Chapter: ${chapterName || 'General'}.
Prompt: ${prompt || 'Generate standard MCQ questions'}.
Return ONLY a valid JSON array. Each object must have: "questionText", "options" (array of 4 strings), "correctAnswer" (must match one option exactly), "explanation". Do not include markdown.`;
    }

    const generatedArray = await generateQuizQuestions(basePrompt, file);

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
          questionType: 'MCQ',
          options: JSON.stringify(q.options),
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || null,
          marks: 4,
          negativeMarks: 1,
          difficulty: difficulty || 'MEDIUM',
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
