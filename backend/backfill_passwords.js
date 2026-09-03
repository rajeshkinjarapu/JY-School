const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfill() {
  const result = await prisma.user.updateMany({
    where: { role: 'STUDENT' },
    data: { plainPassword: 'Student2026' }
  });
  console.log(`Backfilled plainPassword for ${result.count} students.`);
}

backfill().finally(() => prisma.$disconnect());
