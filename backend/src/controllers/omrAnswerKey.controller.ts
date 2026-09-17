import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAnswerKey = async (req: Request, res: Response) => {
  try {
    const { examId, classId } = req.query;
    if (!examId || !classId) return res.status(400).json({ error: 'Exam ID and Class ID are required' });

    const key = await prisma.examAnswerKey.findUnique({
      where: {
        examId_classId: {
          examId: String(examId),
          classId: String(classId)
        }
      }
    });

    res.json(key ? key.answers : {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const saveAnswerKey = async (req: Request, res: Response) => {
  try {
    const { examId, classId, answers } = req.body;
    if (!examId || !classId || !answers) return res.status(400).json({ error: 'Missing required fields' });

    const updatedKey = await prisma.examAnswerKey.upsert({
      where: {
        examId_classId: { examId, classId }
      },
      update: { answers },
      create: {
        examId,
        classId,
        answers
      }
    });

    res.json(updatedKey);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
