import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDuplicateSubjects() {
  console.log('🔍 Finding duplicate subjects...\n');

  const allSubjects = await prisma.subject.findMany({
    orderBy: { createdAt: 'asc' },
  });

  // Group by normalized name + classId
  const groups: Record<string, typeof allSubjects> = {};
  for (const sub of allSubjects) {
    const key = `${sub.classId}__${sub.name.trim().toUpperCase()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(sub);
  }

  const duplicateGroups = Object.entries(groups).filter(([, subs]) => subs.length > 1);

  if (duplicateGroups.length === 0) {
    console.log('✅ No duplicate subjects found! Database is clean.');
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${duplicateGroups.length} groups with duplicates:\n`);

  let totalDeleted = 0;
  let marksReassigned = 0;

  for (const [key, subs] of duplicateGroups) {
    const canonical = subs[0]; // keep oldest
    const duplicates = subs.slice(1);
    const dupIds = duplicates.map(d => d.id);

    console.log(`📦 Group: ${key}`);
    console.log(`   ✅ KEEP:   ${canonical.id} (${canonical.name})`);
    console.log(`   ❌ DELETE: ${dupIds.join(', ')}`);

    await prisma.$transaction(async (tx) => {
      // Step 1: Reassign Marks → canonical subject (avoid dupes)
      for (const dupId of dupIds) {
        const dupMarks = await tx.mark.findMany({ where: { subjectId: dupId } });
        for (const mark of dupMarks) {
          const alreadyExists = await tx.mark.findFirst({
            where: { studentId: mark.studentId, examId: mark.examId, subjectId: canonical.id },
          });
          if (!alreadyExists) {
            await tx.mark.update({ where: { id: mark.id }, data: { subjectId: canonical.id } });
            marksReassigned++;
          } else {
            await tx.mark.delete({ where: { id: mark.id } });
          }
        }
      }

      // Step 2: Reassign Timetable entries
      for (const dupId of dupIds) {
        await tx.timetable.updateMany({ where: { subjectId: dupId }, data: { subjectId: canonical.id } });
      }

      // Step 3: Delete ClassSubjectTeacher for duplicates
      await tx.classSubjectTeacher.deleteMany({ where: { subjectId: { in: dupIds } } });

      // Step 4: Delete duplicate subjects
      await tx.subject.deleteMany({ where: { id: { in: dupIds } } });
    });

    totalDeleted += dupIds.length;
    console.log(`   ✔ Done! (${dupIds.length} duplicates removed)\n`);
  }

  console.log('─────────────────────────────────────────');
  console.log(`✅ Cleanup Complete!`);
  console.log(`   📦 Duplicate subjects deleted: ${totalDeleted}`);
  console.log(`   📝 Marks reassigned: ${marksReassigned}`);
  console.log('─────────────────────────────────────────');

  await prisma.$disconnect();
}

fixDuplicateSubjects().catch(async (e) => {
  console.error('❌ Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
