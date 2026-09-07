const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const examId = '9f997160-3621-4fe4-a596-f6d725bf6c70';
  const classId = 'c92f5aba-2ed2-4203-8139-2b1f2ee55a6d';
  const exam = await prisma.exam.findUnique({ where: { id: examId }});
  console.log("Exam Frozen Classes:", exam.frozenClasses);
  console.log("Type:", typeof exam.frozenClasses);
  console.log("Is Array?", Array.isArray(exam.frozenClasses));
  
  if (Array.isArray(exam.frozenClasses)) {
    console.log("Includes classId?", exam.frozenClasses.includes(classId));
  } else if (typeof exam.frozenClasses === 'string') {
    const parsed = JSON.parse(exam.frozenClasses);
    console.log("Parsed includes classId?", parsed.includes(classId));
  }

  // Find all marks for this class/exam
  const students = await prisma.student.findMany({ where: { classId: classId } });
  const studentIds = students.map(s => s.id);
  const marks = await prisma.mark.findMany({ where: { examId: examId, studentId: { in: studentIds } } });
  console.log("Marks count for this class:", marks.length);
  
  // Find other students who have marks in this exam
  const allMarks = await prisma.mark.findMany({ where: { examId: examId } });
  console.log("All Marks count for this exam:", allMarks.length);
  
  if (allMarks.length > 0) {
    const s = await prisma.student.findUnique({ where: { id: allMarks[0].studentId }});
    console.log("One student with marks has classId:", s.classId);
    console.log("Current classId is:", classId);
  }
}
main().finally(() => prisma.$disconnect());
