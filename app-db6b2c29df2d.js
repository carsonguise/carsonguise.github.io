'use strict';
const projects = window.PORTFOLIO_PROJECTS;
const grid = document.getElementById('project-grid');
const search = document.getElementById('project-search');
const dialog = document.getElementById('case-dialog');
const content = document.getElementById('case-content');
const sort = document.getElementById('project-sort');
const loadMore = document.getElementById('load-more');
const isHome = document.body.dataset.page === 'home';
const pageSize = 6;
let visibleLimit = pageSize;
let filter = 'all';
let projectKind = 'all';
let activeIndex = 0;
let returnFocus = null;
let toastTimer;
let viewerCleanup = null;
const categoryLabels = {strategy:'Marketing Strategy',pr:'PR & Communications',international:'International', 'music-fashion':'Music & Fashion',research:'Research & Analytics',digital:'Digital Marketing'};
const normalized = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const projectKindLabels = {work:'Work Projects',academic:'Academic Projects'};
let cardAlignmentFrame;
function alignCardRows() {
    const fields = ['.card-meta','.project-period','.card-title-row','.card-subtitle','.card-summary','.card-skills'];
    const projectGrids = grid ? [...grid.querySelectorAll('.project-grid')] : [...document.querySelectorAll('.home-project-grid')];
    const cards = projectGrids.flatMap(projectGrid => [...projectGrid.querySelectorAll('.project-card')]);
    const measurements = [];
    cards.forEach(card => fields.forEach(field => {
      const element = card.querySelector(field);
      if (element) element.style.minHeight = '';
    }));
    projectGrids.forEach(projectGrid => {
      const rows = new Map();
      projectGrid.querySelectorAll('.project-card').forEach(card => {
        const top = Math.round(card.getBoundingClientRect().top);
        if (!rows.has(top)) rows.set(top, []);
        rows.get(top).push(card);
      });
      rows.forEach(row => {
        if (row.length < 2) return;
        fields.forEach(field => {
          const elements = row.map(card => card.querySelector(field)).filter(Boolean);
          if (elements.length < 2) return;
          const height = Math.ceil(Math.max(...elements.map(element => element.getBoundingClientRect().height)));
          measurements.push({elements,height});
        });
      });
    });
    measurements.forEach(({elements,height}) => elements.forEach(element => { element.style.minHeight = `${height}px`; }));
}
function scheduleCardAlignment() {
  cancelAnimationFrame(cardAlignmentFrame);
  cardAlignmentFrame = requestAnimationFrame(alignCardRows);
}
window.addEventListener('resize', scheduleCardAlignment, {passive:true});
document.fonts?.ready.then(scheduleCardAlignment);
function experienceLinkMarkup(p, card = false) {
  if (p.projectKind !== 'work' || !p.experienceLink) return '';
  const company = p.experienceLink.url.match(/#experience-([a-z0-9-]+)$/)?.[1];
  const inline = isHome && company && document.getElementById('home-experience-' + company);
  return `<a class="${card ? 'project-card-experience' : 'button secondary project-experience-link'}" href="${esc(inline ? '#experience-' + company : p.experienceLink.url)}"${inline ? ` data-home-experience="${esc(company)}" aria-haspopup="dialog" aria-controls="case-dialog"` : ''}>${esc(p.experienceLink.label)}</a>`;
}
function cardMarkup(p) {
  return `<article class="project-card plain-project-card"><a class="project-open" href="#project/${p.id}" data-project="${p.id}" aria-label="Read ${esc(p.title)} project"><div class="card-meta"><span>${esc(p.type)}</span></div><div class="project-period"><span>${esc(p.period)}</span>${p.projectKind==='academic'&&p.featured?'<span class="featured-label">Featured</span>':''}</div><div class="card-title-row"><h3>${esc(p.title)}</h3></div><p class="card-subtitle">${esc(p.subtitle)}</p><p class="card-summary">${esc(p.summary)}</p><div class="card-skills">${p.skills.slice(0,3).map(skill=>`<span>${esc(skill)}</span>`).join('')}</div><span class="project-card-link">View Project</span></a>${experienceLinkMarkup(p,true)}</article>`;
}
function renderCards() {
  const query = normalized(search.value.trim());
  const matches = projects.filter(p => (projectKind === 'all' || p.projectKind === projectKind) && (filter === 'all' || p.category.includes(filter)) && normalized([p.title,p.subtitle,p.type,p.summary,p.period,p.association,p.issue,...(p.finalPoints||[]),...(p.dataPoints||[]).flatMap(point=>[point.value,point.label]),...p.skills,...p.deliverables].join(' ')).includes(query));
  if(sort.value==='featured') matches.sort((a,b)=>Number(Boolean(b.featured))-Number(Boolean(a.featured)));
  if(sort.value==='newest') matches.sort((a,b)=>b.dateSort-a.dateSort);
  if(sort.value==='az') matches.sort((a,b)=>a.title.localeCompare(b.title));
  const visible = ['work','academic'].flatMap(kind=>{
    const group = matches.filter(p=>p.projectKind===kind);
    return kind === 'academic' ? group.slice(0,visibleLimit) : group;
  });
  grid.innerHTML = ['work','academic'].map(kind=>{
    const shown=visible.filter(p=>p.projectKind===kind);
    if(!shown.length) return '';
    return `<section class="project-group project-group-${kind}" aria-labelledby="project-group-${kind}"><header class="project-group-heading"><h2 id="project-group-${kind}">${projectKindLabels[kind]}</h2></header><div class="project-grid">${shown.map(cardMarkup).join('')}</div></section>`;
  }).join('');
  const count = matches.length>visible.length ? `Showing ${visible.length} of ${matches.length} projects` : `${matches.length} ${matches.length===1?'project':'projects'}`;
  document.getElementById('result-count').textContent = count + (projectKind!=='all'?' · '+projectKindLabels[projectKind]:'') + (filter!=='all'?' · '+categoryLabels[filter]:'') + (query?' matching “'+search.value.trim()+'”':'');
  document.getElementById('empty-state').hidden = matches.length !== 0;
  loadMore.hidden = matches.length <= visible.length;
  loadMore.textContent = 'Show More Projects';
  alignCardRows();
}
document.querySelectorAll('[data-project-kind]').forEach(button=>button.addEventListener('click',()=>{
  projectKind=button.dataset.projectKind;
  visibleLimit=pageSize;
  const url=new URL(location.href);
  if(projectKind==='all') url.searchParams.delete('kind'); else url.searchParams.set('kind',projectKind);
  history.replaceState(null,'',url.pathname+url.search+url.hash);
  document.querySelectorAll('[data-project-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  renderCards();
}));
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  visibleLimit = pageSize;
  const url = new URL(location.href);
  if(filter==='all') url.searchParams.delete('area'); else url.searchParams.set('area',filter);
  history.replaceState(null,'',url.pathname+url.search+url.hash);
  document.querySelectorAll('[data-filter]').forEach(b => { const selected = b === button; b.classList.toggle('active',selected); b.setAttribute('aria-pressed',String(selected)); });
  renderCards();
}));
search?.addEventListener('input',()=>{visibleLimit=pageSize;renderCards();});
sort?.addEventListener('change',()=>{visibleLimit=pageSize;renderCards();});
loadMore?.addEventListener('click',()=>{const previousCount=grid.querySelectorAll('.project-open').length;visibleLimit+=pageSize;renderCards();grid.querySelectorAll('.project-open')[previousCount]?.focus();});
document.getElementById('reset-filters')?.addEventListener('click',()=>{search.value=''; document.querySelector('[data-project-kind="all"]').click(); document.querySelector('[data-filter="all"]').click();search.focus();});

function projectHeaderMarkup(p) {
  return `<div class="case-header"><p class="eyebrow">${esc(p.type)}</p><h2 id="case-title">${esc(p.title)}</h2><p class="case-subtitle serif">${esc(p.subtitle)}</p><p class="case-origin">${esc(p.period)} · ${esc(p.association)}</p><div class="case-tags"><span>${esc(p.status)}</span></div>${experienceLinkMarkup(p)}</div>`;
}
function resourceMarkup(p) {
  const links = (p.resources || []).filter(resource => resource.external && resource.url);
  if (!links.length) return '';
  return `<div class="published-work"><h4>${esc(p.resourceHeading || 'Published Work')}</h4><div class="resource-links">${links.map(resource=>`<a class="${resource.cta ? 'button secondary' : 'text-link'}" href="${esc(resource.url)}" target="_blank" rel="noopener noreferrer">${esc(resource.label)}</a>`).join('')}</div></div>`;
}
function projectOverviewMarkup(p) {
  const findings = (p.finalPoints || []).filter(Boolean);
  const data = p.dataPoints || [];
  return `<section class="project-section" aria-labelledby="project-issue"><h3 id="project-issue">Issue</h3><p>${esc(p.issue)}</p></section>
    <section class="project-section" aria-labelledby="project-process"><h3 id="project-process">My Thought Process</h3><p>${esc(p.role)}</p>${p.approach.length ? `<ol>${p.approach.map(step=>`<li>${esc(step)}</li>`).join('')}</ol>` : '<p>This project is currently in development.</p>'}</section>
    <section class="project-section" aria-labelledby="project-deliverable"><h3 id="project-deliverable">My Deliverable</h3><p>${esc(p.outcome)}</p><div class="deliverables">${p.deliverables.map(item=>`<span>${esc(item)}</span>`).join('')}</div>${resourceMarkup(p)}</section>
    ${findings.length || data.length ? `<section class="project-section" aria-labelledby="project-findings"><h3 id="project-findings">Key Findings & Data</h3>${data.length ? `<div class="project-data" style="--data-columns:${Math.min(data.length,3)}">${data.map(point=>`<div><strong>${esc(point.value)}</strong><span>${esc(point.label)}</span><small>${esc(point.note)}</small></div>`).join('')}</div>` : ''}${findings.length ? `<ul class="project-findings">${findings.map(point=>`<li>${esc(point)}</li>`).join('')}</ul>` : ''}</section>` : ''}
    <section class="project-section skill-section" aria-labelledby="project-skills"><h3 id="project-skills">${p.inProgress ? 'Relevant Skills' : 'Five Skills Demonstrated'}</h3><div class="skills">${p.skills.map(skill=>`<span>${esc(skill)}</span>`).join('')}</div></section>`;
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
  dialog.classList.remove('document-view', 'experience-dialog');
  dialog.querySelector('.case-navigation').hidden = false;
  document.getElementById('dialog-home').href = 'projects.html';
  document.getElementById('dialog-home').textContent = 'CARSON GUISE / SELECTED WORK';
  document.getElementById('close-case').setAttribute('aria-label', 'Close project');
  content.innerHTML = `${projectHeaderMarkup(p)}<div class="project-layout"><div class="project-overview${p.inProgress ? ' case-progress' : ''}">${projectOverviewMarkup(p)}</div>${hasDocument ? window.ProjectViewer.markup(p) : ''}</div>`;
  viewerCleanup = window.ProjectViewer.mount(content.querySelector('.project-viewer'), p);
  revealDialog();
}
function revealDialog() {
  if (!dialog.open) {
    returnFocus = document.activeElement;
    dialog.showModal();
    document.body.classList.add('dialog-open');
  }
  dialog.scrollTop = 0;
  content.scrollTop = 0;
  document.getElementById('close-case').focus({preventScroll:true});
}
function showExperience(company) {
  const template = document.getElementById('home-experience-' + company);
  if (!isHome || !template) return;
  viewerCleanup?.();
  viewerCleanup = null;
  dialog.classList.remove('has-project-document', 'document-view');
  dialog.classList.add('experience-dialog');
  dialog.querySelector('.case-navigation').hidden = true;
  const companyCard = template.content.firstElementChild.cloneNode(true);
  const heading = companyCard.querySelector('.company-heading h3');
  const title = document.createElement('h2');
  title.id = 'case-title';
  title.textContent = heading.textContent;
  heading.replaceWith(title);
  companyCard.querySelectorAll('.timeline-role h4').forEach(heading => {
    const roleTitle = document.createElement('h3');
    roleTitle.textContent = heading.textContent;
    heading.replaceWith(roleTitle);
  });
  companyCard.querySelectorAll('.role-contributions').forEach(detail => {detail.open = true;});
  companyCard.querySelectorAll('.company-project-link').forEach(link => {
    const project = link.getAttribute('href').match(/#project\/([a-z0-9-]+)$/)?.[1];
    if (project) {
      link.href = '#project/' + project;
      link.dataset.homeProject = project;
      link.setAttribute('aria-haspopup', 'dialog');
      link.setAttribute('aria-controls', 'case-dialog');
    }
  });
  const fullExperience = document.createElement('a');
  fullExperience.className = 'button secondary experience-page-link';
  fullExperience.href = 'experiences.html#experience-' + company;
  fullExperience.textContent = 'View on Experiences';
  companyCard.append(fullExperience);
  content.replaceChildren(companyCard);
  document.getElementById('dialog-home').href = fullExperience.href;
  document.getElementById('dialog-home').textContent = 'CARSON GUISE / WORK EXPERIENCE';
  document.getElementById('close-case').setAttribute('aria-label', 'Close experience');
  revealDialog();
}
function route() {
  const match = location.hash.match(/^#project\/([a-z0-9-]+)$/);
  if (match) { if(projects.some(p=>p.id===match[1])) showCase(match[1]); else { closeDialog(); showToast('That project could not be found.'); } }
  else if (isHome && /^#experience-[a-z0-9-]+$/.test(location.hash) && document.getElementById('home-' + location.hash.slice(1))) showExperience(location.hash.slice('#experience-'.length));
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
  if (!isHome && new URLSearchParams(location.search).get('from') === 'experiences') {
    location.replace('experiences.html#experience-kevin-guest-house');
    return;
  }
  history.replaceState(null,'',location.pathname+location.search+(isHome ? '' : '#work'));
  closeDialog();
}
document.getElementById('close-case').addEventListener('click',requestClose);
dialog.addEventListener('cancel',event=>{event.preventDefault();requestClose();});
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)requestClose();}});
function navigateCase(id) {history.pushState(null,'','#project/'+id);showCase(id);}
if (isHome) document.addEventListener('click', event => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest('[data-home-experience], [data-home-project]');
  if (!link) return;
  event.preventDefault();
  if (link.dataset.homeExperience) {
    history.pushState(null, '', '#experience-' + link.dataset.homeExperience);
    showExperience(link.dataset.homeExperience);
  } else navigateCase(link.dataset.homeProject);
});
document.getElementById('previous-case').addEventListener('click',()=>navigateCase(projects[(activeIndex-1+projects.length)%projects.length].id));
document.getElementById('next-case').addEventListener('click',()=>navigateCase(projects[(activeIndex+1)%projects.length].id));
function showToast(message) {const toast=document.getElementById('toast');(dialog.open?dialog:document.body).append(toast);toast.textContent=message;toast.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),2800);}
window.addEventListener('hashchange',route);
const initialArea = new URLSearchParams(location.search).get('area');
if(initialArea && Object.hasOwn(categoryLabels,initialArea)) {
  filter = initialArea;
  document.querySelectorAll('[data-filter]').forEach(b=>{const selected=b.dataset.filter===filter;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
}
const initialKind=new URLSearchParams(location.search).get('kind');
if(initialKind && Object.hasOwn(projectKindLabels,initialKind)) projectKind=initialKind;
document.querySelectorAll('[data-project-kind]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.projectKind===projectKind)));
if (grid) renderCards(); else alignCardRows();
route();
