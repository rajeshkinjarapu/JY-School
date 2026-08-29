import { Request, Response } from 'express';
import { prisma, prismaLocal } from '../utils/prisma';

export const getAllQuestionPapers = async (req: Request, res: Response) => {
  try {
    const papers = await prismaLocal.questionPaper.findMany({
      orderBy: { uploadedAt: 'desc' }
    });

    // Fetch related data from main DB
    const classIds = [...new Set(papers.map(p => p.classId).filter(Boolean))];
    const subjectIds = [...new Set(papers.map(p => p.subjectId).filter(Boolean))];
    const examIds = [...new Set(papers.map(p => p.examId).filter(Boolean))];

    const [classes, subjects, exams] = await Promise.all([
      prisma.class.findMany({ where: { id: { in: classIds } } }),
      prisma.subject.findMany({ where: { id: { in: subjectIds as string[] } } }),
      prisma.exam.findMany({ where: { id: { in: examIds as string[] } } })
    ]);

    const enrichedPapers = papers.map(paper => ({
      ...paper,
      class: classes.find(c => c.id === paper.classId) || null,
      subject: subjects.find(s => s.id === paper.subjectId) || null,
      exam: exams.find(e => e.id === paper.examId) || null,
    }));

    res.json(enrichedPapers);
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
      classId,
      uploadedBy: req.body.uploadedBy || 'system',
    };
    if (subjectId) data.subjectId = subjectId;
    if (examId) data.examId = examId;
    if (section) data.section = section;

    const paper = await prismaLocal.questionPaper.create({
      data
    });

    const [cls, subj, ex] = await Promise.all([
      prisma.class.findUnique({ where: { id: classId } }),
      subjectId ? prisma.subject.findUnique({ where: { id: subjectId } }) : null,
      examId ? prisma.exam.findUnique({ where: { id: examId } }) : null
    ]);

    res.status(201).json({
      ...paper,
      class: cls,
      subject: subj,
      exam: ex
    });
  } catch (error) {
    console.error('Error creating question paper:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteQuestionPaper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prismaLocal.questionPaper.delete({
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

    const updatedPaper = await prismaLocal.questionPaper.update({
      where: { id },
      data: { answerKey, answerKeyUrl }
    });
    
    // We don't necessarily need to attach relations for an update response, 
    // but we can if the frontend expects it.
    res.json(updatedPaper);
  } catch (error) {
    console.error('Error updating answer key:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

