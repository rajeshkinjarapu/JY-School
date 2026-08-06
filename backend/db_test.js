const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.student.count();
  const students = await prisma.student.findMany({ take: 2 });
  fs.writeFileSync('db_test.json', JSON.stringify({ count, students }, null, 2));
}

main()
  .catch(e => fs.writeFileSync('db_test_err.txt', e.message))
  .finally(() => prisma.$disconnect());
