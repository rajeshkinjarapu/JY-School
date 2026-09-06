import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const student = await prisma.student.findFirst({
      where: { rollNo: 'JY26-6013' },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true, isActive: true, createdAt: true } },
        class: true,
        marks: { include: { exam: true, subject: true }, orderBy: { createdAt: 'desc' } },
        feePayments: { include: { feeStructure: true }, orderBy: { createdAt: 'desc' } },
        feeDiscounts: true,
      },
    });
    console.log(JSON.stringify(student?.marks, null, 2));
  } catch (e) {
    console.error(e);
  }
}
main().finally(() => prisma.$disconnect());
