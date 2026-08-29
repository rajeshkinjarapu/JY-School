import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { prisma } from '../utils/prisma';

export const applyLeave = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { type, startDate, endDate, reason, documentUrl, userId: targetUserId } = req.body;

    if (!type || !startDate || !reason) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    let finalUserId = currentUserId;

    // If a specific userId is provided in the body, verify if the current user has admin rights
    if (targetUserId && targetUserId !== currentUserId) {
      if (req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN') {
        finalUserId = targetUserId;
      } else {
        return res.status(403).json({ success: false, message: 'Only admins can apply on behalf of other users' });
      }
    }

    // Optional: check leave balance here before creating

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId: finalUserId,
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

export const getMyLeaves = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const leaves = await prisma.leaveRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    let balance = await prisma.leaveBalance.findUnique({
      where: { userId },
    });

    if (!balance) {
      // Auto-create balance if it doesn't exist
      balance = await prisma.leaveBalance.create({
        data: { userId },
      });
    }

    res.status(200).json({ success: true, data: { leaves, balance } });
  } catch (error) {
    console.error('Error fetching my leaves:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leaves' });
  }
};

export const getAllLeaves = async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as string;
    
    const whereClause: any = {};
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    const leaves = await prisma.leaveRequest.findMany({
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

export const approveRejectLeave = async (req: AuthRequest, res: Response) => {
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

    const leave = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    const updatedLeave = await prisma.leaveRequest.update({
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

      let balance = await prisma.leaveBalance.findUnique({ where: { userId: leave.userId } });
      if (!balance) {
        balance = await prisma.leaveBalance.create({ data: { userId: leave.userId } });
      }

      if (leave.type === 'CASUAL') {
        await prisma.leaveBalance.update({
          where: { userId: leave.userId },
          data: { casualUsed: balance.casualUsed + days },
        });
      } else if (leave.type === 'SICK') {
        await prisma.leaveBalance.update({
          where: { userId: leave.userId },
          data: { sickUsed: balance.sickUsed + days },
        });
      } else if (leave.type === 'EARNED') {
        await prisma.leaveBalance.update({
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
export const updateLeave = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { type, startDate, endDate, reason, status } = req.body;
    const adminId = req.user?.id;
    if (!adminId || (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN')) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const leave = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
    const updatedLeave = await prisma.leaveRequest.update({
      where: { id },
      data: {
        type: type || leave.type,
        startDate: startDate ? new Date(startDate) : leave.startDate,
        endDate: endDate ? new Date(endDate) : leave.endDate,
        reason: reason || leave.reason,
        status: status || leave.status,
      },
    });
    res.status(200).json({ success: true, data: updatedLeave, message: 'Leave updated successfully' });
  } catch (error) {
    console.error('Error updating leave:', error);
    res.status(500).json({ success: false, message: 'Failed to update leave' });
  }
};

export const deleteLeave = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;
    if (!adminId || (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN')) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const leave = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
    await prisma.leaveRequest.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Leave deleted successfully' });
  } catch (error) {
    console.error('Error deleting leave:', error);
    res.status(500).json({ success: false, message: 'Failed to delete leave' });
  }
};
