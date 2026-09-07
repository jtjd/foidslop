from pathlib import Path
import json
import re

ROOT = Path('.')

# Rewrite the trial copy around direct, factual context and attach visual slots.
trials_path = ROOT / 'data/slop-trials.json'
trials = json.loads(trials_path.read_text())
copy = {
    'simone-rocha-adidas': (
        'Simone Rocha put lace, pearls, tulle and ribbon details onto Adidas sportswear and shoes. The first collection launches September 10.',
        "Simone Rocha's first Adidas Originals collection launches this week."
    ),
    'tired-girl-eyes': (
        'Smudged eye makeup, visible under-eyes and dark lips are back in fall beauty coverage.',
        "Byrdie included tired-girl eyes in its fall 2026 makeup trend report this week."
    ),
    'adidas-mary-janes': (
        'Adidas sneaker silhouettes with Mary Jane straps are showing up in back-to-school TikTok.',
        'Who What Wear found Adidas Mary Janes repeatedly in a scan of more than 200 back-to-school TikToks.'
    ),
    'ballet-flats-again': (
        'Ballet flats are back in fall celebrity styling.',
        'People highlighted another run of ballet-flat sightings on September 6.'
    ),
    'preppy-revival-2026': (
        'Argyle, roll-necks, micro minis and prep-school references are back in fall fashion.',
        'The Wall Street Journal reported a new preppy push among Gen Z and Gen Alpha as fall starts.'
    ),
    'yesteryear': (
        'A novel about tradwife influencer culture became one of BookTok\'s major 2026 discussion titles.',
        "The Bookseller's September BookTok review singled it out as one of the year's biggest discussion books."
    ),
    'once-upon-a-broken-heart': (
        'Stephanie Garber\'s romantasy series is back near the top of BookTok tracking.',
        'BookTokAI ranked the series first in its September 5 weekly tracking.'
    ),
    'devil-wears-prada-2': (
        'Miranda, Andy and Emily returned for The Devil Wears Prada 2 this summer.',
        'The sequel is still part of the post-summer box-office conversation heading into fall.'
    ),
    'bridgerton-season-4': (
        'Bridgerton season 4 centers Benedict and Sophie and is streaming now.',
        'Netflix says the full season is now available and the season is Emmy-nominated.'
    ),
    'daisy-chain-fields': (
        'Olivia Rodrigo launched an all-female festival in California with Chappell Roan, Doechii, Stevie Nicks, Bikini Kill and more.',
        'The inaugural Daisy Chain Fields festival took place last week and remains in current music coverage.'
    ),
    'earle-meets-world': (
        'Alix Earle now has a Netflix reality series about her life and career.',
        'Earle Meets World premiered September 4.'
    ),
    'lizzie-borden-monster': (
        "Ryan Murphy's Monster series turns to Lizzie Borden this month.",
        'The season arrives on Netflix September 17 with Ella Beatty as Borden.'
    ),
    'the-wrong-girls': (
        'Kristen Stewart and Alia Shawkat star as roommates in a psychedelic comedy now available digitally.',
        'The movie reached digital rental and purchase platforms this week.'
    ),
    'twilight': 'A vampire romance set in the Pacific Northwest, centered on Bella Swan and Edward Cullen.',
    'nana': 'A manga and anime about two women named Nana navigating music, fashion, friendship and relationships in Tokyo.',
    'the-sims': 'A life-simulation series built around houses, outfits, relationships, careers and domestic chaos.',
    'stardew-valley': 'A farming game built around routines, decorating, gifts, relationships and seasonal collecting.',
    'mamma-mia': 'An ABBA musical set on a Greek island, built around a wedding and a paternity question.',
    'pride-and-prejudice-2005': 'The 2005 adaptation of Pride & Prejudice starring Keira Knightley and Matthew Macfadyen.',
    'animal-crossing': 'A life-simulation series about decorating, collecting, clothes, neighbors and seasonal routines.',
    'matcha': 'Powdered green tea that also became a recurring visual and lifestyle marker online.',
    'tiny-treat': 'A small snack, drink or purchase framed as a reward for getting through the day.',
    'rottingangel': 'A username built from a soft noun and a damage modifier, one of the common foidslop handle patterns.',
    'romance-novels': 'A huge fiction category organized around romantic relationships, tropes, subgenres and highly specific reader tastes.',
    'dress-to-impress': 'A Roblox dress-up game where players build outfits around a theme and vote on the runway.'
}
alt = {
    'simone-rocha-adidas': 'Editorial source image for Simone Rocha x Adidas',
    'tired-girl-eyes': 'Editorial source image for the tired girl eye makeup trend',
    'adidas-mary-janes': 'Editorial source image for Adidas Mary Jane shoes',
    'ballet-flats-again': 'Editorial source image for the ballet flat trend',
    'preppy-revival-2026': 'Editorial source image for the fall 2026 preppy trend',
    'yesteryear': 'Editorial source image for Yesteryear and BookTok coverage',
    'once-upon-a-broken-heart': 'Editorial source image for Once Upon a Broken Heart BookTok coverage',
    'devil-wears-prada-2': 'Editorial source image for The Devil Wears Prada 2',
    'bridgerton-season-4': 'Editorial source image for Bridgerton season 4',
    'daisy-chain-fields': 'Editorial source image for Daisy Chain Fields',
    'earle-meets-world': 'Editorial source image for Earle Meets World',
    'lizzie-borden-monster': 'Editorial source image for Monster: The Lizzie Borden Story',
    'the-wrong-girls': 'Editorial source image for The Wrong Girls'
}
for item in trials['items']:
    replacement = copy.get(item['id'])
    if isinstance(replacement, tuple):
        item['prompt'], item['whyNow'] = replacement
    elif isinstance(replacement, str):
        item['prompt'] = replacement
    if item.get('kind') == 'current':
        item['image'] = f"/culture/trials/{item['id']}.webp"
        item['imageAlt'] = alt.get(item['id'], f"Editorial source image for {item['name']}")
trials_path.write_text(json.dumps(trials, indent=2) + '\n')

# Replace the generated product shell.
publisher_path = ROOT / 'scripts/publish-culture-products.js'
publisher = publisher_path.read_text()
publisher = publisher.replace("const STYLE_VERSION = '20260906-6';", "const STYLE_VERSION = '20260906-7';")
publisher = publisher.replace(
    "for (const field of ['whyNow', 'sourceLabel', 'sourceUrl', 'activeFrom', 'activeUntil']) if (!String(item[field] || '').trim()) errors.push(`Slop Trial ${item.id}: missing current field ${field}`);",
    "for (const field of ['whyNow', 'sourceLabel', 'sourceUrl', 'activeFrom', 'activeUntil', 'image', 'imageAlt']) if (!String(item[field] || '').trim()) errors.push(`Slop Trial ${item.id}: missing current field ${field}`);\n      if (item.image && !fs.existsSync(path.join(ROOT, item.image.replace(/^\\//, '')))) errors.push(`Slop Trial ${item.id}: missing visual asset ${item.image}`);"
)
new_trial = r'''function renderTrialPage() {
  const route = 'culture/is-it-foidslop';
  const title = 'Is It Foidslop? Vote on Current Culture';
  const description = 'Vote yes or no on current fashion, media, food, games, books, and internet culture. See the live split and the closest calls.';
  const schema = [
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Is It Foidslop?', applicationCategory: 'EntertainmentApplication', operatingSystem: 'Any', url: canonical(route), description },
    breadcrumb(route, 'Is It Foidslop?')
  ];
  const currentCount = trials.items.filter(item => item.kind === 'current').length;
  const classicCount = trials.items.filter(item => item.kind === 'evergreen').length;
  const revisionLabel = new Date(`${trials.revisionDate}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const categories = [...new Set(trials.items.map(item => item.category))].sort();
  const pageHead = head(route, title, description, schema).replace('</head>', '<link rel="stylesheet" href="../css/culture-showcase.css?v=20260906-4">\n</head>');
  return `${pageHead}${header(route)}<main id="main" class="slop-trial-page"><header class="slop-trial-hero"><div><p class="content-eyebrow">Is It Foidslop? / updated ${esc(revisionLabel)}</p><h1>Vote on the current feed.</h1><p class="article-deck">Current fashion, media, food, games and internet stuff. Vote yes or no, then see the split.</p></div><div class="slop-trial-hero-stats"><div><strong>${currentCount}</strong><span>current</span></div><div><strong>${classicCount}</strong><span>classics</span></div><div><strong>live</strong><span>results</span></div></div></header><section class="slop-trial-shell" data-slop-trial><div class="slop-trial-nav"><div class="slop-trial-modes" role="group" aria-label="Trial set"><button type="button" data-trial-mode="current" aria-pressed="true">Current</button><button type="button" data-trial-mode="classics" aria-pressed="false">Classics</button></div><nav class="slop-trial-categories" aria-label="Trial categories"><button type="button" data-trial-category="all" aria-pressed="true">All</button>${categories.map(value => `<button type="button" data-trial-category="${esc(value)}" aria-pressed="false">${esc(value === 'television' ? 'TV' : value[0].toUpperCase() + value.slice(1))}</button>`).join('')}</nav></div><div class="slop-trial-progress"><span data-trial-progress>0 of ${currentCount} current items voted</span><span>Results update live</span></div><article class="slop-trial-card"><figure class="slop-trial-media"><img data-trial-image src="" alt="" width="960" height="640" decoding="async"><div class="slop-trial-media-fallback" data-trial-image-fallback hidden><span data-trial-image-category></span><strong data-trial-image-name></strong></div><figcaption><span data-trial-freshness></span><a data-trial-source href="#" target="_blank" rel="noopener" hidden></a></figcaption></figure><div class="slop-trial-panel"><div class="slop-trial-meta"><span data-trial-category-label></span><span data-trial-date-label></span></div><h2 data-trial-name></h2><p class="slop-trial-prompt" data-trial-prompt></p><div class="slop-trial-why" data-trial-why-wrap hidden><span>Why now</span><p data-trial-why></p></div><div class="slop-trial-vote"><div class="slop-trial-question">Is it foidslop?</div><div class="slop-vote-buttons"><button type="button" data-vote="yes">Yes</button><button type="button" data-vote="no">No</button></div><p class="slop-trial-status" data-trial-status aria-live="polite"></p><div class="slop-trial-result-row"><strong data-trial-result aria-live="polite"></strong><div class="slop-trial-meter" aria-hidden="true"><span data-trial-meter></span></div></div></div><div class="slop-trial-actions"><button class="slop-next" type="button" data-trial-next>Next</button><button type="button" data-trial-share>Share</button></div></div></article><section class="slop-trial-feed"><div class="slop-trial-section-head"><div><span>More current</span><h2>Keep voting.</h2></div><p>Open any item. Your votes stay on this browser.</p></div><div class="slop-trial-feed-grid" data-trial-queue></div></section><section class="slop-trial-disputed" data-trial-disputed-wrap hidden><div class="slop-trial-section-head"><div><span>Closest calls</span><h2>The current split.</h2></div><p>Items nearest to 50/50, once they have votes.</p></div><div class="slop-trial-disputed-grid" data-trial-disputed></div></section></section><section class="slop-trial-links culture-tool-links"><a href="slop-index"><strong>Media Index</strong><span>Staff scores for the classics.</span></a><a href="slop-taxonomy"><strong>Slop Taxonomy</strong><span>Where the categories fit.</span></a><a href="username-generator"><strong>Username Generator</strong><span>Make a foidslop handle.</span></a></section></main>${scriptData('slop-trial-data', trials.items)}<script src="slop-tools.js?v=20260906-3" defer></script>${footer(route)}`;
}
'''
publisher, count = re.subn(r'function renderTrialPage\(\) \{.*?\n\}\n\n(?=function renderUsernamePage)', new_trial + '\n', publisher, count=1, flags=re.S)
if count != 1:
    raise SystemExit('renderTrialPage replacement failed')
publisher_path.write_text(publisher)

# Replace only the Slop Trial runtime. Username generator remains untouched.
script_path = ROOT / 'culture/slop-tools.js'
script = script_path.read_text()
new_init = r'''  function initTrial() {
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
    const categoryButtons = [...root.querySelectorAll('[data-trial-category]')];
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
    const setPressed = () => {
      modeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.trialMode === mode)));
      categoryButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.trialCategory === selectedCategory)));
    };
    const pool = () => {
      let items = mode === 'current' ? currentItems : classicItems;
      if (selectedCategory !== 'all') items = items.filter(item => item.category === selectedCategory);
      return items.length ? items : (mode === 'current' ? currentItems : classicItems);
    };
    const titleCase = value => String(value || '').replace(/(^|[-\s])([a-z])/g, (_, lead, char) => lead + char.toUpperCase());
    const displayCategory = value => value === 'television' ? 'TV' : titleCase(value);
    const itemUrl = item => {
      const url = new URL(location.href);
      url.search = '';
      url.searchParams.set('item', item.id);
      return url.toString();
    };

    function updateProgress() {
      if (!progress) return;
      const voted = currentItems.filter(item => savedVote(item.id)).length;
      progress.textContent = `${voted} of ${currentItems.length} current item${currentItems.length === 1 ? '' : 's'} voted`;
    }

    function cardMarkup(item) {
      const summary = summaries.get(item.id);
      const consensus = summary?.total ? `<span class="slop-feed-consensus">${summary.percentYes}% yes · ${summary.total}</span>` : '<span class="slop-feed-consensus">Vote</span>';
      const visual = item.image ? `<img src="${item.image}" alt="" width="480" height="320" loading="lazy" decoding="async">` : `<div class="slop-feed-fallback">${displayCategory(item.category)}</div>`;
      return `${visual}<span class="slop-feed-meta">${displayCategory(item.category)}</span><strong>${item.name}</strong>${consensus}`;
    }

    function renderQueue() {
      if (!queue) return;
      const items = pool().filter(item => item.id !== current?.id).slice(0, 6);
      queue.innerHTML = '';
      for (const item of items) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.trialQueueItem = item.id;
        button.innerHTML = cardMarkup(item);
        button.addEventListener('click', () => render(item));
        queue.appendChild(button);
      }
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
        // Individual result loading still works when the batch endpoint is unavailable.
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
        image.src = item.image;
        image.alt = item.imageAlt || '';
      } else {
        image.hidden = true;
        image.removeAttribute('src');
        imageFallback.hidden = false;
        imageCategory.textContent = displayCategory(item.category);
        imageName.textContent = item.name;
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
      window.scrollTo({ top: Math.max(0, root.getBoundingClientRect().top + window.scrollY - 84), behavior: 'smooth' });
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
      setPressed();
      render(pool()[0]);
    }));
    categoryButtons.forEach(button => button.addEventListener('click', () => {
      selectedCategory = button.dataset.trialCategory;
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
          setTimeout(() => { share.textContent = 'Share'; }, 1200);
        }
      } catch (error) {
        if (error?.name !== 'AbortError') share.textContent = 'Share failed';
      }
    });

    setPressed();
    const requested = new URLSearchParams(location.search).get('item');
    const requestedItem = all.find(item => item.id === requested);
    if (requestedItem?.kind === 'evergreen') mode = 'classics';
    setPressed();
    const initial = requestedItem || (currentItems[0] || classicItems[0]);
    render(initial);
    loadAllResults();
  }
'''
script, count = re.subn(r'  function initTrial\(\) \{.*?\n  \}\n\n(?=  function initUsernameGenerator)', new_init + '\n', script, count=1, flags=re.S)
if count != 1:
    raise SystemExit('initTrial replacement failed')
script_path.write_text(script)

# Replace the old Slop Trial stylesheet block with the visual-pulse layout.
css_path = ROOT / 'css/culture-showcase.css'
css = css_path.read_text()
visual_css = r'''/* slop-trial-redesign:start */
.slop-trial-page{max-width:1440px;margin:0 auto;padding-bottom:92px;border-inline:1px solid var(--border);background:var(--bg)}
.slop-trial-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:52px;align-items:end;max-width:1220px;margin:0 auto;padding:66px 42px 34px}
.slop-trial-hero h1{max-width:760px;margin:8px 0 12px;font:900 clamp(3.1rem,6vw,5.9rem)/.9 Arial Black,Arial,sans-serif;letter-spacing:-.065em;text-transform:none;text-wrap:balance}.slop-trial-hero .article-deck{max-width:720px;margin:0;color:var(--muted);font-size:clamp(1.02rem,1.5vw,1.2rem);line-height:1.55}
.slop-trial-hero-stats{display:grid;grid-template-columns:repeat(3,minmax(82px,1fr));border:1px solid var(--border)}.slop-trial-hero-stats div{min-width:94px;padding:15px 16px;border-right:1px solid var(--border)}.slop-trial-hero-stats div:last-child{border-right:0}.slop-trial-hero-stats strong{display:block;color:var(--text);font:900 1.55rem/.9 Inter,sans-serif;letter-spacing:-.05em}.slop-trial-hero-stats span{display:block;margin-top:7px;color:var(--muted);font:700 8px/1 Inter,sans-serif;letter-spacing:.1em;text-transform:uppercase}
.slop-trial-shell{max-width:1220px;margin:0 auto;padding:18px 42px 0}.slop-trial-nav{display:flex;align-items:center;justify-content:space-between;gap:22px;margin-bottom:10px}.slop-trial-modes,.slop-trial-categories{display:flex;gap:6px;min-width:0}.slop-trial-categories{overflow-x:auto;padding:2px 0;scrollbar-width:none}.slop-trial-categories::-webkit-scrollbar{display:none}.slop-trial-modes button,.slop-trial-categories button,.slop-trial-actions button{flex:0 0 auto;border:1px solid var(--border);background:transparent;color:var(--text);cursor:pointer;font:700 9px/1 Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase}.slop-trial-modes button,.slop-trial-categories button{padding:10px 12px}.slop-trial-modes button[aria-pressed="true"],.slop-trial-categories button[aria-pressed="true"]{border-color:var(--text);background:var(--text);color:var(--bg)}
.slop-trial-progress{display:flex;justify-content:space-between;gap:20px;padding:10px 0 13px;color:var(--muted);font:700 8px/1 Inter,sans-serif;letter-spacing:.09em;text-transform:uppercase}
.slop-trial-card{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(380px,.88fr);width:100%;max-width:none!important;margin:0!important;padding:0!important;border:1px solid var(--border);background:var(--surface);overflow:hidden}.slop-trial-media{position:relative;min-width:0;margin:0!important;border-right:1px solid var(--border);background:var(--bg)}.slop-trial-media>img{display:block;width:100%;height:100%;min-height:560px;max-height:700px;object-fit:cover}.slop-trial-media-fallback{display:flex;min-height:560px;flex-direction:column;justify-content:flex-end;padding:34px;background:linear-gradient(145deg,var(--surface),var(--bg))}.slop-trial-media-fallback span{color:var(--accent);font:700 9px/1 Inter,sans-serif;letter-spacing:.11em;text-transform:uppercase}.slop-trial-media-fallback strong{max-width:620px;margin-top:10px;font:900 clamp(2.7rem,5vw,5rem)/.9 Arial Black,Arial,sans-serif;letter-spacing:-.06em}.slop-trial-media figcaption{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;gap:18px;padding:12px 14px;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(10px);color:var(--muted);font:700 8px/1 Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase}.slop-trial-media figcaption a{color:var(--text);text-decoration:underline;text-decoration-color:var(--accent);text-underline-offset:3px}
.slop-trial-panel{display:flex;min-width:0;flex-direction:column;padding:38px}.slop-trial-meta{display:flex;justify-content:space-between;gap:16px;color:var(--muted);font:700 8px/1 Inter,sans-serif;letter-spacing:.1em;text-transform:uppercase}.slop-trial-page .slop-trial-card h2{max-width:620px;margin:34px 0 14px;font:900 clamp(2.5rem,4.4vw,4.4rem)/.92 Arial Black,Arial,sans-serif;letter-spacing:-.055em;text-transform:none;overflow-wrap:anywhere;text-wrap:balance}.slop-trial-prompt{max-width:600px;margin:0;color:var(--text);font:17px/1.55 Georgia,serif}.slop-trial-why{margin-top:26px;padding-top:17px;border-top:1px solid var(--border)}.slop-trial-why span{display:block;margin-bottom:7px;color:var(--accent);font:700 8px/1 Inter,sans-serif;letter-spacing:.11em;text-transform:uppercase}.slop-trial-why p{margin:0;color:var(--muted);font-size:13px;line-height:1.55}
.slop-trial-vote{margin-top:auto;padding-top:34px}.slop-trial-question{margin:0 0 12px!important;font:800 1.45rem/1 Inter,sans-serif!important;letter-spacing:-.025em;text-transform:none!important}.slop-vote-buttons{display:grid;grid-template-columns:1fr 1fr;gap:8px}.slop-vote-buttons button{min-height:54px!important;border:1px solid var(--text);background:transparent;color:var(--text);font:800 13px/1 Inter,sans-serif!important;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}.slop-vote-buttons button:first-child{background:var(--text);color:var(--bg)}.slop-vote-buttons button[aria-pressed="true"]{outline:2px solid var(--accent);outline-offset:2px}.slop-vote-buttons button:disabled{cursor:default;opacity:.82}.slop-trial-status{margin:12px 0 9px!important;color:var(--muted);font-size:12px}.slop-trial-result-row{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:16px}.slop-trial-result-row strong{font:750 12px/1.3 Inter,sans-serif;white-space:nowrap}.slop-trial-meter{height:4px;background:var(--border);overflow:hidden}.slop-trial-meter span{display:block;width:0;height:100%;background:var(--accent);transition:width .25s ease}.slop-trial-actions{display:flex;gap:8px;margin-top:19px}.slop-trial-actions button{padding:10px 13px}.slop-trial-actions .slop-next{background:var(--accent);border-color:var(--accent);color:#fff}
.slop-trial-feed,.slop-trial-disputed{padding-top:54px}.slop-trial-section-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(230px,.45fr);gap:40px;align-items:end;margin-bottom:18px}.slop-trial-section-head>div>span{color:var(--accent);font:700 8px/1 Inter,sans-serif;letter-spacing:.11em;text-transform:uppercase}.slop-trial-section-head h2{margin:7px 0 0;font:900 clamp(2rem,3.6vw,3.6rem)/.92 Arial Black,Arial,sans-serif;letter-spacing:-.055em;text-transform:none}.slop-trial-section-head p{margin:0;color:var(--muted);font-size:13px;line-height:1.5}.slop-trial-feed-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid var(--border);border-left:1px solid var(--border)}.slop-trial-feed-grid button{position:relative;min-width:0;padding:0 0 16px;text-align:left;border:0;border-right:1px solid var(--border);border-bottom:1px solid var(--border);background:var(--surface);color:var(--text);cursor:pointer;overflow:hidden}.slop-trial-feed-grid button:hover{background:color-mix(in srgb,var(--accent) 7%,var(--surface))}.slop-trial-feed-grid img,.slop-feed-fallback{display:block;width:100%;aspect-ratio:3/2;object-fit:cover;border-bottom:1px solid var(--border)}.slop-feed-fallback{display:flex;align-items:flex-end;padding:14px;background:linear-gradient(145deg,var(--surface),var(--bg));color:var(--muted);font:700 8px/1 Inter,sans-serif;letter-spacing:.09em;text-transform:uppercase}.slop-feed-meta,.slop-feed-consensus{display:block;padding:0 16px;color:var(--muted);font:700 8px/1 Inter,sans-serif;letter-spacing:.09em;text-transform:uppercase}.slop-feed-meta{margin-top:14px;color:var(--accent)}.slop-trial-feed-grid strong{display:block;padding:7px 16px 16px;font:800 17px/1.15 Inter,sans-serif;overflow-wrap:anywhere}.slop-feed-consensus{margin-top:auto}.slop-trial-disputed-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid var(--border)}.slop-trial-disputed-grid button{min-width:0;padding:18px;text-align:left;border:0;border-right:1px solid var(--border);background:transparent;color:var(--text);cursor:pointer}.slop-trial-disputed-grid button:last-child{border-right:0}.slop-trial-disputed-grid span,.slop-trial-disputed-grid small{display:block;color:var(--muted);font:700 8px/1.2 Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase}.slop-trial-disputed-grid strong{display:block;margin:8px 0 18px;font:800 16px/1.25 Inter,sans-serif}.slop-trial-disputed-grid b{display:block;font:900 2rem/.95 Inter,sans-serif;letter-spacing:-.05em}.slop-trial-links{max-width:1136px;margin:48px auto 0}
@media(max-width:980px){.slop-trial-hero{grid-template-columns:1fr;gap:28px}.slop-trial-hero-stats{max-width:420px}.slop-trial-card{grid-template-columns:1fr}.slop-trial-media{border-right:0;border-bottom:1px solid var(--border)}.slop-trial-media>img{min-height:0;max-height:none;aspect-ratio:16/10}.slop-trial-media-fallback{min-height:380px}.slop-trial-nav{align-items:flex-start;flex-direction:column}.slop-trial-categories{width:100%}.slop-trial-feed-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.slop-trial-section-head{grid-template-columns:1fr}}
@media(max-width:600px){.slop-trial-page{padding-bottom:60px}.slop-trial-hero{padding:46px 20px 26px}.slop-trial-hero h1{font-size:clamp(2.8rem,13vw,4.2rem)}.slop-trial-hero-stats{grid-template-columns:repeat(3,1fr);width:100%}.slop-trial-hero-stats div{min-width:0;padding:12px}.slop-trial-shell{padding:10px 20px 0}.slop-trial-modes{width:100%}.slop-trial-modes button{flex:1}.slop-trial-progress{font-size:7px}.slop-trial-progress span:last-child{display:none}.slop-trial-panel{padding:26px 20px}.slop-trial-page .slop-trial-card h2{margin-top:26px;font-size:clamp(2.15rem,10.8vw,3.4rem)}.slop-trial-prompt{font-size:16px}.slop-trial-media>img{aspect-ratio:4/3}.slop-trial-media-fallback{min-height:290px;padding:22px}.slop-trial-result-row{grid-template-columns:1fr;gap:8px}.slop-trial-actions button{flex:1}.slop-trial-feed,.slop-trial-disputed{padding-top:42px}.slop-trial-feed-grid,.slop-trial-disputed-grid{grid-template-columns:1fr}.slop-trial-feed-grid button,.slop-trial-disputed-grid button{border-right:0;border-bottom:1px solid var(--border)}.slop-trial-disputed-grid button:last-child{border-bottom:0}.slop-trial-links{margin:34px 20px 0}}
/* slop-trial-redesign:end */'''
css, count = re.subn(r'/\* slop-trial-redesign:start \*/.*?/\* slop-trial-redesign:end \*/', visual_css, css, count=1, flags=re.S)
if count != 1:
    raise SystemExit('Slop Trial CSS replacement failed')
css_path.write_text(css)

# Keep HTML fresh while visual assets are immutable.
headers_path = ROOT / '_headers'
headers = headers_path.read_text()
if '/culture/trials/*' not in headers:
    headers += '\n/culture/trials/*\n  Cache-Control: public, max-age=31536000, immutable\n\n/culture/is-it-foidslop\n  Cache-Control: no-cache, max-age=0, must-revalidate\n\n/culture/is-it-foidslop.html\n  Cache-Control: no-cache, max-age=0, must-revalidate\n'
headers_path.write_text(headers)

# Update the focused editorial regression suite.
test_path = ROOT / 'test/slop-trial-editorial.test.js'
test_path.write_text(r'''const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const trials = JSON.parse(fs.readFileSync('data/slop-trials.json', 'utf8'));
const page = fs.readFileSync('culture/is-it-foidslop.html', 'utf8');
const script = fs.readFileSync('culture/slop-tools.js', 'utf8');

const cheesy = [
  /science advances/i,
  /community court/i,
  /launch specimens/i,
  /cast judgment/i,
  /jury remains corruptible/i,
  /historically significant anyway/i,
  /advanced yearning technology/i,
  /emotional accounting department/i,
  /expensive yearning/i,
  /very bad psychedelic night/i,
  /five minutes of actual gameplay/i,
  /relentless outfit discourse/i,
  /feed is quiet/i,
  /making the rounds/i
];

test('Slop Trial defaults to a sourced visual current-events pool', () => {
  const current = trials.items.filter(item => item.kind === 'current');
  assert.ok(current.length >= 8);
  for (const item of current) {
    assert.match(item.sourceUrl, /^https:\/\//);
    assert.ok(item.whyNow.length >= 25);
    assert.match(item.activeFrom, /^2026-/);
    assert.match(item.activeUntil, /^2026-/);
    assert.match(item.image, /^\/culture\/trials\/[a-z0-9-]+\.webp$/);
    assert.ok(item.imageAlt.length >= 20);
    assert.ok(fs.existsSync(item.image.replace(/^\//, '')), `missing ${item.image}`);
  }
});

test('Slop Trial copy stays direct instead of fake-clever', () => {
  const text = JSON.stringify(trials) + page + script;
  for (const pattern of cheesy) assert.doesNotMatch(text, pattern);
  assert.match(page, /Current fashion, media, food, games and internet stuff/);
  assert.match(page, /Why now/);
  assert.match(page, /Closest calls/);
});

test('Slop Trial is image-led and uses button navigation', () => {
  assert.match(page, /data-trial-image/);
  assert.match(page, /data-trial-category="all"/);
  assert.match(page, /data-trial-progress/);
  assert.match(page, /data-trial-disputed/);
  assert.doesNotMatch(page, /<select[^>]*data-trial-filter/);
  assert.match(script, /navigator\.share/);
  assert.match(script, /loadAllResults/);
  assert.match(script, /updateProgress/);
});
''')

# Align the broader layout/product tests with the new contract.
layout_path = ROOT / 'test/culture-layout-audit.test.js'
layout = layout_path.read_text()
layout = re.sub(
    r"test\('Slop Trial uses the compact topical layout'.*?\n\}\);",
    """test('Slop Trial uses the visual culture-pulse layout', () => {\n  assert.match(products, /slop-trial-media/);\n  assert.match(products, /slop-trial-categories/);\n  assert.match(products, /slop-trial-disputed/);\n  assert.match(showcase, /grid-template-columns:minmax\\(0,1\\.12fr\\) minmax\\(380px,\\.88fr\\)/);\n});""",
    layout,
    count=1,
    flags=re.S
)
layout_path.write_text(layout)

products_path = ROOT / 'test/culture-products.test.js'
products = products_path.read_text()
products = products.replace("assert.match(file('culture/is-it-foidslop.html'), /Current Slop Trials/);", "assert.match(file('culture/is-it-foidslop.html'), /Vote on the current feed/);")
products_path.write_text(products)
