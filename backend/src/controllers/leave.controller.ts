import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';

export const requestLeave = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { type, startDate, endDate, reason } = req.body;
  const userId = req.user!.id;

  const leave = await prisma.leaveRequest.create({
    data: {
      userId,
      type, // LEAVE, PERMISSION
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      reason,
    },
  });

  successResponse(res, leave, 'Leave requested successfully', 201);
};

export const getMyLeaves = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const leaves = await prisma.leaveRequest.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  successResponse(res, leaves, 'My leaves fetched');
};

export const getAllLeaves = async (req: AuthRequest, res: Response): Promise<void> => {
  const leaves = await prisma.leaveRequest.findMany({
    include: {
      requester: { select: { name: true, role: true, photoUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  successResponse(res, leaves, 'All leaves fetched');
};

export const updateLeaveStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;
  const approvedById = req.user!.id;

  const leave = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!leave) return next(createError('Leave not found', 404));

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status, // APPROVED, REJECTED
      approvedById,
      rejectionReason: status === 'REJECTED' ? rejectionReason : null,
    },
  });

  successResponse(res, updated, 'Leave status updated');
};
