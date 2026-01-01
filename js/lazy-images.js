/**
 * Progressive Image Loading
 * Uses IntersectionObserver to lazy-load images with blur-up effect.
 */
(function() {
  const images = document.querySelectorAll('img[data-src]');
  if (!images.length) return;

  const loadImage = (img) => {
    const src = img.dataset.src;
    if (!src || img.dataset.loaded === 'true') return;

    const loader = new Image();
    loader.onload = () => {
      img.src = src;
      img.dataset.loaded = 'true';
    };
    loader.src = src;
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadImage(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '100px' });

    images.forEach(img => observer.observe(img));
  } else {
    images.forEach(loadImage);
  }
})();
