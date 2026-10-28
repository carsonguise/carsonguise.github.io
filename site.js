'use strict';
(() => {
  const page = document.body.dataset.page;
  const hash = window.location.hash;
  // Preserve links copied before the portfolio was split into separate pages.
  if (page === 'home' && hash) {
    const legacy = {'#work':'projects.html','#experience':'experiences.html','#about':'about.html','#contact':'contact.html'};
    const destination = /^#project\/[a-z0-9-]+$/.test(hash)
      ? 'projects.html' + window.location.search + hash
      : /^#experience-(paylocity|kevin-guest-house|florania)$/.test(hash)
        ? 'experiences.html' + hash
        : legacy[hash];
    if (destination) { window.location.replace(destination); return; }
  }
  function revealExperience() {
    if (page !== 'experiences' || !/^#experience-(paylocity|kevin-guest-house|florania)$/.test(window.location.hash)) return;
    const card = document.getElementById(window.location.hash.slice(1));
    const details = card?.querySelector('details');
    if (details) {
      details.open = true;
      details.querySelector('summary')?.focus({preventScroll:true});
    }
  }
  revealExperience();
  window.addEventListener('hashchange', revealExperience);
  window.addEventListener('load', () => requestAnimationFrame(revealExperience), {once:true});
})();
