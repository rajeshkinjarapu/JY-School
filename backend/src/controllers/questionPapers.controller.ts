import { Request, Response } from 'express';
import { prisma, prismaLocal } from '../utils/prisma';

export const getAllQuestionPapers = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;
    const userId = (req as any).user?.id;

    let filter: any = {};

    // Filter based on roles
    if (userRole === 'STUDENT' || userRole === 'PARENT') {
      filter.status = 'PUBLISHED';
    } else if (userRole === 'TEACHER') {
      // Teachers can see approved/published papers, or drafts they uploaded themselves
      filter.OR = [
        { status: 'PUBLISHED' },
        { status: 'APPROVED' },
        { uploadedBy: userId }
      ];
    } // ADMIN and SUPER_ADMIN see all

    const papers = await prismaLocal.questionPaper.findMany({
      where: filter,
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
    const { title, classId, subjectId, fileUrl, examId, section, scheduledFor } = req.body;
    const userRole = (req as any).user?.role;
    const userId = (req as any).user?.id;

    // Check teacher permission if uploader is a teacher
    if (userRole === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId }
      });
      if (!teacher || !teacher.canUploadQuestionPapers) {
        return res.status(403).json({ message: 'You do not have permission to upload question papers.' });
      }
    }

    const data: any = {
      title,
      fileUrl,
      classId,
      uploadedBy: userId || 'system',
      status: (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') ? 'PUBLISHED' : 'PENDING_APPROVAL'
    };
    if (subjectId) data.subjectId = subjectId;
    if (examId) data.examId = examId;
    if (section) data.section = section;
    if (scheduledFor) data.scheduledFor = new Date(scheduledFor);

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
    
    res.json(updatedPaper);
  } catch (error) {
    console.error('Error updating answer key:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const approveQuestionPaper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const updatedPaper = await prismaLocal.questionPaper.update({
      where: { id },
      data: { 
        status: 'APPROVED',
        approvedBy: userId
      }
    });
    res.json(updatedPaper);
  } catch (error) {
    console.error('Error approving paper:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const rejectQuestionPaper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedPaper = await prismaLocal.questionPaper.update({
      where: { id },
      data: { status: 'REJECTED' }
    });
    res.json(updatedPaper);
  } catch (error) {
    console.error('Error rejecting paper:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const publishQuestionPaper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedPaper = await prismaLocal.questionPaper.update({
      where: { id },
      data: { status: 'PUBLISHED' }
    });
    res.json(updatedPaper);
  } catch (error) {
    console.error('Error publishing paper:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getQuestionPaperDashboardStats = async (req: Request, res: Response) => {
  try {
    const [totalPapers, publishedPapers, answerKeys, scheduledPapers, totalQuestions] = await Promise.all([
      prismaLocal.questionPaper.count(),
      prismaLocal.questionPaper.count({ where: { status: 'PUBLISHED' } }),
      prismaLocal.questionPaper.count({ where: { answerKeyUrl: { not: null } } }),
      prismaLocal.questionPaper.count({
        where: {
          scheduledFor: { not: null, gt: new Date() }
        }
      }),
      prisma.questionBank.count()
    ]);

    res.json({
      totalPapers,
      publishedPapers,
      answerKeys,
      scheduledPapers,
      totalQuestions
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const toggleTeacherPermission = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.body; // Primary ID of the Teacher model
    const { canUpload } = req.body;

    const updatedTeacher = await prisma.teacher.update({
      where: { id: teacherId },
      data: { canUploadQuestionPapers: canUpload },
      include: { user: { select: { name: true, email: true } } }
    });

    res.json({
      message: `Permissions updated successfully for ${updatedTeacher.user.name}`,
      teacher: updatedTeacher
    });
  } catch (error) {
    console.error('Error toggling teacher permission:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

