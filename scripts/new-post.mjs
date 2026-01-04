/**
 * Scaffold a new blog post.
 * Usage: bun run new "My Post Title"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, '../content/posts');

const title = process.argv[2];

if (!title) {
  console.error('Usage: bun run new "My Post Title"');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .trim();

const filePath = path.join(CONTENT_DIR, `${slug}.md`);

if (fs.existsSync(filePath)) {
  console.error(`File already exists: content/posts/${slug}.md`);
  process.exit(1);
}

const today = new Date().toISOString().split('T')[0];

const template = `---
title: "${title}"
date: "${today}"
excerpt: "A brief description of your post for the homepage."
tags: ["Tag1", "Tag2"]
draft: false
---

Your introduction paragraph goes here.

## First Section

Your content here. You can use **bold**, *italic*, and [links](https://example.com).

> Blockquotes are great for highlighting key ideas.

## Second Section

Continue your essay here.

## Conclusion

Wrap up your thoughts.
`;

if (!fs.existsSync(CONTENT_DIR)) {
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
}

fs.writeFileSync(filePath, template);

const imagesDir = path.join(__dirname, '../assets/images/src', slug);
fs.mkdirSync(imagesDir, { recursive: true });

console.log(`Created: content/posts/${slug}.md`);
console.log(`Created: assets/images/src/${slug}/`);
console.log(`\nNext: Add images to the folder, then run 'bun run dev'`);
