/**
 * 10th Class Student Photo Compressor (180 KB - 195 KB Target)
 * Preserves 100% studio clarity and facial sharpness with 4:4:4 Chroma Subsampling & MozJPEG.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Default target folder from user request
const defaultInputFolder = 'D:\\Rajesh\\10th Class\\Photo & Sign\\photos';
const inputDir = process.argv[2] ? path.resolve(process.argv[2]) : defaultInputFolder;
const outputDir = process.argv[3] ? path.resolve(process.argv[3]) : path.join(inputDir, '..', 'photos_compressed_180_195kb');

const MIN_KB = 180;
const MAX_KB = 195;
const MIN_BYTES = MIN_KB * 1024; // 184,320 bytes
const MAX_BYTES = MAX_KB * 1024; // 199,680 bytes
const TARGET_BYTES = 187.5 * 1024; // 192,000 bytes (~187.5 KB midpoint)

const VALID_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp']);

async function compressImage(filePath, outPath) {
  const meta = await sharp(filePath).metadata();
  const origW = meta.width || 800;
  const origH = meta.height || 1000;

  // Helper function to render image buffer at given scale & quality
  async function render(scale, quality) {
    const w = Math.max(20, Math.round(origW * scale));
    const h = Math.max(20, Math.round(origH * scale));

    return await sharp(filePath)
      .rotate() // Auto-orient EXIF camera orientation
      .resize(w, h, {
        kernel: sharp.kernel.lanczos3,
        fit: 'inside',
        withoutEnlargement: false,
      })
      .jpeg({
        quality: Math.min(100, Math.max(1, Math.round(quality))),
        mozjpeg: true,
        chromaSubsampling: '4:4:4', // Crystal clear facial edges, zero color blur
        trellisQuantisation: true,
        overshootDeringing: true,
        optimiseScans: true,
      })
      .toBuffer();
  }

  // Initial test at scale 1.0, quality 92 (sweet spot)
  let bestScale = 1.0;
  let bestQuality = 92;
  let buf = await render(bestScale, bestQuality);

  // If already inside [180 KB, 195 KB]
  if (buf.length >= MIN_BYTES && buf.length <= MAX_BYTES) {
    fs.writeFileSync(outPath, buf);
    return buf.length;
  }

  let bestBuf = buf;
  let bestDiff = Math.abs(buf.length - TARGET_BYTES);

  // Binary search scale
  let lowScale = 0.05;
  let highScale = buf.length > MAX_BYTES ? 1.0 : 3.0;

  for (let i = 0; i < 12; i++) {
    const midScale = (lowScale + highScale) / 2;
    const testBuf = await render(midScale, 92);
    const diff = Math.abs(testBuf.length - TARGET_BYTES);

    if (diff < bestDiff) {
      bestDiff = diff;
      bestBuf = testBuf;
      bestScale = midScale;
    }

    if (testBuf.length >= MIN_BYTES && testBuf.length <= MAX_BYTES) {
      bestBuf = testBuf;
      fs.writeFileSync(outPath, bestBuf);
      return bestBuf.length;
    }

    if (testBuf.length > TARGET_BYTES) {
      highScale = midScale;
    } else {
      lowScale = midScale;
    }
  }

  // Fine-tune quality in [70..100] around bestScale
  let lowQ = 70;
  let highQ = 100;

  for (let j = 0; j < 8; j++) {
    const midQ = (lowQ + highQ) / 2;
    const testBuf = await render(bestScale, midQ);
    const diff = Math.abs(testBuf.length - TARGET_BYTES);

    if (diff < bestDiff) {
      bestDiff = diff;
      bestBuf = testBuf;
      bestQuality = midQ;
    }

    if (testBuf.length >= MIN_BYTES && testBuf.length <= MAX_BYTES) {
      bestBuf = testBuf;
      fs.writeFileSync(outPath, bestBuf);
      return bestBuf.length;
    }

    if (testBuf.length > TARGET_BYTES) {
      highQ = midQ;
    } else {
      lowQ = midQ;
    }
  }

  // Micro fine-tuning step by step
  if (bestBuf.length < MIN_BYTES) {
    for (let step = 1; step <= 8; step++) {
      const fineScale = bestScale * (1 + step * 0.015);
      const testBuf = await render(fineScale, Math.min(100, bestQuality + step));
      if (testBuf.length >= MIN_BYTES && testBuf.length <= MAX_BYTES) {
        bestBuf = testBuf;
        break;
      }
      if (testBuf.length > MAX_BYTES) break;
      bestBuf = testBuf;
    }
  } else if (bestBuf.length > MAX_BYTES) {
    for (let step = 1; step <= 8; step++) {
      const fineScale = bestScale * (1 - step * 0.015);
      const testBuf = await render(fineScale, Math.max(70, bestQuality - step));
      if (testBuf.length >= MIN_BYTES && testBuf.length <= MAX_BYTES) {
        bestBuf = testBuf;
        break;
      }
      if (testBuf.length < MIN_BYTES) break;
      bestBuf = testBuf;
    }
  }

  fs.writeFileSync(outPath, bestBuf);
  return bestBuf.length;
}

async function main() {
  console.log('================================================================');
  console.log('   📸 10th Class Student Photo Quality Compressor (180 - 195 KB)');
  console.log('================================================================');
  console.log(`📂 Input Folder  : ${inputDir}`);
  console.log(`📁 Output Folder : ${outputDir}`);
  console.log(`🎯 Target Size   : ${MIN_KB} KB to ${MAX_KB} KB (Crystal Clear Quality)`);
  console.log('----------------------------------------------------------------');

  if (!fs.existsSync(inputDir)) {
    console.error(`❌ Input directory not found: ${inputDir}`);
    console.log('Please check the path and try again.');
    process.exit(1);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const allFiles = fs.readdirSync(inputDir);
  const imageFiles = allFiles.filter(f => VALID_EXTS.has(path.extname(f).toLowerCase()));

  if (imageFiles.length === 0) {
    console.log('⚠️ No supported image files (.jpg, .jpeg, .png, .webp) found in the input folder.');
    process.exit(0);
  }

  console.log(`Found ${imageFiles.length} photo(s) to process...\n`);

  let successCount = 0;
  let warnCount = 0;

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const inPath = path.join(inputDir, file);
    const outName = path.parse(file).name + '.jpg';
    const outPath = path.join(outputDir, outName);

    const origStat = fs.statSync(inPath);
    const origKB = (origStat.size / 1024).toFixed(1);

    try {
      const newSizeBytes = await compressImage(inPath, outPath);
      const newKB = (newSizeBytes / 1024).toFixed(1);
      const isPerfect = newSizeBytes >= MIN_BYTES && newSizeBytes <= MAX_BYTES;

      if (isPerfect) {
        successCount++;
        console.log(`✅ [${i + 1}/${imageFiles.length}] ${file}`);
        console.log(`   Original: ${origKB} KB  -->  New: \x1b[32m${newKB} KB\x1b[0m [PERFECT: 180-195 KB]`);
      } else {
        warnCount++;
        console.log(`⚠️ [${i + 1}/${imageFiles.length}] ${file}`);
        console.log(`   Original: ${origKB} KB  -->  New: \x1b[33m${newKB} KB\x1b[0m [Near Target]`);
      }
    } catch (err) {
      console.error(`❌ [${i + 1}/${imageFiles.length}] Error processing ${file}:`, err.message);
    }
  }

  console.log('\n================================================================');
  console.log(`🎉 Finished! Successfully processed: ${successCount} / ${imageFiles.length} photos`);
  if (warnCount > 0) {
    console.log(`   (${warnCount} photos were brought as close as possible to the target window)`);
  }
  console.log(`📁 All compressed photos are safely saved in:`);
  console.log(`   ${outputDir}`);
  console.log('================================================================\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
