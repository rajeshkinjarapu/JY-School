const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'frontend/src/pages'));
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('limit=5000')) {
    content = content.replace(/limit=5000/g, 'limit=500');
    fs.writeFileSync(file, content);
    console.log('Updated', file);
  }
});
