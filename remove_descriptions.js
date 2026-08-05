const fs = require('fs');
const path = require('path');

const targetDir = 'c:\\Users\\SRI\\Desktop\\JY School\\JY-School-main\\frontend\\src\\pages';

const stringsToRemove = [
  "Manage school fleet and vehicle details.",
  "Manage school transportation, routes, and vehicles.",
  "Assign and manage student transportation.",
  "Manage transport routes and assign vehicles.",
  "Manage schedules, teachers, and workloads.",
  "Manage subjects and assign them to specific classes and teachers.",
  "Download Excel & PDF reports",
  "Manage questions, papers, and assessments",
  "Manage certificates, progress cards, and official documents.",
  "Manage leave requests and leave types.",
  "Manage and track student assignments",
  "Manage and issue out-passes for students and staff.",
  "Manage fees, payments, and financial records.",
  "Send WhatsApp fee reminders to parents class-wise",
  "Configure grading scales, publishing rules, and security controls",
  "Manage all grades, sections, and class teacher assignments.",
  "Notice board for students and teachers.",
  "Today's overview & weekly trends"
];

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      filelist = walkSync(filepath, filelist);
    } else {
      if (filepath.endsWith('.tsx')) {
        filelist.push(filepath);
      }
    }
  }
  return filelist;
}

const files = walkSync(targetDir);

let modifiedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  for (const str of stringsToRemove) {
    // Regex to match <p className="...">str</p>
    const regex = new RegExp(`[ \\t]*<p[^>]*>\\s*${str.replace(/[.*+?^$\{key}()|[\\]\\\\]/g, '\\$&')}\\s*<\\/p>\\s*\\n?`, 'g');
    content = content.replace(regex, '');
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
    console.log(`Modified: ${file}`);
  }
}

console.log(`\\nFinished. Modified ${modifiedCount} files.`);
