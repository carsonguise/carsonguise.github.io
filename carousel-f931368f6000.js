'use strict';
(() => {
  document.querySelectorAll('[data-personal-carousel]').forEach(carousel => {
    const slides = [...carousel.querySelectorAll('.personal-photo')];
    if (!slides.length) return;
    const stage = carousel.querySelector('[data-photo-stage]');
    const dots = [...carousel.querySelectorAll('[data-photo-index]')];
    const rotation = carousel.querySelector('[data-photo-rotation]');
    const previous = carousel.querySelector('[data-photo-previous]');
    const next = carousel.querySelector('[data-photo-next]');
    const count = carousel.querySelector('[data-photo-count]');
    const announcement = carousel.querySelector('[data-photo-announcement]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let index = 0;
    let requested = slides.length > 1 && !reducedMotion.matches;
    let inView = !('IntersectionObserver' in window);
    let hovering = false;
    let focused = false;
    let timer;
    let gesture = null;

    function syncRotation() {
      clearInterval(timer);
      rotation.textContent = requested ? 'Pause rotation' : 'Play slideshow';
      if (requested && inView && !hovering && !focused && !document.hidden) {
        timer = setInterval(() => show(index + 1), 6500);
      }
    }
    function show(target, manual = false) {
      index = (target + slides.length) % slides.length;
      slides.forEach((slide, current) => { slide.hidden = current !== index; });
      dots.forEach((dot, current) => dot.setAttribute('aria-pressed', String(current === index)));
      count.textContent = `${index + 1} / ${slides.length}`;
      if (manual) {
        requested = false;
        const caption = slides[index].querySelector('figcaption')?.textContent || slides[index].querySelector('img').alt;
        announcement.textContent = `Photo ${index + 1} of ${slides.length}. ${caption}`;
        syncRotation();
      }
    }
    previous.addEventListener('click', () => show(index - 1, true));
    next.addEventListener('click', () => show(index + 1, true));
    dots.forEach(dot => dot.addEventListener('click', () => show(Number(dot.dataset.photoIndex), true)));
    rotation.addEventListener('click', () => {
      requested = !requested;
      if (requested) { focused = false; hovering = false; }
      syncRotation();
    });
    stage.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        show(index + (event.key === 'ArrowLeft' ? -1 : 1), true);
      }
    });
    stage.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      gesture = {x: event.clientX, y: event.clientY};
    });
    stage.addEventListener('pointerup', event => {
      if (!gesture) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      gesture = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) show(index + (dx < 0 ? 1 : -1), true);
    });
    stage.addEventListener('pointercancel', () => { gesture = null; });
    carousel.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') { hovering = true; syncRotation(); }
    });
    carousel.addEventListener('pointerleave', () => { hovering = false; gesture = null; syncRotation(); });
    carousel.addEventListener('focusin', () => { focused = true; syncRotation(); });
    carousel.addEventListener('focusout', event => {
      if (!carousel.contains(event.relatedTarget)) { focused = false; syncRotation(); }
    });
    document.addEventListener('visibilitychange', syncRotation);
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) requested = false;
      syncRotation();
    });
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        inView = entries[0].isIntersecting;
        syncRotation();
      }, {threshold: 0.25});
      observer.observe(stage);
    }
    if (slides.length === 1) {
      rotation.hidden = true;
      previous.hidden = true;
      next.hidden = true;
      carousel.querySelector('.photo-dots').hidden = true;
    }
    syncRotation();
  });
})();
