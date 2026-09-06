from pathlib import Path
import re

ROOT = Path('.')

SHOWCASE_CSS = r'''
/* Flagship culture surfaces: foidslop primer + username lab */
.username-lab-page,.foidslop-primer{max-width:1440px;margin:0 auto;border-inline:1px solid var(--border);background:var(--bg)}
.username-lab-page{padding:0 0 96px}.username-lab-hero{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(230px,.5fr);gap:48px;align-items:end;padding:76px 42px 40px;border-bottom:1px solid var(--border)}
.username-lab-hero h1{max-width:980px;margin:8px 0 10px;font:900 clamp(3.4rem,7vw,7.4rem)/.82 Arial Black,Arial,sans-serif;letter-spacing:-.075em;text-transform:uppercase}.username-lab-hero .article-deck{max-width:760px;margin:0;font-size:clamp(1.05rem,1.7vw,1.45rem);line-height:1.45}.username-lab-stamp{justify-self:end;width:100%;max-width:260px;padding:18px;border:1px solid var(--border);font:700 10px/1.5 Inter,sans-serif;letter-spacing:.12em;text-transform:uppercase}.username-lab-stamp strong{display:block;margin:8px 0 4px;color:var(--text);font:900 3.4rem/.9 Arial Black,Arial,sans-serif;letter-spacing:-.07em}.username-lab{margin:0;padding:42px}.username-lab-controls{display:flex;justify-content:space-between;gap:28px;align-items:end;margin-bottom:14px}.username-control-label{display:block;margin-bottom:10px;color:var(--muted);font:700 10px/1 Inter,sans-serif;letter-spacing:.13em;text-transform:uppercase}.username-departments{display:flex;flex-wrap:wrap;gap:7px}.username-departments button,.username-lab button{border:1px solid var(--border);background:transparent;color:var(--text);cursor:pointer}.username-departments button{padding:9px 12px;font:700 10px/1 Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase}.username-departments button[aria-pressed="true"]{border-color:var(--text);background:var(--text);color:var(--bg)}.username-roll{min-width:172px;padding:13px 18px!important;background:var(--accent)!important;border-color:var(--accent)!important;color:#fff!important;font:900 11px/1 Inter,sans-serif!important;letter-spacing:.09em;text-transform:uppercase}.username-specimen{position:relative;min-height:430px;display:flex;flex-direction:column;justify-content:space-between;padding:26px 28px 30px;border:1px solid var(--border);background:var(--surface);overflow:hidden}.username-specimen:before{content:"@";position:absolute;right:-.02em;bottom:-.28em;color:color-mix(in srgb,var(--text) 4%,transparent);font:900 29rem/.7 Arial Black,Arial,sans-serif;pointer-events:none}.username-specimen-meta{position:relative;z-index:1;display:flex;justify-content:space-between;gap:18px;color:var(--muted);font:700 9px/1 Inter,sans-serif;letter-spacing:.12em;text-transform:uppercase}.username-handle{position:relative;z-index:1;display:flex;align-items:baseline;min-width:0;padding:56px 0 48px}.username-at{flex:0 0 auto;margin-right:.05em;color:var(--accent);font:900 clamp(2.6rem,5vw,6.2rem)/.8 Arial Black,Arial,sans-serif}.username-output{min-width:0;margin:0;color:var(--text);font:900 clamp(3.6rem,7.4vw,8.2rem)/.78 Arial Black,Arial,sans-serif;letter-spacing:-.08em;white-space:nowrap}.username-output[data-length="long"]{font-size:clamp(3rem,6vw,6.6rem)}.username-output[data-length="very-long"]{font-size:clamp(2.4rem,4.8vw,5.2rem)}.username-specimen-actions{position:relative;z-index:1;display:flex;gap:10px}.username-copy{padding:12px 16px!important;background:var(--text)!important;border-color:var(--text)!important;color:var(--bg)!important;font:900 10px/1 Inter,sans-serif!important;letter-spacing:.1em;text-transform:uppercase}.username-alt-strip{display:grid;grid-template-columns:150px 1fr;border:1px solid var(--border);border-top:0}.username-alt-label{padding:18px 20px;color:var(--accent);font:700 9px/1 Inter,sans-serif;letter-spacing:.13em;text-transform:uppercase}.username-variants{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-left:1px solid var(--border)}.username-variant{min-width:0;padding:18px 20px!important;border:0!important;border-right:1px solid var(--border)!important;text-align:left;font:700 15px/1.2 Inter,sans-serif!important;overflow-wrap:anywhere}.username-variant:last-child{border-right:0!important}.username-variant:hover,.username-variant:focus-visible{background:color-mix(in srgb,var(--accent) 10%,var(--surface))!important}.username-method{display:grid;grid-template-columns:minmax(180px,.45fr) minmax(0,1.55fr);gap:42px;margin:8px 42px 0;padding:34px 0 0;border-top:1px solid var(--border)}.username-method h2{margin:0;font:900 clamp(2rem,4vw,4rem)/.9 Arial Black,Arial,sans-serif;letter-spacing:-.05em;text-transform:uppercase}.username-method-copy{max-width:760px}.username-method-copy p{margin:0 0 12px;line-height:1.55}.username-method-copy a{font-weight:700}
.foidslop-primer{padding-bottom:96px}.foidslop-hero{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(360px,.8fr);min-height:620px;border-bottom:1px solid var(--border)}.foidslop-hero-copy{display:flex;flex-direction:column;justify-content:flex-end;padding:72px 42px 46px}.foidslop-hero h1{max-width:820px;margin:10px 0 24px;font:900 clamp(5.2rem,10.3vw,10.5rem)/.76 Arial Black,Arial,sans-serif;letter-spacing:-.085em;text-transform:uppercase}.foidslop-hero h1 span{display:block;color:var(--accent);font-size:.26em;line-height:1.1;letter-spacing:.03em}.foidslop-hero .article-deck{max-width:780px;margin:0;font-size:clamp(1.05rem,1.7vw,1.4rem);line-height:1.5}.foidslop-hero-nav{display:flex;flex-wrap:wrap;gap:7px;margin-top:28px}.foidslop-hero-nav a{padding:9px 11px;border:1px solid var(--border);color:var(--text);font:700 9px/1 Inter,sans-serif;letter-spacing:.08em;text-decoration:none;text-transform:uppercase}.foidslop-hero-nav a:hover{border-color:var(--accent);color:var(--accent)}.foidslop-definition-panel{display:flex;flex-direction:column;justify-content:space-between;padding:34px;border-left:1px solid var(--border);background:var(--surface)}.foidslop-definition-panel>span,.foidslop-section-kicker{color:var(--accent);font:700 10px/1 Inter,sans-serif;letter-spacing:.13em;text-transform:uppercase}.foidslop-definition-panel>p{margin:auto 0;font:700 clamp(1.55rem,2.7vw,2.75rem)/1.08 Georgia,serif;letter-spacing:-.025em}.foidslop-equation{display:grid;grid-template-columns:1fr auto 1fr auto 1.3fr;align-items:center;gap:9px;padding-top:22px;border-top:1px solid var(--border);font:900 clamp(.72rem,1vw,.95rem)/1 Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase}.foidslop-equation span,.foidslop-equation strong{padding:12px 10px;border:1px solid var(--border);text-align:center}.foidslop-equation strong{background:var(--text);color:var(--bg)}.foidslop-origin,.foidslop-food-feature{display:grid;grid-template-columns:minmax(0,.82fr) minmax(420px,1.18fr);gap:0;border-bottom:1px solid var(--border)}.foidslop-copy-block{padding:58px 42px}.foidslop-copy-block h2,.foidslop-counts-head h2,.foidslop-site-head h2{max-width:760px;margin:12px 0 24px;font:900 clamp(2.7rem,5.8vw,6rem)/.83 Arial Black,Arial,sans-serif;letter-spacing:-.07em;text-transform:uppercase}.foidslop-copy-block p{max-width:670px;font-size:1.02rem;line-height:1.65}.foidslop-origin .culture-receipt,.foidslop-food-feature .culture-receipt{align-self:stretch;max-width:none;margin:0;padding:34px;border-left:1px solid var(--border);background:var(--surface)}.foidslop-origin .culture-receipt-image,.foidslop-food-feature .culture-receipt-image{height:auto}.foidslop-counts{padding:58px 42px;border-bottom:1px solid var(--border)}.foidslop-counts-head{display:grid;grid-template-columns:1fr minmax(260px,.6fr);gap:42px;align-items:end;margin-bottom:30px}.foidslop-counts-head p{margin:0 0 10px;color:var(--muted);line-height:1.55}.foidslop-category-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-top:1px solid var(--border);border-left:1px solid var(--border)}.foidslop-category-card{min-height:270px;padding:24px;border-right:1px solid var(--border);border-bottom:1px solid var(--border);color:var(--text);text-decoration:none;background:var(--surface)}.foidslop-category-card:hover{background:color-mix(in srgb,var(--accent) 9%,var(--surface))}.foidslop-category-card>span{display:block;margin-bottom:42px;color:var(--accent);font:700 9px/1 Inter,sans-serif;letter-spacing:.12em;text-transform:uppercase}.foidslop-category-card strong{display:block;margin-bottom:13px;font:900 1.55rem/.95 Arial Black,Arial,sans-serif;text-transform:uppercase}.foidslop-category-card p{margin:0;color:var(--muted);font-size:.9rem;line-height:1.5}.foidslop-map{padding:58px 42px;border-bottom:1px solid var(--border)}.foidslop-map-copy{display:grid;grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr);gap:56px}.foidslop-map-copy h2{margin:12px 0 0;font:900 clamp(2.8rem,6vw,6.2rem)/.82 Arial Black,Arial,sans-serif;letter-spacing:-.07em;text-transform:uppercase}.foidslop-map-text p{max-width:760px;line-height:1.65}.foidslop-map-links{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin-top:34px;border:1px solid var(--border)}.foidslop-map-links a{padding:22px;border-right:1px solid var(--border);color:var(--text);text-decoration:none}.foidslop-map-links a:last-child{border-right:0}.foidslop-map-links span,.foidslop-site-card span{display:block;margin-bottom:8px;color:var(--accent);font:700 9px/1 Inter,sans-serif;letter-spacing:.11em;text-transform:uppercase}.foidslop-map-links strong,.foidslop-site-card strong{font:900 1.05rem/1 Arial Black,Arial,sans-serif;text-transform:uppercase}.foidslop-site{padding:58px 42px}.foidslop-site-head{max-width:920px}.foidslop-site-head p{max-width:760px;line-height:1.65}.foidslop-site-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin-top:34px;border:1px solid var(--border)}.foidslop-site-card{min-height:210px;padding:24px;border-right:1px solid var(--border);color:var(--text);text-decoration:none;background:var(--surface)}.foidslop-site-card:last-child{border-right:0}.foidslop-site-card p{color:var(--muted);line-height:1.5}.foidslop-primer .culture-sources,.foidslop-primer .culture-related,.foidslop-primer .article-cta{margin-left:42px;margin-right:42px}.foidslop-primer .culture-related{padding-top:34px;border-top:1px solid var(--border)}
@media(max-width:900px){.username-lab-hero,.foidslop-hero,.foidslop-origin,.foidslop-food-feature,.foidslop-counts-head,.foidslop-map-copy{grid-template-columns:1fr}.username-lab-stamp{justify-self:start;max-width:none}.foidslop-definition-panel{border-left:0;border-top:1px solid var(--border);min-height:380px}.foidslop-origin .culture-receipt,.foidslop-food-feature .culture-receipt{border-left:0;border-top:1px solid var(--border)}.foidslop-category-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.username-output{white-space:normal;overflow-wrap:anywhere}.username-method{grid-template-columns:1fr;gap:18px}}
@media(max-width:600px){.username-lab-hero{padding:48px 20px 28px;gap:26px}.username-lab-hero h1{font-size:clamp(3rem,15vw,5rem)}.username-lab{padding:20px}.username-lab-controls{align-items:stretch;flex-direction:column}.username-roll{width:100%}.username-specimen{min-height:360px;padding:20px}.username-specimen:before{font-size:18rem}.username-handle{padding:46px 0 38px}.username-output,.username-output[data-length="long"],.username-output[data-length="very-long"]{font-size:clamp(2.4rem,12.5vw,4.3rem);white-space:normal;overflow-wrap:anywhere}.username-alt-strip{grid-template-columns:1fr}.username-alt-label{border-bottom:1px solid var(--border)}.username-variants{grid-template-columns:1fr;border-left:0}.username-variant{border-right:0!important;border-bottom:1px solid var(--border)!important}.username-variant:last-child{border-bottom:0!important}.username-method{margin:8px 20px 0}.foidslop-hero{min-height:0}.foidslop-hero-copy{padding:48px 20px 32px}.foidslop-hero h1{font-size:clamp(4.6rem,24vw,7.4rem)}.foidslop-definition-panel{padding:24px 20px;min-height:330px}.foidslop-equation{grid-template-columns:1fr auto 1fr;grid-template-areas:"foid plus slop" "eq eq eq" "result result result"}.foidslop-equation span:first-child{grid-area:foid}.foidslop-equation b:nth-of-type(1){grid-area:plus}.foidslop-equation span:nth-of-type(2){grid-area:slop}.foidslop-equation b:nth-of-type(2){grid-area:eq}.foidslop-equation strong{grid-area:result}.foidslop-copy-block,.foidslop-counts,.foidslop-map,.foidslop-site{padding:42px 20px}.foidslop-origin .culture-receipt,.foidslop-food-feature .culture-receipt{padding:20px}.foidslop-category-grid{grid-template-columns:1fr}.foidslop-category-card{min-height:190px}.foidslop-category-card>span{margin-bottom:24px}.foidslop-map-links,.foidslop-site-grid{grid-template-columns:1fr}.foidslop-map-links a,.foidslop-site-card{border-right:0;border-bottom:1px solid var(--border)}.foidslop-map-links a:last-child,.foidslop-site-card:last-child{border-bottom:0}.foidslop-primer .culture-sources,.foidslop-primer .culture-related,.foidslop-primer .article-cta{margin-left:20px;margin-right:20px}}
'''

GENERATOR_JS = r'''(() => {
  const root = document.querySelector('[data-username-generator]');
  const dataNode = document.getElementById('username-generator-data');
  if (!root || !dataNode) return;
  const config = JSON.parse(dataNode.textContent || '{}');
  const output = root.querySelector('[data-username-output]');
  const deptLabel = root.querySelector('[data-username-department-label]');
  const generate = root.querySelector('[data-username-generate]');
  const copy = root.querySelector('[data-username-copy]');
  const tabs = [...root.querySelectorAll('[data-username-tab]')];
  const variants = [...root.querySelectorAll('[data-username-variant]')];
  let active = 'mixed';

  const random = () => {
    if (globalThis.crypto?.getRandomValues) {
      const value = new Uint32Array(1);
      crypto.getRandomValues(value);
      return value[0] / 4294967296;
    }
    return Math.random();
  };
  const pick = items => items[Math.floor(random() * items.length)];
  const realKeys = () => Object.keys(config.categories || {});

  function make(categoryKey) {
    const category = config.categories[categoryKey] || config.categories.soft;
    const base = pick(category.bases);
    const modifier = pick(category.modifiers);
    const suffix = pick(category.suffixes);
    if (categoryKey === '2009') {
      return pick([`xX${base}Xx`, `${modifier}${base}${suffix}`, `${base}${suffix}`, `x_${base}_${suffix}`]).replace(/\s+/g, '').toLowerCase();
    }
    return pick([`${modifier}${base}`, `${base}${suffix}`, `${modifier}${base}${random() > .72 ? suffix : ''}`, base]).replace(/\s+/g, '').toLowerCase();
  }

  function categoryForRoll() { return active === 'mixed' ? pick(realKeys()) : active; }
  function size(value) {
    output.dataset.length = value.length > 24 ? 'very-long' : value.length > 18 ? 'long' : 'normal';
  }
  function show(value, key) {
    output.textContent = value;
    output.dataset.value = value;
    size(value);
    const label = config.categories[key]?.label || 'Mixed';
    deptLabel.textContent = `${label} department`;
    copy.textContent = 'Copy handle';
  }
  function makeUnique(count, exclude = new Set()) {
    const values = [];
    let attempts = 0;
    while (values.length < count && attempts < 40) {
      const key = categoryForRoll();
      const value = make(key);
      attempts += 1;
      if (exclude.has(value) || values.some(item => item.value === value)) continue;
      values.push({ value, key });
    }
    return values;
  }
  function reroll() {
    const key = categoryForRoll();
    const value = make(key);
    show(value, key);
    const alts = makeUnique(variants.length, new Set([value]));
    variants.forEach((button, index) => {
      const item = alts[index] || { value: make(categoryForRoll()), key: categoryForRoll() };
      button.textContent = `@${item.value}`;
      button.dataset.value = item.value;
      button.dataset.category = item.key;
    });
  }

  tabs.forEach(tab => tab.addEventListener('click', () => {
    active = tab.dataset.usernameTab || 'mixed';
    tabs.forEach(item => item.setAttribute('aria-pressed', String(item === tab)));
    reroll();
  }));
  variants.forEach(button => button.addEventListener('click', () => show(button.dataset.value || '', button.dataset.category || categoryForRoll())));
  generate.addEventListener('click', reroll);
  copy.addEventListener('click', async () => {
    const value = output.dataset.value || output.textContent;
    try {
      await navigator.clipboard.writeText(value);
      copy.textContent = 'Copied';
      setTimeout(() => { copy.textContent = 'Copy handle'; }, 1200);
    } catch {
      copy.textContent = 'Select it';
      const selection = getSelection();
      selection?.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(output);
      selection?.addRange(range);
    }
  });
  reroll();
})();
'''

PRODUCTS = ROOT / 'scripts/publish-culture-products.js'
text = PRODUCTS.read_text()
new_username = r'''function renderUsernamePage() {
  const route = 'culture/username-generator';
  const title = 'Foidslop Username Generator';
  const description = 'Generate foidslop usernames from soft nouns, cursed modifiers, food words, gothic damage, and controlled 2009 spelling choices.';
  const schema = [
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: title, applicationCategory: 'EntertainmentApplication', operatingSystem: 'Any', url: canonical(route), description },
    breadcrumb(route, title)
  ];
  const tabs = [['mixed', 'Mixed'], ...Object.entries(usernames.categories).map(([key, group]) => [key, group.label])];
  const pageHead = head(route, title, description, schema).replace('</head>', '<link rel="stylesheet" href="../css/culture-showcase.css?v=20260906-1">\n</head>');
  return `${pageHead}${header(route)}<main id="main" class="username-lab-page"><header class="username-lab-hero"><div><p class="content-eyebrow">Generator / identity damage</p><h1>Foidslop Username Generator</h1><p class="article-deck">Soft noun. Optional damage. Controlled vowel crimes. No startup-name sludge.</p></div><aside class="username-lab-stamp"><span>Handle department</span><strong>05</strong><span>curated damage profiles + mixed mode</span></aside></header><section class="username-lab" data-username-generator><div class="username-lab-controls"><div><span class="username-control-label">Choose department</span><div class="username-departments" role="group" aria-label="Username department">${tabs.map(([key, label], index) => `<button type="button" data-username-tab="${esc(key)}" aria-pressed="${index === 0 ? 'true' : 'false'}">${esc(label)}</button>`).join('')}</div></div><button class="username-roll" type="button" data-username-generate>Roll another</button></div><div class="username-specimen"><div class="username-specimen-meta"><span>Generated handle / use at own risk</span><span data-username-department-label>Mixed department</span></div><div class="username-handle"><span class="username-at" aria-hidden="true">@</span><div class="username-output" data-username-output aria-live="polite"></div></div><div class="username-specimen-actions"><button class="username-copy" type="button" data-username-copy>Copy handle</button></div></div><div class="username-alt-strip"><span class="username-alt-label">Alternates</span><div class="username-variants"><button class="username-variant" type="button" data-username-variant></button><button class="username-variant" type="button" data-username-variant></button><button class="username-variant" type="button" data-username-variant></button></div></div></section><section class="username-method"><div><p class="content-eyebrow">The formula</p><h2>Soft noun. Optional damage.</h2></div><div class="username-method-copy"><p>The machine pulls from bunni, kitty, angel, fae, pixie, food words, gothic modifiers, digital damage, and small spelling mutations. The word banks are curated. The embarrassment is organic.</p><p>Pick a department when you know the damage you want. Leave it on Mixed when you do not.</p><a href="foidslop-usernames">Read the foidslop username field guide</a></div></section></main>${scriptData('username-generator-data', usernames)}<script src="username-generator.js?v=20260906-1" defer></script>${footer(route)}`;
}
'''
text, count = re.subn(r'function renderUsernamePage\(\) \{.*?\n\}\n\nfunction renderTaxonomyPage\(\) \{', new_username + '\nfunction renderTaxonomyPage() {', text, flags=re.S)
if count != 1:
    raise SystemExit(f'Could not replace renderUsernamePage, matches={count}')
PRODUCTS.write_text(text)

CULTURE = ROOT / 'scripts/publish-culture.js'
text = CULTURE.read_text()
flagship_fn = r'''function renderFoidslopEntry(entry, route, schema) {
  const pageHead = commonHead({ route, title: entry.seoTitle, description: entry.description, schema, rootFeed: true }).replace('</head>', '<link rel="stylesheet" href="css/culture-showcase.css?v=20260906-1">\n</head>');
  const origin = entry.sections[0];
  const food = entry.sections[1];
  const outside = entry.sections[2];
  const site = entry.sections[3];
  const originReceipt = (entry.evidence || []).find(item => item.afterSection === 0);
  const foodReceipt = (entry.evidence || []).find(item => item.afterSection === 1);
  const paragraphHtml = section => section.paragraphs.map(p => `<p>${esc(p)}</p>`).join('');
  return `${pageHead}${header(route, 'dictionary')}<main id="main" class="foidslop-primer"><section class="foidslop-hero"><div class="foidslop-hero-copy"><p class="content-eyebrow">Slop Dictionary / flagship file</p><h1><span>What is</span>Foidslop?</h1><p class="article-deck">${esc(entry.deck)}</p><nav class="foidslop-hero-nav" aria-label="Explore foidslop"><a href="culture/slop-index">Media Index</a><a href="culture/is-it-foidslop">Slop Trial</a><a href="culture/username-generator">Username Generator</a><a href="culture/slop-taxonomy">Slop Taxonomy</a></nav></div><aside class="foidslop-definition-panel"><span>Definition / 001</span><p>${esc(entry.definition)}</p><div class="foidslop-equation" aria-label="Foid plus slop equals foidslop"><span>FOID</span><b>+</b><span>SLOP</span><b>=</b><strong>FOIDSLOP</strong></div></aside></section><section class="foidslop-origin"><div class="foidslop-copy-block"><span class="foidslop-section-kicker">Origin / receipt 001</span><h2>Foid + slop.</h2>${paragraphHtml(origin)}</div>${originReceipt ? receiptHtml(originReceipt, route) : ''}</section><section class="foidslop-counts"><div class="foidslop-counts-head"><div><span class="foidslop-section-kicker">Classification desk</span><h2>What counts?</h2></div><p>The borders are intentionally loose. If the thing is strongly female-coded and somebody can plausibly call it slop, the file is open.</p></div><div class="foidslop-category-grid"><a class="foidslop-category-card" href="girl-dinner-ideas"><span>01 / food</span><strong>Girl dinner & tiny treats</strong><p>Snack plates, matcha, toast, tinned fish, cottage cheese, pickles, little desserts.</p></a><a class="foidslop-category-card" href="culture/slop-index"><span>02 / media</span><strong>Yearning on screen</strong><p>Twilight, Nana, romance novels, Gossip Girl, sad playlists, elaborate fandom spreadsheets.</p></a><a class="foidslop-category-card" href="culture/is-it-foidslop"><span>03 / games</span><strong>Life sim department</strong><p>The Sims, Stardew Valley, Animal Crossing, dress-up, decorating, collecting, yearning.</p></a><a class="foidslop-category-card" href="culture/username-generator"><span>04 / identity</span><strong>bunni.jpg online</strong><p>Cute handles, pink interfaces, profile layouts, fan edits, digital damage, lowercase crimes.</p></a></div></section><section class="foidslop-food-feature"><div class="foidslop-copy-block"><span class="foidslop-section-kicker">Food department</span><h2>${esc(food.heading)}</h2>${paragraphHtml(food)}</div>${foodReceipt ? receiptHtml(foodReceipt, route) : ''}</section><section class="foidslop-map"><div class="foidslop-map-copy"><div><span class="foidslop-section-kicker">Outside food</span><h2>The category keeps going.</h2></div><div class="foidslop-map-text">${paragraphHtml(outside)}</div></div><div class="foidslop-map-links"><a href="culture/slop-taxonomy"><span>Reference</span><strong>Open the Slop Taxonomy</strong></a><a href="culture/slop-index"><span>Scoring desk</span><strong>Browse the Media Index</strong></a><a href="culture/is-it-foidslop"><span>Community court</span><strong>Put something on trial</strong></a></div></section><section class="foidslop-site"><div class="foidslop-site-head"><span class="foidslop-section-kicker">foidslop.com</span><h2>${esc(site.heading)}</h2>${paragraphHtml(site)}</div><div class="foidslop-site-grid"><a class="foidslop-site-card" href="slop/archive"><span>Daily</span><strong>Eat the slop</strong><p>One recipe for one person every day.</p></a><a class="foidslop-site-card" href="culture"><span>Culture</span><strong>File the lore</strong><p>Media, slang, usernames, rankings, receipts, and the wider taxonomy.</p></a><a class="foidslop-site-card" href="dictionary"><span>Dictionary</span><strong>Learn the vocabulary</strong><p>Foid, femoid, moid, mog, girl dinner, slop, and the rest of the damage.</p></a></div></section>${sourceList(entry.sources)}${relatedDictionary(entry, route)}<p class="article-cta"><a href="dictionary">Open the Slop Dictionary</a><a href="culture">Read Culture</a><a href="slop/archive">Eat something</a></p></main>${footer(route)}`;
}

'''
anchor = 'function renderDictionaryEntry(entry) {'
if flagship_fn not in text:
    text = text.replace(anchor, flagship_fn + anchor)
pattern = r'(function renderDictionaryEntry\(entry\) \{\n  const route = dictionaryRoute\(entry\);\n  const schema = \[.*?\n  \];)\n  return'
text, count = re.subn(pattern, r"\1\n  if (entry.slug === 'foidslop') return renderFoidslopEntry(entry, route, schema);\n  return", text, count=1, flags=re.S)
if count != 1:
    raise SystemExit(f'Could not add foidslop dispatch, matches={count}')
CULTURE.write_text(text)

(ROOT / 'css/culture-showcase.css').write_text(SHOWCASE_CSS.strip() + '\n')
(ROOT / 'culture/username-generator.js').write_text(GENERATOR_JS.strip() + '\n')

TEST = r'''const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('username generator renders as a flagship handle lab', () => {
  const html = fs.readFileSync('culture/username-generator.html', 'utf8');
  assert.match(html, /username-lab-page/);
  assert.equal((html.match(/data-username-tab=/g) || []).length, 6);
  assert.equal((html.match(/data-username-variant/g) || []).length, 3);
  assert.match(html, /culture-showcase\.css/);
  assert.match(html, /username-generator\.js/);
});

test('foidslop pillar renders as the flagship primer', () => {
  const html = fs.readFileSync('what-is-foidslop.html', 'utf8');
  assert.match(html, /foidslop-primer/);
  assert.match(html, /FOID<\/span><b>\+<\/b><span>SLOP/);
  assert.equal((html.match(/foidslop-category-card/g) || []).length, 4);
  assert.match(html, /culture\/receipts\/foid-r9k-2018\.webp/);
  assert.match(html, /culture\/receipts\/girl-dinner-2023\.webp/);
  assert.match(html, /culture-showcase\.css/);
});
'''
(ROOT / 'test/culture-showcase.test.js').write_text(TEST)
print('Flagship redesign source changes applied.')
