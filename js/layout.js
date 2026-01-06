import { siteConfig } from './site-config.js';

export function initLayout() {
  const path = window.location.pathname;
  const isHome = path.endsWith('index.html') || path.endsWith('/') || path.endsWith('PersonalWebsite/');
  const isAbout = path.includes('about.html');
  const isInBlog = path.includes('/blog/');
  
  const root = isInBlog ? '../' : '';

  const cssId = 'main-stylesheet';
  if (!document.getElementById(cssId)) {
    const link = document.createElement('link');
    link.id = cssId;
    link.rel = 'stylesheet';
    link.href = `${root}css/style.min.css`;
    document.head.appendChild(link);
  }

  const headerHTML = `
    <div class="nav-wrapper">
      <nav class="nav">
        <div class="nav-brand"><a href="${root}index.html">
            <div class="infinity-logo"><svg viewBox="0 0 24 24">
                <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z" />
              </svg></div>
          </a></div>
        <div class="nav-right">
          <ul class="nav-links">
            <li><a href="${root}index.html" class="${isHome ? 'active' : ''}" ${isHome ? 'aria-current="page"' : ''}>Home</a></li>
            <li><a href="${root}about.html" class="${isAbout ? 'active' : ''}" ${isAbout ? 'aria-current="page"' : ''}>About</a></li>
          </ul>
          <button class="command-palette-trigger" id="commandPaletteTrigger" aria-label="Open command palette" data-tooltip="Search" data-tooltip-key="⌘K"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
            </svg></button>
          <button class="theme-toggle" id="themeToggle" aria-label="Toggle theme" data-tooltip="Toggle theme" data-tooltip-key="T"><svg
              class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg><svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg></button>
        </div>
      </nav>
    </div>
  `;

  const footer = siteConfig.footer || {};
  const socialLinks = [];
  
  if (footer.twitter) {
    socialLinks.push(`<a href="https://twitter.com/${footer.twitter}" target="_blank" rel="noopener noreferrer" aria-label="Twitter" data-tooltip="X (Twitter)"><svg viewBox="0 0 24 24" stroke-width="2"><path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" /></svg></a>`);
  }
  if (footer.github) {
    socialLinks.push(`<a href="https://github.com/${footer.github}" target="_blank" rel="noopener noreferrer" aria-label="GitHub" data-tooltip="GitHub"><svg viewBox="0 0 24 24" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg></a>`);
  }
  if (footer.linkedin) {
    socialLinks.push(`<a href="https://linkedin.com/in/${footer.linkedin}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" data-tooltip="LinkedIn"><svg viewBox="0 0 24 24" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg></a>`);
  }
  if (footer.email) {
    socialLinks.push(`<a href="mailto:${footer.email}" aria-label="Email" data-tooltip="Email"><svg viewBox="0 0 24 24" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg></a>`);
  }

  const footerHTML = `
    <div class="container">
      <hr class="footer-divider">
      <div class="footer-content">
        <p class="footer-copy">&copy; ${new Date().getFullYear()} ${siteConfig.name}</p>
        <div class="footer-socials">
          ${socialLinks.join('\n          ')}
        </div>
      </div>
    </div>
  `;

  const headerEl = document.querySelector('.site-header');
  const footerEl = document.querySelector('.footer');
  if (headerEl) headerEl.innerHTML = headerHTML;
  if (footerEl) footerEl.innerHTML = footerHTML;
}
