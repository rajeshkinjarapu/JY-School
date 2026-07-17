const fs = require('fs');
const glob = require('glob');
const files = glob.sync('src/**/*.tsx');
let count = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('<table')) {
    if (content.includes('overflow-x-auto')) {
       console.log('Skipping (already has overflow):', file);
    } else {
       console.log('Needs overflow:', file);
       content = content.replace(/<table/g, '<div className="overflow-x-auto w-full max-w-full block"><table');
       content = content.replace(/<\/table>/g, '</table></div>');
       fs.writeFileSync(file, content);
       count++;
    }
  }
});
console.log('Updated', count, 'files');
