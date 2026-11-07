const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking & Updating Database Schema ---');
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "fatherAadhar" TEXT;`);
    console.log('✅ Column "fatherAadhar" successfully verified/added in "Student" table.');
    
    await prisma.$executeRawUnsafe(`ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "motherAadhar" TEXT;`);
    console.log('✅ Column "motherAadhar" successfully verified/added in "Student" table.');

    await prisma.$executeRawUnsafe(`ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "fatherPhone" TEXT;`);
    console.log('✅ Column "fatherPhone" successfully verified/added in "Student" table.');

    await prisma.$executeRawUnsafe(`ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "motherPhone" TEXT;`);
    console.log('✅ Column "motherPhone" successfully verified/added in "Student" table.');

    const check = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Student' AND column_name IN ('fatherAadhar', 'motherAadhar', 'fatherPhone', 'motherPhone', 'aadharNo');
    `);
    console.log('📊 Active Columns in Database:', check);
    console.log('🎉 Database is 100% ready for Father & Mother Aadhaar, and Father & Mother Phone!');
  } catch (err) {
    console.error('❌ Error executing database migration:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
