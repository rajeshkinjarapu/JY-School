const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const student = await prisma.student.findFirst({
      where: {
        id: "fbb78a1a-b9c7-4f8d-913f-da16eecea701"
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true, isActive: true, createdAt: true } },
        class: true,
        marks: { 
          include: { 
            exam: { select: { id: true, name: true, term: true, examDate: true, maxMarks: true, passingMarks: true } }, 
            subject: true 
          }, 
          orderBy: { createdAt: 'desc' } 
        },
        feePayments: { include: { feeStructure: true }, orderBy: { createdAt: 'desc' } },
        feeDiscounts: true,
      },
    });
    console.log("Success! Marks length:", student.marks.length);
    console.log("FeePayments length:", student.feePayments.length);
  } catch (e) {
    console.error("Error occurred:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
