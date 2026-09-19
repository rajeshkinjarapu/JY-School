import { prisma } from './prisma';
import { getCanonicalSubjectName, getSubjectSortWeight } from '../controllers/exams.controller';

export const autoCleanDuplicateSubjectsAndMarks = async (): Promise<void> => {
  try {
    console.log('🔄 [AUTO-CLEANUP] Checking for duplicate subjects and unifying marks...');

    // 1. Fetch all subjects grouped by class
    const allClasses = await prisma.class.findMany({ select: { id: true, name: true, section: true } });
    
    let totalMerged = 0;
    for (const cls of allClasses) {
      const subjects = await prisma.subject.findMany({
        where: { classId: cls.id }
      });

      // Group subjects by canonical name
      const groupMap = new Map<string, typeof subjects>();
      subjects.forEach(sub => {
        const canon = getCanonicalSubjectName(sub.name);
        if (!groupMap.has(canon)) groupMap.set(canon, []);
        groupMap.get(canon)!.push(sub);
      });

      for (const [canonName, subList] of groupMap.entries()) {
        if (subList.length > 1) {
          // Find the best primary subject (prefer one that already has exact canonical name)
          let primary = subList.find(s => s.name.toUpperCase().trim() === canonName) || subList[0];

          // Ensure primary has clean canonical name
          if (primary.name !== canonName) {
            await prisma.subject.update({
              where: { id: primary.id },
              data: { name: canonName, code: canonName.substring(0, 3).toUpperCase() }
            });
          }

          const duplicates = subList.filter(s => s.id !== primary.id);
          for (const dup of duplicates) {
            // Find marks pointing to the duplicate
            const dupMarks = await prisma.mark.findMany({
              where: { subjectId: dup.id }
            });

            for (const dm of dupMarks) {
              // Check if student already has a mark for the primary subject in this exam
              const existingPrimaryMark = await prisma.mark.findFirst({
                where: {
                  examId: dm.examId,
                  studentId: dm.studentId,
                  subjectId: primary.id
                }
              });

              if (existingPrimaryMark) {
                // If the duplicate mark has a higher score or non-AB, update primary
                if (dm.remarks !== 'AB' && (existingPrimaryMark.remarks === 'AB' || dm.marksObtained > existingPrimaryMark.marksObtained)) {
                  await prisma.mark.update({
                    where: { id: existingPrimaryMark.id },
                    data: {
                      marksObtained: dm.marksObtained,
                      maxMarks: dm.maxMarks,
                      grade: dm.grade,
                      remarks: dm.remarks
                    }
                  });
                }
                // Delete the redundant mark
                await prisma.mark.delete({ where: { id: dm.id } });
              } else {
                // Repoint the mark to primary
                await prisma.mark.update({
                  where: { id: dm.id },
                  data: { subjectId: primary.id }
                });
              }
            }

            // Repoint any other relations that reference dup.id to primary.id
            await prisma.examPlan.updateMany({ where: { subjectId: dup.id }, data: { subjectId: primary.id } }).catch(() => {});
            await prisma.classSubjectTeacher.updateMany({ where: { subjectId: dup.id }, data: { subjectId: primary.id } }).catch(() => {});
            await prisma.timetable.updateMany({ where: { subjectId: dup.id }, data: { subjectId: primary.id } }).catch(() => {});
            await prisma.onlineExam.updateMany({ where: { subjectId: dup.id }, data: { subjectId: primary.id } }).catch(() => {});
            await prisma.competitiveExam.updateMany({ where: { subjectId: dup.id }, data: { subjectId: primary.id } }).catch(() => {});
            await prisma.questionPaper.updateMany({ where: { subjectId: dup.id }, data: { subjectId: primary.id } }).catch(() => {});
            await prisma.slipTest.updateMany({ where: { subjectId: dup.id }, data: { subjectId: primary.id } }).catch(() => {});
            await prisma.homework.updateMany({ where: { subjectId: dup.id }, data: { subjectId: primary.id } }).catch(() => {});
            await prisma.substitute.updateMany({ where: { subjectId: dup.id }, data: { subjectId: primary.id } }).catch(() => {});
            await prisma.masterQuestion.updateMany({ where: { subjectId: dup.id }, data: { subjectId: primary.id } }).catch(() => {});

            // Now safely delete the duplicate subject record
            await prisma.subject.delete({ where: { id: dup.id } }).catch(err => {
              console.warn(`Could not delete duplicate subject ${dup.id}:`, err.message);
            });
            totalMerged++;
          }
        } else if (subList.length === 1) {
          // Normalize subject name if it was written as MATHS or TEL or mat
          const single = subList[0];
          if (single.name.trim().toUpperCase() !== canonName) {
            await prisma.subject.update({
              where: { id: single.id },
              data: { name: canonName, code: canonName.substring(0, 3).toUpperCase() }
            });
          }
        }
      }
    }

    // 2. Clean up all Exam.subjects JSON configurations
    const allExams = await prisma.exam.findMany();
    for (const exam of allExams) {
      if (!exam.subjects) continue;
      let subjectsObj = exam.subjects as any;
      if (typeof subjectsObj === 'string') {
        try { subjectsObj = JSON.parse(subjectsObj); } catch (e) { continue; }
      }

      if (subjectsObj && Array.isArray(subjectsObj.classConfigs)) {
        let changed = false;
        const cleanedConfigs = subjectsObj.classConfigs.map((cfg: any) => {
          if (!Array.isArray(cfg.subjects)) return cfg;

          const canonMap = new Map<string, any>();
          cfg.subjects.forEach((s: any) => {
            if (!s || !s.name) return;
            const cName = getCanonicalSubjectName(s.name);
            if (!canonMap.has(cName)) {
              canonMap.set(cName, {
                ...s,
                name: cName
              });
            } else {
              changed = true;
            }
          });

          const sortedSubs = Array.from(canonMap.values()).sort((a, b) => {
            const wA = getSubjectSortWeight(a.name);
            const wB = getSubjectSortWeight(b.name);
            if (wA !== wB) return wA - wB;
            return (a.name || '').localeCompare(b.name || '');
          });

          return { ...cfg, subjects: sortedSubs };
        });

        if (changed || true) {
          await prisma.exam.update({
            where: { id: exam.id },
            data: { subjects: { ...subjectsObj, classConfigs: cleanedConfigs } }
          });
        }
      }
    }

    console.log(`✅ [AUTO-CLEANUP] Successfully unified subjects and marks. Merged ${totalMerged} duplicate subject records.`);
  } catch (error) {
    console.error('❌ [AUTO-CLEANUP] Error during subject and mark deduplication:', error);
  }
};
