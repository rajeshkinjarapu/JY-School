import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllQuestionPapers = async (req: Request, res: Response) => {
  try {
    const papers = await prisma.questionPaper.findMany({
      include: {
        class: true,
        subject: true,
        exam: true
      },
      orderBy: { uploadedAt: 'desc' }
    });
    res.json(papers);
  } catch (error) {
    console.error('Error fetching question papers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createQuestionPaper = async (req: Request, res: Response) => {
  try {
    const { title, classId, subjectId, fileUrl, examId, section } = req.body;

    const data: any = {
      title,
      fileUrl,
      uploadedBy: req.body.uploadedBy || 'system',
      class: { connect: { id: classId } }
    };
    if (subjectId) {
      data.subject = { connect: { id: subjectId } };
    }
    if (examId) {
      data.exam = { connect: { id: examId } };
    }
    if (section) {
      data.section = section;
    }

    const paper = await prisma.questionPaper.create({
      data,
      include: {
        class: true,
        subject: true,
        exam: true
      }
    });

    res.status(201).json(paper);
  } catch (error) {
    console.error('Error creating question paper:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteQuestionPaper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.questionPaper.delete({
      where: { id }
    });
    res.json({ message: 'Question paper deleted successfully' });
  } catch (error) {
    console.error('Error deleting question paper:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateAnswerKey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { answerKey, answerKeyUrl } = req.body;

    const updatedPaper = await prisma.questionPaper.update({
      where: { id },
      data: { answerKey, answerKeyUrl },
      include: {
        class: true,
        subject: true,
        exam: true
      }
    });
    res.json(updatedPaper);
  } catch (error) {
    console.error('Error updating answer key:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
