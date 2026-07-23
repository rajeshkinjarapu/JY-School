const fs = require('fs');
const files = ['frontend/src/pages/paper-generator/PaperDetail.tsx', 'frontend/src/pages/paper-generator/QuestionBank.tsx'];
files.forEach(file => {
  try {
    let c = fs.readFileSync(file, 'utf8');
    c = c.split('Link to="/"').join('Link to="/question-bank"');
    fs.writeFileSync(file, c);
  } catch(e) {}
});
