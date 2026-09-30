import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { generateQuizQuestions } from '../utils/gemini';

// ==========================================
// ADMIN / TEACHER ROUTES
// ==========================================

export const createCompetitiveExam = async (req: Request, res: Response) => {
  try {
    const { title, classId, subjectId, teacherId, duration, startTime, endTime, totalMarks, passMarks, negativeMarks, isPublished } = req.body;
    
    const exam = await prisma.competitiveExam.create({
      data: {
        title, classId, subjectId, teacherId, duration, 
        startTime: new Date(startTime), 
        endTime: new Date(endTime), 
        totalMarks, passMarks, negativeMarks, isPublished
      }
    });
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create competitive exam' });
  }
};

export const getCompetitiveExamsByClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const exams = await prisma.competitiveExam.findMany({
      where: { classId },
      include: { subject: true, _count: { select: { questions: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch competitive exams' });
  }
};

export const getAllCompetitiveExams = async (req: Request, res: Response) => {
  try {
    const exams = await prisma.competitiveExam.findMany({
      include: { subject: true, class: true, _count: { select: { questions: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch all competitive exams' });
  }
};

export const addCompetitiveQuestion = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    const { questionText, questionType, imageUrl, options, correctAnswer, marks, chapterName, difficulty } = req.body;

    const q = await prisma.competitiveExamQuestion.create({
      data: {
        competitiveExamId: examId,
        questionText, questionType, imageUrl, options: JSON.stringify(options), correctAnswer, marks, chapterName, difficulty
      }
    });
    res.status(201).json({ success: true, data: q });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add question' });
  }
};

export const generateCompetitiveQuestionsAI = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    const { prompt, count, chapterName, difficulty } = req.body;

    const basePrompt = `Generate ${count} ${difficulty} level multiple choice questions for the chapter '${chapterName || 'General'}'. Focus: ${prompt}.
Return ONLY a valid JSON array of objects with keys: "questionText", "options" (array of 4 strings), "correctAnswer" (must match one option exactly). Do not include markdown code block formatting.`;

    const questionsData = await generateQuizQuestions(basePrompt);
    
    const savedQuestions = [];
    for (const q of questionsData) {
      const saved = await prisma.competitiveExamQuestion.create({
        data: {
          competitiveExamId: examId,
          questionText: q.questionText,
          questionType: 'MCQ',
          options: JSON.stringify(q.options),
          correctAnswer: q.correctAnswer,
          marks: 4, // Default marks for competitive like JEE
          chapterName: chapterName,
          difficulty: difficulty || 'MEDIUM'
        }
      });
      savedQuestions.push(saved);
    }
    
    res.status(201).json({ success: true, data: savedQuestions });
  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate competitive questions with AI' });
  }
};

// ==========================================
// STUDENT ROUTES
// ==========================================

export const getStudentCompetitiveExams = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user?.id; 
    const student = await prisma.student.findUnique({ where: { userId: studentId } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const exams = await prisma.competitiveExam.findMany({
      where: { classId: student.classId, isPublished: true },
      include: { 
        subject: true,
        submissions: { where: { studentId: student.id } }
      },
      orderBy: { startTime: 'desc' }
    });

    const mapped = exams.map(e => ({
      ...e,
      submission: e.submissions.length > 0 ? e.submissions[0] : null,
      submissions: undefined
    }));

    res.json({ success: true, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch student exams' });
  }
};

export const getCompetitiveExamDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const exam = await prisma.competitiveExam.findUnique({
      where: { id },
      include: {
        subject: true,
        questions: { select: { id: true, questionText: true, questionType: true, imageUrl: true, options: true, marks: true } }
      }
    });

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    // Parse options
    const parsedQuestions = exam.questions.map(q => ({
      ...q,
      options: q.options ? JSON.parse(q.options) : []
    }));

    res.json({ success: true, data: { ...exam, questions: parsedQuestions } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch exam details' });
  }
};

export const submitCompetitiveExam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // examId
    const { answers, totalTimeTaken } = req.body; // array of { questionId, selectedOption, timeTakenSeconds }
    const studentUserId = (req as any).user?.id;

    const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const exam = await prisma.competitiveExam.findUnique({
      where: { id },
      include: { questions: true }
    });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    // Check existing
    const existing = await prisma.competitiveExamSubmission.findUnique({
      where: { competitiveExamId_studentId: { competitiveExamId: id, studentId: student.id } }
    });
    if (existing) return res.status(400).json({ success: false, message: 'Already submitted' });

    let marksObtained = 0;
    const responseRecords = [];

    // Evaluate
    for (const ans of answers) {
      const q = exam.questions.find(x => x.id === ans.questionId);
      if (q) {
        const isCorrect = q.correctAnswer === ans.selectedOption;
        if (isCorrect) {
          marksObtained += q.marks;
        } else if (ans.selectedOption && ans.selectedOption !== '') {
          // Negative marking if answered incorrectly
          marksObtained -= exam.negativeMarks;
        }
        
        responseRecords.push({
          questionId: q.id,
          selectedOption: ans.selectedOption,
          isCorrect,
          timeTakenSeconds: ans.timeTakenSeconds || 0
        });
      }
    }

    const submission = await prisma.competitiveExamSubmission.create({
      data: {
        competitiveExamId: id,
        studentId: student.id,
        marksObtained,
        totalTimeTaken: totalTimeTaken || 0,
        responses: {
          create: responseRecords
        }
      },
      include: {
        responses: {
          include: { question: true }
        }
      }
    });

    res.json({ success: true, data: submission });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to submit exam' });
  }
};

 e x p o r t   c o n s t   g e t E x a m L e a d e r b o a r d   =   a s y n c   ( r e q :   R e q u e s t ,   r e s :   R e s p o n s e )   = >   { 
     t r y   { 
         c o n s t   {   i d   }   =   r e q . p a r a m s ; 
         c o n s t   s u b m i s s i o n s   =   a w a i t   p r i s m a . c o m p e t i t i v e E x a m S u b m i s s i o n . f i n d M a n y ( { 
             w h e r e :   {   c o m p e t i t i v e E x a m I d :   i d   } , 
             i n c l u d e :   { 
                 s t u d e n t :   { 
                     i n c l u d e :   { 
                         u s e r :   t r u e , 
                         c l a s s :   t r u e 
                     } 
                 } 
             } , 
             o r d e r B y :   [ 
                 {   m a r k s O b t a i n e d :   " d e s c "   } , 
                 {   t o t a l T i m e T a k e n :   " a s c "   } 
             ] 
         } ) ; 
         r e s . j s o n ( {   s u c c e s s :   t r u e ,   d a t a :   s u b m i s s i o n s   } ) ; 
     }   c a t c h   ( e r r o r )   { 
         r e s . s t a t u s ( 5 0 0 ) . j s o n ( {   s u c c e s s :   f a l s e ,   m e s s a g e :   " F a i l e d   t o   f e t c h   l e a d e r b o a r d "   } ) ; 
     } 
 } ; 
 
 e x p o r t   c o n s t   g e t S t u d e n t R e s u l t   =   a s y n c   ( r e q :   R e q u e s t ,   r e s :   R e s p o n s e )   = >   { 
     t r y   { 
         c o n s t   {   i d   }   =   r e q . p a r a m s ; 
         c o n s t   s t u d e n t U s e r I d   =   ( r e q   a s   a n y ) . u s e r ? . i d ; 
 
         c o n s t   s t u d e n t   =   a w a i t   p r i s m a . s t u d e n t . f i n d U n i q u e ( {   w h e r e :   {   u s e r I d :   s t u d e n t U s e r I d   }   } ) ; 
         i f   ( ! s t u d e n t )   r e t u r n   r e s . s t a t u s ( 4 0 4 ) . j s o n ( {   s u c c e s s :   f a l s e ,   m e s s a g e :   " S t u d e n t   n o t   f o u n d "   } ) ; 
 
         c o n s t   s u b m i s s i o n   =   a w a i t   p r i s m a . c o m p e t i t i v e E x a m S u b m i s s i o n . f i n d U n i q u e ( { 
             w h e r e :   {   c o m p e t i t i v e E x a m I d _ s t u d e n t I d :   {   c o m p e t i t i v e E x a m I d :   i d ,   s t u d e n t I d :   s t u d e n t . i d   }   } , 
             i n c l u d e :   { 
                 r e s p o n s e s :   { 
                     i n c l u d e :   {   q u e s t i o n :   t r u e   } 
                 } , 
                 e x a m :   t r u e 
             } 
         } ) ; 
 
         i f   ( ! s u b m i s s i o n )   r e t u r n   r e s . s t a t u s ( 4 0 4 ) . j s o n ( {   s u c c e s s :   f a l s e ,   m e s s a g e :   " R e s u l t   n o t   f o u n d "   } ) ; 
         r e s . j s o n ( {   s u c c e s s :   t r u e ,   d a t a :   s u b m i s s i o n   } ) ; 
     }   c a t c h   ( e r r o r )   { 
         r e s . s t a t u s ( 5 0 0 ) . j s o n ( {   s u c c e s s :   f a l s e ,   m e s s a g e :   " F a i l e d   t o   f e t c h   r e s u l t "   } ) ; 
     } 
 } ; 
 
 e x p o r t   c o n s t   d e l e t e C o m p e t i t i v e E x a m   =   a s y n c   ( r e q :   R e q u e s t ,   r e s :   R e s p o n s e )   = >   { 
     t r y   { 
         c o n s t   {   i d   }   =   r e q . p a r a m s ; 
         a w a i t   p r i s m a . c o m p e t i t i v e E x a m . d e l e t e ( {   w h e r e :   {   i d   }   } ) ; 
         r e s . j s o n ( {   s u c c e s s :   t r u e ,   m e s s a g e :   " E x a m   d e l e t e d   s u c c e s s f u l l y "   } ) ; 
     }   c a t c h   ( e r r o r )   { 
         r e s . s t a t u s ( 5 0 0 ) . j s o n ( {   s u c c e s s :   f a l s e ,   m e s s a g e :   " F a i l e d   t o   d e l e t e   e x a m "   } ) ; 
     } 
 } ; 
 
 e x p o r t   c o n s t   u p d a t e C o m p e t i t i v e E x a m   =   a s y n c   ( r e q :   R e q u e s t ,   r e s :   R e s p o n s e )   = >   { 
     t r y   { 
         c o n s t   {   i d   }   =   r e q . p a r a m s ; 
         c o n s t   {   t i t l e ,   d e s c r i p t i o n ,   e x a m D a t e ,   d u r a t i o n ,   t o t a l M a r k s ,   p a s s M a r k s ,   n e g a t i v e M a r k s ,   c l a s s e s   }   =   r e q . b o d y ; 
         
         c o n s t   e x a m   =   a w a i t   p r i s m a . c o m p e t i t i v e E x a m . u p d a t e ( { 
             w h e r e :   {   i d   } , 
             d a t a :   {   t i t l e ,   d e s c r i p t i o n ,   e x a m D a t e :   n e w   D a t e ( e x a m D a t e ) ,   d u r a t i o n ,   t o t a l M a r k s ,   p a s s M a r k s ,   n e g a t i v e M a r k s   } 
         } ) ; 
 
         i f   ( c l a s s e s )   { 
             a w a i t   p r i s m a . c o m p e t i t i v e E x a m C l a s s . d e l e t e M a n y ( {   w h e r e :   {   c o m p e t i t i v e E x a m I d :   i d   }   } ) ; 
             c o n s t   c l a s s R e c o r d s   =   c l a s s e s . m a p ( ( c I d :   s t r i n g )   = >   ( {   c o m p e t i t i v e E x a m I d :   i d ,   c l a s s I d :   c I d   } ) ) ; 
             a w a i t   p r i s m a . c o m p e t i t i v e E x a m C l a s s . c r e a t e M a n y ( {   d a t a :   c l a s s R e c o r d s   } ) ; 
         } 
 
         r e s . j s o n ( {   s u c c e s s :   t r u e ,   d a t a :   e x a m   } ) ; 
     }   c a t c h   ( e r r o r )   { 
         r e s . s t a t u s ( 5 0 0 ) . j s o n ( {   s u c c e s s :   f a l s e ,   m e s s a g e :   " F a i l e d   t o   u p d a t e   e x a m "   } ) ; 
     } 
 } ; 
 
 e x p o r t   c o n s t   u p d a t e C o m p e t i t i v e Q u e s t i o n   =   a s y n c   ( r e q :   R e q u e s t ,   r e s :   R e s p o n s e )   = >   { 
     t r y   { 
         c o n s t   {   q u e s t i o n I d   }   =   r e q . p a r a m s ; 
         c o n s t   {   q u e s t i o n T e x t ,   o p t i o n s ,   c o r r e c t A n s w e r ,   e x p l a n a t i o n ,   m a r k s   }   =   r e q . b o d y ; 
         
         c o n s t   q   =   a w a i t   p r i s m a . c o m p e t i t i v e E x a m Q u e s t i o n . u p d a t e ( { 
             w h e r e :   {   i d :   q u e s t i o n I d   } , 
             d a t a :   { 
                 q u e s t i o n T e x t , 
                 o p t i o n s :   J S O N . s t r i n g i f y ( o p t i o n s ) , 
                 c o r r e c t A n s w e r , 
                 e x p l a n a t i o n , 
                 m a r k s 
             } 
         } ) ; 
         r e s . j s o n ( {   s u c c e s s :   t r u e ,   d a t a :   q   } ) ; 
     }   c a t c h   ( e r r o r )   { 
         r e s . s t a t u s ( 5 0 0 ) . j s o n ( {   s u c c e s s :   f a l s e ,   m e s s a g e :   " F a i l e d   t o   u p d a t e   q u e s t i o n "   } ) ; 
     } 
 } ; 
 
 e x p o r t   c o n s t   d e l e t e C o m p e t i t i v e Q u e s t i o n   =   a s y n c   ( r e q :   R e q u e s t ,   r e s :   R e s p o n s e )   = >   { 
     t r y   { 
         c o n s t   {   q u e s t i o n I d   }   =   r e q . p a r a m s ; 
         a w a i t   p r i s m a . c o m p e t i t i v e E x a m Q u e s t i o n . d e l e t e ( {   w h e r e :   {   i d :   q u e s t i o n I d   }   } ) ; 
         r e s . j s o n ( {   s u c c e s s :   t r u e ,   m e s s a g e :   " Q u e s t i o n   d e l e t e d   s u c c e s s f u l l y "   } ) ; 
     }   c a t c h   ( e r r o r )   { 
         r e s . s t a t u s ( 5 0 0 ) . j s o n ( {   s u c c e s s :   f a l s e ,   m e s s a g e :   " F a i l e d   t o   d e l e t e   q u e s t i o n "   } ) ; 
     } 
 } ; 
  
 