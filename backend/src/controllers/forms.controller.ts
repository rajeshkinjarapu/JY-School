import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';

export const createForm = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, fields, targetRoles } = req.body;
    const createdById = req.user?.id;

    if (!createdById) return next(createError('Unauthorized', 401));
    if (!title || !fields) return next(createError('Title and fields are required', 400));

    const fieldsStr = typeof fields === 'string' ? fields : JSON.stringify(fields);

    const form = await prisma.customForm.create({
      data: {
        title,
        description,
        fields: fieldsStr,
        targetRoles: targetRoles || 'ALL',
        createdById,
      },
    });

    successResponse(res, form, 'Form created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getForms = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;

    if (!userRole || !userId) return next(createError('Unauthorized', 401));

    const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

    let forms;
    if (isAdmin) {
      // Admins see all forms
      forms = await prisma.customForm.findMany({
        include: {
          createdBy: { select: { name: true } },
          _count: { select: { submissions: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Non-admins see active forms targetting their role
      forms = await prisma.customForm.findMany({
        where: {
          isActive: true,
          OR: [
            { targetRoles: { contains: userRole } },
            { targetRoles: 'ALL' },
          ],
        },
        include: {
          createdBy: { select: { name: true } },
          submissions: {
            where: { submittedById: userId },
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    successResponse(res, forms, 'Forms fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const getFormDetails = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const form = await prisma.customForm.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true } },
      },
    });

    if (!form) return next(createError('Form not found', 404));

    successResponse(res, form, 'Form details fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const submitFormResponse = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // Form ID
    const { answers } = req.body;
    const submittedById = req.user?.id;

    if (!submittedById) return next(createError('Unauthorized', 401));
    if (!answers) return next(createError('Answers are required', 400));

    const form = await prisma.customForm.findUnique({ where: { id } });
    if (!form) return next(createError('Form not found', 404));

    // Check if user already submitted this form
    const existingSubmission = await prisma.formSubmission.findFirst({
      where: { formId: id, submittedById },
    });

    if (existingSubmission) {
      return next(createError('You have already submitted this form', 400));
    }

    const answersStr = typeof answers === 'string' ? answers : JSON.stringify(answers);

    const submission = await prisma.formSubmission.create({
      data: {
        formId: id,
        submittedById,
        answers: answersStr,
      },
    });

    successResponse(res, submission, 'Form submitted successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getFormSubmissions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // Form ID
    const userRole = req.user?.role;

    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      return next(createError('Forbidden', 403));
    }

    const submissions = await prisma.formSubmission.findMany({
      where: { formId: id },
      include: {
        submittedBy: { select: { name: true, email: true, role: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    successResponse(res, submissions, 'Submissions fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteForm = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      return next(createError('Forbidden', 403));
    }

    const form = await prisma.customForm.findUnique({ where: { id } });
    if (!form) return next(createError('Form not found', 404));

    await prisma.customForm.delete({ where: { id } });

    successResponse(res, null, 'Form deleted successfully');
  } catch (error) {
    next(error);
  }
};
