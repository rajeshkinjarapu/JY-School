import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper: calculate scores from answers + answer key
function calculateScore(answers: Record<string, string>, answerKey: Record<string, string>) {
  let correct = 0, wrong = 0, blank = 0;
  let maths = 0, physics = 0, chem = 0;

  for (const qNum of Object.keys(answerKey)) {
    const correctAns = answerKey[qNum]?.toUpperCase();
    const studentAns = (answers[qNum] || '').toUpperCase();
    const qInt = parseInt(qNum, 10);

    if (!studentAns || studentAns === 'UNATTEMPTED') {
      blank++;
    } else if (studentAns === correctAns) {
      correct++;
      if (qInt >= 1 && qInt <= 25) maths += 4;
      else if (qInt >= 26 && qInt <= 50) physics += 4;
      else if (qInt >= 51 && qInt <= 75) chem += 4;
    } else if (studentAns !== 'INVALID') {
      wrong++;
    }
  }

  return {
    correct,
    wrong,
    blank,
    maths,
    physics,
    chem,
    total: (correct * 4) - (wrong * 1),
  };
}

// Helper: call Gemini to extract answers from a base64 image
async function extractAnswersFromImage(base64Data: string, mimeType: string, apiKey: string) {
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are an expert OMR (Optical Mark Recognition) reading AI for JEE Mains style answer sheets.

I have provided an image of a student's OMR answer sheet. The sheet has 75 questions (Q1-Q75), divided into 3 sections: Maths (1-25), Physics (26-50), Chemistry (51-75). Each question has 4 bubble options: 1/A, 2/B, 3/C, 4/D.

Your tasks:
1. Identify the "Student ID" — look at any handwritten ID at the top, or ID bubbles, return as string (e.g. "JY267063").
2. For each question 1 to 75, identify which bubble option is darkened/filled.
   - Return as: "A", "B", "C", or "D"
   - If no bubble is filled → "UNATTEMPTED"
   - If multiple bubbles filled → "INVALID"

Respond STRICTLY with valid JSON only. No markdown. No explanation.

Format:
{
  "student_id": "JY267063",
  "answers": {
    "1": "B",
    "2": "A",
    "3": "UNATTEMPTED",
    "4": "C",
    ...up to 75...
  }
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      prompt,
      { inlineData: { data: base64Data, mimeType } },
    ],
    config: { responseMimeType: 'application/json' },
  });

  const text = response.text || '';
  return JSON.parse(text);
}

// ─────────────────────────────────────────────
// POST /api/omr  (single sheet scan - existing)
// ─────────────────────────────────────────────
export const scanOmrSheet = async (req: Request, res: Response) => {
  try {
    const { image, answer_key } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set in .env' });

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ error: 'Invalid base64 image string' });

    const parsedData = await extractAnswersFromImage(matches[2], matches[1], apiKey);

    let stats = { correct: 0, wrong: 0, blank: 0, maths: 0, physics: 0, chem: 0, total: 0 };
    if (answer_key && parsedData.answers) {
      stats = calculateScore(parsedData.answers, answer_key);
    } else {
      for (const ans of Object.values(parsedData.answers || {})) {
        const a = (ans as string)?.toUpperCase();
        if (!a || a === 'UNATTEMPTED') stats.blank++;
        else stats.correct++;
      }
    }

    const total_questions = Object.keys(answer_key || parsedData.answers || {}).length;

    return res.status(200).json({
      student_id: parsedData.student_id,
      answers: parsedData.answers,
      total_questions,
      filled_count: stats.correct + stats.wrong,
      blank_count: stats.blank,
      score: answer_key ? stats.total : null,
      correct_count: answer_key ? stats.correct : null,
      wrong_count: answer_key ? stats.wrong : null,
      max_score: total_questions * 4,
      maths_score: answer_key ? stats.maths : null,
      physics_score: answer_key ? stats.physics : null,
      chem_score: answer_key ? stats.chem : null,
    });
  } catch (error: any) {
    console.error('OMR scan error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// ─────────────────────────────────────────────
// POST /api/omr/bulk-scan  (multiple sheets)
// ─────────────────────────────────────────────
export const bulkScanOmrSheets = async (req: Request, res: Response) => {
  try {
    const { images, answer_key } = req.body; // images: Array<{ data: string (base64 dataURL), name: string }>
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set in .env' });

    const results = [];

    for (const imgObj of images) {
      try {
        const matches = imgObj.data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches) {
          results.push({ name: imgObj.name, error: 'Invalid image format', student_id: null });
          continue;
        }

        const parsedData = await extractAnswersFromImage(matches[2], matches[1], apiKey);
        let stats = { correct: 0, wrong: 0, blank: 0, maths: 0, physics: 0, chem: 0, total: 0 };
        if (answer_key && parsedData.answers) {
          stats = calculateScore(parsedData.answers, answer_key);
        }

        const total_questions = Object.keys(answer_key || parsedData.answers || {}).length;

        results.push({
          name: imgObj.name,
          student_id: parsedData.student_id || null,
          answers: parsedData.answers || {},
          total_questions,
          filled_count: stats.correct + stats.wrong,
          blank_count: stats.blank,
          score: answer_key ? stats.total : null,
          correct_count: answer_key ? stats.correct : null,
          wrong_count: answer_key ? stats.wrong : null,
          max_score: total_questions * 4,
          maths_score: answer_key ? stats.maths : null,
          physics_score: answer_key ? stats.physics : null,
          chem_score: answer_key ? stats.chem : null,
          error: null,
        });
      } catch (err: any) {
        results.push({ name: imgObj.name, error: err.message || 'Scan failed', student_id: null });
      }
    }

    return res.status(200).json({ results });
  } catch (error: any) {
    console.error('Bulk OMR scan error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// ─────────────────────────────────────────────
// POST /api/omr/answer-key  (save answer key)
// ─────────────────────────────────────────────
export const saveAnswerKey = async (req: Request, res: Response) => {
  try {
    const { examName, className, examDate, answerKey } = req.body;
    if (!examName || !className || !answerKey) {
      return res.status(400).json({ error: 'examName, className, and answerKey are required' });
    }

    const omrExam = await prisma.omrExam.create({
      data: {
        examName,
        className,
        examDate: examDate ? new Date(examDate) : new Date(),
        answerKey,
      },
    });

    return res.status(201).json(omrExam);
  } catch (error: any) {
    console.error('Save answer key error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/omr/answer-keys  (list saved exams)
// ─────────────────────────────────────────────
export const getAnswerKeys = async (_req: Request, res: Response) => {
  try {
    const exams = await prisma.omrExam.findMany({
      select: { id: true, examName: true, className: true, examDate: true, createdAt: true, answerKey: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(exams);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/omr/results  (save student results)
// ─────────────────────────────────────────────
export const saveOmrResults = async (req: Request, res: Response) => {
  try {
    const { omrExamId, results } = req.body;
    // results: Array of scanned student result objects

    if (!omrExamId || !results || !Array.isArray(results)) {
      return res.status(400).json({ error: 'omrExamId and results[] are required' });
    }

    const saved = await Promise.all(
      results.map(async (r: any) => {
        // Try to find matching student by rollNo
        let studentDbId: string | null = null;
        if (r.student_id) {
          try {
            const student = await prisma.student.findFirst({
              where: { rollNo: r.student_id },
            });
            if (student) studentDbId = student.id;
          } catch {}
        }

        return prisma.omrStudentResult.create({
          data: {
            omrExamId,
            studentId: r.student_id || 'Unknown',
            studentDbId,
            mathsScore: r.maths_score || 0,
            physicsScore: r.physics_score || 0,
            chemScore: r.chem_score || 0,
            totalScore: r.score || 0,
            correctCount: r.correct_count || 0,
            wrongCount: r.wrong_count || 0,
            blankCount: r.blank_count || 0,
            answers: r.answers || {},
          },
        });
      })
    );

    return res.status(201).json({ message: `${saved.length} results saved`, saved });
  } catch (error: any) {
    console.error('Save OMR results error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/omr/results/:examId  (get results for an exam)
// ─────────────────────────────────────────────
export const getOmrResults = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    const results = await prisma.omrStudentResult.findMany({
      where: { omrExamId: examId },
      orderBy: { totalScore: 'desc' },
    });
    return res.status(200).json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
