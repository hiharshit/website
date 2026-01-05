import { describe, it, expect } from 'bun:test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

describe('Build Configuration', () => {
  it('should have valid site.config.json', () => {
    const configPath = path.join(ROOT, 'site.config.json');
    expect(fs.existsSync(configPath)).toBe(true);
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(config).toHaveProperty('name');
    expect(typeof config.name).toBe('string');
    expect(config.name.length).toBeGreaterThan(0);
  });

  it('should have blog template', () => {
    const templatePath = path.join(ROOT, 'blog/_template.html');
    expect(fs.existsSync(templatePath)).toBe(true);
    
    const content = fs.readFileSync(templatePath, 'utf-8');
    expect(content).toContain('YOUR_TITLE_HERE');
    expect(content).toContain('<!DOCTYPE html>');
  });

  it('should have required assets', () => {
    expect(fs.existsSync(path.join(ROOT, 'css/style.css'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'sw.js'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'robots.txt'))).toBe(true);
  });
});

describe('Frontmatter Parsing', () => {
  const parseFrontmatter = (content) => {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) throw new Error('Invalid frontmatter format');

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
      }

      if (value === 'true') value = true;
      if (value === 'false') value = false;

      frontmatter[key] = value;
    }

    return { frontmatter, body };
  };

  it('should parse valid frontmatter', () => {
    const content = `---
title: "Test Post"
date: "2025-01-01"
excerpt: "A test excerpt"
---

Content here`;

    const { frontmatter, body } = parseFrontmatter(content);
    expect(frontmatter.title).toBe('Test Post');
    expect(frontmatter.date).toBe('2025-01-01');
    expect(body.trim()).toBe('Content here');
  });

  it('should parse boolean values', () => {
    const content = `---
draft: true
published: false
---

Body`;

    const { frontmatter } = parseFrontmatter(content);
    expect(frontmatter.draft).toBe(true);
    expect(frontmatter.published).toBe(false);
  });

  it('should throw on invalid frontmatter', () => {
    const invalid = 'No frontmatter here';
    expect(() => parseFrontmatter(invalid)).toThrow();
  });
});

describe('Date Validation', () => {
  const isValidDate = (dateStr) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    const date = new Date(dateStr + 'T00:00:00');
    return !isNaN(date.getTime());
  };

  it('should validate YYYY-MM-DD format', () => {
    expect(isValidDate('2025-01-15')).toBe(true);
    expect(isValidDate('2025-12-31')).toBe(true);
  });

  it('should reject invalid formats', () => {
    expect(isValidDate('01-15-2025')).toBe(false);
    expect(isValidDate('2025/01/15')).toBe(false);
    expect(isValidDate('2025-1-15')).toBe(false);
    expect(isValidDate('invalid')).toBe(false);
  });
});

describe('Read Time Calculation', () => {
  const calculateReadTime = (text, wpm = 200) => {
    const cleaned = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]+`/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[#*_~>]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    const wordCount = cleaned.split(' ').filter(w => w.length > 0).length;
    return Math.max(1, Math.ceil(wordCount / wpm));
  };

  it('should calculate minimum 1 min for short content', () => {
    expect(calculateReadTime('Short')).toBe(1);
    expect(calculateReadTime('')).toBe(1);
  });

  it('should calculate based on word count', () => {
    const words = Array(400).fill('word').join(' ');
    expect(calculateReadTime(words)).toBe(2);
  });

  it('should exclude code blocks', () => {
    const content = 'Hello ```code block with many words here``` world';
    expect(calculateReadTime(content)).toBe(1);
  });
});

describe('CSS Minification', () => {
  const minifyCSS = (css) => {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}:;,>~])\s*/g, '$1')
      .replace(/;}/g, '}')
      .replace(/\s*!important/g, '!important')
      .trim();
  };

  it('should remove comments', () => {
    const css = '/* comment */ .class { color: red; }';
    expect(minifyCSS(css)).toBe('.class{color:red}');
  });

  it('should collapse whitespace', () => {
    const css = '.a   {   color:   red;   }';
    expect(minifyCSS(css)).toBe('.a{color:red}');
  });

  it('should remove trailing semicolons before braces', () => {
    const css = '.a { color: red; }';
    expect(minifyCSS(css)).toBe('.a{color:red}');
  });
});
