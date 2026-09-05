import { prisma } from '../src/utils/prisma';

async function mergeAllFa1Exams() {
  console.log('🔍 Fetching all exams to merge FA-1 variations...');

  const allExams = await prisma.exam.findMany({
    include: {
      classes: { select: { id: true, name: true, section: true } },
      _count: { select: { marks: true } }
    },
    orderBy: { createdAt: 'asc' }
  });

  const fa1Exams = allExams.filter(e => {
    const nameUpper = e.name.toUpperCase().trim();
    return (
      nameUpper.includes('FA-1') ||
      nameUpper.includes('FA - 1') ||
      nameUpper.includes('FA 1') ||
      nameUpper.includes('FORMATIVE ASSESSMENT - 1') ||
      nameUpper.includes('FORMATIVE ASSESSMENT 1') ||
      nameUpper.startsWith('FA-') ||
      nameUpper.startsWith('FA -')
    );
  });

  console.log(`\n📋 Found ${fa1Exams.length} FA-1 related exams to merge:`);
  fa1Exams.forEach(e => {
    console.log(`- ID: ${e.id} | Name: "${e.name}" | Classes: [${e.classes.map(c => `${c.name}-${c.section}`).join(', ')}] | Marks Recorded: ${e._count.marks}`);
  });

  if (fa1Exams.length <= 1) {
    console.log('✅ Only 1 or 0 FA-1 exams found. No merge needed!');
    return;
  }

  const targetExam = fa1Exams[0];
  const duplicateExams = fa1Exams.slice(1);
  const duplicateIds = duplicateExams.map(e => e.id);

  const allClassIdsSet = new Set<string>();
  fa1Exams.forEach(e => e.classes.forEach(c => allClassIdsSet.add(c.id)));
  const allClassIds = Array.from(allClassIdsSet);

  const mergedClassConfigs: any[] = [];
  const mergedGlobalSubjectsMap = new Map<string, any>();

  fa1Exams.forEach(e => {
    const subData: any = e.subjects;
    if (subData && typeof subData === 'object' && !Array.isArray(subData) && subData.classConfigs) {
      subData.classConfigs.forEach((cfg: any) => {
        const existingIdx = mergedClassConfigs.findIndex(c => c.classId === cfg.classId);
        if (existingIdx >= 0) {
          mergedClassConfigs[existingIdx] = cfg;
        } else {
          mergedClassConfigs.push(cfg);
        }
      });
      if (Array.isArray(subData.globalSubjects)) {
        subData.globalSubjects.forEach((s: any) => {
          if (s.name) mergedGlobalSubjectsMap.set(s.name.toUpperCase(), s);
        });
      }
    } else if (Array.isArray(subData)) {
      subData.forEach((s: any) => {
        if (s.name) mergedGlobalSubjectsMap.set(s.name.toUpperCase(), s);
      });
    }
  });

  const mergedSubjectsPayload = {
    classConfigs: mergedClassConfigs,
    globalSubjects: Array.from(mergedGlobalSubjectsMap.values())
  };

  console.log(`\n⚡ Merging all ${fa1Exams.length} exams into single Target Exam...`);
  console.log(`- Target Exam ID: ${targetExam.id}`);
  console.log(`- Target Exam Name will be set to: "FORMATIVE ASSESSMENT - 1"`);

  const updatedMarks = await prisma.mark.updateMany({
    where: { examId: { in: duplicateIds } },
    data: { examId: targetExam.id }
  });
  console.log(`- Reassigned ${updatedMarks.count} student marks to Target Exam!`);

  await prisma.examPlan.updateMany({
    where: { examId: { in: duplicateIds } },
    data: { examId: targetExam.id }
  });

  await prisma.exam.update({
    where: { id: targetExam.id },
    data: {
      name: 'FORMATIVE ASSESSMENT - 1',
      classes: {
        set: allClassIds.map(id => ({ id }))
      },
      subjects: mergedSubjectsPayload
    }
  });

  await prisma.exam.deleteMany({
    where: { id: { in: duplicateIds } }
  });

  console.log(`\n🎉 SUCCESS: Merged all ${fa1Exams.length} FA-1 exam variations into ONE single "FORMATIVE ASSESSMENT - 1" exam!`);
}

mergeAllFa1Exams()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error during FA-1 merge:', err);
    process.exit(1);
  });
