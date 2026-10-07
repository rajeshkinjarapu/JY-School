import { PrismaClient } from '@prisma/client';

export const getCanonicalSubjectName = (subjectName: string): string => {
  if (!subjectName) return '';
  const s = subjectName.toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
  
  // 1. TELUGU (tel, telugu, TEL, TELUGU, etc.)
  if (s.includes('TELUGU') || s.startsWith('TEL') || s.includes('FIRSTLANG')) return 'TELUGU';
  
  // 2. HINDI (hin, hindi, HIN, HINDI, etc.)
  if (s.includes('HINDI') || s.startsWith('HIN') || s.includes('SECONDLANG')) return 'HINDI';
  
  // 3. ENGLISH (eng, english, ENG, ENGLISH, etc.)
  if (s.includes('ENGLISH') || s.startsWith('ENG') || s.includes('THIRDLANG')) return 'ENGLISH';
  
  // 4. MATHEMATICS (mat, maths, math, mathematics, MATHEMATICSi, etc.)
  if (s.includes('MATH') || s.startsWith('MAT')) return 'MATHEMATICS';
  
  // 5. EVS (evs, environmental science, etc.)
  if (s === 'EVS' || s.includes('ENVIRONMENT')) return 'EVS';
  
  // 6. SCIENCES
  if (s.includes('PHYSIC') || s.startsWith('PHY')) return 'PHYSICS';
  if (s.includes('CHEMIS') || s.startsWith('CHE')) return 'CHEMISTRY';
  if (s.includes('BIOLOG') || s.startsWith('BIO')) return 'BIOLOGY';
  if (s.includes('SCIENCE') || s.startsWith('SCI')) return 'SCIENCE';
  
  // 7. SOCIAL STUDIES
  if (s.includes('SOCIAL') || s.startsWith('SOC')) return 'SOCIAL';

  // 8. OTHERS
  if (s.includes('DRAWING') || s.includes('ART')) return 'DRAWING';
  if (s.includes('COMPUTER') || s.includes('COMP')) return 'COMPUTERS';
  if (s.includes('GENERAL') && s.includes('KNOW')) return 'GK';
  if (s.includes('RHYMES')) return 'RHYMES';
  
  return subjectName.toUpperCase().trim();
};

const prisma = new PrismaClient();

async function fixDuplicateSubjects() {
  console.log('🔍 Finding duplicate subjects...\n');

  const allSubjects = await prisma.subject.findMany({
    orderBy: { id: 'asc' },
  });

  // Group by normalized name + classId
  const groups: Record<string, typeof allSubjects> = {};
  for (const sub of allSubjects) {
    const key = `${sub.classId}__${getCanonicalSubjectName(sub.name.trim().toUpperCase())}`;
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
