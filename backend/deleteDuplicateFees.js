const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Finding duplicate fees...');
  
  // Find all fees named "Tuition fee" with a lowercase 'f'
  const feesToDelete = await prisma.feeStructure.findMany({
    where: {
      name: 'Tuition fee',
      studentId: { not: null }
    }
  });
  
  console.log(`Found ${feesToDelete.length} duplicate fees to delete.`);
  
  if (feesToDelete.length > 0) {
    const ids = feesToDelete.map(f => f.id);
    const result = await prisma.feeStructure.deleteMany({
      where: {
        id: { in: ids }
      }
    });
    console.log(`Deleted ${result.count} fees successfully.`);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
