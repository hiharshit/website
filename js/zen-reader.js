import { onScroll } from './utils.js';

export const ZenReader = {
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
    
    const threshold = 100;
    const hoverZone = 40;
    let isHovering = false;
    
    onScroll(() => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < threshold || isHovering) {
        this.header.classList.remove('header-hidden');
      } else if (currentScrollY > this.lastScrollY) {
        this.header.classList.add('header-hidden');
      } else {
        this.header.classList.remove('header-hidden');
      }
      
      this.lastScrollY = currentScrollY;
    });
    
    document.addEventListener('mousemove', (e) => {
      const wasHovering = isHovering;
      isHovering = e.clientY <= hoverZone;
      
      if (isHovering && !wasHovering) {
        this.header.classList.remove('header-hidden');
      }
    }, { passive: true });
    
    this.header.addEventListener('mouseenter', () => {
      isHovering = true;
      this.header.classList.remove('header-hidden');
    });
    
    this.header.addEventListener('mouseleave', (e) => {
      isHovering = e.clientY <= hoverZone;
      if (!isHovering && window.scrollY >= threshold) {
        this.header.classList.add('header-hidden');
      }
    });
  },
  
  initProgressTracker() {
    if (!this.progressBar || !this.postContent) return;
    
    const updateProgress = () => {
      const docHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const scrollY = window.scrollY;
      
      const scrollableHeight = docHeight - windowHeight;
      const progress = scrollableHeight > 0 ? Math.min(scrollY / scrollableHeight, 1) : 1;
      
      this.progressBar.style.transform = `scaleX(${progress})`;
    };
    
    onScroll(updateProgress);
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
    
    const upArrow = document.createElement('button');
    upArrow.className = 'waypoint-arrow waypoint-arrow-up';
    upArrow.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>';
    upArrow.setAttribute('data-tooltip', 'Previous section');
    upArrow.setAttribute('data-tooltip-placement', 'left');
    upArrow.setAttribute('aria-label', 'Previous section');
    upArrow.addEventListener('click', () => {
      const scrollY = window.scrollY;
      const offset = 80;
      let currentIndex = -1;
      for (let i = this.sections.length - 1; i >= 0; i--) {
        if (this.sections[i].offsetTop - offset <= scrollY + 10) {
          currentIndex = i;
          break;
        }
      }
      if (currentIndex > 0) {
        const prevSection = this.sections[currentIndex - 1];
        window.scrollTo({ top: prevSection.offsetTop - offset, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
    this.waypointsContainer.appendChild(upArrow);
    
    this.sections.forEach((heading) => {
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
    
    const downArrow = document.createElement('button');
    downArrow.className = 'waypoint-arrow waypoint-arrow-down';
    downArrow.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>';
    downArrow.setAttribute('data-tooltip', 'Next section');
    downArrow.setAttribute('data-tooltip-placement', 'left');
    downArrow.setAttribute('aria-label', 'Next section');
    downArrow.addEventListener('click', () => {
      const scrollY = window.scrollY;
      const offset = 80;
      for (let i = 0; i < this.sections.length; i++) {
        const sectionTop = this.sections[i].offsetTop - offset;
        if (sectionTop > scrollY + 10) {
          window.scrollTo({ top: sectionTop, behavior: 'smooth' });
          return;
        }
      }
    });
    this.waypointsContainer.appendChild(downArrow);
    
    document.body.appendChild(this.waypointsContainer);
    
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
    };
    
    onScroll(updateActiveWaypoint);
    updateActiveWaypoint();
  }
};
