import { prisma } from './prisma';

/**
 * Ensures that high-quality, pre-populated NTA-style Competitive Exams
 * (JEE Mains, NEET, Navodaya Entrance) are available out-of-the-box in the database.
 */
export async function ensureCompetitiveExams(): Promise<void> {
  try {
    const existingCount = await prisma.competitiveExam.count();
    if (existingCount > 0) {
      console.log(`✅ [CompetitiveExams] Already populated with ${existingCount} exams.`);
      return;
    }

    console.log('🌱 [CompetitiveExams] Seeding NTA-style competitive mock exams...');

    // 1. Get or create a default Class & Subject
    let defaultClass = await prisma.class.findFirst();
    if (!defaultClass) {
      defaultClass = await prisma.class.create({
        data: {
          name: '10th',
          section: 'A',
          academicYear: '2024-2025',
          capacity: 50,
        },
      });
    }

    let defaultSubject = await prisma.subject.findFirst({
      where: { name: { in: ['Mathematics', 'Physics', 'Science', 'Maths'] } },
    });
    if (!defaultSubject) {
      defaultSubject = await prisma.subject.findFirst();
      if (!defaultSubject) {
        defaultSubject = await prisma.subject.create({
          data: {
            name: 'Mathematics',
            code: 'MTH-101',
            type: 'THEORY',
          },
        });
      }
    }

    const startTime = new Date();
    const endTime = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year active

    // ───────────────────────────────────────────────────────────
    // EXAM 1: JEE Mains All India Grand Mock Test #1
    // ───────────────────────────────────────────────────────────
    const jeeExam = await prisma.competitiveExam.create({
      data: {
        title: 'JEE Mains 2026 - All India Grand Mock Test #1',
        classId: defaultClass.id,
        subjectId: defaultSubject.id,
        duration: 180, // 3 hours
        totalMarks: 300,
        passMarks: 100,
        negativeMarks: 1, // +4, -1 pattern
        isPublished: true,
        startTime,
        endTime,
      },
    });

    const jeeQuestions = [
      {
        questionText: 'If A and B are two sets such that n(A) = 3 and n(B) = 6, then the minimum number of elements in A \\cup B is:',
        options: JSON.stringify(['3', '6', '9', '18']),
        correctAnswer: '6',
        marks: 4,
        difficulty: 'EASY',
        chapterName: 'Sets & Relations',
      },
      {
        questionText: 'The value of \\lim_{x \\to 0} \\frac{\\sin 5x}{x} is equal to:',
        options: JSON.stringify(['1', '5', '0', 'Does not exist']),
        correctAnswer: '5',
        marks: 4,
        difficulty: 'EASY',
        chapterName: 'Limits & Derivatives',
      },
      {
        questionText: 'The unit of Universal Gravitational Constant (G) in the SI system is:',
        options: JSON.stringify(['N m^2 kg^{-2}', 'N m kg^{-1}', 'N m^2 kg^{-1}', 'N kg^2 m^{-2}']),
        correctAnswer: 'N m^2 kg^{-2}',
        marks: 4,
        difficulty: 'MEDIUM',
        chapterName: 'Units & Measurements',
      },
      {
        questionText: 'A projectile is launched with velocity v at an angle of 45^\\circ with the horizontal. The maximum horizontal range R is:',
        options: JSON.stringify(['v^2 / g', 'v / g', 'v^2 / (2g)', '2v^2 / g']),
        correctAnswer: 'v^2 / g',
        marks: 4,
        difficulty: 'MEDIUM',
        chapterName: 'Kinematics & Motion',
      },
      {
        questionText: 'The oxidation state of Oxygen in Hydrogen Peroxide (H_2O_2) is:',
        options: JSON.stringify(['-2', '-1', '+1', '+2']),
        correctAnswer: '-1',
        marks: 4,
        difficulty: 'MEDIUM',
        chapterName: 'Redox Reactions',
      },
      {
        questionText: 'What is the pH of pure neutral water at standard room temperature (25^\\circ C)?',
        options: JSON.stringify(['0', '7', '14', '1']),
        correctAnswer: '7',
        marks: 4,
        difficulty: 'EASY',
        chapterName: 'Chemical Equilibrium',
      },
      {
        questionText: 'If matrix A is of order 3 \\times 4 and matrix B is of order 4 \\times 2, then the order of the product AB is:',
        options: JSON.stringify(['3 \\times 2', '4 \\times 4', '3 \\times 4', 'Cannot be multiplied']),
        correctAnswer: '3 \\times 2',
        marks: 4,
        difficulty: 'MEDIUM',
        chapterName: 'Matrices & Determinants',
      },
      {
        questionText: 'The speed of light in vacuum is approximately equal to:',
        options: JSON.stringify(['3 \\times 10^8 \\text{ m/s}', '3 \\times 10^6 \\text{ m/s}', '3 \\times 10^{10} \\text{ m/s}', '3 \\times 10^5 \\text{ m/s}']),
        correctAnswer: '3 \\times 10^8 \\text{ m/s}',
        marks: 4,
        difficulty: 'EASY',
        chapterName: 'Optics',
      },
      {
        questionText: 'Which gas is released when Sodium metal reacts with absolute Ethanol?',
        options: JSON.stringify(['Oxygen', 'Hydrogen', 'Carbon Dioxide', 'Methane']),
        correctAnswer: 'Hydrogen',
        marks: 4,
        difficulty: 'MEDIUM',
        chapterName: 'Organic Chemistry',
      },
      {
        questionText: 'The roots of the quadratic equation x^2 - 7x + 12 = 0 are:',
        options: JSON.stringify(['3 and 4', '2 and 6', '-3 and -4', '1 and 12']),
        correctAnswer: '3 and 4',
        marks: 4,
        difficulty: 'EASY',
        chapterName: 'Quadratic Equations',
      },
    ];

    for (const q of jeeQuestions) {
      await prisma.competitiveExamQuestion.create({
        data: {
          competitiveExamId: jeeExam.id,
          questionType: 'MCQ',
          ...q,
        },
      });
    }

    // ───────────────────────────────────────────────────────────
    // EXAM 2: NEET UG 2026 - National Speed Practice Test
    // ───────────────────────────────────────────────────────────
    const neetExam = await prisma.competitiveExam.create({
      data: {
        title: 'NEET UG 2026 - National Speed Practice Test',
        classId: defaultClass.id,
        subjectId: defaultSubject.id,
        duration: 200, // 3 hours 20 mins
        totalMarks: 720,
        passMarks: 250,
        negativeMarks: 1, // +4, -1 pattern
        isPublished: true,
        startTime,
        endTime,
      },
    });

    const neetQuestions = [
      {
        questionText: 'Which organelle is popularly known as the powerhouse of the cell?',
        options: JSON.stringify(['Ribosome', 'Mitochondria', 'Golgi Apparatus', 'Lysosome']),
        correctAnswer: 'Mitochondria',
        marks: 4,
        difficulty: 'EASY',
        chapterName: 'Cell Biology',
      },
      {
        questionText: 'The primary site of gaseous exchange in human lungs is:',
        options: JSON.stringify(['Trachea', 'Bronchi', 'Alveoli', 'Larynx']),
        correctAnswer: 'Alveoli',
        marks: 4,
        difficulty: 'EASY',
        chapterName: 'Human Physiology',
      },
      {
        questionText: 'Photosynthesis primarily occurs in which plant cell organelle?',
        options: JSON.stringify(['Chloroplast', 'Vacuole', 'Centrosome', 'Peroxisome']),
        correctAnswer: 'Chloroplast',
        marks: 4,
        difficulty: 'EASY',
        chapterName: 'Plant Physiology',
      },
      {
        questionText: 'Which vitamin is essential for blood clotting in humans?',
        options: JSON.stringify(['Vitamin A', 'Vitamin C', 'Vitamin K', 'Vitamin D']),
        correctAnswer: 'Vitamin K',
        marks: 4,
        difficulty: 'MEDIUM',
        chapterName: 'Biomolecules',
      },
      {
        questionText: 'The functional unit of the human kidney is called:',
        options: JSON.stringify(['Neuron', 'Nephron', 'Glomerulus', 'Axon']),
        correctAnswer: 'Nephron',
        marks: 4,
        difficulty: 'EASY',
        chapterName: 'Excretory System',
      },
    ];

    for (const q of neetQuestions) {
      await prisma.competitiveExamQuestion.create({
        data: {
          competitiveExamId: neetExam.id,
          questionType: 'MCQ',
          ...q,
        },
      });
    }

    // ───────────────────────────────────────────────────────────
    // EXAM 3: Navodaya & Sainik School 6th Entrance Mock Exam
    // ───────────────────────────────────────────────────────────
    const navodayaExam = await prisma.competitiveExam.create({
      data: {
        title: 'Navodaya & Sainik School 6th Entrance Mock Exam',
        classId: defaultClass.id,
        subjectId: defaultSubject.id,
        duration: 120, // 2 hours
        totalMarks: 100,
        passMarks: 40,
        negativeMarks: 0, // No negative marks in Navodaya
        isPublished: true,
        startTime,
        endTime,
      },
    });

    const navodayaQuestions = [
      {
        questionText: 'What is the sum of the first 5 prime numbers (2, 3, 5, 7, 11)?',
        options: JSON.stringify(['26', '28', '29', '30']),
        correctAnswer: '28',
        marks: 5,
        difficulty: 'EASY',
        chapterName: 'Arithmetic & Numbers',
      },
      {
        questionText: 'Find the odd one out among the following words:',
        options: JSON.stringify(['Square', 'Triangle', 'Rectangle', 'Circle']),
        correctAnswer: 'Circle',
        marks: 5,
        difficulty: 'EASY',
        chapterName: 'Mental Ability (Classifications)',
      },
      {
        questionText: 'A train 150 meters long crosses a pole in 15 seconds. What is the speed of the train in km/h?',
        options: JSON.stringify(['36 km/h', '45 km/h', '54 km/h', '60 km/h']),
        correctAnswer: '36 km/h',
        marks: 5,
        difficulty: 'MEDIUM',
        chapterName: 'Speed, Distance & Time',
      },
      {
        questionText: 'What is 25% of 600?',
        options: JSON.stringify(['120', '150', '175', '200']),
        correctAnswer: '150',
        marks: 5,
        difficulty: 'EASY',
        chapterName: 'Percentages',
      },
    ];

    for (const q of navodayaQuestions) {
      await prisma.competitiveExamQuestion.create({
        data: {
          competitiveExamId: navodayaExam.id,
          questionType: 'MCQ',
          ...q,
        },
      });
    }

    console.log('🎉 [CompetitiveExams] Successfully seeded JEE Mains, NEET, and Navodaya Mock Exams!');
  } catch (err: any) {
    console.warn('⚠️ [CompetitiveExams] ensureCompetitiveExams error:', err?.message);
  }
}
