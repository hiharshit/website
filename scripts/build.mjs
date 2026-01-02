/**
 * Build script: Markdown to HTML blog generator
 * Usage: bun run build [--force]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const siteConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf-8'));

const CONFIG = {
  WORDS_PER_MINUTE: 200,
  DOMAIN: siteConfig.domain ? `https://${siteConfig.domain}` : '',
  AUTHOR: siteConfig.name,
  PATHS: {
    CONTENT: path.join(ROOT, 'content/posts'),
    BLOG: path.join(ROOT, 'blog'),
    TEMPLATE: path.join(ROOT, 'blog/_template.html'),
    BLOG_DATA: path.join(ROOT, 'js/blog-data.js'),
    SITEMAP: path.join(ROOT, 'sitemap.xml'),
    FEED: path.join(ROOT, 'feed.xml'),
    CSS_SRC: path.join(ROOT, 'css/style.css'),
    CSS_MIN: path.join(ROOT, 'css/style.min.css'),
  }
};

const isValidDate = (dateStr) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const date = new Date(dateStr + 'T00:00:00');
  return !isNaN(date.getTime());
};

const FORCE_REBUILD = process.argv.includes('--force');

const md = new MarkdownIt({
  html: true,
  breaks: false,
  linkify: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
      } catch (__) {}
    }
    return md.utils.escapeHtml(str);
  }
});

md.renderer.rules.fence = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  const info = token.info ? md.utils.unescapeAll(token.info).trim() : '';
  let langName = '';
  let langClass = '';

  if (info) {
    langName = info.split(/\s+/)[0];
    langClass = options.langPrefix + langName;
  }

  const highlighted = options.highlight(token.content, langName) || md.utils.escapeHtml(token.content);
  const copyIcon = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

  return  '<div class="code-block">\n' +
            '<div class="code-header">\n' +
              '<span class="code-lang">' + (langName || 'text') + '</span>\n' +
              '<button class="copy-btn" aria-label="Copy code">' + copyIcon + '</button>\n' +
            '</div>\n' +
            '<pre><code class="' + langClass + ' hljs">' + highlighted + '</code></pre>\n' +
          '</div>\n';
};

const defaultImageRender = md.renderer.rules.image || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.image = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  const src = token.attrGet('src');
  const alt = token.content || '';
  
  token.attrSet('loading', 'lazy');
  token.attrSet('decoding', 'async');
  
  if (src && src.startsWith('/assets/images/')) {
    const relativePath = src.replace('/assets/images/', '');
    const baseName = relativePath.replace(/\.[^.]+$/, '');
    const placeholderPath = path.join(ROOT, 'assets/images', baseName + '-placeholder.txt');
    
    if (fs.existsSync(placeholderPath)) {
      const placeholder = fs.readFileSync(placeholderPath, 'utf-8').trim();
      return `<div class="lazy-image"><img src="${placeholder}" data-src="${src}" data-loaded="false" alt="${md.utils.escapeHtml(alt)}" loading="lazy" decoding="async"></div>`;
    }
  }
  
  return defaultImageRender(tokens, idx, options, env, self);
};

const defaultLinkRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  const href = token.attrGet('href');

  if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
    if (!href.startsWith(CONFIG.DOMAIN)) {
       token.attrSet('target', '_blank');
       token.attrSet('rel', 'noopener noreferrer');
    }
  }

  return defaultLinkRender(tokens, idx, options, env, self);
};

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    throw new Error('Invalid frontmatter format');
  }

  const frontmatterText = match[1];
  const body = match[2];
  const frontmatter = {};

  for (const line of frontmatterText.split(/\r?\n/)) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
      value = value.replace(/\\"/g, '"').replace(/\\'/g, "'");
    }

    if (value === 'true') value = true;
    if (value === 'false') value = false;

    if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1)
        .split(',')
        .map(item => item.trim().replace(/^["']|["']$/g, ''));
    }

    if (typeof value === 'string' && !isNaN(value) && value !== '') {
      value = Number(value);
    }

    frontmatter[key] = value;
  }

  return { frontmatter, body };
}

function calculateReadTime(markdownContent) {
  const text = markdownContent
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_~>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  const wordCount = text.split(' ').filter(w => w.length > 0).length;
  const minutes = Math.ceil(wordCount / CONFIG.WORDS_PER_MINUTE);
  return Math.max(1, minutes);
}

function formatDate(isoDate) {
  const date = new Date(isoDate + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>~])\s*/g, '$1')
    .replace(/;}/g, '}')
    .replace(/\s*!important/g, '!important')
    .trim();
}

function generateHTML(slug, frontmatter, markdownContent, template, readTime) {
  const htmlContent = md.render(markdownContent);
  const formattedDate = formatDate(frontmatter.date);
  const tags = Array.isArray(frontmatter.tags) 
    ? frontmatter.tags.filter(tag => tag && tag.trim() !== '') 
    : [];
  const tagsHtml = tags.length > 0
    ? `<div class="post-tags">\n                            ${tags.map(tag => `<span class="post-tag">${tag}</span>`).join('\n                            ')}\n                        </div>`
    : '';

  let html = template;

  html = html.replace(/YOUR_TITLE_HERE/g, frontmatter.title);
  html = html.replace(/YOUR_DESCRIPTION_HERE/g, frontmatter.excerpt);
  html = html.replace(/YOUR_SLUG_HERE/g, slug);
  html = html.replace(/YOUR_DATE_HERE/g, formattedDate);
  html = html.replace(/YYYY-MM-DD/g, frontmatter.date);
  html = html.replace(/X min read/g, `${readTime} min read`);

  html = html.replace(
    /<div class="post-tags">\s*<span class="post-tag">TAG_1<\/span>\s*<span class="post-tag">TAG_2<\/span>\s*<\/div>/,
    tagsHtml
  );

  html = html.replace(
    /<div class="post-content">[\s\S]*?<!-- YOUR CONTENT HERE -->[\s\S]*?<\/div>\s*<div class="post-footer">/,
    `<div class="post-content">\n                        ${htmlContent}\n                    </div>\n                    <div class="post-footer">`
  );

  return html;
}

function generateBlogData(posts) {
  const sortedPosts = [...posts].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  const postsArray = sortedPosts.map(post => `  {
    id: '${post.slug}',
    title: "${post.title.replace(/"/g, '\\"')}",
    date: "${post.date}",
    excerpt: "${post.excerpt.replace(/"/g, '\\"')}",
    tags: [${post.tags.map(t => `"${t}"`).join(', ')}],
    url: "blog/${post.slug}.html",
    readTime: ${post.readTime}
  }`).join(',\n');

  return `export const blogPosts = [\n${postsArray}\n];\n`;
}

function generateSitemap(posts) {
  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { url: '', priority: '1.0', lastmod: today },
    { url: 'about.html', priority: '0.8', lastmod: today }
  ];

  let content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  for (const page of staticPages) {
    content += `
  <url>
    <loc>${CONFIG.DOMAIN}/${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <priority>${page.priority}</priority>
  </url>`;
  }

  for (const post of posts) {
    content += `
  <url>
    <loc>${CONFIG.DOMAIN}/blog/${post.slug}.html</loc>
    <lastmod>${post.date}</lastmod>
    <priority>0.7</priority>
  </url>`;
  }

  content += `
</urlset>`;

  return content;
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateRSS(posts) {
  const sortedPosts = [...posts].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  let content = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteConfig.name}</title>
    <link>${CONFIG.DOMAIN}/</link>
    <description>${siteConfig.description}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${CONFIG.DOMAIN}/feed.xml" rel="self" type="application/rss+xml"/>
`;

  for (const post of sortedPosts) {
    const pubDate = new Date(post.date + 'T00:00:00').toUTCString();
    content += `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${CONFIG.DOMAIN}/blog/${post.slug}.html</link>
      <description>${escapeXml(post.excerpt)}</description>
      <pubDate>${pubDate}</pubDate>
      <guid>${CONFIG.DOMAIN}/blog/${post.slug}.html</guid>
    </item>`;
  }

  content += `
  </channel>
</rss>`;

  return content;
}

async function build() {
  console.log('Building blog...');
  if (FORCE_REBUILD) console.log('   (--force: rebuilding all files)');
  console.log('');

  if (!fs.existsSync(CONFIG.PATHS.CONTENT)) {
    console.error('Error: Content directory not found:', CONFIG.PATHS.CONTENT);
    process.exit(1);
  }

  if (!fs.existsSync(CONFIG.PATHS.TEMPLATE)) {
    console.error('Error: Template not found:', CONFIG.PATHS.TEMPLATE);
    process.exit(1);
  }
  const template = fs.readFileSync(CONFIG.PATHS.TEMPLATE, 'utf-8');

  const mdFiles = fs.readdirSync(CONFIG.PATHS.CONTENT)
    .filter(file => file.endsWith('.md'));

  if (mdFiles.length === 0) {
    console.log('No Markdown files found in content/posts/');
  }

  const posts = [];
  let generated = 0;
  let skipped = 0;
  let drafts = 0;

  for (const file of mdFiles) {
    const slug = file.replace('.md', '');
    const mdPath = path.join(CONFIG.PATHS.CONTENT, file);
    const htmlPath = path.join(CONFIG.PATHS.BLOG, `${slug}.html`);

    const mdContent = fs.readFileSync(mdPath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(mdContent);

    if (frontmatter.draft === true) {
      drafts++;
      console.log(`Draft: ${file} (skipped)`);
      continue;
    }

    if (!frontmatter.title || !frontmatter.date || !frontmatter.excerpt) {
      console.error(`Error: Missing required frontmatter in ${file}`);
      continue;
    }

    if (!isValidDate(frontmatter.date)) {
      console.error(`Error: Invalid date format in ${file} (expected YYYY-MM-DD)`);
      continue;
    }

    const readTime = frontmatter.readTime || calculateReadTime(body);

    posts.push({
      slug,
      title: frontmatter.title,
      date: frontmatter.date,
      excerpt: frontmatter.excerpt,
      tags: Array.isArray(frontmatter.tags) 
        ? frontmatter.tags.filter(tag => tag && tag.trim() !== '') 
        : [],
      readTime
    });

    if (!FORCE_REBUILD) {
      const mdStat = fs.statSync(mdPath);
      if (fs.existsSync(htmlPath)) {
        const htmlStat = fs.statSync(htmlPath);
        if (htmlStat.mtime > mdStat.mtime) {
          skipped++;
          continue;
        }
      }
    }

    const html = generateHTML(slug, frontmatter, body, template, readTime);
    fs.writeFileSync(htmlPath, html);
    console.log(`Generated: blog/${slug}.html`);
    generated++;
  }

  const blogData = generateBlogData(posts);
  fs.writeFileSync(CONFIG.PATHS.BLOG_DATA, blogData);
  console.log(`Generated: js/blog-data.js (${posts.length} posts)`);

  const sitemap = generateSitemap(posts);
  fs.writeFileSync(CONFIG.PATHS.SITEMAP, sitemap);
  console.log('Generated: sitemap.xml');

  const rss = generateRSS(posts);
  fs.writeFileSync(CONFIG.PATHS.FEED, rss);
  console.log('Generated: feed.xml');

  if (fs.existsSync(CONFIG.PATHS.CSS_SRC)) {
    const cssContent = fs.readFileSync(CONFIG.PATHS.CSS_SRC, 'utf-8');
    const minified = minifyCSS(cssContent);
    fs.writeFileSync(CONFIG.PATHS.CSS_MIN, minified);
    const savings = Math.round((1 - minified.length / cssContent.length) * 100);
    console.log(`Minified: css/style.min.css (${savings}% smaller)`);
  }

  const siteConfigJS = `export const siteConfig = ${JSON.stringify(siteConfig, null, 2)};
`;
  fs.writeFileSync(path.join(ROOT, 'js/site-config.js'), siteConfigJS);
  console.log('Generated: js/site-config.js');

  let summary = `\nBuild complete: ${generated} generated`;
  if (skipped > 0) summary += `, ${skipped} unchanged`;
  if (drafts > 0) summary += `, ${drafts} drafts`;
  console.log(summary);
}

build().catch(err => {
  console.error('Build failed:', err.message);
  process.exit(1);
});
