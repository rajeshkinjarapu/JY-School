import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.deleteMany({
    where: { role: 'STUDENT' }
  });
  console.log(`Deleted ${result.count} students.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
