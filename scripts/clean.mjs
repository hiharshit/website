/**
 * scripts/clean.mjs
 * 
 * Safely removes generated build artifacts.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const FILES_TO_REMOVE = [
  path.join(ROOT, 'js/blog-data.js'),
  path.join(ROOT, 'sitemap.xml'),
  path.join(ROOT, 'feed.xml'),
];

const DIRS_TO_CLEAN = [
  path.join(ROOT, 'blog'),
];

console.log('Cleaning generated files...');

FILES_TO_REMOVE.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      fs.unlinkSync(file);
      console.log(`Removed: ${path.relative(ROOT, file)}`);
    } catch (e) {
      console.error(`Failed to remove ${file}:`, e.message);
    }
  }
});

DIRS_TO_CLEAN.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (file.endsWith('.html') && file !== '_template.html') {
        const fullPath = path.join(dir, file);
        try {
          fs.unlinkSync(fullPath);
          console.log(`Removed: ${path.relative(ROOT, fullPath)}`);
        } catch (e) {
          console.error(`Failed to remove ${fullPath}:`, e.message);
        }
      }
    });
  }
});

console.log('Clean complete.');
