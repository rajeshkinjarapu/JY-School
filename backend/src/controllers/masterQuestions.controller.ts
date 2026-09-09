import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { generateQuizQuestions } from '../utils/gemini';

// ==========================================
// MASTER QUESTION BANK
// ==========================================

export const getMasterQuestions = async (req: Request, res: Response) => {
  try {
    const { subjectId, classId, chapterName, difficulty } = req.query;
    const filter: any = {};
    if (subjectId) filter.subjectId = String(subjectId);
    if (classId) filter.classId = String(classId);
    if (chapterName) filter.chapterName = String(chapterName);
    if (difficulty) filter.difficulty = String(difficulty);

    const questions = await prisma.masterQuestion.findMany({
      where: filter,
      include: { subject: true, class: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: questions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch master questions' });
  }
};

export const addMasterQuestion = async (req: Request, res: Response) => {
  try {
    const { subjectId, classId, chapterName, topicName, difficulty, questionType, questionText, imageUrl, options, correctAnswer, marks, negativeMarks, explanation } = req.body;
    
    const q = await prisma.masterQuestion.create({
      data: {
        subjectId, classId, chapterName, topicName, difficulty: difficulty || 'MEDIUM',
        questionType: questionType || 'MCQ', questionText, imageUrl, 
        options: JSON.stringify(options), correctAnswer, 
        marks: marks || 4, negativeMarks: negativeMarks || 1, explanation
      }
    });
    res.status(201).json({ success: true, data: q });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to add question to master bank' });
  }
};

export const generateMasterQuestionsAI = async (req: Request, res: Response) => {
  try {
    const { subjectId, classId, chapterName, prompt, count, difficulty } = req.body;
    const file = (req as any).file; // from multer if file was uploaded

    let basePrompt: string;
    if (file) {
      basePrompt = `Generate ${count || 5} ${difficulty || 'MEDIUM'} level multiple choice questions from the uploaded document/image.
Chapter: ${chapterName || 'General'}.
Additional Instructions: ${prompt || 'Generate standard MCQ questions based on the content.'}.
Return ONLY a valid JSON array. Each object must have: "questionText", "options" (array of 4 strings), "correctAnswer" (must match one option exactly), "explanation". Do not include markdown.`;
    } else {
      basePrompt = `Generate ${count} ${difficulty} level multiple choice questions for the chapter '${chapterName}'. Focus: ${prompt}.
Return ONLY a valid JSON array of objects with keys: "questionText", "options" (array of 4 strings), "correctAnswer" (must match one option exactly), "explanation" (short explanation). Do not include markdown code block formatting.`;
    }

    const questionsData = await generateQuizQuestions(basePrompt, file);
    
    const savedQuestions = [];
    for (const q of questionsData) {
      const saved = await prisma.masterQuestion.create({
        data: {
          subjectId,
          classId,
          chapterName,
          questionText: q.questionText,
          questionType: 'MCQ',
          options: JSON.stringify(q.options),
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          marks: 4, 
          negativeMarks: 1,
          difficulty: difficulty || 'MEDIUM'
        }
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
