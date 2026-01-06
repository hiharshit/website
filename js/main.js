import { blogPosts } from './blog-data.js';
import { initLayout } from './layout.js';
import { escapeHtml, removeListeners, onScroll } from './utils.js';
import { ZenReader } from './zen-reader.js';

const CONFIG = {
  POSTS_PER_PAGE: 5,
  DEBOUNCE_MS: 250,
  SCROLL_THRESHOLD: 400
};

const state = {
  searchQuery: '',
  activeTag: 'all',
  sortOrder: 'newest',
  filteredPosts: [],
  currentPage: 1,
  postsPerPage: CONFIG.POSTS_PER_PAGE
};

let animateMaskUpdates = () => {};

function saveSession() {
  sessionStorage.setItem('blogState', JSON.stringify({
    searchQuery: state.searchQuery,
    activeTag: state.activeTag,
    sortOrder: state.sortOrder,
    currentPage: state.currentPage
  }));
}

function loadSession() {
  const saved = sessionStorage.getItem('blogState');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.searchQuery !== undefined) state.searchQuery = parsed.searchQuery;
      if (parsed.activeTag !== undefined) state.activeTag = parsed.activeTag;
      if (parsed.sortOrder !== undefined) state.sortOrder = parsed.sortOrder;
      if (parsed.currentPage !== undefined) state.currentPage = parsed.currentPage;
    } catch {}
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initLayout();
  
  state.filteredPosts = [...blogPosts];
  loadSession();
  
  renderApp();

  initThemeToggle();
  initSearch();
  initTagFilters();
  initSortDropdown();
  initTooltips();
  initShareButtons();
  initBackToTop();
  initPagination();
  initReadTime();
  initCopyButtons();
  initAvatar();
  initImageZoom();
  initHeadingLinks();
  initCommandPalette();
  
  ZenReader.init();
});

function initCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const codeBlock = btn.closest('.code-block');
      if (!codeBlock) return;
      
      const codeEl = codeBlock.querySelector('pre code');
      if (!codeEl) return;

      const lineContents = codeEl.querySelectorAll('.line-content');
      const text = lineContents.length 
        ? Array.from(lineContents).map(el => el.textContent).join('\n')
        : codeEl.innerText;
      let copied = false;
      
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(text);
          copied = true;
        } catch {}
      }
      
      if (!copied) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-9999px;top:0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
          copied = document.execCommand('copy');
        } catch {}
        document.body.removeChild(ta);
      }
      
      if (copied) {
        const originalIcon = btn.innerHTML;
        btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        btn.classList.add('copied');
        
        setTimeout(() => {
          btn.innerHTML = originalIcon;
          btn.classList.remove('copied');
        }, 2000);
      }
    });
  });
}

function initReadTime() {
  const article = document.querySelector('.post-content');
  const timeDisplay = document.querySelector('.post-author-date');
  
  if (!article || !timeDisplay) return;
  
  const text = article.innerText;
  const wpm = 200;
  const words = text.trim().split(/\s+/).length;
  const time = Math.ceil(words / wpm);
  
  timeDisplay.textContent = `${time} min read`;
}

function renderApp() {
  applyFiltersAndSort();
  const start = (state.currentPage - 1) * state.postsPerPage;
  const paginatedPosts = state.filteredPosts.slice(start, start + state.postsPerPage);
  renderPosts(paginatedPosts);
  renderPagination();
  renderTags();
  updateUIState();
  announceResults();
  saveSession();
}

function announceResults() {
  const announcer = document.getElementById('announcer');
  if (!announcer) return;
  
  const count = state.filteredPosts.length;
  const filterInfo = state.activeTag !== 'all' ? ` in ${state.activeTag}` : '';
  const searchInfo = state.searchQuery ? ` matching "${state.searchQuery}"` : '';
  
  announcer.textContent = count === 0 
    ? 'No posts found' 
    : `Showing ${count} post${count === 1 ? '' : 's'}${filterInfo}${searchInfo}`;
}

function applyFiltersAndSort() {
  const result = blogPosts.filter(post => {
    if (state.activeTag !== 'all') {
      const postTags = post.tags.map(t => t.toLowerCase());
      if (!postTags.includes(state.activeTag)) return false;
    }
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const match = post.title.toLowerCase().includes(q) 
                 || post.excerpt.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  result.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return state.sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  state.filteredPosts = result;
}

function formatDate(isoString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(isoString).toLocaleDateString('en-US', options);
}

function renderPosts(posts) {
  const blogList = document.getElementById('blogList');
  if (!blogList) return;

  blogList.innerHTML = '';
  blogList.classList.remove('loading');
  
  posts.forEach((post, index) => {
    const article = document.createElement('article');
    article.className = 'blog-item';
    article.style.animationDelay = `${index * 0.05}s`;
    
    const tagsHtml = post.tags.map(tag => 
      `<span class="blog-item-tag">${escapeHtml(tag)}</span>`
    ).join('');

    const readTime = post.readTime ? `${post.readTime} min read` : '';

    article.innerHTML = `
      <a href="${escapeHtml(post.url)}" class="blog-item-link">
        <div class="blog-item-header">
          <h2 class="blog-item-title">${escapeHtml(post.title)}</h2>
          <span class="blog-item-date">${formatDate(post.date)}</span>
        </div>
        <p class="blog-item-excerpt">${escapeHtml(post.excerpt)}</p>
        <div class="blog-item-footer">
          <div class="blog-item-tags">${tagsHtml}</div>
          <div class="blog-item-meta">
            ${readTime ? `<span class="blog-item-readtime">${readTime}</span>` : ''}
            <span class="blog-item-read">Read post</span>
          </div>
        </div>
      </a>
    `;
    blogList.appendChild(article);
  });
}

function updateUIState() {
  const noResults = document.getElementById('noResults');
  const skeletonContainer = document.querySelector('.blog-skeleton-container');
  
  if (noResults) {
    noResults.classList.toggle('visible', state.filteredPosts.length === 0);
  }
  
  if (skeletonContainer) {
    skeletonContainer.style.display = state.filteredPosts.length === 0 ? 'none' : '';
  }

  const clearFilterBtn = document.getElementById('clearFilterBtn');
  if (clearFilterBtn) {
    clearFilterBtn.classList.toggle('visible', state.activeTag !== 'all');
  }

  const searchClear = document.getElementById('searchClear');
  if (searchClear) {
    searchClear.classList.toggle('visible', state.searchQuery !== '');
  }
}

function initPagination() {
  const container = document.getElementById('pagination');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const totalPages = Math.ceil(state.filteredPosts.length / state.postsPerPage);

    if (btn.classList.contains('pagination-prev') && state.currentPage > 1) {
      state.currentPage--;
      renderApp();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (btn.classList.contains('pagination-next') && state.currentPage < totalPages) {
      state.currentPage++;
      renderApp();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (btn.classList.contains('pagination-num')) {
      const page = parseInt(btn.dataset.page);
      if (page !== state.currentPage) {
        state.currentPage = page;
        renderApp();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  });
}

function renderPagination() {
  const container = document.getElementById('pagination');
  if (!container) return;

  const totalPages = Math.ceil(state.filteredPosts.length / state.postsPerPage);
  
  if (totalPages <= 1) {
    container.innerHTML = '';
    container.classList.remove('visible');
    return;
  }

  container.classList.add('visible');
  
  const prevDisabled = state.currentPage === 1;
  const nextDisabled = state.currentPage === totalPages;

  const getPageNumbers = () => {
    const pages = [];
    const current = state.currentPage;
    const total = totalPages;
    
    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();
  const numbersHTML = pageNumbers.map(p => {
    if (p === '...') {
      return `<span class="pagination-ellipsis">…</span>`;
    }
    const isActive = p === state.currentPage;
    return `<button class="pagination-num ${isActive ? 'active' : ''}" data-page="${p}" ${isActive ? 'aria-current="page"' : ''}>${p}</button>`;
  }).join('');

  container.innerHTML = `
    <button class="pagination-btn pagination-prev ${prevDisabled ? 'disabled' : ''}" 
            ${prevDisabled ? 'disabled' : ''} aria-label="Previous page">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 18l-6-6 6-6"/>
      </svg>
    </button>
    <div class="pagination-numbers">${numbersHTML}</div>
    <button class="pagination-btn pagination-next ${nextDisabled ? 'disabled' : ''}" 
            ${nextDisabled ? 'disabled' : ''} aria-label="Next page">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>
  `;
}

function initTagFilters() {
  const tagFiltersContainer = document.getElementById('tagFilters');
  if (!tagFiltersContainer) return;

  const allTags = new Set();
  blogPosts.forEach(post => {
    post.tags.forEach(tag => allTags.add(tag.toLowerCase()));
  });

  const sortedTags = Array.from(allTags).sort();

  const createBtn = (tag, label) => {
    const btn = document.createElement('button');
    btn.className = `tag-btn ${state.activeTag === tag ? 'active' : ''}`;
    btn.textContent = label;
    btn.dataset.tag = tag;
    btn.addEventListener('click', () => {
      state.activeTag = tag;
      state.currentPage = 1;
      renderApp();
      animateMaskUpdates();
    });
    return btn;
  };

  tagFiltersContainer.innerHTML = '';
  tagFiltersContainer.appendChild(createBtn('all', 'All'));
  
  sortedTags.forEach(tag => {
    const label = tag.charAt(0).toUpperCase() + tag.slice(1);
    tagFiltersContainer.appendChild(createBtn(tag, label));
  });

  setupMaskLogic(tagFiltersContainer);

  const clearFilterBtn = document.getElementById('clearFilterBtn');
  if (clearFilterBtn) {
    const btn = removeListeners(clearFilterBtn);
    btn.addEventListener('click', () => {
      state.activeTag = 'all';
      state.currentPage = 1;
      renderApp();
      animateMaskUpdates();
    });
  }
}

function renderTags() {
  const tagButtons = document.querySelectorAll('.tag-btn');
  tagButtons.forEach(btn => {
    const tag = btn.dataset.tag;
    btn.classList.toggle('active', tag === state.activeTag);
  });
}

function setupMaskLogic(container) {
  const updateMask = () => {
    const isStart = container.scrollLeft <= 10;
    const isEnd = Math.abs(container.scrollWidth - container.clientWidth - container.scrollLeft) <= 10;
    container.classList.remove('mask-start', 'mask-end', 'mask-both');
    if (!isStart && !isEnd) container.classList.add('mask-both');
    else if (!isStart && isEnd) container.classList.add('mask-start');
    else if (isStart && !isEnd) container.classList.add('mask-end');
  };

  container.addEventListener('scroll', updateMask);
  
  const resizeObserver = new ResizeObserver(() => updateMask());
  resizeObserver.observe(container);
  
  animateMaskUpdates = () => {
    let count = 0;
    updateMask();
    const int = setInterval(() => {
      updateMask();
      count++;
      if (count > 20) clearInterval(int);
    }, 50);
  };

  setTimeout(updateMask, 100);
}

function initSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');
  if (!searchInput) return;

  if (state.searchQuery) {
    searchInput.value = state.searchQuery;
  }

  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.searchQuery = val.trim();
      state.currentPage = 1;
      renderApp();
    }, CONFIG.DEBOUNCE_MS);
  });

  if (searchClear) {
    const btn = removeListeners(searchClear);
    btn.addEventListener('click', () => {
      searchInput.value = '';
      state.searchQuery = '';
      state.currentPage = 1;
      renderApp();
      searchInput.focus();
    });
  }

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      state.searchQuery = '';
      renderApp();
      searchInput.blur();
    }
  });
}

function initSortDropdown() {
  const trigger = document.getElementById('sortTrigger');
  const menu = document.getElementById('sortMenu');
  const options = document.querySelectorAll('.sort-option');

  if (!trigger || !menu) return;

  const updateIcon = () => {
    if (state.sortOrder === 'newest') {
      trigger.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M6 12h12M9 18h6" /></svg>`;
    } else {
      trigger.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18h18M6 12h12M9 6h6" /></svg>`;
    }
  };
  updateIcon();

  options.forEach(opt => {
    opt.classList.toggle('active', opt.dataset.sort === state.sortOrder);
  });

  trigger.onclick = (e) => {
    e.stopPropagation();
    const isOpen = menu.classList.contains('open');
    menu.classList.toggle('open', !isOpen);
    trigger.setAttribute('aria-expanded', !isOpen);
  };

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !trigger.contains(e.target)) {
      menu.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });

  options.forEach(opt => {
    opt.onclick = () => {
      const type = opt.dataset.sort;
      if (type === state.sortOrder) {
          menu.classList.remove('open');
          return; 
      }
      
      state.sortOrder = type;
      options.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      
      menu.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
      
      state.currentPage = 1;
      updateIcon();
      renderApp();
    };
  });
}

function initThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
}

function initTooltips() {
  let tooltip = document.querySelector('.tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    document.body.appendChild(tooltip);
  }

  let activeTarget = null;

  const show = (target) => {
    const text = target.getAttribute('data-tooltip');
    if (!text) return;

    activeTarget = target;
    
    const key = target.getAttribute('data-tooltip-key');
    if (key) {
      tooltip.innerHTML = `${text} <kbd class="tooltip-kbd">${key}</kbd>`;
    } else {
      tooltip.textContent = text;
    }
    tooltip.style.display = 'block';
    
    const placement = target.getAttribute('data-tooltip-placement') || 'top';
    tooltip.classList.remove('tooltip-left');
    if (placement === 'left') {
      tooltip.classList.add('tooltip-left');
    }

    const rect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const padding = 12;
    const gap = placement === 'left' ? 24 : 8;

    let left, top;

    if (placement === 'left') {
      left = rect.left - tooltipRect.width - gap;
      top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
      
      if (left < padding) {
        left = rect.right + gap;
        tooltip.classList.remove('tooltip-left');
      }
    } else {
      left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
      if (left < padding) left = padding;
      if (left + tooltipRect.width > window.innerWidth - padding) {
        left = window.innerWidth - tooltipRect.width - padding;
      }

      top = rect.top - tooltipRect.height - gap;
      if (top < padding) {
        top = rect.bottom + gap;
      }
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    
    requestAnimationFrame(() => {
      tooltip.classList.add('visible');
    });
  };

  const hide = () => {
    activeTarget = null;
    tooltip.classList.remove('visible');
  };

  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('[data-tooltip]');
    if (target) {
      if (activeTarget !== target) show(target);
    } else {
      if (activeTarget) hide();
    }
  });
  
  onScroll(hide);
}

function initShareButtons() {
  document.querySelectorAll('[data-share]').forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      const platform = button.dataset.share;
      const url = window.location.href;
      const title = document.title;
      
      if (platform === 'twitter') {
        const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
      } else if (platform === 'copy') {
        let copied = false;
        
        if (navigator.clipboard) {
          try {
            await navigator.clipboard.writeText(url);
            copied = true;
          } catch {}
        }
        
        if (!copied) {
          const ta = document.createElement('textarea');
          ta.value = url;
          ta.style.cssText = 'position:fixed;left:-9999px;top:0';
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          try {
            copied = document.execCommand('copy');
          } catch {}
          document.body.removeChild(ta);
        }
        
        if (copied) {
          button.classList.add('copied');
          setTimeout(() => button.classList.remove('copied'), 2000);
        }
      }
    });
  });
}

function initBackToTop() {
  const button = document.getElementById('backToTop');
  if (!button) return;
  
  onScroll(() => {
    button.classList.toggle('visible', window.scrollY > CONFIG.SCROLL_THRESHOLD);
  });
  
  button.addEventListener('click', () => { 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  });
}

function initAvatar() {
  import('./site-config.js').then(module => {
    const config = module.siteConfig;
    if (!config.avatar) return;
    
    const avatarEl = document.querySelector('[data-avatar="true"]');
    if (!avatarEl) return;
    
    const img = document.createElement('img');
    img.src = config.avatar;
    img.alt = config.name || 'Avatar';
    
    img.onload = () => {
      avatarEl.innerHTML = '';
      avatarEl.appendChild(img);
    };
    
    img.onerror = () => {
      console.warn('Failed to load avatar image');
    };
  }).catch(() => {});
}

function initImageZoom() {
  const postContent = document.querySelector('.post-content');
  if (!postContent) return;

  let overlay = null;

  const close = () => {
    if (!overlay) return;
    overlay.classList.remove('active');
    setTimeout(() => {
      overlay.remove();
      overlay = null;
    }, 300);
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  };

  postContent.addEventListener('click', (e) => {
    const img = e.target.closest('img');
    if (!img) return;

    overlay = document.createElement('div');
    overlay.className = 'image-zoom-overlay';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'image-zoom-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      close();
    });
    
    const zoomedImg = document.createElement('img');
    zoomedImg.src = img.dataset.src || img.src;
    zoomedImg.alt = img.alt;
    
    overlay.appendChild(closeBtn);
    overlay.appendChild(zoomedImg);
    document.body.appendChild(overlay);
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => overlay.classList.add('active'));

    overlay.addEventListener('click', close);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay) close();
  });
}

function initHeadingLinks() {
  const postContent = document.querySelector('.post-content');
  if (!postContent) return;

  const headings = postContent.querySelectorAll('h2');
  
  headings.forEach(heading => {
    const text = heading.textContent.trim();
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    heading.id = id;

    const anchor = document.createElement('button');
    anchor.className = 'heading-anchor';
    anchor.setAttribute('aria-label', 'Copy link to section');
    anchor.setAttribute('data-tooltip', 'Copy link');
    anchor.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;

    anchor.addEventListener('click', async (e) => {
      e.preventDefault();
      const url = `${window.location.origin}${window.location.pathname}#${id}`;
      
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.cssText = 'position:fixed;left:-9999px;top:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }

      anchor.classList.add('copied');
      anchor.setAttribute('data-tooltip', 'Copied!');
      setTimeout(() => {
        anchor.classList.remove('copied');
        anchor.setAttribute('data-tooltip', 'Copy link');
      }, 2000);
    });

    heading.prepend(anchor);
  });
}

function initCommandPalette() {
  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  const baseCommands = [
    { id: 'home', title: 'Go to Posts', icon: 'home', action: () => window.location.href = '/', group: 'Navigation' },
    { id: 'about', title: 'Go to About', icon: 'user', action: () => window.location.href = '/about.html', group: 'Navigation' },
    { id: 'theme', title: 'Toggle Theme', icon: 'moon', action: toggleTheme, group: 'Settings' }
  ];

  const blogCommands = blogPosts.map(post => ({
    id: `post-${post.url}`,
    title: post.title,
    icon: 'file-text',
    action: () => window.location.href = post.url,
    group: 'Posts'
  }));

  const commands = [...baseCommands, ...blogCommands];

  const icons = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>'
  };

  let overlay = null;
  let selectedIndex = 0;
  let filteredCommands = [...commands];

  const createPalette = () => {
    overlay = document.createElement('div');
    overlay.className = 'command-palette-overlay';
    overlay.innerHTML = `
      <div class="command-palette">
        <div class="command-palette-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons.search}</svg>
          <input type="text" class="command-palette-input" placeholder="Type a command or search..." autocomplete="off">
        </div>
        <div class="command-palette-list"></div>
        <div class="command-palette-footer">
          <div class="command-palette-footer-hints">
            <span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
            <span><kbd>↵</kbd> to select</span>
            <span><kbd>esc</kbd> to close</span>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    
    const input = overlay.querySelector('.command-palette-input');
    const list = overlay.querySelector('.command-palette-list');

    const render = () => {
      if (filteredCommands.length === 0) {
        list.innerHTML = '<div class="command-palette-empty">No commands found</div>';
        return;
      }

      const groups = {};
      filteredCommands.forEach(cmd => {
        if (!groups[cmd.group]) groups[cmd.group] = [];
        groups[cmd.group].push(cmd);
      });

      let html = '';
      let idx = 0;
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      
      Object.entries(groups).forEach(([group, cmds]) => {
        html += `<div class="command-palette-group">${group}</div>`;
        cmds.forEach(cmd => {
          const shortcut = cmd.shortcut ? `<div class="command-palette-shortcut">${cmd.shortcut.map(k => `<kbd>${k}</kbd>`).join('')}</div>` : '';
          const iconKey = cmd.id === 'theme' ? (isDark ? 'sun' : 'moon') : cmd.icon;
          html += `
            <div class="command-palette-item${idx === selectedIndex ? ' selected' : ''}" data-index="${idx}" data-id="${cmd.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[iconKey]}</svg>
              <div class="command-palette-item-content">
                <span class="command-palette-item-title">${cmd.title}</span>
              </div>
              ${shortcut}
            </div>
          `;
          idx++;
        });
      });
      list.innerHTML = html;
      
      const selectedEl = list.querySelector('.command-palette-item.selected');
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    };

    const filter = (query) => {
      const q = query.toLowerCase().trim();
      filteredCommands = q ? commands.filter(cmd => cmd.title.toLowerCase().includes(q)) : [...commands];
      selectedIndex = 0;
      render();
    };

    input.addEventListener('input', (e) => filter(e.target.value));

    list.addEventListener('click', (e) => {
      const item = e.target.closest('.command-palette-item');
      if (item) {
        selectedIndex = parseInt(item.dataset.index);
        if (filteredCommands[selectedIndex]) {
          close();
          filteredCommands[selectedIndex].action();
        }
      }
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    render();
    return { input, render };
  };

  const open = () => {
    if (overlay) return;
    
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    const { input, render } = createPalette();
    filteredCommands = [...commands];
    selectedIndex = 0;
    render();
    
    requestAnimationFrame(() => {
      overlay.classList.add('active');
      setTimeout(() => {
        input.focus();
      }, 50);
    });

    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        close();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % filteredCommands.length;
        render();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + filteredCommands.length) % filteredCommands.length;
        render();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          close();
          filteredCommands[selectedIndex].action();
        }
      }
    };

    document.addEventListener('keydown', handleKeydown);
    overlay._handleKeydown = handleKeydown;
  };

  const close = () => {
    if (!overlay) return;
    overlay.classList.remove('active');
    
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    
    if (overlay._handleKeydown) {
      document.removeEventListener('keydown', overlay._handleKeydown);
    }
    setTimeout(() => {
      overlay.remove();
      overlay = null;
    }, 150);
  };

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (overlay) close();
      else open();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 't' || e.key === 'T') {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.isContentEditable
      );
      
      if (!isInput) {
        e.preventDefault();
        if (overlay) close();
        toggleTheme();
      }
    }
  });

  window.openCommandPalette = open;

  const trigger = document.getElementById('commandPaletteTrigger');
  if (trigger) {
    trigger.addEventListener('click', open);
  }
}

