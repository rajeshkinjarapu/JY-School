const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const student = await prisma.student.findFirst({ where: { rollNo: 'JY26-6013' }, include: { marks: true } });
  console.log('Marks:', student ? student.marks : 'No student');
}
main().finally(() => prisma.$disconnect());
