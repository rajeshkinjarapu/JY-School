import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

import { initSocket } from './socket';
import { errorHandler } from './middlewares/errorHandler';
import { rateLimiter } from './middlewares/rateLimiter';
// Removed auditNotificationMiddleware import

// Routes
import authRoutes from './routes/auth';
import studentRoutes from './routes/students';
import teacherRoutes from './routes/teachers';
import classRoutes from './routes/classes';
import subjectRoutes from './routes/subjects';
import attendanceRoutes from './routes/attendance';
import examRoutes from './routes/exams';
import questionPaperRoutes from './routes/questionPapers';
import slipTestRoutes from './routes/slipTests';
import markRoutes from './routes/marks';
import timetableRoutes from './routes/timetable';
import feeRoutes from './routes/fees';
import announcementRoutes from './routes/announcements';
import messageRoutes from './routes/messages';
import dashboardRoutes from './routes/dashboard';
import reportRoutes from './routes/reports';
import settingsRoutes from './routes/settings';
import uploadRoutes from './routes/uploads';
import userRoutes from './routes/users';
import eventRoutes from './routes/events';
import examsExtendedRoutes from './routes/examsExtended';

import latexRoutes from './routes/latex';
import gatePassRoutes from './routes/gatePass';
import notificationRoutes from './routes/notification.routes';
import homeworkRoutes from './routes/homework';
import teacherAttendanceRoutes from './routes/teacherAttendance';
import salaryRoutes from './routes/salary';
import leaveRoutes from './routes/leave';
import questionBankRoutes from './routes/questionBank';
import generatedPapersRoutes from './routes/generatedPapers';
import transportRoutes from './routes/transport.routes';

const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);

// Init Socket.io (Only if not on Vercel)
if (!process.env.VERCEL) {
  initSocket(httpServer);
}

// Enable CORS for all origins including Vercel and Railway
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));
app.options('*', cors() as any);

// Core Middleware
app.use(helmet({ 
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(rateLimiter);
// app.use(auditNotificationMiddleware as any); // Disabled to prevent duplicate generic notifications

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/question-papers', questionPaperRoutes);
app.use('/api/slip-tests', slipTestRoutes);
app.use('/api/marks', markRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/exams-extended', examsExtendedRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api/latex', latexRoutes);
app.use('/api/gate-pass', gatePassRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/teacher-attendance', teacherAttendanceRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api', questionBankRoutes);
app.use('/api/generated-papers', generatedPapersRoutes);
app.use('/api/transport', transportRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler for API routes
app.use('*', (_req, res) => {
  res.status(404).json({ success: false, message: 'JY School API Server: Route not found. Please use the Vercel frontend app.' });
});

// Global error handler
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '5000', 10);
if (!process.env.VERCEL) {
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 JY School SMS Backend running on http://0.0.0.0:${PORT}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV}`);
  });
}

export default app;
