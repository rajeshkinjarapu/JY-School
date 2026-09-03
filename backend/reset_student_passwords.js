const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPasswords() {
  const hash = await bcrypt.hash('Student2026', 10);
  const result = await prisma.user.updateMany({
    where: { role: 'STUDENT' },
    data: { password: hash }
  });
  console.log(`Updated ${result.count} students passwords to Student2026`);
}

resetPasswords().finally(() => prisma.$disconnect());
