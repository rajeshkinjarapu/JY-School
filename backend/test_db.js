const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const classes = await prisma.class.findMany({
    include: { _count: { select: { students: true } } }
  });
  console.log('Classes:');
  classes.forEach(c => {
    console.log(${c.name}-:  students);
  });
  
  const exams = await prisma.exam.findMany({
    include: { classes: true }
  });
  console.log('Exams:');
  exams.forEach(e => {
    console.log(${e.name} classes: );
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
