const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkStudent() {
  const user = await prisma.user.findFirst({
    where: { role: 'STUDENT' },
    include: { student: true }
  });
  if (user) {
    console.log("Found student:", user.email, "Phone:", user.phone, "RollNo:", user.student?.rollNo);
    const isMatch = await bcrypt.compare('Student2026', user.password);
    console.log("Password matches 'Student2026':", isMatch);
  } else {
    console.log("No student found");
  }
}

checkStudent().finally(() => prisma.$disconnect());
