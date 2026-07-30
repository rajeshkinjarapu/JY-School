import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

export const scanOmrSheet = async (req: Request, res: Response) => {
  try {
    const { image, answer_key } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in backend .env' });
    }

    // image is a data URL: e.g. "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 image string' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      You are an expert OMR (Optical Mark Recognition) reading AI.
      I have provided an image of a student's OMR answer sheet.
      
      Your tasks:
      1. Identify the "Student ID" from the bubbled section. (If handwritten clearly, extract that too).
      2. For each question number (usually 1 to 75), identify which option bubble is darkened. 
         Options are usually A, B, C, D (or 1, 2, 3, 4). Return as A, B, C, or D.
         If multiple bubbles are darkened for a single question, mark it as "INVALID".
         If no bubble is darkened, mark it as "UNATTEMPTED".
         
      Respond STRICTLY with valid JSON only. Do not include markdown code blocks like \`\`\`json.
      
      Expected JSON Format:
      {
        "student_id": "JY267063",
        "answers": {
          "1": "A",
          "2": "C",
          "3": "UNATTEMPTED"
        }
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
      ],
      config: {
        responseMimeType: 'application/json',
      }
    });

    const responseText = response.text || '';
    if (!responseText) {
      throw new Error('Empty response from AI');
    }

    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse JSON from AI', responseText);
      return res.status(500).json({ error: 'AI returned invalid format', data: responseText });
    }

    // Now if answer_key is provided, we can calculate score!
    let correct_count = 0;
    let wrong_count = 0;
    let blank_count = 0;
    let filled_count = 0;
    const total_questions = Object.keys(answer_key || parsedData.answers || {}).length;

    if (answer_key && parsedData.answers) {
      for (const qNum of Object.keys(answer_key)) {
        const correctAns = answer_key[qNum]?.toUpperCase();
        const studentAns = parsedData.answers[qNum]?.toUpperCase();

        if (!studentAns || studentAns === 'UNATTEMPTED') {
          blank_count++;
        } else {
          filled_count++;
          if (studentAns === correctAns) {
            correct_count++;
          } else if (studentAns !== 'INVALID') {
            wrong_count++;
          }
        }
      }
    } else {
      // Just count filled vs blank
      for (const qNum of Object.keys(parsedData.answers || {})) {
        const studentAns = parsedData.answers[qNum]?.toUpperCase();
        if (!studentAns || studentAns === 'UNATTEMPTED') {
          blank_count++;
        } else {
          filled_count++;
        }
      }
    }

    const score = (correct_count * 4) - (wrong_count * 1);

    const omrResult = {
      student_id: parsedData.student_id,
      answers: parsedData.answers,
      total_questions: total_questions,
      filled_count: filled_count,
      blank_count: blank_count,
      score: answer_key ? score : null,
      correct_count: answer_key ? correct_count : null,
      wrong_count: answer_key ? wrong_count : null,
      max_score: total_questions * 4
    };

    return res.status(200).json(omrResult);
  } catch (error: any) {
    console.error('Error scanning OMR:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
