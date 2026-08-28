const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const exams = await prisma.exam.findMany({
      where: {},
      select: {
        id: true,
        name: true,
        term: true,
        examDate: true,
        maxMarks: true,
        passingMarks: true,
        admitCardPublished: true,
        subjects: true,
        createdAt: true,
        classes: { select: { id: true, name: true, section: true } },
        _count: { select: { marks: true } },
      },
      orderBy: { examDate: 'desc' },
    });
    console.log(exams);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
