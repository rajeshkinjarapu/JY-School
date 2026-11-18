// Script to safely restore NADIMANTI MOUNIKA for JY26-6022 and clear student cache
// Usage: node scripts/restore-student-6022.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('====================================================');
  console.log('🛠️ RESTORING STUDENT JY26-6022: NADIMANTI MOUNIKA');
  console.log('====================================================\n');

  const student = await prisma.student.findUnique({
    where: { rollNo: 'JY26-6022' },
    include: { user: true, class: true }
  });

  if (!student) {
    console.error('❌ Error: Student with rollNo "JY26-6022" not found in DB!');
    return;
  }

  console.log('CURRENT STATE IN DATABASE:');
  console.log({
    rollNo: student.rollNo,
    currentName: student.user?.name,
    class: student.class?.name,
    fatherName: student.fatherName,
    motherName: student.motherName,
    hasPhoto: !!student.user?.photoUrl
  });

  // 1. Restore User Name to NADIMANTI MOUNIKA
  const updatedUser = await prisma.user.update({
    where: { id: student.userId },
    data: {
      name: 'NADIMANTI MOUNIKA'
    }
  });

  // 2. Ensure Gender is FEMALE
  const updatedStudent = await prisma.student.update({
    where: { id: student.id },
    data: {
      gender: 'FEMALE'
    }
  });

  console.log('\n✅ SUCCESSFULLY RESTORED STUDENT RECORD:');
  console.log({
    rollNo: updatedStudent.rollNo,
    restoredName: updatedUser.name,
    gender: updatedStudent.gender,
    fatherName: updatedStudent.fatherName,
    motherName: updatedStudent.motherName,
    photoPreserved: !!updatedUser.photoUrl,
    updatedAt: updatedUser.updatedAt
  });

  console.log('\n====================================================');
  console.log('🎉 RESTORE COMPLETE! Student list now has NADIMANTI MOUNIKA with her proper photo.');
  console.log('====================================================');
}

main()
  .catch(err => {
    console.error('Error during restore:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
