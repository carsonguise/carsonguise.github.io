'use strict';
const projects = window.PORTFOLIO_PROJECTS;
const grid = document.getElementById('project-grid');
const search = document.getElementById('project-search');
const dialog = document.getElementById('case-dialog');
const content = document.getElementById('case-content');
const sort = document.getElementById('project-sort');
const loadMore = document.getElementById('load-more');
const pageSize = 9;
let visibleLimit = pageSize;
let filter = 'all';
let activeIndex = 0;
let returnFocus = null;
let toastTimer;
let viewerCleanup = null;
const categoryLabels = {strategy:'Marketing strategy',pr:'PR & communications',international:'International', 'music-fashion':'Music & fashion',research:'Research & analytics',digital:'Digital marketing'};
const total = String(projects.length).padStart(2,'0');
const normalized = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function renderCards() {
  const query = normalized(search.value.trim());
  const matches = projects.filter(p => (filter === 'all' || p.category.includes(filter)) && normalized([p.title,p.subtitle,p.type,p.summary,p.period,p.association,...p.skills,...p.deliverables].join(' ')).includes(query));
  if(sort.value==='newest') matches.sort((a,b)=>b.dateSort-a.dateSort);
  if(sort.value==='az') matches.sort((a,b)=>a.title.localeCompare(b.title));
  const visible = matches.slice(0,visibleLimit);
  grid.innerHTML = visible.map(p => `<article class="project-card plain-project-card"><a class="project-open" href="#project/${p.id}" data-project="${p.id}" aria-label="Read ${esc(p.title)} case study"><div class="card-meta"><span>${esc(p.type)}</span></div><div class="project-period"><span>${esc(p.period)}</span>${p.featured?'<span class="featured-label">Featured</span>':''}</div><div class="card-title-row"><h2>${esc(p.title)}</h2></div><p class="card-subtitle">${esc(p.subtitle)}</p><p class="card-summary">${esc(p.summary)}</p><div class="card-skills">${p.skills.slice(0,3).map(skill=>`<span>${esc(skill)}</span>`).join('')}</div></a></article>`).join('');
  const count = matches.length>visible.length ? `Showing ${visible.length} of ${matches.length} projects` : `${matches.length} ${matches.length===1?'project':'projects'}`;
  document.getElementById('result-count').textContent = count + (filter!=='all'?' in '+categoryLabels[filter]:'') + (query?' matching “'+search.value.trim()+'”':'');
  document.getElementById('empty-state').hidden = matches.length !== 0;
  loadMore.hidden = matches.length <= visible.length;
  loadMore.textContent = `Show more projects · ${matches.length-visible.length} remaining`;
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  visibleLimit = pageSize;
  const url = new URL(location.href);
  if(filter==='all') url.searchParams.delete('area'); else url.searchParams.set('area',filter);
  history.replaceState(null,'',url.pathname+url.search+url.hash);
  document.querySelectorAll('[data-filter]').forEach(b => { const selected = b === button; b.classList.toggle('active',selected); b.setAttribute('aria-pressed',String(selected)); });
  renderCards();
}));
search.addEventListener('input',()=>{visibleLimit=pageSize;renderCards();});
sort.addEventListener('change',()=>{visibleLimit=pageSize;renderCards();});
loadMore.addEventListener('click',()=>{const previousCount=grid.querySelectorAll('.project-open').length;visibleLimit+=pageSize;renderCards();grid.querySelectorAll('.project-open')[previousCount]?.focus();});
document.getElementById('reset-filters').addEventListener('click',()=>{search.value=''; document.querySelector('[data-filter="all"]').click();search.focus();});

function caseHeaderMarkup(p) {
  return `<div class="case-header"><p class="eyebrow">${esc(p.type)}</p><h2 id="case-title">${esc(p.title)}</h2><p class="case-subtitle serif">${esc(p.subtitle)}</p><div class="case-tags"><span>${esc(p.status)}</span><button id="copy-case-link">Copy case link</button></div></div>`;
}
function resourceMarkup(p) {
  const links = (p.resources || []).filter(resource => resource.external && resource.url);
  if (!links.length) return '';
  return `<section class="published-work"><h3>Published work</h3>${links.map(resource=>`<a class="text-link" href="${esc(resource.url)}" target="_blank" rel="noopener noreferrer">${esc(resource.label)}</a>`).join('')}</section>`;
}

function showCase(id) {
  const index = projects.findIndex(p => p.id === id);
  if (index < 0) return;
  activeIndex = index;
  const p = projects[index];
  viewerCleanup?.();
  viewerCleanup = null;
  content.innerHTML = p.inProgress
    ? `${caseHeaderMarkup(p)}<div class="case-body case-progress"><p>${esc(p.context)}</p></div>`
    : `${caseHeaderMarkup(p)}${window.ProjectViewer.markup(p)}<div class="case-body">${resourceMarkup(p)}<div class="case-context"><div><p class="eyebrow">Project context</p><p>${esc(p.context)}</p></div><div><p class="eyebrow">My contribution</p><p>${esc(p.role)}</p></div></div><section class="case-section"><span class="section-number">01</span><div><h3>Strategic approach</h3><ol>${p.approach.map(a=>`<li>${esc(a)}</li>`).join('')}</ol></div></section><section class="insight-box"><p class="eyebrow">${esc(p.insightLabel)}</p><p>${esc(p.insight)}</p></section><section class="case-section"><span class="section-number">02</span><div><h3>Outcomes & deliverables</h3><p>${esc(p.outcome)}</p>${p.metrics.length?`<div class="case-metrics">${p.metrics.map(m=>`<div><strong>${esc(m.value)}</strong><span>${esc(m.label)}</span></div>`).join('')}</div>`:''}<div class="deliverables">${p.deliverables.map(d=>`<span>${esc(d)}</span>`).join('')}</div></div></section><section class="case-section skill-section"><span class="section-number">03</span><div><h3>Five skills demonstrated</h3><div class="skills">${p.skills.map(s=>`<span>${esc(s)}</span>`).join('')}</div></div></section><details class="source-details"><summary>Project sources & result context</summary><p>${esc(p.evidence)}</p></details></div>`;
  viewerCleanup = window.ProjectViewer.mount(content.querySelector('.project-viewer'), p);
  const origin = document.createElement('p');
  origin.className = 'case-origin';
  origin.textContent = `${p.period} · ${p.association}`;
  content.querySelector('.case-tags').before(origin);
  document.getElementById('case-position').textContent = `${String(index+1).padStart(2,'0')} / ${total}`;
  document.getElementById('copy-case-link').addEventListener('click',copyLink);
  if (!dialog.open) {
    returnFocus = document.activeElement;
    dialog.showModal();
    document.body.classList.add('dialog-open');
  }
  dialog.scrollTop = 0;
  document.getElementById('close-case').focus({preventScroll:true});
}
function route() {
  const match = location.hash.match(/^#project\/([a-z0-9-]+)$/);
  if (match) { if(projects.some(p=>p.id===match[1])) showCase(match[1]); else { closeDialog(); showToast('That case study could not be found.'); } }
  else if (dialog.open) closeDialog();
}
function closeDialog() {
  viewerCleanup?.();
  viewerCleanup = null;
  if(dialog.open) dialog.close();
  document.body.classList.remove('dialog-open');
  if(returnFocus && document.contains(returnFocus)) returnFocus.focus({preventScroll:true});
}
function requestClose() {
  if (new URLSearchParams(location.search).get('from') === 'experiences') {
    location.replace('experiences.html#experience-kevin-guest-house');
    return;
  }
  history.replaceState(null,'',location.pathname+location.search+'#work');
  closeDialog();
}
document.getElementById('close-case').addEventListener('click',requestClose);
dialog.addEventListener('cancel',event=>{event.preventDefault();requestClose();});
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)requestClose();}});
function navigateCase(id) {history.pushState(null,'','#project/'+id);showCase(id);}
document.getElementById('previous-case').addEventListener('click',()=>navigateCase(projects[(activeIndex-1+projects.length)%projects.length].id));
document.getElementById('next-case').addEventListener('click',()=>navigateCase(projects[(activeIndex+1)%projects.length].id));
async function copyLink() {
  const link = new URL(location.href);
  link.searchParams.delete('from');
  try {await navigator.clipboard.writeText(link.href);showToast('Case-study link copied');}
  catch { const field=document.createElement('input');field.value=link.href;field.className='copy-fallback';dialog.append(field);field.select();const ok=document.execCommand('copy');field.remove();showToast(ok?'Case-study link copied':'Copy this case-study URL from your address bar.');document.getElementById('copy-case-link').focus(); }
}
function showToast(message) {const toast=document.getElementById('toast');(dialog.open?dialog:document.body).append(toast);toast.textContent=message;toast.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),2800);}
window.addEventListener('hashchange',route);
document.getElementById('project-total').textContent = total;
const initialArea = new URLSearchParams(location.search).get('area');
if(initialArea && Object.hasOwn(categoryLabels,initialArea)) {
  filter = initialArea;
  document.querySelectorAll('[data-filter]').forEach(b=>{const selected=b.dataset.filter===filter;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
}
renderCards();route();
