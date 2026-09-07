(() => {
  const random = () => {
    if (globalThis.crypto?.getRandomValues) {
      const value = new Uint32Array(1);
      crypto.getRandomValues(value);
      return value[0] / 4294967296;
    }
    return Math.random();
  };
  const pick = items => items[Math.floor(random() * items.length)];
  const titleCase = value => String(value || '').replace(/(^|[-\s])([a-z])/g, (_, lead, char) => lead + char.toUpperCase());

  function initTrial() {
    const root = document.querySelector('[data-slop-trial]');
    const dataNode = document.getElementById('slop-trial-data');
    if (!root || !dataNode) return;
    const all = JSON.parse(dataNode.textContent || '[]');
    const name = root.querySelector('[data-trial-name]');
    const prompt = root.querySelector('[data-trial-prompt]');
    const freshness = root.querySelector('[data-trial-freshness]');
    const source = root.querySelector('[data-trial-source]');
    const categoryLabel = root.querySelector('[data-trial-category-label]');
    const dateLabel = root.querySelector('[data-trial-date-label]');
    const whyWrap = root.querySelector('[data-trial-why-wrap]');
    const why = root.querySelector('[data-trial-why]');
    const image = root.querySelector('[data-trial-image]');
    const imageFallback = root.querySelector('[data-trial-image-fallback]');
    const imageCategory = root.querySelector('[data-trial-image-category]');
    const imageName = root.querySelector('[data-trial-image-name]');
    const result = root.querySelector('[data-trial-result]');
    const meter = root.querySelector('[data-trial-meter]');
    const status = root.querySelector('[data-trial-status]');
    const yes = root.querySelector('[data-vote="yes"]');
    const no = root.querySelector('[data-vote="no"]');
    const next = root.querySelector('[data-trial-next]');
    const share = root.querySelector('[data-trial-share]');
    const progress = root.querySelector('[data-trial-progress]');
    const modeButtons = [...root.querySelectorAll('[data-trial-mode]')];
    const categoryNav = root.querySelector('[data-trial-categories]');
    const queue = root.querySelector('[data-trial-queue]');
    const disputedWrap = root.querySelector('[data-trial-disputed-wrap]');
    const disputed = root.querySelector('[data-trial-disputed]');
    let mode = 'current';
    let selectedCategory = 'all';
    let current = null;
    let currentSummary = null;
    const summaries = new Map();

    const date = new Date().toISOString().slice(0, 10);
    const isCurrent = item => item.kind === 'current' && (!item.activeFrom || item.activeFrom <= date) && (!item.activeUntil || item.activeUntil >= date);
    const currentItems = all.filter(isCurrent);
    const classicItems = all.filter(item => item.kind === 'evergreen');
    if (!currentItems.length) mode = 'classics';
    const savedVote = id => localStorage.getItem(`foidslop:trial:${id}`);
    const displayCategory = value => value === 'television' ? 'TV' : titleCase(value);
    const modeItems = () => mode === 'current' ? currentItems : classicItems;
    const pool = () => {
      const base = modeItems();
      if (selectedCategory === 'all') return base;
      const filtered = base.filter(item => item.category === selectedCategory);
      return filtered.length ? filtered : base;
    };
    const itemUrl = item => `${location.origin}/culture/is-it-foidslop/${encodeURIComponent(item.id)}`;

    function setPressed() {
      modeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.trialMode === mode)));
      [...root.querySelectorAll('[data-trial-category]')].forEach(button => button.setAttribute('aria-pressed', String(button.dataset.trialCategory === selectedCategory)));
    }

    function renderCategories() {
      if (!categoryNav) return;
      const available = [...new Set(modeItems().map(item => item.category))].sort();
      if (selectedCategory !== 'all' && !available.includes(selectedCategory)) selectedCategory = 'all';
      categoryNav.innerHTML = '';
      for (const value of ['all', ...available]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.trialCategory = value;
        button.textContent = value === 'all' ? 'All' : displayCategory(value);
        button.setAttribute('aria-pressed', String(value === selectedCategory));
        button.addEventListener('click', () => {
          selectedCategory = value;
          setPressed();
          render(pool()[0]);
        });
        categoryNav.appendChild(button);
      }
    }

    function updateProgress() {
      if (!progress) return;
      const voted = currentItems.filter(item => savedVote(item.id)).length;
      progress.textContent = `${voted} of ${currentItems.length} current item${currentItems.length === 1 ? '' : 's'} voted`;
    }

    function fallbackMarkup(item) {
      return `<span class="slop-feed-fallback"><small>${displayCategory(item.category)}</small><strong>${item.name}</strong></span>`;
    }

    function cardMarkup(item) {
      const summary = summaries.get(item.id);
      const consensus = summary?.total ? `<span class="slop-feed-consensus">${summary.percentYes}% yes · ${summary.total}</span>` : '<span class="slop-feed-consensus">Vote</span>';
      const visual = item.image
        ? `<span class="slop-feed-visual"><img src="${item.image}" alt="" width="480" height="320" loading="lazy" decoding="async">${fallbackMarkup(item)}</span>`
        : `<span class="slop-feed-visual">${fallbackMarkup(item)}</span>`;
      return `${visual}<span class="slop-feed-meta">${displayCategory(item.category)}</span><strong class="slop-feed-title">${item.name}</strong>${consensus}`;
    }

    function wireQueueImageFallbacks() {
      for (const img of queue?.querySelectorAll('img') || []) {
        const fallback = img.nextElementSibling;
        const fail = () => { img.hidden = true; if (fallback) fallback.hidden = false; };
        if (img.complete && !img.naturalWidth) fail();
        else img.addEventListener('error', fail, { once: true });
      }
    }

    function renderQueue() {
      if (!queue) return;
      const items = pool().filter(item => item.id !== current?.id).slice(0, 8);
      queue.innerHTML = '';
      for (const item of items) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.trialQueueItem = item.id;
        button.innerHTML = cardMarkup(item);
        button.addEventListener('click', () => render(item));
        queue.appendChild(button);
      }
      wireQueueImageFallbacks();
    }

    function renderDisputed() {
      if (!disputed || !disputedWrap) return;
      const ranked = currentItems
        .map(item => ({ item, summary: summaries.get(item.id) }))
        .filter(row => row.summary?.total)
        .sort((a, b) => Math.abs(a.summary.percentYes - 50) - Math.abs(b.summary.percentYes - 50) || b.summary.total - a.summary.total)
        .slice(0, 3);
      disputedWrap.hidden = !ranked.length;
      disputed.innerHTML = '';
      for (const row of ranked) {
        const button = document.createElement('button');
        button.type = 'button';
        button.innerHTML = `<span>${displayCategory(row.item.category)}</span><strong>${row.item.name}</strong><b>${row.summary.percentYes}% yes</b><small>${row.summary.total} vote${row.summary.total === 1 ? '' : 's'}</small>`;
        button.addEventListener('click', () => render(row.item));
        disputed.appendChild(button);
      }
    }

    function setResult(summary) {
      currentSummary = summary || { total: 0, percentYes: 0 };
      const percent = Number(currentSummary.percentYes || 0);
      meter.style.width = `${Math.max(0, Math.min(100, percent))}%`;
      result.textContent = currentSummary.total
        ? `${percent}% yes · ${currentSummary.total} vote${currentSummary.total === 1 ? '' : 's'}`
        : 'No votes yet.';
    }

    async function loadAllResults() {
      const ids = currentItems.map(item => item.id);
      if (!ids.length) return;
      try {
        const response = await fetch(`/api/slop-votes?ids=${encodeURIComponent(ids.join(','))}`, { headers: { accept: 'application/json' } });
        const body = await response.json();
        if (!response.ok) throw new Error('unavailable');
        for (const [id, summary] of Object.entries(body)) summaries.set(id, summary);
        if (current && summaries.has(current.id)) setResult(summaries.get(current.id));
        renderQueue();
        renderDisputed();
      } catch {
        // The page still works if aggregate results are temporarily unavailable.
      }
    }

    async function loadResult(id) {
      if (summaries.has(id)) {
        setResult(summaries.get(id));
        return;
      }
      result.textContent = 'Loading result...';
      meter.style.width = '0%';
      try {
        const response = await fetch(`/api/slop-votes?ids=${encodeURIComponent(id)}`, { headers: { accept: 'application/json' } });
        const body = await response.json();
        if (!response.ok || !body[id]) throw new Error('unavailable');
        summaries.set(id, body[id]);
        setResult(body[id]);
      } catch {
        currentSummary = null;
        result.textContent = 'Result unavailable right now.';
      }
    }

    function showFallback(item) {
      image.hidden = true;
      image.removeAttribute('src');
      imageFallback.hidden = false;
      imageCategory.textContent = displayCategory(item.category);
      imageName.textContent = item.name;
    }

    function render(item) {
      if (!item) return;
      current = item;
      name.textContent = item.name;
      prompt.textContent = item.prompt;
      categoryLabel.textContent = displayCategory(item.category);
      const activeCurrent = isCurrent(item);
      freshness.textContent = activeCurrent ? 'Current' : 'Classic';
      dateLabel.textContent = activeCurrent && item.activeFrom ? `Added ${item.activeFrom}` : '';
      if (item.image) {
        image.hidden = false;
        imageFallback.hidden = true;
        image.alt = item.imageAlt || '';
        image.onerror = () => showFallback(item);
        image.src = item.image;
      } else {
        showFallback(item);
      }
      if (activeCurrent && item.sourceUrl) {
        source.hidden = false;
        source.href = item.sourceUrl;
        source.textContent = item.sourceLabel || 'Source';
        whyWrap.hidden = false;
        why.textContent = item.whyNow || '';
      } else {
        source.hidden = true;
        source.removeAttribute('href');
        whyWrap.hidden = true;
        why.textContent = '';
      }
      const prior = savedVote(item.id);
      yes.disabled = Boolean(prior);
      no.disabled = Boolean(prior);
      yes.setAttribute('aria-pressed', String(prior === 'yes'));
      no.setAttribute('aria-pressed', String(prior === 'no'));
      status.textContent = prior ? `You voted ${prior}.` : 'Vote to compare with everyone else.';
      history.replaceState(null, '', itemUrl(item));
      loadResult(item.id);
      updateProgress();
      renderQueue();
    }

    async function vote(value) {
      if (!current || savedVote(current.id)) return;
      yes.disabled = true;
      no.disabled = true;
      status.textContent = 'Saving vote...';
      try {
        const response = await fetch('/api/slop-vote', {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({ id: current.id, vote: value, website: '' })
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'vote failed');
        const saved = body.vote || value;
        localStorage.setItem(`foidslop:trial:${current.id}`, saved);
        yes.setAttribute('aria-pressed', String(saved === 'yes'));
        no.setAttribute('aria-pressed', String(saved === 'no'));
        status.textContent = `You voted ${saved}.`;
        if (body.summary) {
          summaries.set(current.id, body.summary);
          setResult(body.summary);
        }
        updateProgress();
        renderQueue();
        renderDisputed();
      } catch {
        yes.disabled = false;
        no.disabled = false;
        status.textContent = 'Vote failed. Try again.';
      }
    }

    yes.addEventListener('click', () => vote('yes'));
    no.addEventListener('click', () => vote('no'));
    next.addEventListener('click', () => {
      const items = pool();
      const unvoted = items.filter(item => item.id !== current?.id && !savedVote(item.id));
      const choices = unvoted.length ? unvoted : items.filter(item => item.id !== current?.id);
      render(choices[0] || items[0]);
    });
    modeButtons.forEach(button => button.addEventListener('click', () => {
      mode = button.dataset.trialMode;
      selectedCategory = 'all';
      renderCategories();
      setPressed();
      render(pool()[0]);
    }));
    share.addEventListener('click', async () => {
      if (!current) return;
      const url = itemUrl(current);
      const percentage = currentSummary?.total ? `${currentSummary.percentYes}% of readers voted yes.` : '';
      const prior = savedVote(current.id);
      const text = [prior ? `I voted ${prior.toUpperCase()} on ${current.name}.` : `Is ${current.name} foidslop?`, percentage].filter(Boolean).join(' ');
      try {
        if (navigator.share) {
          await navigator.share({ title: `Is ${current.name} foidslop?`, text, url });
        } else {
          await navigator.clipboard.writeText(`${text} ${url}`.trim());
          share.textContent = 'Copied';
          setTimeout(() => { share.textContent = 'Share verdict'; }, 1200);
        }
      } catch (error) {
        if (error?.name !== 'AbortError') share.textContent = 'Share failed';
      }
    });

    const initialId = root.dataset.initialItem || new URLSearchParams(location.search).get('item');
    const requestedItem = all.find(item => item.id === initialId);
    if (requestedItem?.kind === 'evergreen') mode = 'classics';
    renderCategories();
    setPressed();
    render(requestedItem || (currentItems[0] || classicItems[0]));
    loadAllResults();
  }

  function initUsernameGenerator() {
    const root = document.querySelector('[data-username-generator]');
    const dataNode = document.getElementById('username-generator-data');
    if (!root || !dataNode) return;
    const config = JSON.parse(dataNode.textContent || '{}');
    const output = root.querySelector('[data-username-output]');
    const generate = root.querySelector('[data-username-generate]');
    const copy = root.querySelector('[data-username-copy]');
    const select = root.querySelector('[data-username-category]');
    const tabs = [...root.querySelectorAll('[data-username-tab]')];
    const variants = [...root.querySelectorAll('[data-username-variant]')];
    const departmentLabel = root.querySelector('[data-username-department-label]');
    const keys = Object.keys(config.categories || {});
    let selected = 'mixed';

    function make(categoryKey) {
      const category = config.categories[categoryKey] || config.categories.soft || config.categories[keys[0]];
      const base = pick(category.bases);
      const modifier = pick(category.modifiers);
      const suffix = pick(category.suffixes);
      if (categoryKey === '2009') {
        return pick([`xX${base}Xx`, `${modifier}${base}${suffix}`, `${base}${suffix}`, `x_${base}_${suffix}`]).replace(/\s+/g, '').toLowerCase();
      }
      return pick([`${modifier}${base}`, `${base}${suffix}`, `${modifier}${base}${random() > .72 ? suffix : ''}`, base]).replace(/\s+/g, '').toLowerCase();
    }

    const resolvedKey = () => selected === 'mixed' ? pick(keys) : selected;
    function setOutput(value) {
      output.textContent = value;
      output.dataset.value = value;
      const length = value.length;
      output.dataset.length = length > 19 ? 'very-long' : length > 15 ? 'long' : 'normal';
      if (copy) copy.textContent = 'Copy handle';
    }
    function reroll() {
      const key = resolvedKey();
      setOutput(make(key));
      if (departmentLabel) departmentLabel.textContent = selected === 'mixed' ? 'Mixed department' : `${config.categories[selected]?.label || titleCase(selected)} department`;
      variants.forEach(button => { button.textContent = make(selected === 'mixed' ? pick(keys) : selected); });
    }
    function choose(key) {
      selected = key;
      tabs.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.usernameTab === key)));
      if (select) select.value = key;
      reroll();
    }

    tabs.forEach(button => button.addEventListener('click', () => choose(button.dataset.usernameTab)));
    if (select) select.addEventListener('change', () => choose(select.value));
    variants.forEach(button => button.addEventListener('click', () => setOutput(button.textContent.trim())));
    generate?.addEventListener('click', reroll);
    copy?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(output.dataset.value || output.textContent);
        copy.textContent = 'Copied';
      } catch { copy.textContent = 'Select it'; }
    });
    choose(tabs.find(button => button.getAttribute('aria-pressed') === 'true')?.dataset.usernameTab || select?.value || 'mixed');
  }

  initTrial();
  initUsernameGenerator();
})();
