const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('====================================================');
  console.log('🔍 JEE MAINS MODEL PAPER - FIXING 4 DEFECTS IN DB');
  console.log('====================================================\n');

  // 1. Find the generated paper by ID or examName
  let paper = await prisma.generatedPaper.findFirst({
    where: {
      OR: [
        { id: '9c6f972f-ea28-42e2-bad8-4eaa6da6aee1' },
        { examName: { contains: 'JEE', mode: 'insensitive' } }
      ]
    }
  });

  if (!paper) {
    console.error('❌ Paper not found! Listing all generated papers:');
    const all = await prisma.generatedPaper.findMany({
      select: { id: true, examName: true, examDate: true, createdAt: true },
      take: 5
    });
    console.log(all);
    return;
  }

  console.log(`✅ Found Paper: ID: ${paper.id}`);
  console.log(`   Exam Name: "${paper.examName}"`);
  console.log(`   Date: "${paper.examDate}"`);
  console.log(`   Subjects: "${paper.examSubject}"\n`);

  // 2. Fix Defect 3: Instructions mismatch
  let instructions = paper.instructions || '';
  console.log('--- Checking & Fixing Instructions ---');
  console.log('Current instructions:\n', instructions);

  let updatedInstructions = instructions;
  // Replace 26 to 45 with 26 to 50
  updatedInstructions = updatedInstructions.replace(/Question\s*No\.?\s*26\s*to\s*45/gi, 'Question No. 26 to 50');
  // Replace 51 to 70 with 51 to 75
  updatedInstructions = updatedInstructions.replace(/Question\s*No\.?\s*51\s*to\s*70/gi, 'Question No. 51 to 75');

  if (instructions !== updatedInstructions) {
    console.log('✅ Instructions updated:');
    console.log(updatedInstructions);
  } else {
    console.log('ℹ️ Instructions already up to date or pattern not matched.');
  }

  // 3. Parse Content
  let content = paper.content || '';
  let isV2 = content.startsWith('<!--MCQ_DATA_V2-->\n');
  let data;
  if (isV2) {
    data = JSON.parse(content.replace('<!--MCQ_DATA_V2-->\n', ''));
  } else {
    data = { subjectContents: { 'General': content }, inlineImages: {}, answerKeys: {} };
  }

  let subjectContents = data.subjectContents || {};

  // Fix Defect 2: Duplicate Question (Q13 vs Q20 in Maths)
  for (const [subKey, text] of Object.entries(subjectContents)) {
    if (subKey.toLowerCase().includes('math') || text.includes('adj(adj(2(adj A)^-1))')) {
      console.log(`\n--- Checking Maths for Duplicate Q20 in [${subKey}] ---`);
      
      // Match Question 20 block
      const q20Regex = /(?:^|\n)(20\.\s+[^\n]*adj\(adj\(2\(adj A\)\^-1\)[^\n]*[\s\S]*?)(?=(?:\n\d+\.\s+)|$)/i;
      if (q20Regex.test(text)) {
        console.log('⚠️ Found Duplicate Q20 matching Q13! Replacing with new JEE Main question...');
        const newQ20 = `20. If $A = \\begin{bmatrix} 0 & -\\tan\\frac{\\theta}{2} \\\\ \\tan\\frac{\\theta}{2} & 0 \\end{bmatrix}$ and $I$ is the identity matrix of order 2, then $(I - A)\\begin{bmatrix} \\cos\\theta & -\\sin\\theta \\\\ \\sin\\theta & \\cos\\theta \\end{bmatrix}$ is equal to:\n(A) $I + A$\n(B) $I - A$\n(C) $A - I$\n(D) $A$`;
        subjectContents[subKey] = text.replace(q20Regex, (match, p1) => {
          return match.startsWith('\n') ? `\n${newQ20}` : newQ20;
        });
        console.log('✅ Successfully replaced duplicate Q20 with distinct matrix question!');
      } else {
        console.log('ℹ️ Duplicate Q20 pattern not found or already replaced.');
      }
    }
  }

  // Fix Defect 4: Typo in Q35 Options in Physics
  for (const [subKey, text] of Object.entries(subjectContents)) {
    if (subKey.toLowerCase().includes('physic') || text.includes('acting on a particle is at right angles')) {
      console.log(`\n--- Checking Physics for Q35 options typo in [${subKey}] ---`);
      
      const q35Regex = /(?:^|\n)(35\.\s+[^\n]*acting on a particle is at right angles[\s\S]*?)(?=(?:\n\d+\.\s+)|$)/i;
      const match35 = text.match(q35Regex);
      if (match35) {
        console.log('⚠️ Found Q35! Correcting options typo...');
        const correctQ35 = `35. The resultant $R$ of two forces acting on a particle is at right angles to one of them and its magnitude is one third of the other force. The ratio of larger force to smaller one is:\n(A) $3 : 1$\n(B) $3 : 2$\n(C) $2 : 1$\n(D) $3 : 2\\sqrt{2}$`;
        subjectContents[subKey] = text.replace(q35Regex, (match, p1) => {
          return match.startsWith('\n') ? `\n${correctQ35}` : correctQ35;
        });
        console.log('✅ Successfully corrected Q35 options with LaTeX $\\sqrt{2}$ and distinct choices!');
      } else {
        console.log('ℹ️ Q35 pattern not found or already corrected.');
      }
    }
  }

  // Re-serialize content
  data.subjectContents = subjectContents;
  const newContent = isV2 ? '<!--MCQ_DATA_V2-->\n' + JSON.stringify(data) : JSON.stringify(data);

  // Update Database
  await prisma.generatedPaper.update({
    where: { id: paper.id },
    data: {
      instructions: updatedInstructions,
      content: newContent
    }
  });

  console.log('\n====================================================');
  console.log('🎉 SUCCESS: JEE MAINS PAPER UPDATED IN DATABASE!');
  console.log('====================================================');
}

main()
  .catch(e => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
