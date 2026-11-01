'use strict';
(() => {
  const cache = new Map();
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function markup(project) {
    const documents = (project.resources || []).filter(resource => resource.preview);
    if (!documents.length) return '';
    return `<section class="project-viewer" aria-labelledby="viewer-heading"><div class="viewer-heading"><div><h3 id="viewer-heading">Inside the project</h3><p>Swipe through the pages, or use Previous and Next.</p></div><span class="viewer-file-count">${documents.length} ${documents.length === 1 ? 'document' : 'documents'}</span></div>${documents.length > 1 ? `<div class="viewer-documents" role="group" aria-label="Choose a project document">${documents.map((document, index) => `<button type="button" data-document="${index}" aria-pressed="${index === 0}">${escape(document.label)}</button>`).join('')}</div>` : ''}<p class="viewer-document-title"></p><div class="viewer-controls"><button type="button" class="viewer-previous" disabled>Previous</button><label class="viewer-page-picker"><span>Page</span><select aria-label="Choose a document page" disabled></select></label><p class="viewer-position" role="status" aria-live="polite"></p><button type="button" class="viewer-next" disabled>Next</button><button type="button" class="viewer-enlarge" aria-pressed="false" disabled>Enlarge page</button></div><div class="viewer-stage" tabindex="0" role="group" aria-roledescription="page viewer" aria-label="Project document pages" aria-busy="true"><img class="viewer-page" alt="" draggable="false" hidden><p class="viewer-loading" role="status">Loading the document…</p><div class="viewer-error" hidden><p>This preview couldn’t load.</p><button type="button" class="viewer-retry">Try again</button></div></div><details class="viewer-transcript"><summary>Read page text</summary><div></div></details></section>`;
  }

  function loadPreview(url) {
    if (cache.has(url)) {
      const existing = cache.get(url);
      cache.delete(url);
      cache.set(url, existing);
      return existing;
    }
    const request = fetch(url).then(response => {
      if (!response.ok) throw new Error('Preview unavailable');
      return response.json();
    }).then(data => {
      if (!Array.isArray(data.pages) || !data.pages.length) throw new Error('Preview empty');
      return data;
    }).catch(error => {
      if (cache.get(url) === request) cache.delete(url);
      throw error;
    });
    cache.set(url, request);
    if (cache.size > 6) cache.delete(cache.keys().next().value);
    return request;
  }

  function mount(root, project) {
    if (!root) return () => {};
    const documents = project.resources.filter(resource => resource.preview);
    const stage = root.querySelector('.viewer-stage');
    const image = root.querySelector('.viewer-page');
    const loading = root.querySelector('.viewer-loading');
    const error = root.querySelector('.viewer-error');
    const previous = root.querySelector('.viewer-previous');
    const next = root.querySelector('.viewer-next');
    const picker = root.querySelector('.viewer-page-picker select');
    const position = root.querySelector('.viewer-position');
    const enlarge = root.querySelector('.viewer-enlarge');
    const title = root.querySelector('.viewer-document-title');
    const transcript = root.querySelector('.viewer-transcript div');
    const buttons = [...root.querySelectorAll('[data-document]')];
    const savedPages = documents.map(() => 0);
    let active = 0;
    let pageIndex = 0;
    let pages = [];
    let requestVersion = 0;
    let disposed = false;
    let pointerStart = null;

    image.addEventListener('load', () => {
      if (disposed) return;
      loading.hidden = true;
      stage.setAttribute('aria-busy', 'false');
    });
    image.addEventListener('error', () => {
      if (disposed) return;
      loading.hidden = true;
      image.hidden = true;
      error.hidden = false;
      stage.setAttribute('aria-busy', 'false');
    });

    function renderPage(index) {
      if (!pages.length || disposed) return;
      pageIndex = Math.max(0, Math.min(index, pages.length - 1));
      savedPages[active] = pageIndex;
      const page = pages[pageIndex];
      image.alt = `${documents[active].label}, page ${pageIndex + 1} of ${pages.length}`;
      image.width = page.width;
      image.height = page.height;
      stage.style.setProperty('--page-aspect', `${page.width} / ${page.height}`);
      stage.classList.add('has-page');
      image.src = page.image;
      image.hidden = false;
      error.hidden = true;
      loading.hidden = true;
      previous.disabled = pageIndex === 0;
      next.disabled = pageIndex === pages.length - 1;
      picker.disabled = false;
      picker.value = String(pageIndex);
      enlarge.disabled = false;
      position.textContent = `${pageIndex + 1} of ${pages.length}`;
      stage.setAttribute('aria-label', `${documents[active].label}. Page ${pageIndex + 1} of ${pages.length}. Use left and right arrow keys to change pages.`);
      stage.setAttribute('aria-busy', 'false');
      transcript.textContent = page.text || 'This page is primarily visual. Its artwork is shown above.';
    }

    async function selectDocument(index) {
      active = index;
      pages = [];
      const version = ++requestVersion;
      title.textContent = documents[index].label;
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      image.hidden = true;
      stage.classList.remove('has-page');
      loading.hidden = false;
      error.hidden = true;
      previous.disabled = next.disabled = picker.disabled = enlarge.disabled = true;
      position.textContent = '';
      picker.replaceChildren();
      transcript.textContent = '';
      stage.setAttribute('aria-busy', 'true');
      try {
        const data = await loadPreview(documents[index].preview);
        if (disposed || version !== requestVersion || !root.isConnected) return;
        pages = data.pages;
        pages.forEach((page, i) => {
          const option = document.createElement('option');
          option.value = String(i);
          option.textContent = String(i + 1);
          picker.append(option);
        });
        renderPage(savedPages[index]);
      } catch {
        if (disposed || version !== requestVersion || !root.isConnected) return;
        loading.hidden = true;
        error.hidden = false;
        stage.setAttribute('aria-busy', 'false');
      }
    }

    buttons.forEach((button, index) => button.addEventListener('click', () => selectDocument(index)));
    previous.addEventListener('click', () => renderPage(pageIndex - 1));
    next.addEventListener('click', () => renderPage(pageIndex + 1));
    picker.addEventListener('change', () => renderPage(Number(picker.value)));
    root.querySelector('.viewer-retry').addEventListener('click', () => selectDocument(active));
    enlarge.addEventListener('click', () => {
      const expanded = stage.classList.toggle('is-expanded');
      enlarge.setAttribute('aria-pressed', String(expanded));
      enlarge.textContent = expanded ? 'Fit page' : 'Enlarge page';
    });
    stage.addEventListener('keydown', event => {
      const change = {ArrowLeft:pageIndex - 1, ArrowRight:pageIndex + 1, Home:0, End:pages.length - 1};
      if (!Object.hasOwn(change, event.key) || !pages.length) return;
      event.preventDefault();
      renderPage(change[event.key]);
    });
    stage.addEventListener('pointerdown', event => {
      if (!pages.length || (event.pointerType === 'mouse' && event.button !== 0)) return;
      pointerStart = {x:event.clientX, y:event.clientY, id:event.pointerId};
      stage.setPointerCapture(event.pointerId);
    });
    stage.addEventListener('pointerup', event => {
      if (!pointerStart || pointerStart.id !== event.pointerId) return;
      const dx = event.clientX - pointerStart.x;
      const dy = event.clientY - pointerStart.y;
      pointerStart = null;
      if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.4) renderPage(pageIndex + (dx < 0 ? 1 : -1));
    });
    stage.addEventListener('pointercancel', () => { pointerStart = null; });
    selectDocument(0);
    return () => {disposed = true;requestVersion++;pointerStart = null;};
  }

  window.ProjectViewer = {markup, mount};
})();
