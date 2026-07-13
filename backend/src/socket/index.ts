import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';

let io: SocketServer;

export const initSocket = (server: HttpServer): SocketServer => {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on('join', (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    socket.on('send_message', (data: { receiverId: string; content: string; senderId: string; senderName: string }) => {
      io.to(`user:${data.receiverId}`).emit('new_message', {
        senderId: data.senderId,
        senderName: data.senderName,
        content: data.content,
        sentAt: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketServer => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

export const emitToUser = (userId: string, event: string, data: unknown): void => {
  getIO().to(`user:${userId}`).emit(event, data);
};
