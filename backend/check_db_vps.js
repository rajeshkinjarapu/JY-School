const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const student = await prisma.student.findFirst({
    where: { rollNo: 'JY26-6047' },
    include: { class: true, user: true }
  });
  console.log("================================");
  console.log("Student Name:", student?.user?.name);
  console.log("Class:", student?.class?.name, student?.class?.section);
  console.log("Academic Year in DB:", student?.class?.academicYear);
  console.log("================================");
}
main().finally(() => prisma.$disconnect());
