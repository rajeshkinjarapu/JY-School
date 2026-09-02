import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const student = await prisma.student.findFirst({
    where: { rollNo: { contains: 'JY26-6007' } },
    include: { class: true, user: true }
  });
  console.log("Student:", student?.user?.name);
  console.log("Class:", student?.class?.name, student?.class?.section);
  console.log("Academic Year in DB:", student?.class?.academicYear);
}
main().finally(() => prisma.$disconnect());
