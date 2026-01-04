import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const PATHS = {
  CONTENT: path.join(ROOT, 'content/posts'),
  BLOG: path.join(ROOT, 'blog'),
  IMAGES_SRC: path.join(ROOT, 'assets/images/src'),
  IMAGES_OUT: path.join(ROOT, 'assets/images'),
};

const FILES_TO_REMOVE = [
  path.join(ROOT, 'js/blog-data.js'),
  path.join(ROOT, 'sitemap.xml'),
  path.join(ROOT, 'feed.xml'),
];

function getActiveSlugs() {
  if (!fs.existsSync(PATHS.CONTENT)) return new Set();
  return new Set(
    fs.readdirSync(PATHS.CONTENT)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''))
  );
}

function cleanBuildArtifacts() {
  console.log('Cleaning build artifacts...');
  
  FILES_TO_REMOVE.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`  Removed: ${path.relative(ROOT, file)}`);
    }
  });

  if (fs.existsSync(PATHS.BLOG)) {
    fs.readdirSync(PATHS.BLOG)
      .filter(f => f.endsWith('.html') && f !== '_template.html')
      .forEach(file => {
        fs.unlinkSync(path.join(PATHS.BLOG, file));
        console.log(`  Removed: blog/${file}`);
      });
  }
}

function cleanOrphanedImages() {
  console.log('Cleaning orphaned images...');
  const activeSlugs = getActiveSlugs();
  let removed = 0;

  [PATHS.IMAGES_SRC, PATHS.IMAGES_OUT].forEach(baseDir => {
    if (!fs.existsSync(baseDir)) return;
    
    fs.readdirSync(baseDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .filter(d => baseDir !== PATHS.IMAGES_OUT || d.name !== 'src')
      .forEach(dir => {
        if (!activeSlugs.has(dir.name)) {
          const dirPath = path.join(baseDir, dir.name);
          fs.rmSync(dirPath, { recursive: true });
          console.log(`  Removed: ${path.relative(ROOT, dirPath)}/`);
          removed++;
        }
      });
  });

  if (removed === 0) {
    console.log('  No orphaned images found.');
  }
}

console.log('');
cleanBuildArtifacts();
console.log('');
cleanOrphanedImages();
console.log('');
console.log('Clean complete.');

