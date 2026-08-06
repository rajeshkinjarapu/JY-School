const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDates() {
  const payments = await prisma.feePayment.findMany();
  let fixedCount = 0;
  for (const payment of payments) {
    if (payment.paymentDate && payment.paymentDate.getFullYear() === 1970) {
      console.log(`Fixing payment ${payment.id} from 1970 to ${payment.createdAt}`);
      await prisma.feePayment.update({
        where: { id: payment.id },
        data: { paymentDate: payment.createdAt }
      });
      fixedCount++;
    }
  }
  console.log(`Fixed ${fixedCount} payments with 1970 date.`);
}

fixDates().catch(console.error).finally(() => prisma.$disconnect());
