const { execSync } = require('child_process');
const fs = require('fs');
try {
  const result = execSync('git show HEAD~4:frontend/src/pages/exams/ProgressCardTab.tsx').toString();
  const lines = result.split('\n');
  const idx = lines.findIndex(l => l.includes('const handleWhatsAppShare'));
  fs.writeFileSync('git_history.txt', lines.slice(idx, idx + 40).join('\n'));
} catch(e) {
  fs.writeFileSync('git_history.txt', e.toString());
}
