
import { blogPosts } from './blog-data.js';
import { initLayout } from './layout.js';

const CONFIG = {
  POSTS_PER_PAGE: 5,
  DEBOUNCE_MS: 250,
  SCROLL_THRESHOLD: 400
};

const escapeHtml = (str) => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

const removeListeners = (el) => {
  const clone = el.cloneNode(true);
  el.parentNode.replaceChild(clone, el);
  return clone;
};

const state = {
  searchQuery: '',
  activeTag: 'all',
  sortOrder: 'newest',
  filteredPosts: [],
  currentPage: 1,
  postsPerPage: CONFIG.POSTS_PER_PAGE
};

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
});

function initCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const codeBlock = btn.closest('.code-header').nextElementSibling.querySelector('code');
      if (!codeBlock) return;

      const text = codeBlock.innerText;
      
      try {
        await navigator.clipboard.writeText(text);
        const originalIcon = btn.innerHTML;
        btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        btn.classList.add('copied');
        
        setTimeout(() => {
          btn.innerHTML = originalIcon;
          btn.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
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
  let result = blogPosts.filter(post => {
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
  if (noResults) {
    if (state.filteredPosts.length === 0) {
      noResults.classList.add('visible');
    } else {
      noResults.classList.remove('visible');
    }
  }

  const clearFilterBtn = document.getElementById('clearFilterBtn');
  if (clearFilterBtn) {
    if (state.activeTag !== 'all') {
      clearFilterBtn.classList.add('visible');
    } else {
      clearFilterBtn.classList.remove('visible');
    }
  }

  const searchClear = document.getElementById('searchClear');
  if (searchClear) {
    if (state.searchQuery !== '') {
      searchClear.classList.add('visible');
    } else {
      searchClear.classList.remove('visible');
    }
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
    if (tag === state.activeTag) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
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
  
  window.animateMaskUpdates = () => {
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
    if (opt.dataset.sort === state.sortOrder) {
      opt.classList.add('active');
    } else {
      opt.classList.remove('active');
    }
  });

  trigger.onclick = (e) => {
    e.stopPropagation();
    const isOpen = menu.classList.contains('open');
    if (isOpen) {
      menu.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    } else {
      menu.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    }
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
    tooltip.textContent = text;
    tooltip.style.display = 'block';
    
    const placement = target.getAttribute('data-tooltip-placement') || 'top';
    tooltip.classList.remove('tooltip-left');
    if (placement === 'left') {
      tooltip.classList.add('tooltip-left');
    }

    const rect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const padding = 12;
    const gap = 8;

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
  
  window.addEventListener('scroll', () => {
    if (activeTarget) hide();
  }, { passive: true });
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
          } catch (e) {}
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
          } catch (e) {}
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
  let ticking = false;
  const updateVisibility = () => {
    button.classList.toggle('visible', window.scrollY > CONFIG.SCROLL_THRESHOLD);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(updateVisibility); ticking = true; }
  }, { passive: true });
  button.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
}

const ZenReader = {
  isPostPage: false,
  header: null,
  progressBar: null,
  postContent: null,
  postFooter: null,
  lastScrollY: 0,
  sections: [],
  waypointLines: [],
  waypointsContainer: null,
  
  init() {
    this.postContent = document.querySelector('.post-content');
    this.isPostPage = !!this.postContent;
    this.header = document.querySelector('.site-header');
    
    if (!this.isPostPage) return;
    
    this.postFooter = document.querySelector('.post-footer');
    
    this.createProgressBar();
    this.initAutoHideHeader();
    this.initProgressTracker();
    this.initEndOfArticle();
    this.initSectionWaypoints();
    initShareButtons();
  },
  
  createProgressBar() {
    const progressContainer = document.createElement('div');
    progressContainer.className = 'reading-progress';
    progressContainer.innerHTML = '<div class="reading-progress-bar"></div>';
    document.body.appendChild(progressContainer);
    this.progressBar = progressContainer.querySelector('.reading-progress-bar');
  },
  
  initAutoHideHeader() {
    if (!this.header) return;
    
    let ticking = false;
    const threshold = 100;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < threshold) {
        this.header.classList.remove('header-hidden');
      } else if (currentScrollY > this.lastScrollY) {
        this.header.classList.add('header-hidden');
      } else {
        this.header.classList.remove('header-hidden');
      }
      
      this.lastScrollY = currentScrollY;
      ticking = false;
    };
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(handleScroll);
        ticking = true;
      }
    }, { passive: true });
  },
  
  initProgressTracker() {
    if (!this.progressBar || !this.postContent) return;
    
    let ticking = false;
    
    const updateProgress = () => {
      const article = this.postContent;
      const articleBottom = article.offsetTop + article.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      
      const scrollableHeight = docHeight - windowHeight;
      const progress = scrollableHeight > 0 ? Math.min(scrollY / scrollableHeight, 1) : 1;
      
      this.progressBar.style.transform = `scaleX(${progress})`;
      ticking = false;
    };
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    }, { passive: true });
    
    updateProgress();
  },
  
  initEndOfArticle() {
    if (!this.postFooter) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.postFooter.classList.add('visible');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px 0px 0px'
    });
    
    observer.observe(this.postFooter);
  },
  
  initSectionWaypoints() {
    const headings = this.postContent.querySelectorAll('h2');
    if (headings.length < 2) return;
    
    this.sections = Array.from(headings);
    
    this.waypointsContainer = document.createElement('nav');
    this.waypointsContainer.className = 'section-waypoints';
    this.waypointsContainer.setAttribute('aria-label', 'Article sections');
    
    this.sections.forEach((heading, index) => {
      const dot = document.createElement('button');
      dot.className = 'waypoint-dot';
      dot.setAttribute('data-tooltip', heading.textContent);
      dot.setAttribute('data-tooltip-placement', 'left');
      dot.setAttribute('aria-label', `Jump to: ${heading.textContent}`);
      
      dot.addEventListener('click', () => {
        const offset = 80;
        const top = heading.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      });
      
      this.waypointLines.push(dot);
      this.waypointsContainer.appendChild(dot);
    });
    
    document.body.appendChild(this.waypointsContainer);
    
    let ticking = false;
    const updateActiveWaypoint = () => {
      const scrollY = window.scrollY;
      const offset = 150;
      
      let activeIndex = 0;
      for (let i = this.sections.length - 1; i >= 0; i--) {
        const sectionTop = this.sections[i].offsetTop - offset;
        if (scrollY >= sectionTop) {
          activeIndex = i;
          break;
        }
      }
      
      this.waypointLines.forEach((line, i) => {
        line.classList.toggle('active', i === activeIndex);
      });
      
      const showWaypoints = scrollY > 200;
      this.waypointsContainer.classList.toggle('visible', showWaypoints);
      
      ticking = false;
    };
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateActiveWaypoint);
        ticking = true;
      }
    }, { passive: true });
    
    updateActiveWaypoint();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ZenReader.init();
});
