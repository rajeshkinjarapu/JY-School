import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';
import { emitToUser } from '../socket';

export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  // Get all messages involving this user
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: {
      sender: { select: { id: true, name: true, photoUrl: true, role: true } },
      receiver: { select: { id: true, name: true, photoUrl: true, role: true } },
    },
    orderBy: { sentAt: 'desc' },
  });

  // Get unique conversation partners
  const partnerMap = new Map<string, any>();
  for (const msg of messages) {
    const partner = msg.senderId === userId ? msg.receiver : msg.sender;
    if (!partnerMap.has(partner.id)) {
      const unreadCount = await prisma.message.count({
        where: { senderId: partner.id, receiverId: userId, readStatus: 'UNREAD' },
      });
      partnerMap.set(partner.id, {
        partner,
        latestMessage: msg,
        unreadCount,
      });
    }
  }

  successResponse(res, Array.from(partnerMap.values()), 'Conversations fetched');
};

export const getConversation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.user!.id;
  const partnerId = req.params.userId as string;

  const partner = await prisma.user.findUnique({ where: { id: partnerId }, select: { id: true, name: true, photoUrl: true, role: true } });
  if (!partner) return next(createError('User not found', 404));

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: partnerId },
        { senderId: partnerId, receiverId: userId },
      ],
    },
    orderBy: { sentAt: 'asc' },
  });

  // Mark unread messages as read
  await prisma.message.updateMany({
    where: { senderId: partnerId, receiverId: userId, readStatus: 'UNREAD' },
    data: { readStatus: 'READ' },
  });

  successResponse(res, { partner, messages }, 'Conversation fetched');
};

export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { receiverId, content } = req.body;
  const senderId = req.user!.id;

  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) return next(createError('Receiver not found', 404));

  const message = await prisma.message.create({
    data: { senderId, receiverId, content },
    include: {
      sender: { select: { id: true, name: true, photoUrl: true } },
    },
  });

  // Emit real-time notification
  emitToUser(receiverId, 'new_message', {
    id: message.id,
    senderId,
    senderName: req.user!.name,
    content,
    sentAt: message.sentAt,
  });

  successResponse(res, message, 'Message sent', 201);
};

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  const count = await prisma.message.count({
    where: { receiverId: req.user!.id, readStatus: 'UNREAD' },
  });
  successResponse(res, { count }, 'Unread count fetched');
};
