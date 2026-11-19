'use strict';
(() => {
  const mounted = new WeakSet();
  function mount(root = document) {
    const cleanups = [];
    root.querySelectorAll('.work-samples').forEach(group => {
      if (mounted.has(group)) return;
      mounted.add(group);
      const rail = group.querySelector('.social-sample-rail');
      const controls = group.querySelector('.sample-controls');
      const previous = controls.querySelector('[data-sample-direction="-1"]');
      const next = controls.querySelector('[data-sample-direction="1"]');
      const events = new AbortController();
      function update() {
        const maximum = rail.scrollWidth - rail.clientWidth;
        controls.hidden = maximum <= 2;
        previous.disabled = rail.scrollLeft <= 2;
        next.disabled = rail.scrollLeft >= maximum - 2;
      }
      controls.addEventListener('click', event => {
        const button = event.target.closest('[data-sample-direction]');
        if (!button || button.disabled) return;
        const step = rail.querySelector('.social-sample').getBoundingClientRect().width + parseFloat(getComputedStyle(rail).columnGap);
        rail.scrollBy({left: Number(button.dataset.sampleDirection) * step, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
      }, {signal: events.signal});
      rail.addEventListener('scroll', update, {passive: true, signal: events.signal});
      const observer = new ResizeObserver(update);
      observer.observe(rail);
      update();
      cleanups.push(() => {events.abort(); observer.disconnect(); group.querySelectorAll('.social-video').forEach(video=>video.pause()); mounted.delete(group);});
    });
    return () => cleanups.forEach(cleanup => cleanup());
  }
  window.WorkSamples = {mount};
  mount();
})();
