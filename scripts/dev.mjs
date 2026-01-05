import { spawn } from 'child_process';
import { watch } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const WATCH_DIRS = ['content', 'css'];
const WATCH_FILES = ['site.config.json', 'blog/_template.html'];
const DEBOUNCE_MS = 300;

let buildTimeout = null;
let server = null;
let isBuilding = false;

async function build() {
  if (isBuilding) return;
  isBuilding = true;
  
  console.log('\n🔄 Rebuilding...');
  const start = Date.now();
  
  const imgProc = spawn('bun', ['scripts/optimize-images.mjs'], { cwd: ROOT, stdio: 'pipe', shell: true });
  await new Promise(resolve => imgProc.on('close', resolve));
  
  const buildProc = spawn('bun', ['scripts/build.mjs', '--drafts'], { cwd: ROOT, stdio: 'pipe', shell: true });
  await new Promise(resolve => buildProc.on('close', resolve));
  
  console.log(`✅ Built in ${Date.now() - start}ms`);
  isBuilding = false;
  return true;
}

function scheduleBuild(callback) {
  if (buildTimeout) clearTimeout(buildTimeout);
  buildTimeout = setTimeout(async () => {
    await build();
    if (callback) callback();
  }, DEBOUNCE_MS);
}

function startServer() {
  server = spawn('bunx', [
    'browser-sync', 'start',
    '--server', '.',
    '--port', '3000',
    '--no-open',
    '--no-notify',
    '--files', 'blog/*.html', 'css/style.min.css', 'js/**/*.js'
  ], { 
    cwd: ROOT, 
    stdio: 'inherit',
    shell: true 
  });
}

function startWatching() {
  WATCH_DIRS.forEach(dir => {
    const fullPath = path.join(ROOT, dir);
    try {
      watch(fullPath, { recursive: true }, (event, filename) => {
        if (filename && !filename.endsWith('.html') && !filename.endsWith('.min.css')) {
          console.log(`📝 ${dir}/${filename} changed`);
          scheduleBuild();
        }
      });
    } catch {}
  });
  
  WATCH_FILES.forEach(file => {
    try {
      watch(path.join(ROOT, file), () => {
        console.log(`📝 ${file} changed`);
        scheduleBuild();
      });
    } catch {}
  });
}

async function main() {
  console.log('🚀 Starting dev server with live reload...\n');
  
  await build();
  startServer();
  startWatching();
  
  console.log('\n👀 Watching for changes (auto-refresh enabled)');
  console.log('   Press Ctrl+C to stop\n');
}

process.on('SIGINT', () => {
  if (server) server.kill();
  process.exit();
});

main();

