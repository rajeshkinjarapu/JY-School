import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const student = await prisma.student.findFirst({
      where: { rollNo: 'JY26-0044' },
      include: {
        marks: { include: { exam: true, subject: true }, orderBy: { createdAt: 'desc' } },
      },
    });
    console.log('Student:', student?.user?.name);
    console.log('Marks length:', student?.marks?.length);
    if (student?.marks?.length) {
      console.log('First mark:', JSON.stringify(student.marks[0], null, 2));
    }
  } catch (e) {
    console.error(e);
  }
}
main().finally(() => prisma.$disconnect());
