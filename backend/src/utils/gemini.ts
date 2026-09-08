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
