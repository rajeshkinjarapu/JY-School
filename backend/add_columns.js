const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Checking and adding childId & apaarId columns to Student table...');
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "childId" TEXT;`);
    console.log('✅ Column "childId" created/verified successfully.');
  } catch (err) {
    console.error('❌ Error adding childId:', err.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "apaarId" TEXT;`);
    console.log('✅ Column "apaarId" created/verified successfully.');
  } catch (err) {
    console.error('❌ Error adding apaarId:', err.message);
  }

  try {
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Student_childId_idx" ON "Student"("childId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Student_apaarId_idx" ON "Student"("apaarId");`);
    console.log('✅ Indexes for childId and apaarId created/verified successfully.');
  } catch (err) {
    console.error('❌ Error creating indexes:', err.message);
  }

  console.log('🎉 Database migration complete! All Student columns are ready.');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Fatal migration error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
