/**
 * Image optimizer - converts to WebP with responsive sizes.
 * 
 * Usage:
 *   bun run images         - Process new images
 *   bun run images --force - Reprocess all
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const CONFIG = {
  SRC_DIR: path.join(ROOT, 'assets/images/src'),
  OUT_DIR: path.join(ROOT, 'assets/images'),
  SIZES: [
    { width: 400, suffix: '-400w' },
    { width: 800, suffix: '-800w' },
    { width: 1200, suffix: '-1200w' },
  ],
  PLACEHOLDER_WIDTH: 20,
  QUALITY: 80,
  SUPPORTED_FORMATS: ['.jpg', '.jpeg', '.png', '.gif'],
};

const FORCE_REBUILD = process.argv.includes('--force');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function needsUpdate(srcPath, outPath) {
  if (!fs.existsSync(outPath)) return true;
  const srcStat = fs.statSync(srcPath);
  const outStat = fs.statSync(outPath);
  return srcStat.mtime > outStat.mtime;
}

async function processImage(srcPath, outDir, baseName) {
  const results = [];
  ensureDir(outDir);

  for (const size of CONFIG.SIZES) {
    const outName = `${baseName}${size.suffix}.webp`;
    const outPath = path.join(outDir, outName);

    if (!FORCE_REBUILD && !needsUpdate(srcPath, outPath)) {
      continue;
    }

    const image = sharp(srcPath);
    const metadata = await image.metadata();
    const targetWidth = Math.min(size.width, metadata.width);

    await image
      .resize(targetWidth, null, { withoutEnlargement: true })
      .webp({ quality: CONFIG.QUALITY })
      .toFile(outPath);

    const outStat = fs.statSync(outPath);
    results.push({
      name: outName,
      size: outStat.size,
      width: targetWidth,
    });
  }


  const fullOutName = `${baseName}.webp`;
  const fullOutPath = path.join(outDir, fullOutName);

  if (FORCE_REBUILD || needsUpdate(srcPath, fullOutPath)) {
    await sharp(srcPath)
      .webp({ quality: CONFIG.QUALITY })
      .toFile(fullOutPath);

    const fullStat = fs.statSync(fullOutPath);
    results.push({
      name: fullOutName,
      size: fullStat.size,
      width: 'original',
    });
  }


  const placeholderPath = path.join(outDir, `${baseName}-placeholder.txt`);

  if (FORCE_REBUILD || needsUpdate(srcPath, placeholderPath)) {
    const placeholderBuffer = await sharp(srcPath)
      .resize(CONFIG.PLACEHOLDER_WIDTH, null, { withoutEnlargement: true })
      .webp({ quality: 20 })
      .toBuffer();

    const base64 = `data:image/webp;base64,${placeholderBuffer.toString('base64')}`;
    fs.writeFileSync(placeholderPath, base64);

    results.push({
      name: `${baseName}-placeholder.txt`,
      size: base64.length,
      width: 'placeholder',
    });
  }

  return results;
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function collectImages(dir, subDir = '') {
  const images = [];
  const fullPath = subDir ? path.join(dir, subDir) : dir;
  
  if (!fs.existsSync(fullPath)) return images;
  
  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      images.push(...collectImages(dir, path.join(subDir, entry.name)));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (CONFIG.SUPPORTED_FORMATS.includes(ext)) {
        images.push({
          relativePath: subDir,
          fileName: entry.name,
          fullPath: path.join(fullPath, entry.name),
        });
      }
    }
  }
  
  return images;
}

async function optimize() {
  console.log('Optimizing images...');
  if (FORCE_REBUILD) console.log('   (--force: reprocessing all images)');
  console.log('');

  ensureDir(CONFIG.SRC_DIR);

  const images = collectImages(CONFIG.SRC_DIR);

  if (images.length === 0) {
    console.log('No images found in assets/images/src/');
    console.log('Add images directly or in blog-named subdirectories.');
    return;
  }

  let processed = 0;
  let skipped = 0;
  let totalSaved = 0;

  for (const img of images) {
    const outDir = img.relativePath 
      ? path.join(CONFIG.OUT_DIR, img.relativePath)
      : CONFIG.OUT_DIR;
    const baseName = path.basename(img.fileName, path.extname(img.fileName));
    const srcStat = fs.statSync(img.fullPath);
    const displayPath = img.relativePath 
      ? `${img.relativePath}/${img.fileName}`
      : img.fileName;

    const results = await processImage(img.fullPath, outDir, baseName);

    if (results.length > 0) {
      const savedBytes = srcStat.size - (results.find(r => r.width === 'original')?.size || 0);
      totalSaved += Math.max(0, savedBytes);

      console.log(`Optimized: ${displayPath}`);
      for (const r of results) {
        console.log(`  → ${r.name} (${formatSize(r.size)})`);
      }
      processed++;
    } else {
      skipped++;
    }
  }

  console.log('');
  if (processed > 0) {
    console.log(`Done: ${processed} images optimized`);
    if (totalSaved > 0) {
      console.log(`      ${formatSize(totalSaved)} saved on full-size conversions`);
    }
  }
  if (skipped > 0) {
    console.log(`      ${skipped} images unchanged (skipped)`);
  }
}

optimize().catch(err => {
  console.error('Image optimization failed:', err.message);
  process.exit(1);
});
