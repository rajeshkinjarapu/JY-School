import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const latestPayments = await prisma.feePayment.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      student: { select: { rollNo: true, user: { select: { name: true } } } },
    }
  });

  console.log('Latest 10 Fee Payments:');
  latestPayments.forEach(p => {
    console.log(`- ${p.createdAt}: ${p.student.rollNo} (${p.student.user?.name}) - Paid ${p.amountPaid} via ${p.method}. Status: ${p.status}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
