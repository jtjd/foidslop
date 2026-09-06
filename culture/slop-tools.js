(() => {
  const pick = items => items[Math.floor(random() * items.length)];
  const random = () => {
    if (globalThis.crypto?.getRandomValues) {
      const value = new Uint32Array(1);
      crypto.getRandomValues(value);
      return value[0] / 4294967296;
    }
    return Math.random();
  };

  function initTrial() {
    const root = document.querySelector('[data-slop-trial]');
    const dataNode = document.getElementById('slop-trial-data');
    if (!root || !dataNode) return;
    const all = JSON.parse(dataNode.textContent || '[]');
    const name = root.querySelector('[data-trial-name]');
    const category = root.querySelector('[data-trial-category]');
    const prompt = root.querySelector('[data-trial-prompt]');
    const result = root.querySelector('[data-trial-result]');
    const status = root.querySelector('[data-trial-status]');
    const yes = root.querySelector('[data-vote="yes"]');
    const no = root.querySelector('[data-vote="no"]');
    const next = root.querySelector('[data-trial-next]');
    const share = root.querySelector('[data-trial-share]');
    const filter = root.querySelector('[data-trial-filter]');
    let current = null;

    const eligible = () => filter.value === 'all' ? all : all.filter(item => item.category === filter.value);
    const savedVote = id => localStorage.getItem(`foidslop:trial:${id}`);

    async function loadResult(id) {
      result.textContent = 'Checking the jury...';
      try {
        const response = await fetch(`/api/slop-votes?ids=${encodeURIComponent(id)}`, { headers: { accept: 'application/json' } });
        const body = await response.json();
        const summary = body[id];
        if (!response.ok || !summary) throw new Error('unavailable');
        result.textContent = summary.total
          ? `Community verdict: ${summary.percentYes}% foidslop · ${summary.total} vote${summary.total === 1 ? '' : 's'}`
          : 'Community verdict: no votes yet. Be useful.';
      } catch {
        result.textContent = 'Community verdict is unavailable right now.';
      }
    }

    function render(item) {
      current = item;
      name.textContent = item.name;
      category.textContent = item.category;
      prompt.textContent = item.prompt;
      const prior = savedVote(item.id);
      yes.disabled = Boolean(prior);
      no.disabled = Boolean(prior);
      status.textContent = prior ? `You voted ${prior.toUpperCase()}.` : 'Cast judgment.';
      const url = new URL(location.href);
      url.searchParams.set('item', item.id);
      history.replaceState(null, '', url);
      loadResult(item.id);
    }

    async function vote(value) {
      if (!current || savedVote(current.id)) return;
      yes.disabled = true;
      no.disabled = true;
      status.textContent = 'Filing vote...';
      try {
        const response = await fetch('/api/slop-vote', {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({ id: current.id, vote: value, website: '' })
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'vote failed');
        localStorage.setItem(`foidslop:trial:${current.id}`, body.vote || value);
        status.textContent = body.duplicate ? `Already filed as ${(body.vote || value).toUpperCase()}.` : `You voted ${value.toUpperCase()}.`;
        const summary = body.summary;
        if (summary) result.textContent = summary.total
          ? `Community verdict: ${summary.percentYes}% foidslop · ${summary.total} vote${summary.total === 1 ? '' : 's'}`
          : 'Community verdict: no votes yet.';
      } catch {
        yes.disabled = false;
        no.disabled = false;
        status.textContent = 'Vote failed. The jury remains corruptible.';
      }
    }

    yes.addEventListener('click', () => vote('yes'));
    no.addEventListener('click', () => vote('no'));
    next.addEventListener('click', () => {
      const pool = eligible().filter(item => item.id !== current?.id);
      render(pick(pool.length ? pool : eligible()));
    });
    filter.addEventListener('change', () => render(pick(eligible())));
    share.addEventListener('click', async () => {
      const url = location.href;
      try {
        await navigator.clipboard.writeText(url);
        share.textContent = 'Copied';
        setTimeout(() => { share.textContent = 'Copy trial link'; }, 1200);
      } catch { location.hash = 'copy-failed'; }
    });

    const requested = new URLSearchParams(location.search).get('item');
    render(all.find(item => item.id === requested) || all[0]);
  }

  function initUsernameGenerator() {
    const root = document.querySelector('[data-username-generator]');
    const dataNode = document.getElementById('username-generator-data');
    if (!root || !dataNode) return;
    const config = JSON.parse(dataNode.textContent || '{}');
    const select = root.querySelector('[data-username-category]');
    const output = root.querySelector('[data-username-output]');
    const generate = root.querySelector('[data-username-generate]');
    const copy = root.querySelector('[data-username-copy]');

    function make(categoryKey) {
      const category = config.categories[categoryKey] || config.categories.soft;
      const base = pick(category.bases);
      const modifier = pick(category.modifiers);
      const suffix = pick(category.suffixes);
      if (categoryKey === '2009') {
        const forms = [`xX${base}Xx`, `${modifier}${base}${suffix}`, `${base}${suffix}`, `x_${base}_${suffix}`];
        return pick(forms).replace(/\s+/g, '').toLowerCase();
      }
      const forms = [
        `${modifier}${base}`,
        `${base}${suffix}`,
        `${modifier}${base}${random() > .72 ? suffix : ''}`,
        base
      ];
      return pick(forms).replace(/\s+/g, '').toLowerCase();
    }

    function reroll() {
      const key = select.value === 'mixed' ? pick(Object.keys(config.categories)) : select.value;
      output.textContent = make(key);
      output.dataset.value = output.textContent;
      copy.textContent = 'Copy';
    }

    generate.addEventListener('click', reroll);
    select.addEventListener('change', reroll);
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(output.dataset.value || output.textContent);
        copy.textContent = 'Copied';
      } catch { copy.textContent = 'Select it'; }
    });
    reroll();
  }

  initTrial();
  initUsernameGenerator();
})();
