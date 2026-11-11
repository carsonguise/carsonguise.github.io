'use strict';
(() => {
  const cache = new Map();
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function markup(project) {
    const documents = (project.resources || []).filter(resource => resource.preview);
    if (!documents.length) return '';
    return `<section id="project-document" class="project-viewer" aria-label="Project document viewer">
      <div class="viewer-controls">
        <label class="viewer-file-picker"><span>Document</span><select aria-label="Choose a project document"${documents.length === 1 ? ' disabled' : ''}>${documents.map((document, index) => `<option value="${index}">${escape(document.label)}</option>`).join('')}</select></label>
        <label class="viewer-page-picker"><span>Page</span><select aria-label="Choose a document page" disabled></select></label>
        <p class="viewer-position" role="status" aria-live="polite"></p>
        <div class="paper-navigation" hidden><button type="button" class="paper-previous" aria-label="Previous paper page" disabled>Previous Page</button><button type="button" class="paper-next" aria-label="Next paper page" disabled>Next Page</button></div>
      </div>
      <div class="viewer-stage" tabindex="0" role="group" aria-roledescription="page viewer" aria-label="Project document pages" aria-busy="true">
        <img id="viewer-page" class="viewer-page" alt="" draggable="false" hidden>
        <button type="button" class="viewer-arrow viewer-previous" aria-label="Previous page" aria-controls="viewer-page" title="Previous page" disabled><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg></button>
        <button type="button" class="viewer-arrow viewer-next" aria-label="Next page" aria-controls="viewer-page" title="Next page" disabled><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>
        <p class="viewer-loading" role="status">Loading the document…</p>
        <div class="viewer-error" hidden><p>This preview couldn’t load.</p><button type="button" class="viewer-retry">Try again</button></div>
      </div>
      <div class="paper-pages" aria-label="Scrollable paper pages" hidden></div>
    </section>`;
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
    const documentPicker = root.querySelector('.viewer-file-picker select');
    const paperPages = root.querySelector('.paper-pages');
    const paperNavigation = root.querySelector('.paper-navigation');
    const paperPrevious = root.querySelector('.paper-previous');
    const paperNext = root.querySelector('.paper-next');
    const scroller = root.closest('#case-content');
    let paperMode = false;
    let singlePaperMode = false;
    let scrollFrame = null;
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
      stage.classList.add('has-page');
      stage.style.setProperty('--page-aspect', `${page.width} / ${page.height}`);
      image.src = page.image;
      if (singlePaperMode) stage.scrollTop = 0;
      image.hidden = false;
      error.hidden = true;
      loading.hidden = true;
      previous.disabled = paperPrevious.disabled = pageIndex === 0;
      next.disabled = paperNext.disabled = pageIndex === pages.length - 1;
      picker.disabled = false;
      picker.value = String(pageIndex);
      position.textContent = `${pageIndex + 1} of ${pages.length}`;
      stage.setAttribute('aria-label', `${documents[active].label}. Page ${pageIndex + 1} of ${pages.length}. Use left and right arrow keys to change pages.`);
      stage.setAttribute('aria-busy', 'false');
    }

    async function selectDocument(index) {
      active = index;
      pages = [];
      paperMode = false;
      singlePaperMode = false;
      root.classList.remove('paper-view', 'single-paper-view');
      stage.hidden = false;
      previous.hidden = next.hidden = false;
      paperPages.hidden = paperNavigation.hidden = true;
      paperPages.replaceChildren();
      const version = ++requestVersion;
      documentPicker.value = String(index);
      image.hidden = true;
      stage.classList.remove('has-page');
      loading.hidden = false;
      error.hidden = true;
      previous.disabled = next.disabled = picker.disabled = true;
      position.textContent = '';
      picker.replaceChildren();
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
        paperMode = documents[index].viewMode === 'paper';
        singlePaperMode = documents[index].viewMode === 'paper-single';
        root.classList.toggle('paper-view', paperMode || singlePaperMode);
        root.classList.toggle('single-paper-view', singlePaperMode);
        previous.hidden = next.hidden = singlePaperMode;
        if (paperMode) {
          const fragment = document.createDocumentFragment();
          pages.forEach((page, number) => {
            const figure = document.createElement('figure');
            figure.className = 'paper-page';
            figure.setAttribute('aria-label', `Page ${number + 1} of ${pages.length}`);
            const paperImage = document.createElement('img');
            paperImage.src = page.image;
            paperImage.width = page.width;
            paperImage.height = page.height;
            paperImage.alt = `${documents[active].label}, page ${number + 1}`;
            paperImage.loading = 'lazy';
            paperImage.decoding = 'async';
            const caption = document.createElement('figcaption');
            caption.textContent = `Page ${number + 1} of ${pages.length}`;
            figure.append(paperImage, caption);
            fragment.append(figure);
          });
          paperPages.replaceChildren(fragment);
        }
        renderPage(savedPages[index]);
        stage.hidden = paperMode;
        paperPages.hidden = !paperMode;
        paperNavigation.hidden = !(paperMode || singlePaperMode);
      } catch {
        if (disposed || version !== requestVersion || !root.isConnected) return;
        loading.hidden = true;
        error.hidden = false;
        stage.setAttribute('aria-busy', 'false');
      }
    }

    function goToPage(index) {
      renderPage(index);
      if (paperMode) paperPages.children[pageIndex]?.scrollIntoView({block:'start', behavior:'instant'});
    }
    function followPaperScroll() {
      if (!paperMode || !pages.length || disposed || scrollFrame !== null) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = null;
        if (disposed || !paperMode) return;
        const bounds = scroller.getBoundingClientRect();
        const readingLine = bounds.top + Math.min(bounds.height * .4, 220);
        const index = [...paperPages.children].findIndex(figure => figure.getBoundingClientRect().bottom > readingLine);
        const nextIndex = index < 0 ? pages.length - 1 : index;
        if (nextIndex !== pageIndex) renderPage(nextIndex);
      });
    }
    scroller.addEventListener('scroll', followPaperScroll, {passive:true});
    paperPrevious.addEventListener('click', () => goToPage(pageIndex - 1));
    paperNext.addEventListener('click', () => goToPage(pageIndex + 1));
    documentPicker.addEventListener('change', () => selectDocument(Number(documentPicker.value)));
    previous.addEventListener('click', () => renderPage(pageIndex - 1));
    next.addEventListener('click', () => renderPage(pageIndex + 1));
    picker.addEventListener('change', () => goToPage(Number(picker.value)));
    root.querySelector('.viewer-retry').addEventListener('click', () => selectDocument(active));
    stage.addEventListener('keydown', event => {
      const change = {ArrowLeft:pageIndex - 1, ArrowRight:pageIndex + 1, Home:0, End:pages.length - 1};
      if (!Object.hasOwn(change, event.key) || !pages.length) return;
      event.preventDefault();
      renderPage(change[event.key]);
    });
    stage.addEventListener('pointerdown', event => {
      if (event.target.closest('button, select, input, a')) return;
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
    return () => {
      disposed = true;requestVersion++;pointerStart = null;
      scroller.removeEventListener('scroll', followPaperScroll);
      if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
    };
  }

  window.ProjectViewer = {markup, mount};
})();
