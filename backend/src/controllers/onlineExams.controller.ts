import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { generateQuizQuestions } from '../utils/gemini';

const sendResponse = (res: Response, statusCode: number, message: string, data?: any) => {
    return res.status(statusCode).json({ success: true, message, data });
};
const sendError = (res: Response, statusCode: number, message: string) => {
    return res.status(statusCode).json({ success: false, message });
};

// ----------------------------------------------------------------------
// Admin: Create Online Exam
// ----------------------------------------------------------------------
export const createOnlineExam = async (req: Request, res: Response) => {
    try {
        const { title, classId, subjectId, duration, startTime, endTime, totalMarks, passMarks } = req.body;

        if (!title || !classId || !subjectId || !duration || !startTime || !endTime) {
            return sendError(res, 400, 'All required fields must be provided');
        }

        const onlineExam = await prisma.onlineExam.create({
            data: {
                title,
                classId,
                subjectId,
                duration: parseInt(duration),
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                totalMarks: parseFloat(totalMarks || 100),
                passMarks: parseFloat(passMarks || 40),
                isPublished: false
            }
        });

        return sendResponse(res, 201, 'Online Exam created successfully', onlineExam);
    } catch (error) {
        console.error('Error creating online exam:', error);
        return sendError(res, 500, 'Server error while creating exam');
    }
};

// ----------------------------------------------------------------------
// Admin: Add Questions to Exam
// ----------------------------------------------------------------------
export const addQuestionToExam = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { questions } = req.body; // array of questions

        if (!questions || !Array.isArray(questions)) {
            return sendError(res, 400, 'Questions array is required');
        }

        // Check if exam exists
        const exam = await prisma.onlineExam.findUnique({ where: { id } });
        if (!exam) return sendError(res, 404, 'Exam not found');

        // Create Question Group for this exam if not using an existing one
        const group = await prisma.questionGroup.create({
            data: {
                name: `Group for Exam ${id} - ${Date.now()}`,
                description: `Auto-generated group for exam ${exam.title}`
            }
        });

        // Insert questions into QuestionBank and link to OnlineExamQuestion
        for (const q of questions) {
            const newQuestion = await prisma.questionBank.create({
                data: {
                    groupId: group.id,
                    questionText: q.questionText,
                    questionType: 'MCQ',
                    options: JSON.stringify(q.options),
                    correctAnswer: q.correctAnswer,
                    marks: parseFloat(q.marks || 1)
                }
            });

            await prisma.onlineExamQuestion.create({
                data: {
                    onlineExamId: id,
                    questionId: newQuestion.id
                }
            });
        }

        return sendResponse(res, 201, 'Questions added to exam successfully');
    } catch (error) {
        console.error('Error adding questions:', error);
        return sendError(res, 500, 'Server error while adding questions');
    }
};

// ----------------------------------------------------------------------
// Admin: Generate Questions with AI (Gemini)
// ----------------------------------------------------------------------
export const generateQuestionsWithAI = async (req: Request, res: Response) => {
    try {
        const file = req.file;
        const { prompt, instructions } = req.body;

        const aiPrompt = `
        ${instructions || 'Generate multiple choice questions.'}
        
        Text content to base questions on (if any):
        ${prompt || ''}
        `;

        const generatedQuestions = await generateQuizQuestions(aiPrompt, file);

        return sendResponse(res, 200, 'Questions generated successfully', generatedQuestions);
    } catch (error: any) {
        console.error('Error generating AI questions:', error);
        return sendError(res, 500, error.message || 'Server error while generating questions');
    }
};

// ----------------------------------------------------------------------
// Admin: Publish Exam
// ----------------------------------------------------------------------
export const publishOnlineExam = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const updated = await prisma.onlineExam.update({
            where: { id },
            data: { isPublished: true }
        });

        return sendResponse(res, 200, 'Exam published successfully', updated);
    } catch (error) {
        console.error('Error publishing exam:', error);
        return sendError(res, 500, 'Server error while publishing exam');
    }
};

// ----------------------------------------------------------------------
// Admin: Get All Exams
// ----------------------------------------------------------------------
export const getAllExamsAdmin = async (req: Request, res: Response) => {
    try {
        const exams = await prisma.onlineExam.findMany({
            include: {
                class: { select: { name: true, section: true } },
                subject: { select: { name: true } },
                _count: {
                    select: { questions: true, submissions: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return sendResponse(res, 200, 'Exams fetched successfully', exams);
    } catch (error) {
        console.error('Error fetching admin exams:', error);
        return sendError(res, 500, 'Server error while fetching exams');
    }
};

// ----------------------------------------------------------------------
// Admin: Get Exam Results
// ----------------------------------------------------------------------
export const getExamResults = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const submissions = await prisma.onlineExamSubmission.findMany({
            where: { onlineExamId: id },
            include: {
                student: {
                    include: {
                        user: { select: { name: true, email: true } }
                    }
                }
            },
            orderBy: { marksObtained: 'desc' }
        });

        return sendResponse(res, 200, 'Results fetched successfully', submissions);
    } catch (error) {
        console.error('Error fetching results:', error);
        return sendError(res, 500, 'Server error while fetching results');
    }
};

// ----------------------------------------------------------------------
// Student: Get Available Exams
// ----------------------------------------------------------------------
export const getStudentExams = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user.studentId;
        
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            select: { classId: true }
        });

        if (!student || !student.classId) {
            return sendError(res, 400, 'Student class not found');
        }

        const now = new Date();

        const exams = await prisma.onlineExam.findMany({
            where: {
                classId: student.classId,
                isPublished: true
            },
            include: {
                subject: { select: { name: true } },
                submissions: {
                    where: { studentId: studentId },
                    select: { id: true, marksObtained: true, submittedAt: true }
                },
                _count: {
                    select: { questions: true }
                }
            },
            orderBy: { startTime: 'asc' }
        });

        // Determine status (ACTIVE, UPCOMING, COMPLETED, MISSED)
        const mappedExams = exams.map(exam => {
            const hasSubmitted = exam.submissions.length > 0;
            const isStarted = now >= exam.startTime;
            const isEnded = now >= exam.endTime;

            let status = 'UPCOMING';
            if (hasSubmitted) status = 'COMPLETED';
            else if (isStarted && !isEnded) status = 'ACTIVE';
            else if (isEnded && !hasSubmitted) status = 'MISSED';

            return {
                ...exam,
                status,
                submission: hasSubmitted ? exam.submissions[0] : null,
                submissions: undefined // remove array
            };
        });

        return sendResponse(res, 200, 'Student exams fetched successfully', mappedExams);
    } catch (error) {
        console.error('Error fetching student exams:', error);
        return sendError(res, 500, 'Server error while fetching exams');
    }
};

// ----------------------------------------------------------------------
// Student: Take Exam (Get Questions WITHOUT Answers)
// ----------------------------------------------------------------------
export const takeExam = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const studentId = (req as any).user.studentId;

        // Check if student already submitted
        const existingSubmission = await prisma.onlineExamSubmission.findUnique({
            where: {
                onlineExamId_studentId: {
                    onlineExamId: id,
                    studentId: studentId
                }
            }
        });

        if (existingSubmission) {
            return sendError(res, 400, 'You have already submitted this exam');
        }

        const exam = await prisma.onlineExam.findUnique({
            where: { id },
            include: {
                questions: {
                    include: {
                        question: true
                    }
                }
            }
        });

        if (!exam) return sendError(res, 404, 'Exam not found');

        // Check time constraints
        const now = new Date();
        if (now < exam.startTime) return sendError(res, 400, 'Exam has not started yet');
        if (now > exam.endTime) return sendError(res, 400, 'Exam has ended');

        // Map questions and REMOVE correct answers
        const safeQuestions = exam.questions.map(eq => {
            const q = eq.question;
            return {
                id: q.id,
                questionText: q.questionText,
                options: q.options ? JSON.parse(q.options) : [],
                marks: q.marks,
                questionType: q.questionType
            };
        });

        return sendResponse(res, 200, 'Exam started', {
            id: exam.id,
            title: exam.title,
            duration: exam.duration,
            totalMarks: exam.totalMarks,
            endTime: exam.endTime,
            questions: safeQuestions
        });
    } catch (error) {
        console.error('Error taking exam:', error);
        return sendError(res, 500, 'Server error while starting exam');
    }
};

// ----------------------------------------------------------------------
// Student: Submit Exam
// ----------------------------------------------------------------------
export const submitExam = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const studentId = (req as any).user.studentId;
        const { answers } = req.body; // e.g. { "questionId1": "Option A", "questionId2": "Option C" }

        if (!answers || typeof answers !== 'object') {
            return sendError(res, 400, 'Invalid answers format');
        }

        // Prevent duplicate submission
        const existingSubmission = await prisma.onlineExamSubmission.findUnique({
            where: {
                onlineExamId_studentId: {
                    onlineExamId: id,
                    studentId: studentId
                }
            }
        });

        if (existingSubmission) {
            return sendError(res, 400, 'You have already submitted this exam');
        }

        const exam = await prisma.onlineExam.findUnique({
            where: { id },
            include: {
                questions: {
                    include: { question: true }
                }
            }
        });

        if (!exam) return sendError(res, 404, 'Exam not found');

        // Evaluate answers
        let marksObtained = 0;
        const evaluationDetails: any[] = [];

        for (const eq of exam.questions) {
            const q = eq.question;
            const studentAnswer = answers[q.id];
            
            const isCorrect = studentAnswer === q.correctAnswer;
            if (isCorrect) {
                marksObtained += q.marks;
            }

            evaluationDetails.push({
                questionId: q.id,
                studentAnswer: studentAnswer || null,
                correctAnswer: q.correctAnswer,
                isCorrect,
                marksAwarded: isCorrect ? q.marks : 0
            });
        }

        // Save submission
        const submission = await prisma.onlineExamSubmission.create({
            data: {
                onlineExamId: id,
                studentId: studentId,
                answers: JSON.stringify(evaluationDetails),
                marksObtained: marksObtained
            }
        });

        return sendResponse(res, 200, 'Exam submitted successfully', {
            marksObtained,
            totalMarks: exam.totalMarks,
            submissionId: submission.id
        });
    } catch (error) {
        console.error('Error submitting exam:', error);
        return sendError(res, 500, 'Server error while submitting exam');
    }
};
