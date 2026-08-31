const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.schoolSettings.findFirst();
  console.log("Global Settings:", settings);
  
  const exam = await prisma.exam.findFirst({ where: { name: { contains: "JEE" } }});
  console.log("Exam Settings:", exam?.admitCardSettings);
}

main().catch(console.error).finally(() => prisma.$disconnect());
