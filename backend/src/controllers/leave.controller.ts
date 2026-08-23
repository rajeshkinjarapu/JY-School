import { Request, Response } from 'express';
import { prisma } from '../index'; // or wherever prisma is exported from
// Adjusting import based on common patterns in this codebase.
import { PrismaClient } from '@prisma/client';

const prismaClient = new PrismaClient();

export const applyLeave = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { type, startDate, endDate, reason, documentUrl } = req.body;

    if (!type || !startDate || !reason) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Optional: check leave balance here before creating

    const leaveRequest = await prismaClient.leaveRequest.create({
      data: {
        userId,
        type,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        reason,
        documentUrl,
        status: 'PENDING',
      },
    });

    res.status(201).json({ success: true, data: leaveRequest, message: 'Leave applied successfully' });
  } catch (error) {
    console.error('Error applying leave:', error);
    res.status(500).json({ success: false, message: 'Failed to apply leave' });
  }
};

export const getMyLeaves = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const leaves = await prismaClient.leaveRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    let balance = await prismaClient.leaveBalance.findUnique({
      where: { userId },
    });

    if (!balance) {
      // Auto-create balance if it doesn't exist
      balance = await prismaClient.leaveBalance.create({
        data: { userId },
      });
    }

    res.status(200).json({ success: true, data: { leaves, balance } });
  } catch (error) {
    console.error('Error fetching my leaves:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leaves' });
  }
};

export const getAllLeaves = async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    
    const whereClause: any = {};
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    const leaves = await prismaClient.leaveRequest.findMany({
      where: whereClause,
      include: {
        requester: {
          select: { name: true, role: true, photoUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    console.error('Error fetching all leaves:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leaves' });
  }
};

export const approveRejectLeave = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body; // 'APPROVED' or 'REJECTED'
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const leave = await prismaClient.leaveRequest.findUnique({ where: { id } });
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    const updatedLeave = await prismaClient.leaveRequest.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        approvedById: adminId,
      },
    });

    // If approved, update balance
    if (status === 'APPROVED') {
      const days = leave.endDate
        ? Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 3600 * 24)) + 1
        : 1;

      let balance = await prismaClient.leaveBalance.findUnique({ where: { userId: leave.userId } });
      if (!balance) {
        balance = await prismaClient.leaveBalance.create({ data: { userId: leave.userId } });
      }

      if (leave.type === 'CASUAL') {
        await prismaClient.leaveBalance.update({
          where: { userId: leave.userId },
          data: { casualUsed: balance.casualUsed + days },
        });
      } else if (leave.type === 'SICK') {
        await prismaClient.leaveBalance.update({
          where: { userId: leave.userId },
          data: { sickUsed: balance.sickUsed + days },
        });
      } else if (leave.type === 'EARNED') {
        await prismaClient.leaveBalance.update({
          where: { userId: leave.userId },
          data: { earnedUsed: balance.earnedUsed + days },
        });
      }
    }

    res.status(200).json({ success: true, data: updatedLeave, message: `Leave ${status.toLowerCase()} successfully` });
  } catch (error) {
    console.error('Error updating leave status:', error);
    res.status(500).json({ success: false, message: 'Failed to update leave status' });
  }
};
