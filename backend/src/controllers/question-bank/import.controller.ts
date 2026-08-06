import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import axios from 'axios';

// Helper to parse standard question structures from raw text
const parseQuestionFromText = (text: string) => {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  
  let questionText = '';
  let optionA = '';
  let optionB = '';
  let optionC = '';
  let optionD = '';
  let correctAnswer = 'A';
  let solution = '';
  let subject = 'Mathematics';
  let chapter = 'Algebra';
  let topic = 'Number System';
  let type = 'MCQ_SINGLE';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.toUpperCase() === 'MATHEMATICS' || line.toUpperCase() === 'PHYSICS' || line.toUpperCase() === 'CHEMISTRY') {
      subject = line.charAt(0) + line.slice(1).toLowerCase();
      continue;
    }

    const qMatch = line.match(/^(?:Q\d+|\d+)\.\s+(.+)$/i);
    if (qMatch && !optionA) {
      questionText = qMatch[1];
      
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        
        const inlineOpts = nextLine.match(/(?:1\.\s+|A\.\s+|a\)\s+)(.+?)\s+(?:2\.\s+|B\.\s+|b\)\s+)(.+?)\s+(?:3\.\s+|C\.\s+|c\)\s+)(.+?)\s+(?:4\.\s+|D\.\s+|d\)\s+)(.+)$/);
        
        if (inlineOpts) {
          optionA = inlineOpts[1].trim();
          optionB = inlineOpts[2].trim();
          optionC = inlineOpts[3].trim();
          optionD = inlineOpts[4].trim();
          i++; 
        }
      }
    }
  }

  return {
    subject,
    chapter,
    topic,
    type,
    difficulty: 'Medium',
    questionText: questionText || text,
    optionA,
    optionB,
    optionC,
    optionD,
    correctAnswer,
    solution,
    marks: 4,
    negativeMarks: -1
  };
};

  export const parseWithGemini = async (req: Request, res: Response) => {
  try {
    const { text, subject, provider = 'gemini', apiKey, imageBase64, imageMimeType } = req.body;
    if (!text && !imageBase64) {
      return res.status(400).json({ message: 'Text input or image is required.' });
    }

    const promptText = `You are an AI assistant for an exam portal. Extract multiple exam questions from the provided content (which may be text, a handwritten document, an image, or a PDF). 
Your primary goal is to perfectly transcribe the content, including handwritten text and mathematical equations, into a structured JSON array of objects.
Do not wrap the output in markdown code blocks like \`\`\`json. Just return the raw JSON array.
Each object must strictly match this structure:
{
  "subject": "${subject || 'Physics'}",
  "chapter": "Extracted chapter or empty string",
  "topic": "Extracted topic or empty string",
  "type": "MCQ_SINGLE" | "MCQ_MULTI" | "NUMERICAL",
  "difficulty": "Easy" | "Medium" | "Hard",
  "questionText": "Question text in LaTeX format if math/science. Enclose math in \\\\( \\\\) or \\\\[ \\\\]. \\n**CRITICAL FORMATTING RULES**:\\n1. For **Matching questions**, strictly format like this:\\nMatch the following:\\n       'Column I'                 'Column II'\\n(a) Item 1                   (i) Match 1\\n(b) Item 2                   (ii) Match 2\\n(c) Item 3                   (iii) Match 3\\n(d) Item 4                   (iv) Match 4\\n\\n2. For **Assertion-Reason questions**, strictly format like this:\\nAssertion (A): [Assertion text here]\\nReason (R): [Reason text here]\\n",
  "optionA": "Option A text",
  "optionB": "Option B text",
  "optionC": "Option C text",
  "optionD": "Option D text",
  "correctAnswer": "A, B, C, or D (or value if numerical)",
  "solution": "Explanation",
  "marks": 4,
  "negativeMarks": -1
}
Raw Text/Image Content:
${text || ''}`;

    let parsed = null;

    if (provider === 'gemini') {
      const activeKey = apiKey || process.env.GEMINI_API_KEY;
      if (!activeKey) throw new Error("Gemini API key is missing");
      const ai = new GoogleGenAI({ apiKey: activeKey });
      
      let contents: any = promptText;
      if (imageBase64) {
        contents = [
          { text: promptText },
          { inlineData: { data: imageBase64, mimeType: imageMimeType || 'image/jpeg' } }
        ];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          responseMimeType: 'application/json',
        }
      });
      if (response.text) {
        parsed = JSON.parse(response.text.replace(/```json\n?|```/g, ''));
      }
    } else if (provider === 'chatgpt') {
      if (!apiKey) throw new Error("ChatGPT API key is required");
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: promptText }]
      }, {
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
      });
      const content = response.data.choices[0].message.content;
      parsed = JSON.parse(content.replace(/```json\n?|```/g, ''));
    } else if (provider === 'claude') {
      if (!apiKey) throw new Error("Claude API key is required");
      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: 'claude-3-haiku-20240307',
        max_tokens: 4000,
        messages: [{ role: 'user', content: promptText }]
      }, {
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' }
      });
      const content = response.data.content[0].text;
      parsed = JSON.parse(content.replace(/```json\n?|```/g, ''));
    } else if (provider === 'deepseek') {
      if (!apiKey) throw new Error("DeepSeek API key is required");
      const response = await axios.post('https://api.deepseek.com/chat/completions', {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: promptText }]
      }, {
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
      });
      const content = response.data.choices[0].message.content;
      parsed = JSON.parse(content.replace(/```json\n?|```/g, ''));
    } else {
      throw new Error("Invalid provider");
    }

    if (parsed) {
      if (!Array.isArray(parsed)) {
          parsed = [parsed];
      }
      return res.status(200).json({ questions: parsed });
    }
    
    return res.status(500).json({ message: 'Failed to generate content.' });
  } catch (error: any) {
    console.error('AI parsing error:', error);
    return res.status(500).json({ message: error.response?.data?.error?.message || error.message || 'Server error' });
  }
};
export const importQuestionFile = async (req: Request, res: Response) => {
  return res.status(501).json({ message: 'Not implemented' });
};

/**
 * parseDocxWithGemini
 * Uploads a .docx file directly to the Gemini Files API and
 * asks Gemini to extract all exam questions including equations & symbols.
 */
export const parseDocxWithGemini = async (req: Request, res: Response) => {
  let filePath: string | undefined;
  try {
    const { subject, apiKey } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    filePath = req.file.path;
    const mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    const activeKey = apiKey || process.env.GEMINI_API_KEY;
    if (!activeKey) throw new Error('Gemini API key is missing');

    const ai = new GoogleGenAI({ apiKey: activeKey });

    // Step 1: Upload the file to Gemini Files API
    const uploadedFile = await ai.files.upload({
      file: filePath,
      mimeType,
      name: path.basename(filePath),
      displayName: req.file.originalname,
    });

    const fileUri = uploadedFile.uri;
    if (!fileUri) throw new Error('File upload to Gemini failed — no URI returned.');

    // Step 2: Ask Gemini to read the uploaded doc and extract questions
    const prompt = `You are an expert exam question extractor. You are given a Word document (.docx) that may contain exam questions, mathematical equations (in OMML / MathML format), symbols, and tables.

Your job:
- Read every question in the document carefully.
- Convert ALL mathematical expressions, equations, and symbols into LaTeX format.
  - Use \\( ... \\) for inline math.
  - Use \\[ ... \\] for display/block math.
- For Matching Type questions format them exactly as:
     Column I              Column II
(a) item1          (i) match1
(b) item2          (ii) match2
- For Assertion-Reason questions format them as:
Assertion (A): ...
Reason (R): ...

Return ONLY a raw JSON array (no markdown code blocks) where each element has:
{
  "subject": "${subject || 'General'}",
  "chapter": "",
  "topic": "",
  "type": "MCQ_SINGLE",
  "difficulty": "Medium",
  "questionText": "Question with LaTeX math",
  "optionA": "Option A with LaTeX if needed",
  "optionB": "Option B",
  "optionC": "Option C",
  "optionD": "Option D",
  "correctAnswer": "A",
  "solution": "",
  "marks": 1,
  "negativeMarks": 0
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { fileData: { mimeType, fileUri } },
          ],
        },
      ],
      config: { responseMimeType: 'application/json' },
    });

    // Step 3: Delete the uploaded file from Gemini to save quota
    try { await ai.files.delete({ name: uploadedFile.name! }); } catch (_) {}

    let parsed = null;
    if (response.text) {
      parsed = JSON.parse(response.text.replace(/```json\n?|```/g, ''));
    }

    if (!Array.isArray(parsed)) parsed = parsed ? [parsed] : [];
    return res.status(200).json({ questions: parsed });
  } catch (error: any) {
    console.error('DOCX parse error:', error);
    return res.status(500).json({ message: error.message || 'Failed to parse document.' });
  } finally {
    // Always clean up the local temp file
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};