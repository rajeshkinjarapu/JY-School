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

    for (const mark of exam.marks) {
      const studentClassId = mark.student.classId;
      const classSubjects = getSubjectsForClassHelper(exam.subjects, studentClassId || undefined);

      const subKey = mark.subject.name.toUpperCase().trim();
      let actualMax = 50; // Default subject max marks for FA exams

      const foundInConfig = classSubjects.find((s: any) => s.name?.toUpperCase().trim() === subKey);
      if (foundInConfig && foundInConfig.maxMarks) {
        actualMax = Number(foundInConfig.maxMarks);
      } else if (mark.maxMarks > 0 && mark.maxMarks <= 200) {
        actualMax = mark.maxMarks;
      }

      const isAbsent = mark.remarks === 'AB';
      const grade = isAbsent ? 'F' : calculateGrade(mark.marksObtained, actualMax);

      if (mark.maxMarks !== actualMax || mark.grade !== grade) {
        await prisma.mark.update({
          where: { id: mark.id },
          data: {
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
