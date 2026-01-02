export const escapeHtml = (str) => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

export const removeListeners = (el) => {
  const clone = el.cloneNode(true);
  el.parentNode.replaceChild(clone, el);
  return clone;
};

export const debounce = (fn, ms) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

export const throttleRAF = (fn) => {
  let ticking = false;
  return (...args) => {
    if (!ticking) {
      requestAnimationFrame(() => {
        fn(...args);
        ticking = false;
      });
      ticking = true;
    }
  };
};

const scrollCallbacks = [];
let scrollTicking = false;

const handleScroll = () => {
  scrollCallbacks.forEach(cb => cb());
  scrollTicking = false;
};

export const onScroll = (callback) => {
  if (scrollCallbacks.length === 0) {
    window.addEventListener('scroll', () => {
      if (!scrollTicking) {
        requestAnimationFrame(handleScroll);
        scrollTicking = true;
      }
    }, { passive: true });
  }
  scrollCallbacks.push(callback);
};
