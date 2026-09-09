const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://jy_admin:JySchool2026@66.116.252.191:5432/jy_school_local"
    }
  }
});

async function main() {
  console.log("Fetching exams...");
  const exams = await prisma.exam.findMany({
    take: 1,
    orderBy: { createdAt: 'desc' }
  });
  
  if (exams.length === 0) {
    console.log("No exams found.");
    return;
  }
  
  const exam = exams[0];
  console.log("Exam Name:", exam.name);
  console.log("Exam Subjects JSON keys (classes):", exam.subjects ? Object.keys(exam.subjects) : "None");
  
  console.log("\nFetching classes...");
  const classes = await prisma.class.findMany({
    take: 5
  });
  
  console.log("Classes in DB:");
  for (const cls of classes) {
    console.log(`- ${cls.name} ${cls.section} (ID: ${cls.id})`);
    const subjects = await prisma.subject.findMany({ where: { classId: cls.id } });
    console.log(`  Subjects: ${subjects.map(s => s.name).join(', ')}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
