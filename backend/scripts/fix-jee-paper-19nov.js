const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('====================================================');
  console.log('🔍 JEE MAINS 19-NOV PAPER - FIXING MISTAKES IN DB');
  console.log('====================================================\n');

  // 1. Find paper by ID or date/name
  let paper = await prisma.generatedPaper.findFirst({
    where: {
      OR: [
        { id: 'a288caf9-a258-4aa4-8e2f-712e1997646e' },
        { examDate: { contains: '19-11-2026' } },
        { examName: { contains: '19-11-2026' } }
      ]
    }
  });

  if (!paper) {
    console.warn('⚠️ Targeted paper not found by specific query, finding latest JEE paper...');
    paper = await prisma.generatedPaper.findFirst({
      where: {
        examName: { contains: 'JEE', mode: 'insensitive' }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  if (!paper) {
    console.error('❌ No paper found!');
    return;
  }

  console.log(`✅ Found Paper ID: ${paper.id}`);
  console.log(`   Exam Name: "${paper.examName}"`);
  console.log(`   Date: "${paper.examDate}"\n`);

  // 2. Fix Instructions
  let instructions = paper.instructions || '';
  let updatedInstructions = instructions;
  updatedInstructions = updatedInstructions.replace(/Question\s*No\.?\s*26\s*to\s*45/gi, 'Question No. 26 to 50');
  updatedInstructions = updatedInstructions.replace(/Question\s*No\.?\s*51\s*to\s*70/gi, 'Question No. 51 to 75');

  if (instructions !== updatedInstructions) {
    console.log('✅ Instructions updated:');
    console.log(updatedInstructions);
  } else {
    console.log('ℹ️ Instructions already up to date.');
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

  for (const [subKey, text] of Object.entries(subjectContents)) {
    let modified = text;

    // Check Question 11
    if (modified.includes('csc 10') || modified.includes('sec 10')) {
      console.log(`🔍 Checking Q11 in [${subKey}]...`);
      // If Q11 doesn't have options (A) (B) (C) (D)
      const q11Regex = /(11\.\s+[^\n]*?(?:csc\s*10|sec\s*10)[^\n]*)([\s\S]*?)(?=(?:\n\s*12\.\s+)|$)/i;
      const match11 = modified.match(q11Regex);
      if (match11 && !/\(A\)/.test(match11[2])) {
        console.log('⚠️ Q11 is missing options! Adding options...');
        const q11WithOpts = `${match11[1].trim()}\n(A) $4$\n(B) $2$\n(C) $1$\n(D) $0$`;
        modified = modified.replace(q11Regex, `${q11WithOpts}\n\n`);
        console.log('✅ Q11 options added successfully!');
      }
    }

    // Check Question 12
    if (modified.includes('3x + 4y + 12 = 0') || modified.includes('3x+4y+12=0') || modified.includes('6 + 16')) {
      console.log(`🔍 Checking Q12 in [${subKey}]...`);
      const q12Regex = /(12\.\s+[\s\S]*?(?:3x\s*\+\s*4y\s*\+\s*12\s*=\s*0|3x\+4y\+12=0)[^\n]*)([\s\S]*?)(?=(?:\n\s*13\.\s+)|$)/i;
      const match12 = modified.match(q12Regex);
      if (match12 && !/\(A\)/.test(match12[2])) {
        console.log('⚠️ Q12 is missing options! Adding options...');
        const q12WithOpts = `${match12[1].trim()}\n(A) $11$\n(B) $9$\n(C) $7$\n(D) $13$`;
        modified = modified.replace(q12Regex, `${q12WithOpts}\n\n`);
        console.log('✅ Q12 options added successfully!');
      }
    }

    // Check Question 13
    if (modified.includes('tan 15') && modified.includes('tan 195')) {
      console.log(`🔍 Checking Q13 in [${subKey}]...`);
      const q13Regex = /(13\.\s+[\s\S]*?(?:tan\s*195|tan\s*15)[^\n]*)([\s\S]*?)(?=(?:\n\s*14\.\s+)|$)/i;
      const match13 = modified.match(q13Regex);
      if (match13 && !/\(A\)/.test(match13[2])) {
        console.log('⚠️ Q13 is missing options! Adding options...');
        const q13WithOpts = `${match13[1].trim()}\n(A) $4$\n(B) $2$\n(C) $4\\sqrt{3}$\n(D) $2\\sqrt{3}$`;
        modified = modified.replace(q13Regex, `${q13WithOpts}\n\n`);
        console.log('✅ Q13 options added successfully!');
      }
    }

    subjectContents[subKey] = modified;
  }

  // 4. Save to Database
  let updatedContent = isV2 
    ? '<!--MCQ_DATA_V2-->\n' + JSON.stringify(data)
    : (subjectContents['General'] || content);

  await prisma.generatedPaper.update({
    where: { id: paper.id },
    data: {
      instructions: updatedInstructions,
      content: updatedContent
    }
  });

  console.log(`\n🎉 Successfully updated paper [${paper.id}] in database!`);
}

main()
  .catch((e) => {
    console.error('❌ Error executing fix script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
