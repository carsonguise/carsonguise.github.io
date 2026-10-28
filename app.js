'use strict';
const projects = window.PORTFOLIO_PROJECTS;
const basePath = document.querySelector('meta[name="portfolio-base-path"]')?.content || '';
const sitePath = path => path.startsWith('/') && !path.startsWith('//') ? basePath + path : path;
const grid = document.getElementById('project-grid');
const search = document.getElementById('project-search');
const dialog = document.getElementById('case-dialog');
const content = document.getElementById('case-content');
let filter = 'all';
let activeIndex = 0;
let returnFocus = null;
let toastTimer;
const categoryLabels = {strategy:'Marketing strategy',pr:'PR & communications',international:'International', 'music-fashion':'Music & fashion'};
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function coverMarkup(p, detail = false) {
  if (p.cover === 'aeop') return `<div class="cover aeop-cover ${detail?'detail-cover':''}"><span class="cover-kicker">AEOP / SOCIAL & STORYTELLING</span><div class="aeop-headline">Real people.<br>Real possibilities<span>.</span></div><div class="aeop-stat"><strong>+96.88<span>%</span></strong><span>LinkedIn impressions</span></div><span class="cover-foot">INTERNSHIPS & FELLOWSHIPS <span>↗</span></span></div>`;
  if (p.cover === 'gummy') return `<div class="cover gummy-cover ${detail?'detail-cover':''}"><span class="cover-kicker">GUMMY GAINS / CONSUMER RESEARCH</span><div class="gummy-word">Small gummy.<br><em>Big choices.</em></div><div class="gummy-shapes" aria-hidden="true"><i></i><i></i><i></i><i></i></div><span class="cover-foot">PRICE / FLAVOR / SWEETNESS / CUSTOMIZATION</span></div>`;
  if (p.cover === 'chanel') return `<div class="cover chanel-cover ${detail?'detail-cover':''}"><img src="${sitePath(p.image)}" alt="Pink and black exploratory moodboard for the fictional Slayyyter and Chanel academic PR concept" loading="lazy"><span class="concept-badge">ACADEMIC CONCEPT · AI MOODBOARD</span></div>`;
  if (p.cover === 'eras') return `<div class="cover eras-cover ${detail?'detail-cover':''}"><span class="cover-kicker">THE ERAS TOUR / PRICING ANALYSIS</span><div class="ticket-art"><span>ADMIT ONE / MARKET ANALYSIS</span><strong>Face value.<br><em>Resale reality.</em></strong><div class="ticket-bottom"><span>TABLEAU × INDUSTRY RESEARCH</span><span class="barcode" aria-hidden="true"></span></div></div><span class="cover-foot">THE MARKET BEHIND THE MUSIC <span>↗</span></span></div>`;
  if (p.cover === 'kgh') return `<div class="cover kgh-cover ${detail?'detail-cover':''}"><span class="cover-kicker">KEVIN GUEST HOUSE / GIVE716</span><div class="kgh-headline">A community.<br>A shared cause.</div><div class="kgh-total"><strong>$10,430</strong><span>GIVE716 CAMPAIGN TOTAL</span></div><span class="cover-foot">COMMUNICATIONS WITH PURPOSE <span>↗</span></span></div>`;
  return `<div class="cover ethel-cover ${detail?'detail-cover':''}"><span class="cover-kicker">CIEE LONDON / CULTURAL ANALYSIS</span><div class="ethel-word">Beyond<br><em>the music.</em></div><div class="ethel-path"><span>Identity</span><i>↗</i><span>Storytelling</span><i>↗</i><span>Belonging</span></div><span class="cover-foot">UNDERSTANDING ETHEL CAIN’S CULTURAL IMPACT</span></div>`;
}
function renderCards() {
  const query = search.value.trim().toLowerCase();
  const visible = projects.filter(p => (filter === 'all' || p.category.includes(filter)) && [p.title,p.subtitle,p.type,p.summary,...p.skills].join(' ').toLowerCase().includes(query));
  grid.innerHTML = visible.map(p => `<article class="project-card"><a class="project-open" href="#project/${p.id}" data-project="${p.id}" aria-label="Read ${esc(p.title)} case study">${coverMarkup(p)}<div class="card-meta"><span>${esc(p.type)}</span><span>${p.number} / 06</span></div><div class="card-title-row"><h2>${esc(p.title)}</h2><span class="card-arrow" aria-hidden="true">↗</span></div><p class="card-subtitle">${esc(p.subtitle)}</p><p class="card-summary">${esc(p.summary)}</p><div class="card-bottom"><span>${esc(p.highlight)}</span><span>View case study ↗</span></div></a></article>`).join('');
  document.getElementById('result-count').textContent = filter === 'all' && !query ? 'Showing all 6 projects' : `${visible.length} ${visible.length===1?'project':'projects'}${filter!=='all'?' in '+categoryLabels[filter]:''}${query?' matching “'+search.value.trim()+'”':''}`;
  document.getElementById('empty-state').hidden = visible.length !== 0;
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(b => { const selected = b === button; b.classList.toggle('active',selected); b.setAttribute('aria-pressed',String(selected)); });
  renderCards();
}));
search.addEventListener('input',renderCards);
document.getElementById('reset-filters').addEventListener('click',()=>{search.value=''; document.querySelector('[data-filter="all"]').click();search.focus();});

function showCase(id) {
  const index = projects.findIndex(p => p.id === id);
  if (index < 0) return;
  activeIndex = index;
  const p = projects[index];
  content.innerHTML = `<div class="case-header"><p class="eyebrow">${esc(p.type)}</p><h2 id="case-title">${esc(p.title)}</h2><p class="case-subtitle serif">${esc(p.subtitle)}</p><div class="case-tags"><span>${esc(p.status)}</span><button id="copy-case-link">Copy case link ↗</button></div></div>${coverMarkup(p,true)}<div class="case-body"><div class="case-context"><div><p class="eyebrow">Project context</p><p>${esc(p.context)}</p></div><div><p class="eyebrow">My contribution</p><p>${esc(p.role)}</p></div></div><section class="case-section"><span class="section-number">01</span><div><h3>Strategic approach</h3><ol>${p.approach.map(a=>`<li>${esc(a)}</li>`).join('')}</ol></div></section><section class="insight-box"><p class="eyebrow">${esc(p.insightLabel)}</p><p>${esc(p.insight)}</p></section><section class="case-section"><span class="section-number">02</span><div><h3>Outcomes & deliverables</h3><p>${esc(p.outcome)}</p>${p.metrics.length?`<div class="case-metrics">${p.metrics.map(m=>`<div><strong>${esc(m.value)}</strong><span>${esc(m.label)}</span></div>`).join('')}</div>`:''}<div class="deliverables">${p.deliverables.map(d=>`<span>${esc(d)}</span>`).join('')}</div></div></section>${p.image?`<figure class="case-figure"><a href="${sitePath(p.image)}" target="_blank" rel="noopener noreferrer"><img src="${sitePath(p.image)}" alt="Full AI-generated exploratory Slayyyter × Chanel concept moodboard" loading="lazy"></a><figcaption>${esc(p.imageCaption)} <a href="${sitePath(p.image)}" target="_blank" rel="noopener noreferrer">Open full image ↗</a></figcaption></figure>`:''}<section class="case-section skill-section"><span class="section-number">03</span><div><h3>Five skills demonstrated</h3><div class="skills">${p.skills.map(s=>`<span>${esc(s)}</span>`).join('')}</div></div></section><details class="source-details"><summary>Project sources & result context</summary><p>${esc(p.evidence)}</p>${p.paper?`<a class="text-link" href="${sitePath(p.paper)}" target="_blank" rel="noopener noreferrer">Read the original supplied paper ↗</a>`:''}</details></div>`;
  document.getElementById('case-position').textContent = `${String(index+1).padStart(2,'0')} / 06`;
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
  if(dialog.open) dialog.close();
  document.body.classList.remove('dialog-open');
  if(returnFocus && document.contains(returnFocus)) returnFocus.focus({preventScroll:true});
}
function requestClose() {
  if (new URLSearchParams(location.search).get('from') === 'experiences') {
    location.replace(sitePath('/experiences/#experience-kevin-guest-house'));
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
renderCards();route();
