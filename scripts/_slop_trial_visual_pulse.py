from pathlib import Path
import json, re

ROOT = Path('.')

# 1) Curate visuals. Keep only images that actually depict the item. Every item
# still gets a unique generated social card in the next workflow step.
data_path = ROOT / 'data/slop-trials.json'
data = json.loads(data_path.read_text())
bad_visuals = {
    'preppy-revival-2026',
    'yesteryear',
    'once-upon-a-broken-heart',
    'devil-wears-prada-2',
    'bridgerton-season-4',
    'earle-meets-world',
}
for item in data['items']:
    if item['id'] in bad_visuals:
        item.pop('image', None)
        item.pop('imageAlt', None)
        stale = ROOT / 'culture' / 'trials' / f"{item['id']}.webp"
        if stale.exists():
            stale.unlink()
    item['socialImage'] = f"/culture/trials/social/{item['id']}.png"
data_path.write_text(json.dumps(data, indent=2) + '\n')

# 2) Rebuild the publisher contract around static share URLs and a compact board.
publisher_path = ROOT / 'scripts/publish-culture-products.js'
publisher = publisher_path.read_text()
publisher = publisher.replace(
    "for (const field of ['whyNow', 'sourceLabel', 'sourceUrl', 'activeFrom', 'activeUntil', 'image', 'imageAlt']) if (!String(item[field] || '').trim()) errors.push(`Slop Trial ${item.id}: missing current field ${field}`);\n      if (item.image && !fs.existsSync(path.join(ROOT, item.image.replace(/^\\//, '')))) errors.push(`Slop Trial ${item.id}: missing visual asset ${item.image}`);",
    "for (const field of ['whyNow', 'sourceLabel', 'sourceUrl', 'activeFrom', 'activeUntil', 'socialImage']) if (!String(item[field] || '').trim()) errors.push(`Slop Trial ${item.id}: missing current field ${field}`);\n      if (item.image && !String(item.imageAlt || '').trim()) errors.push(`Slop Trial ${item.id}: visual needs alt text`);\n      if (item.image && !fs.existsSync(path.join(ROOT, item.image.replace(/^\\//, '')))) errors.push(`Slop Trial ${item.id}: missing visual asset ${item.image}`);\n      if (item.socialImage && !fs.existsSync(path.join(ROOT, item.socialImage.replace(/^\\//, '')))) errors.push(`Slop Trial ${item.id}: missing social asset ${item.socialImage}`);"
)

new_trial = r'''function renderTrialPage(initialItem = null) {
  const item = initialItem;
  const route = item ? `culture/is-it-foidslop/${item.id}` : 'culture/is-it-foidslop';
  const activeCurrent = trials.items.filter(candidate => candidate.kind === 'current' && (!candidate.activeFrom || candidate.activeFrom <= today) && (!candidate.activeUntil || candidate.activeUntil >= today));
  const currentCount = activeCurrent.length || trials.items.filter(candidate => candidate.kind === 'current').length;
  const classicCount = trials.items.filter(candidate => candidate.kind === 'evergreen').length;
  const title = item ? `Is ${item.name} foidslop? | foidslop` : 'Is It Foidslop?';
  const description = item
    ? `${item.prompt} Vote yes or no and see the live split.`
    : `${currentCount} things from this week's feed. Vote yes or no. See the split.`;
  const socialImage = item?.socialImage ? `${BASE_URL}${item.socialImage}` : `${BASE_URL}/og-image.png`;
  const schema = [
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: item ? `Is ${item.name} foidslop?` : 'Is It Foidslop?', applicationCategory: 'EntertainmentApplication', operatingSystem: 'Any', url: canonical(route), description },
    breadcrumb(route, item ? `Is ${item.name} foidslop?` : 'Is It Foidslop?')
  ];
  const revisionLabel = new Date(`${trials.revisionDate}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const currentCategories = [...new Set(activeCurrent.map(candidate => candidate.category))].sort();
  let pageHead = head(route, title, description, schema, socialImage)
    .replace('</head>', '<link rel="stylesheet" href="/css/culture-showcase.css?v=20260907-1">\n</head>');
  if (item) pageHead = pageHead.replace('content="index,follow,max-image-preview:large"', 'content="noindex,follow,max-image-preview:large"');
  const initialCategories = ['all', ...currentCategories];
  const categoryButtons = initialCategories.map((value, index) => `<button type="button" data-trial-category="${esc(value)}" aria-pressed="${index === 0 ? 'true' : 'false'}">${esc(value === 'all' ? 'All' : value === 'television' ? 'TV' : value[0].toUpperCase() + value.slice(1))}</button>`).join('');
  return `${pageHead}${header(route)}<main id="main" class="slop-trial-page"><header class="slop-trial-hero"><p class="content-eyebrow">Current culture / updated ${esc(revisionLabel)}</p><h1>Is it foidslop?</h1><p class="article-deck">${currentCount} things from this week's feed. Vote yes or no. See the split.</p></header><section class="slop-trial-shell" data-slop-trial data-initial-item="${esc(item?.id || '')}"><div class="slop-trial-nav"><div class="slop-trial-modes" role="group" aria-label="Trial set"><button type="button" data-trial-mode="current" aria-pressed="true">Current</button><button type="button" data-trial-mode="classics" aria-pressed="false">Classics</button></div><nav class="slop-trial-categories" data-trial-categories aria-label="Trial categories">${categoryButtons}</nav></div><div class="slop-trial-progress"><span data-trial-progress>0 of ${currentCount} current items voted</span><span>Live reader split</span></div><article class="slop-trial-card"><figure class="slop-trial-media"><img data-trial-image src="" alt="" width="960" height="640" decoding="async"><div class="slop-trial-media-fallback" data-trial-image-fallback hidden><span data-trial-image-category></span><strong data-trial-image-name></strong></div><figcaption><span data-trial-freshness></span><a data-trial-source href="#" target="_blank" rel="noopener" hidden></a></figcaption></figure><div class="slop-trial-panel"><div class="slop-trial-meta"><span data-trial-category-label></span><span data-trial-date-label></span></div><h2 data-trial-name></h2><p class="slop-trial-prompt" data-trial-prompt></p><div class="slop-trial-why" data-trial-why-wrap hidden><span>Why now</span><p data-trial-why></p></div><div class="slop-trial-vote"><div class="slop-trial-question">Is it foidslop?</div><div class="slop-vote-buttons"><button type="button" data-vote="yes">Yes</button><button type="button" data-vote="no">No</button></div><p class="slop-trial-status" data-trial-status aria-live="polite"></p><div class="slop-trial-result-row"><strong data-trial-result aria-live="polite"></strong><div class="slop-trial-meter" aria-hidden="true"><span data-trial-meter></span></div></div></div><div class="slop-trial-actions"><button class="slop-next" type="button" data-trial-next>Next</button><button type="button" data-trial-share>Share verdict</button></div></div></article><section class="slop-trial-feed"><div class="slop-trial-section-head"><div><span>This week</span><h2>Current board.</h2></div><p>Pick anything below. Your votes stay on this browser.</p></div><div class="slop-trial-feed-grid" data-trial-queue></div></section><section class="slop-trial-disputed" data-trial-disputed-wrap hidden><div class="slop-trial-section-head"><div><span>Closest calls</span><h2>Near 50/50.</h2></div><p>The least settled current votes.</p></div><div class="slop-trial-disputed-grid" data-trial-disputed></div></section></section><section class="slop-trial-links culture-tool-links"><a href="/culture/slop-index"><strong>Media Index</strong><span>Staff scores for the classics.</span></a><a href="/culture/slop-taxonomy"><strong>Slop Taxonomy</strong><span>Where the categories fit.</span></a><a href="/culture/username-generator"><strong>Username Generator</strong><span>Make a foidslop handle.</span></a></section></main>${scriptData('slop-trial-data', trials.items)}<script src="/culture/slop-tools.js?v=20260907-1" defer></script>${footer(route)}`;
}'''

publisher, count = re.subn(r"function renderTrialPage\(\) \{[\s\S]*?\n\}\n\nfunction renderUsernamePage\(\)", lambda m: new_trial + "\n\nfunction renderUsernamePage()", publisher, count=1)
if count != 1:
    raise SystemExit('failed to replace renderTrialPage')

publisher = publisher.replace('culture/is-it-foidslop?item=${trial.id}', 'culture/is-it-foidslop/${trial.id}')

old_routes = "const routes = ['culture/is-it-foidslop', 'culture/username-generator', 'culture/slop-taxonomy', 'about'];"
first = publisher.find(old_routes)
second = publisher.find(old_routes, first + 1)
if second < 0:
    raise SystemExit('failed to find redirect routes block')
new_routes = "const routes = ['culture/is-it-foidslop', ...trials.items.map(item => `culture/is-it-foidslop/${item.id}`), 'culture/username-generator', 'culture/slop-taxonomy', 'about'];"
publisher = publisher[:second] + publisher[second:].replace(old_routes, new_routes, 1)

publisher = publisher.replace(
    "for (const file of required) if (!fs.existsSync(path.join(ROOT, file))) throw new Error(`Missing generated culture product: ${file}`);",
    "for (const file of required) if (!fs.existsSync(path.join(ROOT, file))) throw new Error(`Missing generated culture product: ${file}`);\n  for (const item of trials.items) if (!fs.existsSync(path.join(ROOT, `culture/is-it-foidslop/${item.id}.html`))) throw new Error(`Missing generated Slop Trial share page: ${item.id}`);"
)
publisher = publisher.replace(
    "write('culture/is-it-foidslop.html', renderTrialPage());",
    "write('culture/is-it-foidslop.html', renderTrialPage());\nfor (const item of trials.items) write(`culture/is-it-foidslop/${item.id}.html`, renderTrialPage(item));"
)
publisher_path.write_text(publisher)

# 3) Replace the Slop Trial runtime. Static URLs become the product's share URLs,
# filters only show categories that have items, and image errors fall back cleanly.
script_path = ROOT / 'culture/slop-tools.js'
script = script_path.read_text()
new_init = r'''function initTrial() {
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
  }'''

script, count = re.subn(r"function initTrial\(\) \{[\s\S]*?\n  \}\n\n  function initUsernameGenerator\(\)", lambda m: new_init + "\n\n  function initUsernameGenerator()", script, count=1)
if count != 1:
    raise SystemExit('failed to replace initTrial')
script_path.write_text(script)

# 4) Add final responsive product styling as an override layer.
css_path = ROOT / 'css/culture-showcase.css'
css = css_path.read_text()
css = re.sub(r"\n?/\* slop-trial-final:start \*/[\s\S]*?/\* slop-trial-final:end \*/\n?", '\n', css)
css += r'''

/* slop-trial-final:start */
.slop-trial-hero{display:block!important;min-height:0!important;padding:64px 42px 34px!important;border-bottom:1px solid var(--border)!important}
.slop-trial-hero h1{max-width:900px!important;margin:8px 0 12px!important;font:900 clamp(4rem,8vw,8rem)/.82 Arial Black,Arial,sans-serif!important;letter-spacing:-.075em!important;text-transform:uppercase!important}
.slop-trial-hero .article-deck{max-width:720px!important;margin:0!important;font-size:clamp(1rem,1.45vw,1.28rem)!important;line-height:1.5!important}
.slop-trial-hero-stats{display:none!important}
.slop-trial-shell{padding:24px 42px 0!important}
.slop-trial-nav{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:18px!important;margin:0 0 12px!important}
.slop-trial-modes,.slop-trial-categories{display:flex!important;align-items:center!important;gap:7px!important;min-width:0!important}
.slop-trial-categories{overflow-x:auto!important;overscroll-behavior-inline:contain!important;scrollbar-width:none!important}
.slop-trial-categories::-webkit-scrollbar{display:none!important}
.slop-trial-modes button,.slop-trial-categories button{flex:0 0 auto!important;padding:9px 12px!important;border:1px solid var(--border)!important;background:transparent!important;color:var(--text)!important;font:700 9px/1 Inter,sans-serif!important;letter-spacing:.09em!important;text-transform:uppercase!important;cursor:pointer!important}
.slop-trial-modes button[aria-pressed="true"],.slop-trial-categories button[aria-pressed="true"]{background:var(--text)!important;color:var(--bg)!important;border-color:var(--text)!important}
.slop-trial-progress{display:flex!important;justify-content:space-between!important;gap:18px!important;margin:0 0 12px!important;padding:0!important;color:var(--muted)!important;font:700 9px/1.3 Inter,sans-serif!important;letter-spacing:.09em!important;text-transform:uppercase!important}
.slop-trial-card{display:grid!important;grid-template-columns:minmax(0,1.15fr) minmax(330px,.85fr)!important;align-items:start!important;min-height:0!important;padding:0!important;border:1px solid var(--border)!important;background:var(--surface)!important;overflow:hidden!important}
.slop-trial-media{display:block!important;min-width:0!important;min-height:0!important;margin:0!important;border-right:1px solid var(--border)!important;background:var(--image-bg)!important}
.slop-trial-media>img{display:block!important;width:100%!important;height:auto!important;aspect-ratio:3/2!important;object-fit:cover!important;background:var(--image-bg)!important}
.slop-trial-media-fallback{display:flex!important;aspect-ratio:3/2!important;min-height:0!important;flex-direction:column!important;justify-content:flex-end!important;padding:30px!important;background:linear-gradient(145deg,color-mix(in srgb,var(--accent) 16%,var(--surface)),var(--surface) 58%)!important;color:var(--text)!important}
.slop-trial-media-fallback[hidden]{display:none!important}
.slop-trial-media-fallback span{margin-bottom:12px!important;color:var(--accent)!important;font:700 9px/1 Inter,sans-serif!important;letter-spacing:.12em!important;text-transform:uppercase!important}
.slop-trial-media-fallback strong{max-width:92%!important;font:900 clamp(2rem,4vw,4.6rem)/.9 Arial Black,Arial,sans-serif!important;letter-spacing:-.055em!important;text-transform:uppercase!important}
.slop-trial-media figcaption{display:flex!important;justify-content:space-between!important;gap:12px!important;min-height:36px!important;padding:11px 14px!important;border-top:1px solid var(--border)!important;color:var(--muted)!important;font:700 8px/1.25 Inter,sans-serif!important;letter-spacing:.08em!important;text-transform:uppercase!important}
.slop-trial-media figcaption a{color:inherit!important}
.slop-trial-panel{display:block!important;min-height:0!important;padding:30px 30px 28px!important;background:var(--surface)!important}
.slop-trial-meta{display:flex!important;justify-content:space-between!important;gap:12px!important;color:var(--muted)!important;font:700 9px/1.25 Inter,sans-serif!important;letter-spacing:.09em!important;text-transform:uppercase!important}
.slop-trial-panel h2{max-width:620px!important;margin:18px 0 16px!important;font:900 clamp(2.4rem,4.5vw,5.2rem)/.88 Arial Black,Arial,sans-serif!important;letter-spacing:-.06em!important;text-transform:none!important;overflow-wrap:anywhere!important}
.slop-trial-prompt{max-width:620px!important;margin:0!important;color:var(--text)!important;font:1rem/1.55 Georgia,serif!important}
.slop-trial-why{max-width:620px!important;margin:24px 0 0!important;padding:18px 0 0!important;border-top:1px solid var(--border)!important}
.slop-trial-why span{display:block!important;margin-bottom:7px!important;color:var(--accent)!important;font:700 9px/1 Inter,sans-serif!important;letter-spacing:.1em!important;text-transform:uppercase!important}
.slop-trial-why p{margin:0!important;color:var(--muted)!important;font-size:.9rem!important;line-height:1.5!important}
.slop-trial-vote{margin:30px 0 0!important;padding:24px 0 0!important;border-top:1px solid var(--border)!important}
.slop-trial-question{margin:0 0 12px!important;font:900 clamp(1.6rem,2.6vw,2.6rem)/.95 Arial Black,Arial,sans-serif!important;letter-spacing:-.045em!important}
.slop-vote-buttons{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important}
.slop-vote-buttons button{min-height:58px!important;font-size:1rem!important}
.slop-trial-result-row{margin-top:11px!important}
.slop-trial-actions{display:flex!important;gap:8px!important;margin-top:18px!important}
.slop-trial-actions button{margin:0!important}
.slop-trial-feed,.slop-trial-disputed{margin-top:54px!important}
.slop-trial-section-head{display:flex!important;align-items:end!important;justify-content:space-between!important;gap:28px!important;margin-bottom:16px!important}
.slop-trial-section-head span{display:block!important;margin-bottom:7px!important;color:var(--accent)!important;font:700 9px/1 Inter,sans-serif!important;letter-spacing:.1em!important;text-transform:uppercase!important}
.slop-trial-section-head h2{margin:0!important;font:900 clamp(2.1rem,4vw,4rem)/.9 Arial Black,Arial,sans-serif!important;letter-spacing:-.055em!important;text-transform:uppercase!important}
.slop-trial-section-head p{max-width:420px!important;margin:0!important;color:var(--muted)!important;font-size:.85rem!important;line-height:1.45!important;text-align:right!important}
.slop-trial-feed-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;border-top:1px solid var(--border)!important;border-left:1px solid var(--border)!important}
.slop-trial-feed-grid>button{min-width:0!important;padding:0 0 16px!important;border:0!important;border-right:1px solid var(--border)!important;border-bottom:1px solid var(--border)!important;background:var(--surface)!important;color:var(--text)!important;text-align:left!important;cursor:pointer!important}
.slop-feed-visual{position:relative!important;display:block!important;aspect-ratio:4/3!important;overflow:hidden!important;border-bottom:1px solid var(--border)!important;background:var(--image-bg)!important}
.slop-feed-visual img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important}
.slop-feed-fallback{position:absolute!important;inset:0!important;display:flex!important;flex-direction:column!important;justify-content:flex-end!important;padding:18px!important;background:linear-gradient(145deg,color-mix(in srgb,var(--accent) 14%,var(--surface)),var(--surface) 62%)!important}
.slop-feed-visual img:not([hidden]) + .slop-feed-fallback{visibility:hidden!important}
.slop-feed-fallback small{margin-bottom:8px!important;color:var(--accent)!important;font:700 8px/1 Inter,sans-serif!important;letter-spacing:.1em!important;text-transform:uppercase!important}
.slop-feed-fallback strong{font:900 clamp(1.15rem,2vw,2rem)/.92 Arial Black,Arial,sans-serif!important;letter-spacing:-.045em!important;text-transform:uppercase!important}
.slop-feed-meta,.slop-feed-title,.slop-feed-consensus{display:block!important;margin-inline:16px!important}
.slop-feed-meta{margin-top:14px!important;color:var(--accent)!important;font:700 8px/1 Inter,sans-serif!important;letter-spacing:.09em!important;text-transform:uppercase!important}
.slop-feed-title{margin-top:7px!important;font:900 1rem/1.05 Arial Black,Arial,sans-serif!important;overflow-wrap:anywhere!important}
.slop-feed-consensus{margin-top:10px!important;color:var(--muted)!important;font:700 8px/1 Inter,sans-serif!important;letter-spacing:.08em!important;text-transform:uppercase!important}
.slop-trial-disputed-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;border:1px solid var(--border)!important}
.slop-trial-disputed-grid button{min-width:0!important;padding:18px!important;border:0!important;border-right:1px solid var(--border)!important;background:var(--surface)!important;color:var(--text)!important;text-align:left!important}
.slop-trial-disputed-grid button:last-child{border-right:0!important}
@media(max-width:900px){
  .slop-trial-card{grid-template-columns:1fr!important}
  .slop-trial-media{border-right:0!important;border-bottom:1px solid var(--border)!important}
  .slop-trial-feed-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}
}
@media(max-width:600px){
  .slop-trial-hero{padding:42px 18px 26px!important}
  .slop-trial-hero h1{font-size:clamp(3.2rem,15vw,4.8rem)!important}
  .slop-trial-shell{padding:18px 18px 0!important}
  .slop-trial-nav{align-items:stretch!important;flex-direction:column!important;gap:10px!important}
  .slop-trial-progress{font-size:8px!important}
  .slop-trial-progress span:last-child{display:none!important}
  .slop-trial-media-fallback{padding:22px!important}
  .slop-trial-panel{padding:24px 20px 22px!important}
  .slop-trial-panel h2{font-size:clamp(2.25rem,11vw,3.6rem)!important}
  .slop-trial-section-head{align-items:start!important;flex-direction:column!important;gap:8px!important}
  .slop-trial-section-head p{text-align:left!important}
  .slop-trial-feed-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
  .slop-feed-fallback{padding:12px!important}
  .slop-feed-fallback strong{font-size:clamp(.92rem,4.4vw,1.2rem)!important}
  .slop-feed-meta,.slop-feed-title,.slop-feed-consensus{margin-inline:10px!important}
  .slop-feed-title{font-size:.82rem!important}
  .slop-trial-disputed-grid{grid-template-columns:1fr!important}
  .slop-trial-disputed-grid button{border-right:0!important;border-bottom:1px solid var(--border)!important}
  .slop-trial-disputed-grid button:last-child{border-bottom:0!important}
}
/* slop-trial-final:end */
'''
css_path.write_text(css)

# 5) Trial HTML is live data. Item pages are also no-cache so share URLs do not
# get stuck on stale generated markup.
headers_path = ROOT / '_headers'
headers = headers_path.read_text()
if '/culture/is-it-foidslop/*' not in headers:
    headers += '\n/culture/is-it-foidslop/*\n  Cache-Control: no-cache, max-age=0, must-revalidate\n'
headers_path.write_text(headers)

# 6) Update product regression tests to test the product we actually want.
test_path = ROOT / 'test/culture-products.test.js'
test = test_path.read_text()
test = test.replace("assert.match(file('culture/is-it-foidslop.html'), /Vote on the current feed/);", "assert.match(file('culture/is-it-foidslop.html'), /Is it foidslop\?/i);")
if "Slop Trial share pages have item-specific metadata" not in test:
    test += r'''

test('Slop Trial share pages have item-specific metadata', () => {
  for (const item of trials.items) {
    const sharePath = `culture/is-it-foidslop/${item.id}.html`;
    assert.ok(fs.existsSync(path.join(root, sharePath)), `missing ${sharePath}`);
    const html = file(sharePath);
    assert.match(html, new RegExp(`Is ${item.name.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')} foidslop\\?`, 'i'));
    assert.match(html, new RegExp(`culture/trials/social/${item.id}\\.png`));
    assert.match(html, /noindex,follow,max-image-preview:large/);
  }
});

test('current Slop Trial visuals fail closed instead of shipping bad screenshots', () => {
  const byId = new Map(trials.items.map(item => [item.id, item]));
  for (const id of ['preppy-revival-2026','yesteryear','once-upon-a-broken-heart','devil-wears-prada-2','bridgerton-season-4','earle-meets-world']) {
    assert.equal(byId.get(id).image, undefined, `${id} should use the branded fallback until a relevant source image is available`);
  }
  for (const item of trials.items) {
    assert.match(item.socialImage || '', /^\/culture\/trials\/social\/[a-z0-9-]+\.png$/);
    assert.ok(fs.existsSync(path.join(root, item.socialImage.replace(/^\//,''))), `missing social card for ${item.id}`);
  }
});

test('Slop Trial navigation only renders categories that exist in the active set', () => {
  const runtime = file('culture/slop-tools.js');
  assert.match(runtime, /new Set\(modeItems\(\)\.map\(item => item\.category\)\)/);
  assert.match(runtime, /renderCategories\(\)/);
  assert.doesNotMatch(file('culture/is-it-foidslop.html'), /data-trial-category="games"/);
});
'''
test_path.write_text(test)

print('Applied final Slop Trial product fixes.')
