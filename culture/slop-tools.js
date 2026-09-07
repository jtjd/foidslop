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
    const category = root.querySelector('[data-trial-category]');
    const prompt = root.querySelector('[data-trial-prompt]');
    const freshness = root.querySelector('[data-trial-freshness]');
    const source = root.querySelector('[data-trial-source]');
    const whyWrap = root.querySelector('[data-trial-why-wrap]');
    const why = root.querySelector('[data-trial-why]');
    const result = root.querySelector('[data-trial-result]');
    const meter = root.querySelector('[data-trial-meter]');
    const status = root.querySelector('[data-trial-status]');
    const yes = root.querySelector('[data-vote="yes"]');
    const no = root.querySelector('[data-vote="no"]');
    const next = root.querySelector('[data-trial-next]');
    const share = root.querySelector('[data-trial-share]');
    const filter = root.querySelector('[data-trial-filter]');
    const modeButtons = [...root.querySelectorAll('[data-trial-mode]')];
    const queue = root.querySelector('[data-trial-queue]');
    let mode = 'current';
    let current = null;

    const date = new Date().toISOString().slice(0, 10);
    const isCurrent = item => item.kind === 'current' && (!item.activeFrom || item.activeFrom <= date) && (!item.activeUntil || item.activeUntil >= date);
    const currentItems = all.filter(isCurrent);
    if (!currentItems.length) mode = 'all';

    const pool = () => {
      let items = mode === 'current' ? currentItems : all;
      if (filter.value !== 'all') items = items.filter(item => item.category === filter.value);
      if (!items.length && mode === 'current') items = currentItems;
      if (!items.length) items = all;
      return items;
    };
    const savedVote = id => localStorage.getItem(`foidslop:trial:${id}`);
    const setModeButtons = () => modeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.trialMode === mode)));

    function dailyPick(items) {
      if (!items.length) return null;
      const seed = date.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      return items[seed % items.length];
    }

    function renderQueue() {
      if (!queue) return;
      const candidates = currentItems.filter(item => item.id !== current?.id).slice(0, 4);
      queue.innerHTML = '';
      for (const item of candidates) {
        const button = document.createElement('button');
        button.type = 'button';
        button.innerHTML = `<span>${titleCase(item.category)}</span><strong>${item.name}</strong>`;
        button.addEventListener('click', () => render(item));
        queue.appendChild(button);
      }
      queue.closest('.slop-trial-on-deck')?.toggleAttribute('hidden', !candidates.length);
    }

    function setResult(summary) {
      const percent = Number(summary?.percentYes || 0);
      meter.style.width = `${Math.max(0, Math.min(100, percent))}%`;
      result.textContent = summary?.total
        ? `Community: ${percent}% yes · ${summary.total} vote${summary.total === 1 ? '' : 's'}`
        : 'No votes yet.';
    }

    async function loadResult(id) {
      result.textContent = 'Loading community result...';
      meter.style.width = '0%';
      try {
        const response = await fetch(`/api/slop-votes?ids=${encodeURIComponent(id)}`, { headers: { accept: 'application/json' } });
        const body = await response.json();
        if (!response.ok || !body[id]) throw new Error('unavailable');
        setResult(body[id]);
      } catch {
        result.textContent = 'Community result unavailable.';
      }
    }

    function render(item) {
      if (!item) return;
      current = item;
      name.textContent = item.name;
      category.textContent = titleCase(item.category);
      prompt.textContent = item.prompt;
      const activeCurrent = isCurrent(item);
      freshness.textContent = activeCurrent ? 'Current' : 'Classic';
      freshness.dataset.kind = activeCurrent ? 'current' : 'classic';
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
      status.textContent = prior ? `Your vote: ${prior.toUpperCase()}.` : 'Vote once per item.';
      const url = new URL(location.href);
      url.searchParams.set('item', item.id);
      history.replaceState(null, '', url);
      loadResult(item.id);
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
        status.textContent = `Your vote: ${saved.toUpperCase()}.`;
        if (body.summary) setResult(body.summary);
      } catch {
        yes.disabled = false;
        no.disabled = false;
        status.textContent = 'Vote failed. Try again.';
      }
    }

    yes.addEventListener('click', () => vote('yes'));
    no.addEventListener('click', () => vote('no'));
    next.addEventListener('click', () => {
      const choices = pool().filter(item => item.id !== current?.id);
      render(pick(choices.length ? choices : pool()));
    });
    filter.addEventListener('change', () => render(dailyPick(pool())));
    modeButtons.forEach(button => button.addEventListener('click', () => {
      mode = button.dataset.trialMode;
      if (mode === 'current' && !currentItems.length) mode = 'all';
      setModeButtons();
      filter.value = 'all';
      render(dailyPick(pool()));
    }));
    share.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        share.textContent = 'Copied';
        setTimeout(() => { share.textContent = 'Copy link'; }, 1200);
      } catch { share.textContent = 'Copy failed'; }
    });

    setModeButtons();
    const requested = new URLSearchParams(location.search).get('item');
    const requestedItem = all.find(item => item.id === requested);
    if (requestedItem && !isCurrent(requestedItem)) mode = 'all';
    setModeButtons();
    render(requestedItem || dailyPick(currentItems.length ? currentItems : all));
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
