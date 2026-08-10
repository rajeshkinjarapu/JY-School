import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const saveAnswerKey = async (req: Request, res: Response) => {
  try {
    const { paperId, answers } = req.body;
    
    if (!paperId || !answers) {
      return res.status(400).json({ message: 'Paper ID and answers are required.' });
    }

    const answerKey = await prisma.answerKey.upsert({
      where: { paperId },
      update: {
        answers: typeof answers === 'string' ? answers : JSON.stringify(answers)
      },
      create: {
        paperId,
        answers: typeof answers === 'string' ? answers : JSON.stringify(answers)
      }
    });

    return res.status(200).json({ message: 'Answer key saved successfully.', answerKey });
  } catch (error) {
    console.error('Save Answer Key Error:', error);
    return res.status(500).json({ message: 'Failed to save answer key.' });
  }
};

export const getAnswerKey = async (req: Request, res: Response) => {
  try {
    const { paperId } = req.params;
    
    const answerKey = await prisma.answerKey.findUnique({
      where: { paperId }
    });

    if (!answerKey) {
      return res.status(404).json({ message: 'Answer key not found.' });
    }

    // Parse the answers string back to JSON for the frontend
    let parsedAnswers;
    try {
      parsedAnswers = JSON.parse(answerKey.answers);
    } catch(e) {
      parsedAnswers = answerKey.answers;
    }

    const parsed = {
      ...answerKey,
      answers: parsedAnswers
    };

    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Get Answer Key Error:', error);
    return res.status(500).json({ message: 'Failed to retrieve answer key.' });
  }
};
