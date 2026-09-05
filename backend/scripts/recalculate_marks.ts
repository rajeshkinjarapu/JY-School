import { prisma } from '../src/utils/prisma';
import { calculateGrade } from '../src/utils/helpers';
import { getSubjectsForClassHelper } from '../src/controllers/exams.controller';

async function recalculateMarks() {
  console.log('🔄 Starting Exam Marks & Percentages Recalculation...');

  const exams = await prisma.exam.findMany({
    include: {
      marks: {
        include: {
          student: true,
          subject: true
        }
      }
    }
  });

  let updatedCount = 0;

  for (const exam of exams) {
    console.log(`\n📌 Processing Exam: "${exam.name}" (ID: ${exam.id})`);

    const isJEE = exam.name.toUpperCase().includes('JEE');
    const isSA = exam.name.toUpperCase().includes('SA-') || exam.name.toUpperCase().includes('SUMMATIVE');
    const defaultMax = (isJEE || isSA) ? 100 : 50;

    for (const mark of exam.marks) {
      const studentClassId = mark.student.classId;
      const classSubjects = getSubjectsForClassHelper(exam.subjects, studentClassId || undefined);

      const subKey = mark.subject.name.toUpperCase().trim();
      let actualMax = defaultMax;

      const foundInConfig = classSubjects.find((s: any) => s.name?.toUpperCase().trim() === subKey);
      if (foundInConfig && Number(foundInConfig.maxMarks) > 0) {
        actualMax = Number(foundInConfig.maxMarks);
      } else if (mark.maxMarks > 0 && mark.maxMarks <= 200) {
        actualMax = mark.maxMarks;
      } else {
        actualMax = defaultMax;
      }

      if (actualMax <= 0) actualMax = defaultMax;

      // Ensure marksObtained doesn't exceed actualMax
      const safeObtained = mark.marksObtained > actualMax ? actualMax : mark.marksObtained;
      const isAbsent = mark.remarks === 'AB';
      const grade = isAbsent ? 'F' : calculateGrade(safeObtained, actualMax);

      if (mark.maxMarks !== actualMax || mark.grade !== grade || mark.marksObtained !== safeObtained) {
        await prisma.mark.update({
          where: { id: mark.id },
          data: {
            marksObtained: safeObtained,
            maxMarks: actualMax,
            grade: grade
          }
        });
        updatedCount++;
      }
    }
  }

  console.log(`\n🎉 Successfully recalculated and fixed ${updatedCount} mark records!`);
}

recalculateMarks()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error recalculating marks:', err);
    process.exit(1);
  });
