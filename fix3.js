const fs = require('fs');

function fixQuestionBank() {
  const file = 'frontend/src/pages/paper-generator/QuestionBank.tsx';
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/max-w-7xl mx-auto px-4 pt-8/g, 'w-full mx-auto px-2 lg:px-6 pt-4');
  c = c.replace(/max-w-7xl mx-auto px-4/g, 'w-full mx-auto px-2 lg:px-6');
  c = c.replace(/bg-slate-50/g, 'bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/50');
  fs.writeFileSync(file, c);
}

function fixPaperBuilder() {
  const file = 'frontend/src/pages/paper-generator/PaperBuilder.tsx';
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/max-w-7xl mx-auto px-4 pt-8/g, 'w-full mx-auto px-2 lg:px-6 pt-4');
  c = c.replace(/max-w-7xl mx-auto px-4/g, 'w-full mx-auto px-2 lg:px-6');
  c = c.replace(/w-full mx-auto px-2 lg:px-6/g, 'w-full mx-auto px-2 lg:px-6'); // idempotent
  c = c.replace(/bg-slate-50/g, 'bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/50');
  fs.writeFileSync(file, c);
}

fixQuestionBank();
fixPaperBuilder();
