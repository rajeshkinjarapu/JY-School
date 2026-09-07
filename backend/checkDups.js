const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicates() {
  console.log("Checking for duplicate marks...");
  const allMarks = await prisma.mark.findMany({
    include: {
      student: { include: { class: true } },
      exam: true,
      subject: true
    }
  });

  // group by examId_studentId_subjectName
  const groups = {};
  for (const m of allMarks) {
    const subName = m.subject.name.toLowerCase().trim();
    const key = `${m.examId}_${m.studentId}_${subName}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }

  let duplicateCount = 0;
  const classesAffected = new Set();
  
  for (const key in groups) {
    if (groups[key].length > 1) {
      duplicateCount++;
      const sample = groups[key][0];
      const className = sample.student.class ? `${sample.student.class.name}-${sample.student.class.section}` : 'Unknown';
      classesAffected.add(`${className} (Exam: ${sample.exam.name})`);
    }
  }

  console.log(`Found ${duplicateCount} duplicate mark entries.`);
  if (duplicateCount > 0) {
    console.log("Classes affected by this duplicate issue:");
    Array.from(classesAffected).forEach(c => console.log(`- ${c}`));
  } else {
    console.log("No other classes are affected.");
  }

  await prisma.$disconnect();
}

checkDuplicates().catch(console.error);
