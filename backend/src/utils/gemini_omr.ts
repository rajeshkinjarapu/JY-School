import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

export interface OMRScanResult {
  student_id: string;
  student_name: string;
  answers: Record<string, string>;
  correct: number;
  wrong: number;
  unattempted: number;
  marks: {
    maths: number;
    physics: number;
    chemistry: number;
    total: number;
  };
  processed_image?: string;
}

export const scanOMRWithGemini = async (
  filePath: string,
  answerKey: Record<string, string> = {}
): Promise<OMRScanResult> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment');
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `You are a high-precision Optical Mark Recognition (OMR) scanner AI.
Your job is to read the provided OMR Answer Sheet image and extract:
1. "student_id": The student roll number / ID from the STUDENT ID box at the top left. Look at both the handwritten digits (boxes) and the darkened bubble columns below them (e.g. "269657" or "0421").
2. "student_name": The student's name written by hand in the Student Name field (e.g. "A. Aaryan").
3. "answers": An object mapping question numbers "1" through "75" to the marked option ("A", "B", "C", "D").
   - The sheet has 5 vertical question blocks of 15 questions each:
     Block 1: Q1 to Q15
     Block 2: Q16 to Q30
     Block 3: Q31 to Q45
     Block 4: Q46 to Q60
     Block 5: Q61 to Q75
   - For each question 1..75, determine which bubble is darkened by the student.
   - If a bubble is filled, return "A", "B", "C", or "D".
   - If no bubble is filled, return "-".
   - If multiple bubbles are filled, return the darkest one.

Return ONLY a raw JSON object with no markdown fences:
{
  "student_id": "269657",
  "student_name": "A. Aaryan",
  "answers": {
    "1": "B",
    "2": "C",
    ...
    "75": "A"
  }
}`;

  // Read the image file as Base64 inline data
  const fileBuffer = fs.readFileSync(filePath);
  const base64Data = fileBuffer.toString('base64');
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      {
        text: 'Read this OMR Answer Sheet and extract the student ID, student name, and all marked answers for questions 1 to 75.',
      },
    ],
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  });

  if (!response.text) {
    throw new Error('Empty response from Gemini Vision AI');
  }

  const cleanJson = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanJson);

  const detectedAnswers: Record<string, string> = parsed.answers || {};
  const studentId = parsed.student_id || 'AUTO_DETECT';
  const studentName = parsed.student_name || 'Unknown Student';

  // Evaluate against master answer key
  let correctCount = 0;
  let wrongCount = 0;
  let unattemptedCount = 0;

  let mathsMarks = 0;
  let physicsMarks = 0;
  let chemistryMarks = 0;

  for (let q = 1; q <= 75; q++) {
    const qStr = String(q);
    const chosen = (detectedAnswers[qStr] || '-').trim().toUpperCase();
    const correct = (answerKey[qStr] || '').trim().toUpperCase();

    let mark = 0;
    if (correct) {
      if (chosen === correct) {
        mark = 4;
        correctCount++;
      } else if (chosen !== '-' && chosen !== '') {
        mark = 0;
        wrongCount++;
      } else {
        unattemptedCount++;
      }
    }

    if (q <= 25) mathsMarks += mark;
    else if (q <= 50) physicsMarks += mark;
    else chemistryMarks += mark;
  }

  const totalMarks = mathsMarks + physicsMarks + chemistryMarks;

  return {
    student_id: studentId,
    student_name: studentName,
    answers: detectedAnswers,
    correct: correctCount,
    wrong: wrongCount,
    unattempted: unattemptedCount,
    marks: {
      maths: mathsMarks,
      physics: physicsMarks,
      chemistry: chemistryMarks,
      total: totalMarks,
    },
    processed_image: `data:${mimeType};base64,${base64Data}`,
  };
};
