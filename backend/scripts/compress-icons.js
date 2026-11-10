const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const psScript = path.join(__dirname, 'compress-icons.ps1');

if (process.platform === 'win32' && fs.existsSync(psScript)) {
  console.log('⚡ Launching Native Windows Image Optimizer (10KB - 50KB)...\n');
  try {
    execSync(`powershell -ExecutionPolicy Bypass -File "${psScript}"`, { stdio: 'inherit' });
    process.exit(0);
  } catch (err) {
    console.error('PowerShell script error:', err.message);
  }
}

// Fallback: If sharp is available
async function runWithSharp() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.error('\n❌ Could not load sharp or powershell script.');
    return;
  }

  const srcDir = path.join(__dirname, '../../flutter_mobile/app icons');
  const backendDestDir = path.join(__dirname, '../public/app-icons');

  if (!fs.existsSync(backendDestDir)) fs.mkdirSync(backendDestDir, { recursive: true });
  const files = fs.readdirSync(srcDir);

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) continue;
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(backendDestDir, file);
    const buf = await sharp(srcPath).resize(256, 256, { fit: 'inside' }).png({ quality: 80, compressionLevel: 9, palette: true }).toBuffer();
    fs.writeFileSync(srcPath, buf);
    fs.writeFileSync(destPath, buf);
    console.log(`✅ Compressed: ${file} (${(buf.length / 1024).toFixed(1)} KB)`);
  }
}

runWithSharp();
