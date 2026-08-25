import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMarks() {
  console.log('Starting DB fix for marks maxMarks (Batched Version)...');
  
  // 1. Fetch all exams with their plans to build a map in memory
  // This is small compared to all marks.
  const exams = await prisma.exam.findMany({
    include: { examPlans: true }
  });
  
  const examMap = new Map();
  for (const ex of exams) {
    examMap.set(ex.id, ex);
  }

  // Pre-fetch all real subjects to map ID -> Name
  const realSubjects = await prisma.subject.findMany();
  const subjectMap = new Map();
  for (const s of realSubjects) {
    subjectMap.set(s.id, s.name.toUpperCase().trim());
  }

  // 2. Process marks in batches
  const batchSize = 1000;
  let cursor = null;
  let updatedCount = 0;
  let totalProcessed = 0;

  while (true) {
    const marks = await prisma.mark.findMany({
      take: batchSize,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' },
    });

    if (marks.length === 0) {
      break;
    }

    for (const mark of marks) {
      const examInfo = examMap.get(mark.examId);
      if (!examInfo) continue;

      let expectedMaxMarks = 100;
      
      const realSubjectName = subjectMap.get(mark.subjectId);
      
      // Look up maxMarks from exam.subjects JSON array
      if (realSubjectName && examInfo.subjects && Array.isArray(examInfo.subjects)) {
        const subInExam = examInfo.subjects.find((s: any) => 
          s.name && s.name.toUpperCase().trim() === realSubjectName
        );
        if (subInExam && subInExam.maxMarks) {
          expectedMaxMarks = Number(subInExam.maxMarks);
        }
      }

      if (mark.maxMarks !== expectedMaxMarks) {
        console.log(`Fixing mark ID ${mark.id} for subject ${mark.subjectId}: maxMarks from ${mark.maxMarks} to ${expectedMaxMarks}`);
        
        let finalRemarks = mark.remarks;
        let finalMarksObtained = mark.marksObtained;
        
        const percentage = (finalMarksObtained / expectedMaxMarks) * 100;
        let grade = 'F';
        if (finalRemarks === 'AB') grade = 'F';
        else if (percentage >= 91) grade = 'A1';
        else if (percentage >= 81) grade = 'A2';
        else if (percentage >= 71) grade = 'B1';
        else if (percentage >= 61) grade = 'B2';
        else if (percentage >= 51) grade = 'C1';
        else if (percentage >= 41) grade = 'C2';
        else if (percentage >= 33) grade = 'D';
        else grade = 'E';

        await prisma.mark.update({
          where: { id: mark.id },
          data: { maxMarks: expectedMaxMarks, grade }
        });
        updatedCount++;
      }
    }

    totalProcessed += marks.length;
    console.log(`Processed ${totalProcessed} marks...`);
    cursor = marks[marks.length - 1].id;
  }
  
  console.log(`Finished fixing ${updatedCount} mark records out of ${totalProcessed} total marks.`);
}

fixMarks().catch(console.error).finally(() => prisma.$disconnect());
