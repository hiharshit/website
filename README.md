# Personal Website

A minimal static blog with Markdown-to-HTML build system, image optimization, and progressive lazy loading.

## Tech Stack
- **Build**: Bun + Node.js scripts
- **Markdown**: markdown-it with syntax highlighting (highlight.js)
- **Images**: Sharp for WebP conversion + blur placeholders
- **Styling**: Vanilla CSS (no frameworks)
- **Deployment**: Any static hosting (Vercel, Netlify, etc.)

## Site Configuration

Edit `site.config.json` to update your site settings:

```json
{
  "name": "Your Name",
  "domain": "yourdomain.com",
  "email": "you@email.com",
  "social": {
    "twitter": "username",
    "github": "username",
    "linkedin": "username"
  }
}
```

After editing, run `bun run build` to apply changes everywhere.

---

## Quick Start

```bash
bun install                   # Install dependencies (first time only)
bun run new "My Post Title"   # Create a new post
bun run start                 # Build everything and serve at localhost:3000
```

---

## Workflow

### Adding a New Post

1. **Create the post:**
   ```bash
   bun run new "My Post Title"
   ```
   This creates `content/posts/my-post-title.md` with today's date.

2. **Add images** (optional):
   ```
   assets/images/src/my-post-title/photo.png
   ```

3. **Build and preview:**
   ```bash
   bun run start
   ```
   Opens http://localhost:3000 with everything built.

4. **Publish:**
   ```bash
   git add .
   git commit -m "Add: My Post Title"
   git push
   ```

### Editing an Existing Post

1. Edit the `.md` file in `content/posts/`
2. Run `bun run start` to rebuild and preview
3. Commit and push

### Deleting a Post

1. Delete `content/posts/my-post.md`
2. Delete `blog/my-post.html` (or run `bun run clean` to remove all generated files)
3. Run `bun run build` to regenerate sitemap/RSS
4. Commit and push

---

## Post Format

Create `.md` files in `content/posts/`:

```markdown
---
title: "Post Title"
date: "2025-12-22"
excerpt: "Brief description for homepage."
tags: ["Tag1", "Tag2"]
---

Your content here...

## Section Heading

Text with **bold**, *italic*, [links](https://example.com).

> Blockquotes for key ideas.

![Image alt text](/assets/images/post-slug/image.webp)
```

### Frontmatter Fields

| Field     | Required | Description              |
| --------- | -------- | ------------------------ |
| `title`   | ✅        | Post title               |
| `date`    | ✅        | Date (YYYY-MM-DD)        |
| `excerpt` | ✅        | Homepage summary         |
| `tags`    | ❌        | Categories for filtering |
| `draft`   | ❌        | Set `true` to hide post  |

Read time is auto-calculated from word count.

---

## Images

### Adding Images

1. Place source images in:
   ```
   assets/images/src/<post-slug>/image.png
   ```

2. Reference in markdown:
   ```markdown
   ![Description](/assets/images/<post-slug>/image.webp)
   ```

3. Run `bun run start` - images are optimized automatically.

### What Gets Generated

For each source image:
- `image.webp` - full-size optimized version
- `image-placeholder.txt` - tiny blur placeholder for progressive loading
- `image-400w.webp`, `image-800w.webp`, `image-1200w.webp` - responsive sizes (future use)

### Progressive Loading

Images automatically use blur-up lazy loading:
- Tiny placeholder loads instantly (inline base64)
- Full image loads when scrolled into view
- Smooth blur-to-sharp CSS transition
- Images stay loaded after scrolling away

---

## Commands

| Command                | What It Does                                      |
| ---------------------- | ------------------------------------------------- |
| `bun run new "Title"`  | Create new post with template                     |
| `bun run start`        | Optimize images + build HTML + serve at :3000     |
| `bun run build`        | Optimize images + build (incremental)             |
| `bun run build:force`  | Rebuild everything (use after template/CSS edits) |
| `bun run images`       | Optimize new images only                          |
| `bun run images:force` | Reprocess all images                              |
| `bun run serve`        | Serve without building                            |
| `bun run clean`        | Remove all generated files                        |

### When to Use Each

- **`bun run start`** - Default for adding/editing posts. Does everything.
- **`bun run build:force`** - After editing `blog/_template.html` or `css/style.css`.
- **`bun run clean`** - When you want a fresh rebuild from scratch.

---

## Project Structure

```
├── content/posts/          ← Write your Markdown here
│   └── my-post.md
│
├── assets/images/
│   ├── src/                ← Add source images here
│   │   └── <post-slug>/
│   └── <post-slug>/        ← Generated optimized images
│
├── blog/
│   ├── _template.html      ← Base HTML template
│   └── *.html              ← Generated (don't edit)
│
├── css/
│   ├── style.css           ← Source styles (edit this)
│   └── style.min.css       ← Generated minified CSS
│
├── js/
│   ├── main.js             ← Site functionality
│   ├── layout.js           ← Header/footer injection
│   ├── lazy-images.js      ← Progressive image loader
│   └── blog-data.js        ← Generated post index
│
├── scripts/                ← Build automation
│   ├── build.mjs           ← Markdown → HTML + minify CSS
│   ├── optimize-images.mjs ← Image processing + placeholders
│   ├── new-post.mjs        ← Post scaffolder
│   └── clean.mjs           ← Remove generated files
│
├── index.html              ← Homepage
├── about.html              ← About page
├── 404.html                ← Error page
├── sitemap.xml             ← Generated (SEO)
└── feed.xml                ← Generated (RSS)
```

**Edit:** `content/posts/*.md`, `css/style.css`, `index.html`, `about.html`, `blog/_template.html`

**Don't edit:** `blog/*.html`, `js/blog-data.js`, `css/style.min.css`, generated images

---

## Troubleshooting

| Issue                     | Solution                                    |
| ------------------------- | ------------------------------------------- |
| Build fails               | Check frontmatter syntax (quotes, brackets) |
| Post not appearing        | Ensure `.md` is in `content/posts/`         |
| Post hidden               | Remove `draft: true` from frontmatter       |
| Wrong date order          | Use `YYYY-MM-DD` format                     |
| Changes not showing       | Run `bun run build:force`                   |
| Images not loading        | Check path matches `/assets/images/<slug>/` |
| Blurry images stay blurry | Verify `lazy-images.js` is loaded           |
