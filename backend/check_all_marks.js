const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const marksCount = await prisma.mark.count();
    console.log('Total marks in DB:', marksCount);
    
    // Check marks for 6th C
    const marksByClass = await prisma.mark.findMany({
      include: {
        student: { include: { class: true } }
      }
    });
    
    const classCount = {};
    for (const m of marksByClass) {
      const c = m.student?.class?.name || 'Unknown';
      classCount[c] = (classCount[c] || 0) + 1;
    }
    console.log('Marks by class:', classCount);
    
    // Check which students have marks
    const studentsWithMarks = [...new Set(marksByClass.map(m => m.student?.name))];
    console.log('Students with marks:', studentsWithMarks);
  } catch (e) {
    console.error(e);
  }
}
main().finally(() => prisma.$disconnect());
