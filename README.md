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
  "avatar": "/assets/images/avatar.jpg",
  "footer": {
    "twitter": "username",
    "github": "username",
    "linkedin": "username",
    "email": "you@email.com"
  },
  "share": {
    "twitter": true,
    "copyLink": true
  }
}
```

**Avatar Image:**
- Place your avatar image at `assets/images/avatar.jpg` (or `.png`, `.webp`)
- Update the `avatar` field in `site.config.json` with the path
- Set to `null` or `""` to use initials with gradient instead
- Recommended size: 200x200px or larger, square aspect ratio

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
   Creates `content/posts/my-post-title.md` and `assets/images/src/my-post-title/`.

2. **Add images** (optional):
   Drop images into the created `assets/images/src/my-post-title/` folder.

3. **Build and preview:**
   ```bash
   bun run dev
   ```
   Optimizes images, builds, and opens http://localhost:3000.

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
2. Run `bun run clean` to remove generated files + orphaned images
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
draft: false
---

Your content here...

## Section Heading

Text with **bold**, *italic*, [links](https://example.com).

> Blockquotes for key ideas.

![Image alt text](/assets/images/post-slug/image.webp)
```

### Frontmatter Fields

| Field     | Required | Description                              |
| --------- | -------- | ---------------------------------------- |
| `title`   | ✅        | Post title                               |
| `date`    | ✅        | Date (YYYY-MM-DD)                        |
| `excerpt` | ✅        | Homepage summary                         |
| `tags`    | ❌        | Categories for filtering                 |
| `draft`   | ❌        | Set `true` to preview without publishing |

Read time is auto-calculated from word count.

### Working with Drafts

1. Add `draft: true` to your post's frontmatter
2. Run `bun run dev` to preview (shows "Draft" label)
3. When ready: remove `draft: true` (or set `draft: false`), run `bun run start`, then push

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

### Progressive Loading

Images automatically use blur-up lazy loading:
- Tiny placeholder loads instantly (inline base64)
- Full image loads when scrolled into view
- Smooth blur-to-sharp CSS transition
- Images stay loaded after scrolling away

---

## Commands

### Daily Use

| Command               | What It Does                                         |
| --------------------- | ---------------------------------------------------- |
| `bun run new "Title"` | Create a new post                                    |
| `bun run dev`         | Watch mode with auto-rebuild (content, CSS, scripts) |
| `bun run start`       | Build + preview (excludes drafts)                    |

### Advanced

| Command               | When to Use                                       |
| --------------------- | ------------------------------------------------- |
| `bun run build:force` | After editing template or CSS                     |
| `bun run clean`       | Reset - removes generated files + orphaned images |
| `bun run build`       | Build without serving                             |
| `bun run serve`       | Serve without building                            |
| `bun run images`      | Process images only (build already does this)     |

### Development

| Command                | What It Does                      |
| ---------------------- | --------------------------------- |
| `bun run test`         | Run unit tests                    |
| `bun run lint`         | Check for code issues             |
| `bun run lint:fix`     | Auto-fix linting issues           |
| `bun run format`       | Format all files with Prettier    |
| `bun run format:check` | Check formatting without changing |

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
│   ├── main.js             ← Blog list, search, filters, pagination
│   ├── layout.js           ← Header/footer injection
│   ├── utils.js            ← Shared utilities (scroll handler, debounce)
│   ├── zen-reader.js       ← Reading progress, waypoints, auto-hide header
│   ├── lazy-images.js      ← Progressive image loader
│   ├── theme-init.js       ← Theme detection (runs before render)
│   ├── blog-data.js        ← Generated post index
│   └── site-config.js      ← Generated from site.config.json
│
├── scripts/                ← Build automation
│   ├── build.mjs           ← Markdown → HTML + minify CSS
│   ├── dev.mjs             ← Watch mode with hot reload
│   ├── optimize-images.mjs ← Image processing + placeholders
│   ├── new-post.mjs        ← Post scaffolder
│   └── clean.mjs           ← Remove generated files
│
├── tests/                  ← Unit tests (bun test)
│   └── build.test.js
│
├── index.html              ← Homepage
├── about.html              ← About page
├── 404.html                ← Error page
├── sw.js                   ← Service worker (auto-versioned)
├── robots.txt              ← Search engine rules
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
