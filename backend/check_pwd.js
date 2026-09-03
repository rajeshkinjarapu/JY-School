const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const user = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  console.log("Password string:", user.password);
}
check().finally(() => prisma.$disconnect());
