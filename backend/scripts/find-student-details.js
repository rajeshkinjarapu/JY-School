// Script to deeply inspect NADIMANTI and NAKKA students, and check for any other surname/father mismatches
// Usage: node scripts/find-student-details.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('====================================================');
  console.log('🔍 DEEP STUDENT INSPECTION: NADIMANTI & NAKKA');
  console.log('====================================================\n');

  // 1. Search for NADIMANTI anywhere (Student, User, Father, Mother)
  console.log('--- 1. All records with "NADIMANTI" ---');
  const nadimantiStudents = await prisma.student.findMany({
    where: {
      OR: [
        { user: { name: { contains: 'NADIMANTI', mode: 'insensitive' } } },
        { fatherName: { contains: 'NADIMANTI', mode: 'insensitive' } },
        { motherName: { contains: 'NADIMANTI', mode: 'insensitive' } }
      ]
    },
    include: { user: true, class: true }
  });

  console.log(`Found ${nadimantiStudents.length} student(s) with NADIMANTI:`);
  nadimantiStudents.forEach(s => {
    console.log({
      rollNo: s.rollNo,
      studentName: s.user?.name,
      class: s.class?.name,
      section: s.class?.section,
      gender: s.gender,
      aadharNo: s.aadharNo,
      childId: s.childId,
      fatherName: s.fatherName,
      motherName: s.motherName,
      updatedAt: s.user?.updatedAt
    });
  });

  // 2. Search for NAKKA or NEERAJ anywhere
  console.log('\n--- 2. All records with "NAKKA" or "NEERAJ" ---');
  const nakkaStudents = await prisma.student.findMany({
    where: {
      OR: [
        { user: { name: { contains: 'NAKKA', mode: 'insensitive' } } },
        { user: { name: { contains: 'NEERAJ', mode: 'insensitive' } } },
        { fatherName: { contains: 'NAKKA', mode: 'insensitive' } },
        { motherName: { contains: 'NAKKA', mode: 'insensitive' } }
      ]
    },
    include: { user: true, class: true }
  });

  console.log(`Found ${nakkaStudents.length} student(s) with NAKKA / NEERAJ:`);
  nakkaStudents.forEach(s => {
    console.log({
      rollNo: s.rollNo,
      studentName: s.user?.name,
      class: s.class?.name,
      gender: s.gender,
      aadharNo: s.aadharNo,
      fatherName: s.fatherName,
      motherName: s.motherName,
      hasPhoto: !!s.user?.photoUrl,
      updatedAt: s.user?.updatedAt
    });
  });

  // 3. Full 6th Class roster with Roll No, Name, Gender, Father Name, Mother Name
  console.log('\n--- 3. All 6th Class Students (Check Roster Alignment) ---');
  const class6 = await prisma.student.findMany({
    where: {
      class: { name: { contains: '6' } }
    },
    orderBy: { rollNo: 'asc' },
    include: { user: true, class: true }
  });

  console.log(`Total 6th Class Students: ${class6.length}`);
  console.log('-------------------------------------------------------------------------------------------------------------------------');
  console.log('Roll No      | Student Name              | Gender | Father Name               | Mother Name               | Photo?');
  console.log('-------------------------------------------------------------------------------------------------------------------------');
  class6.forEach(s => {
    const roll = s.rollNo.padEnd(12);
    const name = (s.user?.name || '').padEnd(25);
    const gender = (s.gender || '').padEnd(6);
    const father = (s.fatherName || '').padEnd(25);
    const mother = (s.motherName || '').padEnd(25);
    const photo = s.user?.photoUrl ? 'YES' : 'NO ';
    console.log(`${roll} | ${name} | ${gender} | ${father} | ${mother} | ${photo}`);
  });
  console.log('-------------------------------------------------------------------------------------------------------------------------');

  // 4. Look for ANY student in the entire school where Student Surname does NOT match Father/Mother Surname
  console.log('\n--- 4. Checking for any other Surname mismatches across all 533 students ---');
  const allStudents = await prisma.student.findMany({
    include: { user: true, class: true }
  });

  const suspiciousList = [];
  allStudents.forEach(s => {
    const studentName = (s.user?.name || '').trim();
    const fatherName = (s.fatherName || '').trim();
    if (!studentName || !fatherName) return;

    const studentFirstWord = studentName.split(/[\s.]+/)[0].toUpperCase();
    const fatherFirstWord = fatherName.split(/[\s.]+/)[0].toUpperCase();

    // If first word (surname) is >= 3 chars and they don't match, and neither is initials like 'K', 'P', 'S'
    if (studentFirstWord.length >= 3 && fatherFirstWord.length >= 3 && studentFirstWord !== fatherFirstWord) {
      suspiciousList.push({
        rollNo: s.rollNo,
        studentName,
        gender: s.gender,
        className: s.class?.name,
        fatherName,
        motherName: s.motherName
      });
    }
  });

  console.log(`Found ${suspiciousList.length} student(s) where Student surname != Father surname:`);
  suspiciousList.forEach(item => {
    console.log(` ⚠️ [${item.rollNo}] (${item.className}) ${item.studentName} [${item.gender}] -> Father: ${item.fatherName} | Mother: ${item.motherName}`);
  });

  console.log('\n====================================================');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
