import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

// Initialize the Gemini client
// It will automatically pick up the GEMINI_API_KEY from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const generateQuizQuestions = async (
    prompt: string,
    file?: Express.Multer.File
) => {
    try {
        let contents: any[] = [];
        
        const systemInstruction = `You are an expert exam question creator. 
Generate a list of multiple-choice questions based on the provided text, instructions, or uploaded document.
Always return ONLY a raw JSON array of objects. Do not include any markdown formatting like \`\`\`json.
Each object in the array must strictly have this structure:
{
  "questionText": "What is the capital of France?",
  "options": ["London", "Paris", "Berlin", "Madrid"],
  "correctAnswer": "Paris",
  "marks": 1
}
Make sure 'options' is an array of exactly 4 strings. 'correctAnswer' must exactly match one of the 'options'.`;

        if (file) {
            // Upload the file to Gemini via File API
            const uploadedFile = await ai.files.upload({
                file: file.path,
                config: { mimeType: file.mimetype }
            });
            
            contents = [
                uploadedFile,
                { text: prompt || 'Generate quiz questions from this document.' }
            ];
        } else {
            contents = [
                { text: prompt }
            ];
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
            }
        });

        // Clean up temp file if exists
        if (file && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        if (!response.text) {
            throw new Error("Empty response from AI");
        }

        const parsedJson = JSON.parse(response.text);
        return parsedJson;
    } catch (error) {
        console.error("Gemini AI Error:", error);
        
        // Ensure cleanup on failure
        if (file && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        throw new Error("Failed to generate questions using AI. Please check your API key and quota.");
    }
};

export const parseRawExamTextToMCQs = async (
    rawText: string,
    defaultMarks = 4,
    chapterHint = 'General'
) => {
    try {
        const systemInstruction = `You are an expert exam question digitizer and NTA/Eduracle test parsing engine.
Your task is to take unformatted, pasted raw text containing multiple-choice questions (MCQs), which might come from Word, PDF, or text papers, and parse every question into a structured JSON array.

Guidelines:
1. Extract every distinct question found in the text.
2. Clean the question text: remove numbering prefixes like "1.", "Q1:", "Question 1)", etc.
3. If math or scientific formulas appear, keep or wrap them nicely in LaTeX format with single dollar signs (e.g. $E=mc^2$ or $\\frac{a}{b}$).
4. Extract 4 options. Clean option prefixes like "(A)", "(a)", "A)", "A.", "1.", etc. If only 2 or 3 options are present, provide plausible 4th option.
5. Identify the correct answer:
   - If an answer key or solution is indicated in the text (e.g. "Ans: B", "Answer: (C)", bolded, or an answer table at the bottom), map it to the exact text of that option.
   - If no answer key is provided in the text, use your domain knowledge to accurately determine the correct answer and set 'correctAnswer' to the exact matching option string.
6. Determine 'difficulty' ('EASY', 'MEDIUM', or 'HARD') based on the problem complexity.
7. Return strictly a raw JSON array of objects. Do not include markdown code fence formatting like \`\`\`json.

Each object must follow this schema:
{
  "questionText": "string",
  "options": ["string", "string", "string", "string"],
  "correctAnswer": "string (must exactly match one of the 4 options)",
  "marks": number,
  "chapterName": "string",
  "difficulty": "EASY" | "MEDIUM" | "HARD"
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { 
                    text: `Default marks per question: ${defaultMarks}. Default chapter/section hint: "${chapterHint}".\n\nRaw text to parse into MCQs:\n${rawText}` 
                }
            ],
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
            }
        });

        if (!response.text) {
            throw new Error("Empty response from AI");
        }

        const parsedJson = JSON.parse(response.text);
        if (!Array.isArray(parsedJson)) {
            if (parsedJson && Array.isArray((parsedJson as any).questions)) {
                return (parsedJson as any).questions;
            }
            throw new Error("AI did not return an array of questions");
        }
        return parsedJson;
    } catch (error) {
        console.error("Gemini parseRawExamTextToMCQs Error:", error);
        throw new Error("Failed to parse raw text with AI. Please check your text format or API quota.");
    }
};
