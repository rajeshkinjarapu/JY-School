const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const recentMarks = await prisma.mark.findMany({
      where: { createdAt: { gte: today } },
      include: { student: { include: { user: true, class: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    console.log(`Marks created today: ${recentMarks.length} (showing up to 10)`);
    recentMarks.forEach(m => {
      console.log(`Student: ${m.student?.user?.name}, Class: ${m.student?.class?.name}, Marks: ${m.marksObtained}`);
    });
  } catch (e) {
    console.error(e);
  }
}
main().finally(() => prisma.$disconnect());
