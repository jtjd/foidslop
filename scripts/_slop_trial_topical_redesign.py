from pathlib import Path
import json
import re

ROOT = Path('.')

trials = {
  "revisionDate": "2026-09-06",
  "items": [
    {
      "id": "simone-rocha-adidas",
      "name": "Simone Rocha x Adidas",
      "category": "fashion",
      "kind": "current",
      "prompt": "Lace, pearls and tulle on Adidas sportswear. The first collection lands September 10.",
      "whyNow": "Simone Rocha's first Adidas Originals collection launches this week.",
      "sourceLabel": "Vogue · Sep 3",
      "sourceUrl": "https://www.vogue.com/article/simone-rocha-adidas-fall-winter-2026-interview",
      "activeFrom": "2026-09-03",
      "activeUntil": "2026-10-05"
    },
    {
      "id": "tired-girl-eyes",
      "name": "Tired Girl Eyes",
      "category": "beauty",
      "kind": "current",
      "prompt": "Smudged shadow, visible under-eyes and dark lips. Fall makeup has decided looking a little wrecked is back.",
      "whyNow": "Byrdie listed tired-girl eyes among fall 2026's biggest makeup trends this week.",
      "sourceLabel": "Byrdie · Sep 5",
      "sourceUrl": "https://www.byrdie.com/fall-makeup-trends-2026-12064486",
      "activeFrom": "2026-09-05",
      "activeUntil": "2026-10-31"
    },
    {
      "id": "adidas-mary-janes",
      "name": "Adidas Mary Janes",
      "category": "fashion",
      "kind": "current",
      "prompt": "A sneaker with a Mary Jane strap. Back-to-school TikTok is wearing them.",
      "whyNow": "Who What Wear found Adidas Mary Janes in a scan of more than 200 back-to-school TikToks.",
      "sourceLabel": "Who What Wear · Sep 3",
      "sourceUrl": "https://www.whowhatwear.com/fashion/trends/back-to-school-fashion-trends-2026",
      "activeFrom": "2026-09-03",
      "activeUntil": "2026-10-15"
    },
    {
      "id": "ballet-flats-again",
      "name": "Ballet Flats Again",
      "category": "fashion",
      "kind": "current",
      "prompt": "The shoes are back again. Fall celebrity outfits are full of them.",
      "whyNow": "People flagged ballet flats as a fall staple again on September 6 after a run of celebrity sightings.",
      "sourceLabel": "People · Sep 6",
      "sourceUrl": "https://people.com/kate-middleton-katie-holmes-ballet-flats-september-2026-12105789",
      "activeFrom": "2026-09-06",
      "activeUntil": "2026-10-15"
    },
    {
      "id": "preppy-revival-2026",
      "name": "The Preppy Revival",
      "category": "fashion",
      "kind": "current",
      "prompt": "Argyle, roll-necks, micro minis and prep-school references are back in the fall rotation.",
      "whyNow": "Preppy style is surging with Gen Z and Gen Alpha as fall 2026 starts.",
      "sourceLabel": "WSJ · Sep 2",
      "sourceUrl": "https://www.wsj.com/style/fashion/preppy-style-is-booming-what-does-it-look-like-now-b1320c95",
      "activeFrom": "2026-09-02",
      "activeUntil": "2026-10-31"
    },
    {
      "id": "yesteryear",
      "name": "Yesteryear",
      "category": "books",
      "kind": "current",
      "prompt": "A novel about tradwife influencer culture that BookTok spent a large part of 2026 talking about.",
      "whyNow": "The Bookseller's September BookTok review singled it out as one of the year's biggest discussion books.",
      "sourceLabel": "The Bookseller · Sep 4",
      "sourceUrl": "https://www.thebookseller.com/books/books-on-booktok-a-mid-year-review",
      "activeFrom": "2026-09-04",
      "activeUntil": "2026-10-05"
    },
    {
      "id": "once-upon-a-broken-heart",
      "name": "Once Upon a Broken Heart",
      "category": "books",
      "kind": "current",
      "prompt": "Jacks, romantasy and reread edits. The series is back near the center of BookTok attention.",
      "whyNow": "BookTokAI had it at No. 1 in its September 5 weekly tracking.",
      "sourceLabel": "BookTokAI · Sep 5",
      "sourceUrl": "https://booktokai.com/",
      "activeFrom": "2026-09-05",
      "activeUntil": "2026-09-30"
    },
    {
      "id": "devil-wears-prada-2",
      "name": "The Devil Wears Prada 2",
      "category": "movies",
      "kind": "current",
      "prompt": "Miranda, Andy, Emily and another round of fashion-office pathology. Summer 2026 made it a hit.",
      "whyNow": "The sequel is still part of the post-summer box-office conversation heading into fall.",
      "sourceLabel": "The Guardian · Sep 1",
      "sourceUrl": "https://www.theguardian.com/film/the-devil-wears-prada-2",
      "activeFrom": "2026-09-01",
      "activeUntil": "2026-09-30"
    },
    {
      "id": "bridgerton-season-4",
      "name": "Bridgerton Season 4",
      "category": "television",
      "kind": "current",
      "prompt": "Benedict, Sophie, a masquerade ball and another season of expensive yearning.",
      "whyNow": "Season 4 is streaming now and Netflix says it is already Emmy-nominated.",
      "sourceLabel": "Netflix Tudum · Jul 10",
      "sourceUrl": "https://www.netflix.com/tudum/articles/bridgerton-season-4-cast-release-date-news",
      "activeFrom": "2026-08-20",
      "activeUntil": "2026-09-30"
    },
    {
      "id": "daisy-chain-fields",
      "name": "Daisy Chain Fields",
      "category": "music",
      "kind": "current",
      "prompt": "Olivia Rodrigo built an all-female festival with Stevie Nicks, Bikini Kill and a new punk song.",
      "whyNow": "The inaugural Daisy Chain Fields festival happened this week in California.",
      "sourceLabel": "The Atlantic · Sep 1",
      "sourceUrl": "https://www.theatlantic.com/culture/2026/09/olivia-rodrigo-daisy-chain-festival-review/688477/",
      "activeFrom": "2026-09-01",
      "activeUntil": "2026-09-20"
    },
    {
      "id": "earle-meets-world",
      "name": "Earle Meets World",
      "category": "television",
      "kind": "current",
      "prompt": "Alix Earle now has a Netflix reality show about her life and career.",
      "whyNow": "The series premiered September 4.",
      "sourceLabel": "People · Aug 31",
      "sourceUrl": "https://people.com/netflix-shows-you-need-to-watch-september-2026-12063336",
      "activeFrom": "2026-09-04",
      "activeUntil": "2026-10-05"
    },
    {
      "id": "lizzie-borden-monster",
      "name": "Monster: The Lizzie Borden Story",
      "category": "television",
      "kind": "current",
      "prompt": "Ryan Murphy's next Monster season puts Lizzie Borden at the center of the story.",
      "whyNow": "The season arrives on Netflix September 17 with Ella Beatty as Borden.",
      "sourceLabel": "People · Aug 31",
      "sourceUrl": "https://people.com/netflix-shows-you-need-to-watch-september-2026-12063336",
      "activeFrom": "2026-09-01",
      "activeUntil": "2026-10-10"
    },
    {
      "id": "the-wrong-girls",
      "name": "The Wrong Girls",
      "category": "movies",
      "kind": "current",
      "prompt": "Kristen Stewart and Alia Shawkat play stoner roommates having a very bad psychedelic night.",
      "whyNow": "The movie hit digital rental and purchase platforms this week.",
      "sourceLabel": "Decider · Sep 4",
      "sourceUrl": "https://decider.com/2026/09/04/new-movies-on-streaming-i-want-your-sex-the-wrong-girls-and-more/",
      "activeFrom": "2026-09-04",
      "activeUntil": "2026-09-25"
    },
    {
      "id": "twilight",
      "name": "Twilight",
      "category": "movies",
      "kind": "evergreen",
      "prompt": "Vampire romance, Pacific Northwest rain, yearning and Bella Swan."
    },
    {
      "id": "nana",
      "name": "Nana",
      "category": "anime",
      "kind": "evergreen",
      "prompt": "Fashion, music, friendship and disastrous relationships."
    },
    {
      "id": "the-sims",
      "name": "The Sims",
      "category": "games",
      "kind": "evergreen",
      "prompt": "House building, outfit planning, family drama and five minutes of actual gameplay."
    },
    {
      "id": "stardew-valley",
      "name": "Stardew Valley",
      "category": "games",
      "kind": "evergreen",
      "prompt": "Farming, decorating, gifts, romance and seasonal routines."
    },
    {
      "id": "mamma-mia",
      "name": "Mamma Mia!",
      "category": "movies",
      "kind": "evergreen",
      "prompt": "ABBA, a Greek island, a wedding and three possible fathers."
    },
    {
      "id": "pride-and-prejudice-2005",
      "name": "Pride & Prejudice (2005)",
      "category": "movies",
      "kind": "evergreen",
      "prompt": "Period romance, muddy hems, the hand flex and Keira Knightley."
    },
    {
      "id": "animal-crossing",
      "name": "Animal Crossing",
      "category": "games",
      "kind": "evergreen",
      "prompt": "Decorating, clothes, gifts, tiny animals and seasonal collecting."
    },
    {
      "id": "matcha",
      "name": "Matcha",
      "category": "food",
      "kind": "evergreen",
      "prompt": "A drink that is now also an aesthetic object, color palette and personality marker."
    },
    {
      "id": "tiny-treat",
      "name": "A tiny treat",
      "category": "food",
      "kind": "evergreen",
      "prompt": "A small snack or purchase justified as a reward for surviving the day."
    },
    {
      "id": "rottingangel",
      "name": "rottingangel",
      "category": "usernames",
      "kind": "evergreen",
      "prompt": "Soft noun plus damage modifier. A standard foidslop username construction."
    },
    {
      "id": "romance-novels",
      "name": "Romance novels",
      "category": "books",
      "kind": "evergreen",
      "prompt": "Tropes, yearning, annotations, special editions and highly specific male leads."
    },
    {
      "id": "dress-to-impress",
      "name": "Dress to Impress",
      "category": "games",
      "kind": "evergreen",
      "prompt": "Dress-up competition, runway themes and relentless outfit discourse."
    }
  ]
}

(ROOT / 'data/slop-trials.json').write_text(json.dumps(trials, indent=2) + '\n')

publisher_path = ROOT / 'scripts/publish-culture-products.js'
publisher = publisher_path.read_text()
publisher = publisher.replace("const STYLE_VERSION = '20260906-5';", "const STYLE_VERSION = '20260906-6';")

old_validation = """    for (const field of ['name', 'category', 'prompt']) if (!String(item[field] || '').trim()) errors.push(`Slop Trial ${item.id}: missing ${field}`);\n  }\n  if (ids.size < 20) errors.push('Slop Trials needs at least 20 launch items');"""
new_validation = """    for (const field of ['name', 'category', 'prompt']) if (!String(item[field] || '').trim()) errors.push(`Slop Trial ${item.id}: missing ${field}`);\n    if (!['current', 'evergreen'].includes(item.kind)) errors.push(`Slop Trial ${item.id}: invalid kind`);\n    if (item.kind === 'current') {\n      for (const field of ['whyNow', 'sourceLabel', 'sourceUrl', 'activeFrom', 'activeUntil']) if (!String(item[field] || '').trim()) errors.push(`Slop Trial ${item.id}: missing current field ${field}`);\n      if (!/^https:\\/\\//.test(item.sourceUrl || '')) errors.push(`Slop Trial ${item.id}: current source must be https`);\n      if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(item.activeFrom || '') || !/^\\d{4}-\\d{2}-\\d{2}$/.test(item.activeUntil || '')) errors.push(`Slop Trial ${item.id}: invalid current date window`);\n    }\n  }\n  if (ids.size < 20) errors.push('Slop Trials needs at least 20 items');\n  if ((trials.items || []).filter(item => item.kind === 'current').length < 8) errors.push('Slop Trials needs a substantive current-events pool');"""
if old_validation not in publisher:
    raise SystemExit('publisher validation block not found')
publisher = publisher.replace(old_validation, new_validation)

new_trial_function = r'''function renderTrialPage() {
  const route = 'culture/is-it-foidslop';
  const title = 'Is It Foidslop? Current Slop Trials';
  const description = 'Vote yes or no on current movies, fashion, books, internet trends, games, food, and other candidates. See the live community result.';
  const schema = [
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Is It Foidslop?', applicationCategory: 'EntertainmentApplication', operatingSystem: 'Any', url: canonical(route), description },
    breadcrumb(route, 'Is It Foidslop?')
  ];
  const categories = [...new Set(trials.items.map(item => item.category))].sort();
  const currentCount = trials.items.filter(item => item.kind === 'current').length;
  const revisionLabel = new Date(`${trials.revisionDate}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const pageHead = head(route, title, description, schema).replace('</head>', '<link rel="stylesheet" href="../css/culture-showcase.css?v=20260906-3">\n</head>');
  return `${pageHead}${header(route)}<main id="main" class="slop-trial-page"><header class="slop-trial-hero"><p class="content-eyebrow">Slop Trial / updated ${esc(revisionLabel)}</p><h1>Is It Foidslop?</h1><p class="article-deck">Vote on what is making the rounds right now. Current culture first, classics when the feed is quiet.</p></header><section class="slop-trial-shell" data-slop-trial><div class="slop-trial-toolbar"><div class="slop-trial-modes" role="group" aria-label="Trial recency"><button type="button" data-trial-mode="current" aria-pressed="true">Current <span>${currentCount}</span></button><button type="button" data-trial-mode="all" aria-pressed="false">All</button></div><label>Category <select data-trial-filter><option value="all">Everything</option>${categories.map(value => `<option value="${esc(value)}">${esc(value[0].toUpperCase() + value.slice(1))}</option>`).join('')}</select></label></div><article class="slop-trial-card"><div class="slop-trial-meta"><div><span class="slop-trial-freshness" data-trial-freshness></span><span data-trial-category></span></div><a class="slop-trial-source" data-trial-source href="#" target="_blank" rel="noopener" hidden></a></div><div class="slop-trial-main"><div class="slop-trial-copy"><h2 data-trial-name></h2><p class="slop-trial-prompt" data-trial-prompt></p><div class="slop-trial-why" data-trial-why-wrap hidden><span>Why now</span><p data-trial-why></p></div></div><div class="slop-trial-vote"><div class="slop-trial-question">Is it foidslop?</div><div class="slop-vote-buttons"><button type="button" data-vote="yes">Yes</button><button type="button" data-vote="no">No</button></div><p class="slop-trial-status" data-trial-status aria-live="polite"></p><div class="slop-trial-meter" aria-hidden="true"><span data-trial-meter></span></div><p class="slop-trial-result" data-trial-result aria-live="polite"></p></div></div><div class="slop-trial-actions"><button class="slop-next" type="button" data-trial-next>Next</button><button type="button" data-trial-share>Copy link</button></div></article><aside class="slop-trial-on-deck"><div class="slop-trial-on-deck-head"><span>On deck</span><span>Current picks</span></div><div class="slop-trial-on-deck-list" data-trial-queue></div></aside></section><section class="slop-trial-links culture-tool-links"><a href="slop-index"><strong>Media Index</strong><span>Staff scores for the classics.</span></a><a href="slop-taxonomy"><strong>Slop Taxonomy</strong><span>Where the categories fit.</span></a><a href="username-generator"><strong>Username Generator</strong><span>Make a foidslop handle.</span></a></section></main>${scriptData('slop-trial-data', trials.items)}<script src="slop-tools.js?v=20260906-2" defer></script>${footer(route)}`;
}'''

pattern = r"function renderTrialPage\(\) \{.*?\n\}\n\nfunction renderUsernamePage\(\) \{"
match = re.search(pattern, publisher, flags=re.S)
if not match:
    raise SystemExit('renderTrialPage block not found')
publisher = publisher[:match.start()] + new_trial_function + "\n\nfunction renderUsernamePage() {" + publisher[match.end():]
publisher_path.write_text(publisher)

slop_tools = r'''(() => {
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
'''
(ROOT / 'culture/slop-tools.js').write_text(slop_tools)

css_path = ROOT / 'css/culture-showcase.css'
css = css_path.read_text()
new_css = r'''/* slop-trial-redesign:start */
.slop-trial-page{max-width:1440px;margin:0 auto;padding-bottom:88px;border-inline:1px solid var(--border);background:var(--bg)}
.slop-trial-hero{max-width:1120px;margin:0 auto;padding:70px 36px 30px;border-bottom:0}
.slop-trial-hero h1{max-width:760px;margin:8px 0 12px;font:900 clamp(3rem,6vw,5.8rem)/.9 Arial Black,Arial,sans-serif;letter-spacing:-.065em;text-transform:none;text-wrap:balance}
.slop-trial-hero .article-deck{max-width:700px;margin:0;color:var(--muted);font-size:clamp(1rem,1.5vw,1.2rem);line-height:1.55}
.slop-trial-shell{max-width:1120px;margin:0 auto;padding:18px 36px 0}
.slop-trial-toolbar{display:flex;align-items:end;justify-content:space-between;gap:24px;margin:0 0 12px!important}
.slop-trial-modes{display:flex;gap:6px}.slop-trial-modes button,.slop-trial-toolbar button,.slop-trial-toolbar select,.slop-trial-actions button{border:1px solid var(--border);background:transparent;color:var(--text)}
.slop-trial-modes button{padding:10px 13px;font:700 10px/1 Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}.slop-trial-modes button span{color:var(--muted)}.slop-trial-modes button[aria-pressed="true"]{border-color:var(--text);background:var(--text);color:var(--bg)}.slop-trial-modes button[aria-pressed="true"] span{color:inherit}
.slop-trial-toolbar label{display:grid;gap:7px;color:var(--muted);font:700 9px/1 Inter,sans-serif;letter-spacing:.11em;text-transform:uppercase}.slop-trial-toolbar select{min-width:180px;padding:10px 34px 10px 11px;font:600 12px/1 Inter,sans-serif;text-transform:none}
.slop-trial-card{width:100%;max-width:none!important;min-height:0!important;margin:0!important;padding:0!important;border:1px solid var(--border);background:var(--surface);overflow:hidden}
.slop-trial-meta{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:13px 16px;border-bottom:1px solid var(--border);font:700 9px/1 Inter,sans-serif;letter-spacing:.1em;text-transform:uppercase}.slop-trial-meta>div{display:flex;align-items:center;gap:12px;min-width:0}.slop-trial-freshness{color:var(--accent)}.slop-trial-freshness[data-kind="classic"]{color:var(--muted)}.slop-trial-source{color:var(--text);text-decoration:underline;text-decoration-color:var(--accent);text-underline-offset:4px;white-space:nowrap}
.slop-trial-main{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,.65fr)}
.slop-trial-copy{min-width:0;padding:42px 44px 40px}.slop-trial-page .slop-trial-card h2{max-width:760px;margin:0 0 16px;font:900 clamp(2.4rem,5vw,4.8rem)/.94 Arial Black,Arial,sans-serif;letter-spacing:-.055em;text-transform:none;overflow-wrap:anywhere;text-wrap:balance}.slop-trial-prompt{max-width:690px;margin:0;color:var(--muted);font:17px/1.55 Georgia,serif}
.slop-trial-why{max-width:700px;margin-top:30px;padding-top:18px;border-top:1px solid var(--border)}.slop-trial-why span{display:block;margin-bottom:8px;color:var(--accent);font:700 9px/1 Inter,sans-serif;letter-spacing:.11em;text-transform:uppercase}.slop-trial-why p{margin:0;color:var(--text);font-size:14px;line-height:1.55}
.slop-trial-vote{min-width:0;display:flex;flex-direction:column;justify-content:center;padding:34px;border-left:1px solid var(--border);background:color-mix(in srgb,var(--bg) 35%,var(--surface))}.slop-trial-question{margin:0 0 15px!important;font:800 clamp(1.45rem,2.3vw,2rem)/1 Inter,sans-serif!important;letter-spacing:-.025em;text-transform:none!important}.slop-vote-buttons{display:grid;grid-template-columns:1fr 1fr;gap:8px}.slop-vote-buttons button{min-height:54px!important;border:1px solid var(--text);background:transparent;color:var(--text);font:800 13px/1 Inter,sans-serif!important;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}.slop-vote-buttons button:first-child{background:var(--text);color:var(--bg)}.slop-vote-buttons button[aria-pressed="true"]{outline:2px solid var(--accent);outline-offset:2px}.slop-vote-buttons button:disabled{cursor:default;opacity:.82}
.slop-trial-status{margin:14px 0 8px!important;color:var(--muted);font-size:12px}.slop-trial-meter{height:4px;margin:9px 0 10px;background:var(--border);overflow:hidden}.slop-trial-meter span{display:block;width:0;height:100%;background:var(--accent);transition:width .25s ease}.slop-trial-result{margin:0!important;color:var(--text);font:700 12px/1.4 Inter,sans-serif}
.slop-trial-actions{display:flex;justify-content:flex-end;gap:7px;padding:12px 14px;border-top:1px solid var(--border)}.slop-trial-actions button{padding:9px 12px;font:700 9px/1 Inter,sans-serif;letter-spacing:.09em;text-transform:uppercase;cursor:pointer}.slop-trial-actions .slop-next{background:var(--accent);border-color:var(--accent);color:#fff}
.slop-trial-on-deck{margin-top:22px}.slop-trial-on-deck-head{display:flex;justify-content:space-between;margin-bottom:9px;color:var(--muted);font:700 9px/1 Inter,sans-serif;letter-spacing:.1em;text-transform:uppercase}.slop-trial-on-deck-list{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--border)}.slop-trial-on-deck-list button{min-width:0;padding:16px;text-align:left;border:0;border-right:1px solid var(--border);background:transparent;color:var(--text);cursor:pointer}.slop-trial-on-deck-list button:last-child{border-right:0}.slop-trial-on-deck-list button:hover{background:color-mix(in srgb,var(--accent) 7%,var(--surface))}.slop-trial-on-deck-list span{display:block;margin-bottom:8px;color:var(--accent);font:700 8px/1 Inter,sans-serif;letter-spacing:.09em;text-transform:uppercase}.slop-trial-on-deck-list strong{display:block;font:750 13px/1.25 Inter,sans-serif;overflow-wrap:anywhere}
.slop-trial-links{max-width:1048px;margin:38px auto 0}
@media(max-width:900px){.slop-trial-main{grid-template-columns:1fr}.slop-trial-vote{border-left:0;border-top:1px solid var(--border)}.slop-trial-on-deck-list{grid-template-columns:repeat(2,minmax(0,1fr))}.slop-trial-on-deck-list button:nth-child(2){border-right:0}.slop-trial-on-deck-list button:nth-child(-n+2){border-bottom:1px solid var(--border)}}
@media(max-width:600px){.slop-trial-page{padding-bottom:60px}.slop-trial-hero{padding:44px 20px 20px}.slop-trial-hero h1{font-size:clamp(2.8rem,14vw,4.2rem)}.slop-trial-shell{padding:12px 20px 0}.slop-trial-toolbar{align-items:stretch;flex-direction:column;gap:12px}.slop-trial-modes{width:100%}.slop-trial-modes button{flex:1}.slop-trial-toolbar select{width:100%}.slop-trial-meta{align-items:flex-start;flex-direction:column;gap:9px}.slop-trial-source{white-space:normal}.slop-trial-copy{padding:30px 22px 28px}.slop-trial-page .slop-trial-card h2{font-size:clamp(2.2rem,11.5vw,3.6rem)}.slop-trial-prompt{font-size:16px}.slop-trial-vote{padding:26px 22px}.slop-trial-actions{justify-content:stretch}.slop-trial-actions button{flex:1}.slop-trial-on-deck-list{grid-template-columns:1fr}.slop-trial-on-deck-list button,.slop-trial-on-deck-list button:nth-child(2){border-right:0;border-bottom:1px solid var(--border)}.slop-trial-on-deck-list button:last-child{border-bottom:0}.slop-trial-links{margin:30px 20px 0}}
/* slop-trial-redesign:end */'''
css, count = re.subn(r'/\* slop-trial-redesign:start \*/.*?/\* slop-trial-redesign:end \*/', new_css, css, flags=re.S)
if count != 1:
    raise SystemExit(f'expected one slop trial CSS block, found {count}')
css_path.write_text(css)

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
  /emotional accounting department/i
];

test('Slop Trial defaults to a sourced current-events pool', () => {
  const current = trials.items.filter(item => item.kind === 'current');
  assert.ok(current.length >= 8);
  for (const item of current) {
    assert.match(item.sourceUrl, /^https:\/\//);
    assert.ok(item.whyNow.length >= 35);
    assert.match(item.activeFrom, /^2026-/);
    assert.match(item.activeUntil, /^2026-/);
  }
});

test('Slop Trial copy stays direct instead of fake-clever', () => {
  const text = JSON.stringify(trials) + page + script;
  for (const pattern of cheesy) assert.doesNotMatch(text, pattern);
  assert.match(page, /Vote on what is making the rounds right now/);
  assert.match(page, /Why now/);
  assert.match(page, /Current picks/);
});

test('Slop Trial page has a compact topical layout', () => {
  assert.match(page, /slop-trial-modes/);
  assert.match(page, /slop-trial-main/);
  assert.match(page, /slop-trial-meter/);
  assert.match(page, /data-trial-source/);
  assert.match(script, /const isCurrent/);
  assert.match(script, /dailyPick/);
});

test('username generator script supports the redesigned tab UI', () => {
  assert.match(script, /data-username-tab/);
  assert.match(script, /data-username-variant/);
  assert.match(script, /data-length/);
});
''')

print('Applied topical Slop Trial redesign source changes.')
