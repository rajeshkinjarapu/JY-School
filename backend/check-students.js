const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const students = await p.student.findMany({
    include: {
      user: { select: { name: true, email: true, isActive: true } },
      class: { select: { name: true, section: true } }
    },
    orderBy: { rollNo: 'asc' }
  });
  
  console.log(`Total students: ${students.length}`);
  students.forEach(s => {
    console.log(`- ${s.rollNo} | ${s.user.name} | Class: ${s.class ? s.class.name + '-' + s.class.section : 'None'} | Active: ${s.user.isActive}`);
  });
  
  await p.$disconnect();
}

main().catch(console.error);
