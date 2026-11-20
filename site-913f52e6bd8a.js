'use strict';
(() => {
  const page = document.body.dataset.page;
  const hash = window.location.hash;
  // Preserve links copied before the portfolio was split into separate pages.
  const inlineHomeRoute = document.getElementById('case-dialog') && (/^#project\/[a-z0-9-]+$/.test(hash) || (/^#experience-[a-z0-9-]+$/.test(hash) && document.getElementById('home-' + hash.slice(1))));
  if (page === 'home' && hash && !inlineHomeRoute) {
    const legacy = {'#work':'projects.html','#experience':'experiences.html','#about':'about.html','#contact':'contact.html','#volunteering':'experiences.html#volunteering'};
    const destination = /^#project\/[a-z0-9-]+$/.test(hash)
      ? 'projects.html' + window.location.search + hash
      : /^#experience-(paylocity|kevin-guest-house|florania|imageout|aeop|notetaker|legacy|little-caesars|madpr|ama|btp|smac|consumer-lab|bowling|st-pauls)$/.test(hash)
        ? 'experiences.html' + hash
        : legacy[hash];
    if (destination) { window.location.replace(destination); return; }
  }
  const header = document.querySelector('.site-header');
  const menuToggle = header?.querySelector('.nav-toggle');
  const mainNavigation = document.getElementById('primary-navigation');
  if (header && menuToggle && mainNavigation) {
    const phoneLayout = window.matchMedia('(max-width: 600px)');
    function setMenuOpen(open) {
      const expanded = open && phoneLayout.matches;
      header.classList.toggle('menu-is-open', expanded);
      menuToggle.setAttribute('aria-expanded', String(expanded));
      menuToggle.setAttribute('aria-label', expanded ? 'Close navigation menu' : 'Open navigation menu');
    }
    header.classList.add('has-mobile-menu');
    menuToggle.addEventListener('click', () => setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true'));
    mainNavigation.addEventListener('click', event => {
      if (event.target.closest('a')) setMenuOpen(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        setMenuOpen(false);
        menuToggle.focus();
      }
    });
    document.addEventListener('pointerdown', event => {
      if (!header.contains(event.target)) setMenuOpen(false);
    });
    header.addEventListener('focusout', event => {
      if (!header.contains(event.relatedTarget)) setMenuOpen(false);
    });
    phoneLayout.addEventListener('change', () => {
      if (phoneLayout.matches && mainNavigation.contains(document.activeElement)) menuToggle.focus();
      setMenuOpen(false);
    });
  }
  function revealExperience() {
    if (page !== 'experiences' || !/^#experience-(paylocity|kevin-guest-house|florania|imageout|aeop|notetaker|legacy|little-caesars|madpr|ama|btp|smac|consumer-lab|bowling|st-pauls)$/.test(window.location.hash)) return;
    const card = document.getElementById(window.location.hash.slice(1));
    const details = card?.querySelectorAll('details');
    if (details?.length) {
      details.forEach(detail => {detail.open = true;});
      details[0].querySelector('summary')?.focus({preventScroll:true});
    }
  }
  revealExperience();
  window.addEventListener('hashchange', revealExperience);
  window.addEventListener('load', () => requestAnimationFrame(revealExperience), {once:true});
  const toggle = document.getElementById('toggle-contributions');
  if (toggle) {
    const roles = [...document.querySelectorAll('#experience .role-contributions')];
    toggle.setAttribute('aria-controls',roles.map(role=>role.id).join(' '));
    function syncToggle() {
      const expanded = roles.every(role=>role.open);
      toggle.textContent = expanded ? 'Collapse work roles' : 'Expand work roles';
      toggle.setAttribute('aria-expanded',String(expanded));
    }
    toggle.addEventListener('click',()=>{
      const expand = !roles.every(role=>role.open);
      roles.forEach(role=>{role.open=expand;});
      syncToggle();
    });
    roles.forEach(role=>role.addEventListener('toggle',syncToggle));
    syncToggle();
  }

  const skillCards = [...document.querySelectorAll('.skill-directory-card')];
  const skillFilters = [...document.querySelectorAll('[data-skill-filter]')];
  const skillTopic = document.getElementById('skill-topic');
  const skillSearch = document.getElementById('skill-search');
  const moreSkills = document.getElementById('show-more-skills');
  if (skillSearch && moreSkills) {
    let skillArea = 'all';
    let skillLimit = 12;
    const normalizeSkill = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    function renderSkills() {
      const query = normalizeSkill(skillSearch.value.trim());
      const matches = skillCards.filter(card => (skillArea === 'all' || card.dataset.skillArea === skillArea) && normalizeSkill(card.textContent).includes(query));
      const visible = new Set(matches.slice(0,skillLimit));
      skillCards.forEach(card => {card.hidden = !visible.has(card);});
      document.getElementById('skills-status').textContent = visible.size < matches.length ? `Showing ${visible.size} of ${matches.length} skills` : `${matches.length} ${matches.length === 1 ? 'skill' : 'skills'}`;
      moreSkills.hidden = visible.size >= matches.length;
      document.getElementById('skills-empty').hidden = matches.length !== 0;
      return matches;
    }
    skillFilters.forEach(button => button.addEventListener('click', () => {
      skillArea = button.dataset.skillFilter;
      skillLimit = 12;
      skillFilters.forEach(filter => {const active = filter === button;filter.classList.toggle('active',active);filter.setAttribute('aria-pressed',String(active));});
      if (skillTopic) skillTopic.value = skillArea;
      renderSkills();
    }));
    skillTopic?.addEventListener('change', () => {
      skillFilters.find(button => button.dataset.skillFilter === skillTopic.value)?.click();
    });
    skillSearch.addEventListener('input', () => {skillLimit = 12;renderSkills();});
    moreSkills.addEventListener('click', () => {
      const previousLimit = skillLimit;
      skillLimit += 12;
      const matches = renderSkills();
      matches[previousLimit]?.focus();
    });
    document.getElementById('reset-skills').addEventListener('click', () => {
      skillSearch.value = '';
      document.querySelector('[data-skill-filter="all"]').click();
      skillSearch.focus();
    });
    if (skillTopic) skillTopic.value = skillArea;
    renderSkills();
  }

  // CSS-animated rings follow a mouse; touch and reduced-motion users keep a still canvas.
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const layer = document.createElement('div');
  layer.className = 'cursor-ripples';
  layer.setAttribute('aria-hidden','true');
  layer.setAttribute('inert','');
  document.body.append(layer);
  let enabled = false;
  let lastTime = -Infinity;
  let lastX = -Infinity;
  let lastY = -Infinity;
  function syncRipples() {
    enabled = !reducedMotion.matches && finePointer.matches;
    layer.replaceChildren();
    lastTime = -Infinity;
  }
  function ripple(event, isClick=false) {
    if(!enabled || event.pointerType !== 'mouse') return;
    const time = event.timeStamp;
    const distance = Math.hypot(event.clientX-lastX,event.clientY-lastY);
    if(!isClick && (time-lastTime<140 || distance<28)) return;
    lastTime=time;lastX=event.clientX;lastY=event.clientY;
    const modal = event.target instanceof Element ? event.target.closest('dialog[open]') : null;
    const host = modal || document.body;
    if(layer.parentNode!==host) host.append(layer);
    if(layer.childElementCount>=6) layer.firstElementChild.remove();
    const wave = document.createElement('span');
    wave.className = 'cursor-wave' + (isClick?' cursor-wave-click':'');
    wave.style.left=event.clientX+'px';wave.style.top=event.clientY+'px';
    layer.append(wave);
    wave.addEventListener('animationend',()=>wave.remove(),{once:true});
  }
  document.addEventListener('pointermove',event=>ripple(event),{passive:true,capture:true});
  document.addEventListener('pointerdown',event=>ripple(event,true),{passive:true,capture:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden) layer.replaceChildren();});
  window.addEventListener('blur',()=>layer.replaceChildren());
  reducedMotion.addEventListener('change',syncRipples);
  finePointer.addEventListener('change',syncRipples);
  syncRipples();
})();
