'use strict';
(() => {
  const page = document.body.dataset.page;
  const hash = window.location.hash;
  // Preserve links copied before the portfolio was split into separate pages.
  if (page === 'home' && hash) {
    const legacy = {'#work':'projects.html','#experience':'experiences.html','#about':'about.html','#contact':'contact.html'};
    const destination = /^#project\/[a-z0-9-]+$/.test(hash)
      ? 'projects.html' + window.location.search + hash
      : /^#experience-(paylocity|kevin-guest-house|florania|imageout|aeop|notetaker|legacy|little-caesars|madpr|ama|btp)$/.test(hash)
        ? 'experiences.html' + hash
        : legacy[hash];
    if (destination) { window.location.replace(destination); return; }
  }
  function revealExperience() {
    if (page !== 'experiences' || !/^#experience-(paylocity|kevin-guest-house|florania|imageout|aeop|notetaker|legacy|little-caesars|madpr|ama|btp)$/.test(window.location.hash)) return;
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

  const skillCards = [...document.querySelectorAll('.skill-card')];
  const skillFilters = [...document.querySelectorAll('[data-skill-filter]')];
  skillFilters.forEach(button=>button.addEventListener('click',()=>{
    const area = button.dataset.skillFilter;
    skillFilters.forEach(filter=>{const active=filter===button;filter.classList.toggle('active',active);filter.setAttribute('aria-pressed',String(active));});
    skillCards.forEach(card=>{card.hidden=area!=='all'&&card.dataset.skillArea!==area;});
    const count=skillCards.filter(card=>!card.hidden).length;
    document.getElementById('skills-status').textContent=`Showing ${count} ${count===1?'skill':'skills'}`;
  }));
  skillCards.forEach(card=>card.addEventListener('toggle',()=>{
    card.querySelector('.skill-action-label').textContent=card.open?'Hide examples':'View examples';
  }));

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
