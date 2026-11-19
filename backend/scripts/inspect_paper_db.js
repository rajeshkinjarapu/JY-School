const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  const paperId = '056bd2a7-89cf-40d4-bbe4-8282837148be';
  console.log(`Checking paper in DB: ${paperId}...`);

  const paper = await prisma.generatedPaper.findUnique({
    where: { id: paperId }
  });

  if (!paper) {
    console.log('Paper not found in database!');
    return;
  }

  console.log('================ Paper Metadata ================');
  console.log('ID:', paper.id);
  console.log('Exam Name:', paper.examName);
  console.log('Class:', paper.examClass);
  console.log('Subject (examSubject column):', paper.examSubject);
  console.log('Date:', paper.examDate);
  console.log('Updated At:', paper.updatedAt);
  console.log('================ Content Inspection ============');

  if (paper.content && paper.content.startsWith('<!--MCQ_DATA_V2-->')) {
    const jsonStr = paper.content.replace('<!--MCQ_DATA_V2-->\n', '');
    try {
      const data = JSON.parse(jsonStr);
      const subjects = Object.keys(data.subjectContents || {});
      console.log('Subjects found in subjectContents:', subjects);
      for (const subj of subjects) {
        const text = data.subjectContents[subj] || '';
        const qMatches = text.match(/^\s*(?:\d+|Q\d+)[\.\)]/gim) || [];
        console.log(`\n--- Subject: [${subj}] (Questions: ${qMatches.length}) ---`);
        console.log('First 200 chars:\n', text.substring(0, 200));
        console.log('Last 200 chars:\n', text.substring(Math.max(0, text.length - 200)));
      }
    } catch (e) {
      console.error('Error parsing content JSON:', e.message);
    }
  } else {
    console.log('Raw content (first 500 chars):\n', (paper.content || '').substring(0, 500));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
