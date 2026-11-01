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
  const matches = projects.filter(p => (filter === 'all' || p.category.includes(filter)) && normalized([p.title,p.subtitle,p.type,p.summary,p.period,p.association,p.issue,...(p.finalPoints||[]),...(p.dataPoints||[]).flatMap(point=>[point.value,point.label]),...p.skills,...p.deliverables].join(' ')).includes(query));
  if(sort.value==='newest') matches.sort((a,b)=>b.dateSort-a.dateSort);
  if(sort.value==='az') matches.sort((a,b)=>a.title.localeCompare(b.title));
  const visible = matches.slice(0,visibleLimit);
  grid.innerHTML = visible.map(p => `<article class="project-card plain-project-card"><a class="project-open" href="#project/${p.id}" data-project="${p.id}" aria-label="Read ${esc(p.title)} project"><div class="card-meta"><span>${esc(p.type)}</span></div><div class="project-period"><span>${esc(p.period)}</span>${p.featured?'<span class="featured-label">Featured</span>':''}</div><div class="card-title-row"><h2>${esc(p.title)}</h2></div><p class="card-subtitle">${esc(p.subtitle)}</p><p class="card-summary">${esc(p.summary)}</p><div class="card-skills">${p.skills.slice(0,3).map(skill=>`<span>${esc(skill)}</span>`).join('')}</div></a></article>`).join('');
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

function projectHeaderMarkup(p) {
  return `<div class="case-header"><p class="eyebrow">${esc(p.type)}</p><h2 id="case-title">${esc(p.title)}</h2><p class="case-subtitle serif">${esc(p.subtitle)}</p><p class="case-origin">${esc(p.period)} · ${esc(p.association)}</p><div class="case-tags"><span>${esc(p.status)}</span><button id="copy-case-link">Copy project link</button></div></div>`;
}
function resourceMarkup(p) {
  const links = (p.resources || []).filter(resource => resource.external && resource.url);
  if (!links.length) return '';
  return `<div class="published-work"><h4>Published work</h4>${links.map(resource=>`<a class="text-link" href="${esc(resource.url)}" target="_blank" rel="noopener noreferrer">${esc(resource.label)}</a>`).join('')}</div>`;
}
function projectOverviewMarkup(p) {
  const findings = (p.finalPoints || []).filter(Boolean);
  const data = p.dataPoints || [];
  return `<section class="project-section" aria-labelledby="project-issue"><h3 id="project-issue">Issue</h3><p>${esc(p.issue)}</p></section>
    <section class="project-section" aria-labelledby="project-process"><h3 id="project-process">My thought process</h3><p>${esc(p.role)}</p>${p.approach.length ? `<ol>${p.approach.map(step=>`<li>${esc(step)}</li>`).join('')}</ol>` : '<p>This project is currently in development.</p>'}</section>
    <section class="project-section" aria-labelledby="project-deliverable"><h3 id="project-deliverable">My deliverable</h3><p>${esc(p.outcome)}</p><div class="deliverables">${p.deliverables.map(item=>`<span>${esc(item)}</span>`).join('')}</div>${resourceMarkup(p)}</section>
    ${findings.length || data.length ? `<section class="project-section" aria-labelledby="project-findings"><h3 id="project-findings">Key findings & data</h3>${data.length ? `<div class="project-data">${data.map(point=>`<div><strong>${esc(point.value)}</strong><span>${esc(point.label)}</span><small>${esc(point.note)}</small></div>`).join('')}</div>` : ''}${findings.length ? `<ul class="project-findings">${findings.map(point=>`<li>${esc(point)}</li>`).join('')}</ul>` : ''}</section>` : ''}
    <section class="project-section skill-section" aria-labelledby="project-skills"><h3 id="project-skills">${p.inProgress ? 'Relevant skills' : 'Five skills demonstrated'}</h3><div class="skills">${p.skills.map(skill=>`<span>${esc(skill)}</span>`).join('')}</div></section>
    <details class="source-details"><summary>Project sources & result context</summary><p>${esc(p.evidence)}</p></details>`;
}

function showCase(id) {
  const index = projects.findIndex(p => p.id === id);
  if (index < 0) return;
  activeIndex = index;
  const p = projects[index];
  const hasDocument = !p.inProgress && (p.resources || []).some(resource => resource.preview);
  viewerCleanup?.();
  viewerCleanup = null;
  dialog.classList.toggle('has-project-document', hasDocument);
  dialog.classList.remove('document-view');
  content.innerHTML = `${projectHeaderMarkup(p)}<div class="project-layout"><div class="project-overview${p.inProgress ? ' case-progress' : ''}">${projectOverviewMarkup(p)}</div>${hasDocument ? window.ProjectViewer.markup(p) : ''}</div>`;
  viewerCleanup = window.ProjectViewer.mount(content.querySelector('.project-viewer'), p);
  document.getElementById('case-position').textContent = `${String(index+1).padStart(2,'0')} / ${total}`;
  document.getElementById('copy-case-link').addEventListener('click',copyLink);
  if (!dialog.open) {
    returnFocus = document.activeElement;
    dialog.showModal();
    document.body.classList.add('dialog-open');
  }
  dialog.scrollTop = 0;
  content.scrollTop = 0;
  document.getElementById('close-case').focus({preventScroll:true});
}
function route() {
  const match = location.hash.match(/^#project\/([a-z0-9-]+)$/);
  if (match) { if(projects.some(p=>p.id===match[1])) showCase(match[1]); else { closeDialog(); showToast('That project could not be found.'); } }
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
  try {await navigator.clipboard.writeText(link.href);showToast('Project link copied');}
  catch { const field=document.createElement('input');field.value=link.href;field.className='copy-fallback';dialog.append(field);field.select();const ok=document.execCommand('copy');field.remove();showToast(ok?'Project link copied':'Copy this project URL from your address bar.');document.getElementById('copy-case-link').focus(); }
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
