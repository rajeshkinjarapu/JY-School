import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const student = await prisma.student.findFirst({
    where: { rollNo: 'JY26-6013' },
    include: {
      marks: { include: { exam: true, subject: true } }
    }
  });
  console.log('Marks Data:', JSON.stringify(student?.marks, null, 2));
}
main().finally(() => prisma.$disconnect());
