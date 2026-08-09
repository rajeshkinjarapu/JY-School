const { execSync } = require('child_process');
try {
  const result = execSync('git show HEAD~3:frontend/src/pages/exams/JEEProgressCardTab.tsx').toString();
  const lines = result.split('\n');
  const idx = lines.findIndex(l => l.includes('const handleWhatsAppShare'));
  console.log(lines.slice(idx, idx + 40).join('\n'));
} catch(e) {
  console.log(e.toString());
}
