import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const papers = await prisma.generatedPaper.findMany({
      select: {
        id: true,
        examName: true,
        examClass: true,
        examSubject: true,
        createdAt: true
      }
    });
    console.log('Generated papers in database:');
    console.log(JSON.stringify(papers, null, 2));
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
