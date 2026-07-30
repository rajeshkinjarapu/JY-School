const { execSync } = require('child_process');
const fs = require('fs');
try {
  const result = execSync('git log -p -10 -- frontend/src/pages/students/StudentListPage.tsx').toString();
  fs.writeFileSync('git_log_output.txt', result);
  console.log('Success');
} catch (e) {
  console.error(e.message);
}
