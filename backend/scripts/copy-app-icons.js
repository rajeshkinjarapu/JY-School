const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../../flutter_mobile/app icons');
const destDir = path.join(__dirname, '../public/app-icons');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

if (fs.existsSync(srcDir)) {
  const files = fs.readdirSync(srcDir);
  let count = 0;
  for (const file of files) {
    if (file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')) {
      const srcFile = path.join(srcDir, file);
      const destFile = path.join(destDir, file);
      fs.copyFileSync(srcFile, destFile);
      count++;
    }
  }
  console.log(`[Icon Sync] Successfully copied ${count} icons to ${destDir}`);
} else {
  console.log(`[Icon Sync] Source directory not found: ${srcDir}`);
}

