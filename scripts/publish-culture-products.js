#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BASE_URL = 'https://foidslop.com';
const STYLE_VERSION = '20260906-4';
const checkOnly = process.argv.includes('--check');
const dateArg = process.argv.indexOf('--date');
const today = dateArg >= 0 ? process.argv[dateArg + 1] : process.env.PUBLISH_DATE || new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());

const read = file => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const write = (file, content) => {
  const target = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
};
const esc = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const jsonLd = value => JSON.stringify(value, null, 2).replace(/<\//g, '<\\/');

const trials = read('data/slop-trials.json');
const usernames = read('data/username-generator.json');
const taxonomy = read('data/slop-taxonomy.json');
const dictionary = read('data/dictionary.json');
const culture = read('data/culture-articles.json');
const identity = read('data/site-identity.json');
const dictionaryRoutes = new Map(dictionary.entries.map(entry => [entry.slug, entry.route || `dictionary/${entry.slug}`]));

function validate() {
  const errors = [];
  const banned = [/\u2014/, /\bdelve(?:s|d)?\b/i, /\btapestry\b/i, /\bit is important to (?:note|remember|understand)\b/i];
  const walk = value => {
    if (typeof value === 'string') for (const pattern of banned) if (pattern.test(value)) errors.push(`banned copy pattern ${pattern}: ${value}`);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  [trials, usernames, taxonomy].forEach(walk);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trials.revisionDate || '')) errors.push('slop trials revisionDate is invalid');
  const ids = new Set();
  for (const item of trials.items || []) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id || '') || ids.has(item.id)) errors.push(`invalid or duplicate Slop Trial id: ${item.id}`);
    ids.add(item.id);
    for (const field of ['name', 'category', 'prompt']) if (!String(item[field] || '').trim()) errors.push(`Slop Trial ${item.id}: missing ${field}`);
  }
  if (ids.size < 20) errors.push('Slop Trials needs at least 20 launch items');
  const categoryNames = Object.keys(usernames.categories || {});
  if (categoryNames.length < 5) errors.push('username generator needs at least five categories');
  for (const key of categoryNames) {
    const group = usernames.categories[key];
    for (const field of ['bases', 'modifiers', 'suffixes']) if (!Array.isArray(group[field]) || group[field].length < 8) errors.push(`username ${key}: ${field} is too small`);
  }
  if (!Array.isArray(taxonomy.branches) || taxonomy.branches.length < 4) errors.push('taxonomy needs at least four branches');
  for (const branch of taxonomy.branches || []) {
    if (!branch.name || !branch.description || !Array.isArray(branch.items) || branch.items.length < 3) errors.push(`thin taxonomy branch: ${branch.name}`);
    for (const item of branch.items || []) if (!item.name || !item.note || !/^\//.test(item.href || '')) errors.push(`invalid taxonomy item: ${item.name}`);
  }
  if (!Array.isArray(identity.sameAs) || !identity.sameAs.length || identity.sameAs.some(url => !/^https:\/\//.test(url))) errors.push('site identity needs real https sameAs URLs');
  return errors;
}

function prefix(route) {
  const depth = route.split('/').filter(Boolean).length;
  return depth > 1 ? '../'.repeat(depth - 1) : route ? '' : '';
}
function canonical(route) { return `${BASE_URL}/${route}`; }
function breadcrumb(route, label) {
  const parts = [{ '@type': 'ListItem', position: 1, name: 'foidslop', item: BASE_URL }];
  if (route.startsWith('culture/')) parts.push({ '@type': 'ListItem', position: 2, name: 'Culture', item: `${BASE_URL}/culture` });
  else if (route.startsWith('dictionary/')) parts.push({ '@type': 'ListItem', position: 2, name: 'Dictionary', item: `${BASE_URL}/dictionary` });
  parts.push({ '@type': 'ListItem', position: parts.length + 1, name: label, item: canonical(route) });
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: parts };
}
function head(route, title, description, schema, image = `${BASE_URL}/og-image.png`) {
  const p = prefix(route);
  return `<!DOCTYPE html><html lang="en"><head>\n<script src="${p}cookie-consent.js?v=20260713-4" data-ga-id="G-VT527DETQ2" defer></script>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<link rel="icon" type="image/webp" sizes="512x512" href="/brand-icon.webp">\n<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">\n<link rel="manifest" href="${p}site.webmanifest">\n<title>${esc(title)}</title>\n<meta name="description" content="${esc(description)}">\n<meta name="robots" content="index,follow,max-image-preview:large">\n<link rel="canonical" href="${canonical(route)}">\n<meta property="og:site_name" content="foidslop">\n<meta property="og:title" content="${esc(title)}">\n<meta property="og:description" content="${esc(description)}">\n<meta property="og:url" content="${canonical(route)}">\n<meta property="og:type" content="website">\n<meta property="og:image" content="${image}">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="${esc(title)}">\n<meta name="twitter:description" content="${esc(description)}">\n<meta name="twitter:image" content="${image}">\n<link rel="alternate" type="application/atom+xml" title="foidslop culture" href="${BASE_URL}/culture/feed.xml">\n<link rel="preload" as="font" type="font/woff2" href="/fonts/inter-var.woff2" crossorigin>\n<link rel="preload" as="font" type="font/woff2" href="/fonts/bebas-neue-400.woff2" crossorigin>\n<link rel="stylesheet" href="${p}css/fonts.css?v=20260826-1">\n<link rel="stylesheet" href="${p}css/global.css?v=20260827-1">\n<link rel="stylesheet" href="${p}css/content.css?v=20260827-1">\n<link rel="stylesheet" href="${p}css/culture.css?v=${STYLE_VERSION}">\n<link rel="stylesheet" href="${p}css/theme.css?v=20260827-2">\n<script src="${p}theme.js?v=20260713-5"></script>\n<script type="application/ld+json">${jsonLd(schema)}</script>\n</head>`;
}
function header(route, active = 'culture') {
  const p = prefix(route);
  const link = (href, label, key) => `<a href="${p}${href}" class="nav-link${active === key ? ' active' : ''}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`;
  return `<body><a href="#main" class="sr-only focusable">Skip to content</a><header class="site-header" id="site-header"><a href="${p || '/'}" aria-label="foidslop home"><picture><source type="image/webp" srcset="${p}logo-header.webp"><img src="${p}logo-header.png" alt="FOID SLOP" class="logo" width="126" height="74"></picture></a><div class="site-header-center">Daily slop / culture / etc.</div><div class="header-right"><button class="theme-toggle" type="button" aria-label="Switch color theme" aria-pressed="true"><span class="theme-toggle-mark" aria-hidden="true">*</span><span class="theme-toggle-label">Light mode</span></button>${link('slop/archive', 'Archive', 'archive')}${link('culture', 'Culture', 'culture')}${link('dictionary', 'Dictionary', 'dictionary')}<a href="${p || '/'}#dispatch" class="nav-link header-dispatch">Dispatch</a></div></header>`;
}
function footer(route) {
  const p = prefix(route);
  return `<footer><div class="footer-inner"><span class="footer-copy">&copy; 2026 foidslop</span><nav class="footer-links" aria-label="Footer navigation"><a href="${p}what-is-foidslop">What is foidslop?</a><span class="footer-dot"></span><a href="${p}dictionary">Dictionary</a><span class="footer-dot"></span><a href="${p}culture">Culture</a><span class="footer-dot"></span><a href="https://www.pinterest.com/foidslop/" rel="external">Pinterest</a><span class="footer-dot"></span><a href="${p}feed.xml">RSS</a><span class="footer-dot"></span><a href="${p}about">About</a><span class="footer-dot"></span><a href="${p}privacy">Privacy</a></nav></div></footer></body></html>`;
}
function scriptData(id, value) { return `<script type="application/json" id="${id}">${JSON.stringify(value).replace(/<\//g, '<\\/')}</script>`; }

function renderTrialPage() {
  const route = 'culture/is-it-foidslop';
  const title = 'Is It Foidslop? Community Slop Trials';
  const description = 'Vote yes or no on movies, games, food, usernames, books, aesthetics, and other candidates. See the live community foidslop verdict.';
  const schema = [
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Is It Foidslop?', applicationCategory: 'EntertainmentApplication', operatingSystem: 'Any', url: canonical(route), description },
    breadcrumb(route, 'Is It Foidslop?')
  ];
  const categories = [...new Set(trials.items.map(item => item.category))].sort();
  return `${head(route, title, description, schema)}${header(route)}<main id="main" class="culture-index culture-tool-page"><p class="content-eyebrow">Slop Trial / community court</p><h1>Is It Foidslop?</h1><p class="article-deck">A thing appears. You vote yes or no. The jury gets a percentage. Science advances.</p><section class="slop-trial" data-slop-trial><div class="slop-trial-toolbar"><label>Department <select data-trial-filter><option value="all">Everything</option>${categories.map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join('')}</select></label><button type="button" data-trial-share>Copy trial link</button></div><article class="slop-trial-card"><span data-trial-category></span><h2 data-trial-name></h2><p data-trial-prompt></p><div class="slop-trial-question">FOIDSLOP?</div><div class="slop-vote-buttons"><button type="button" data-vote="yes">YES</button><button type="button" data-vote="no">NO</button></div><p class="slop-trial-status" data-trial-status aria-live="polite"></p><p class="slop-trial-result" data-trial-result aria-live="polite"></p><button class="slop-next" type="button" data-trial-next>Next specimen</button></article></section><section class="culture-tool-links"><a href="slop-index"><strong>Media Index</strong><span>See the staff scores.</span></a><a href="slop-taxonomy"><strong>Slop Taxonomy</strong><span>See where the category sits.</span></a><a href="username-generator"><strong>Username Generator</strong><span>Generate a new problem.</span></a></section></main>${scriptData('slop-trial-data', trials.items)}<script src="slop-tools.js?v=20260906-1" defer></script>${footer(route)}`;
}

function renderUsernamePage() {
  const route = 'culture/username-generator';
  const title = 'Foidslop Username Generator';
  const description = 'Generate foidslop usernames from soft nouns, cursed modifiers, food words, gothic damage, and controlled 2009 spelling choices.';
  const schema = [
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: title, applicationCategory: 'EntertainmentApplication', operatingSystem: 'Any', url: canonical(route), description },
    breadcrumb(route, title)
  ];
  const options = Object.entries(usernames.categories).map(([key, group]) => `<option value="${esc(key)}">${esc(group.label)}</option>`).join('');
  return `${head(route, title, description, schema)}${header(route)}<main id="main" class="culture-index culture-tool-page"><p class="content-eyebrow">Generator / identity damage</p><h1>Foidslop Username Generator</h1><p class="article-deck">Soft noun. Optional damage. Controlled vowel crimes. No startup-name sludge.</p><section class="username-generator" data-username-generator><label>Department <select data-username-category><option value="mixed">Mixed</option>${options}</select></label><div class="username-output" data-username-output aria-live="polite"></div><div class="username-actions"><button type="button" data-username-generate>Generate another</button><button type="button" data-username-copy>Copy</button></div></section><section class="culture-tool-copy"><h2>How the machine works</h2><p>The base vocabulary comes from the same pattern documented in the foidslop usernames article: bunni, kitty, angel, fae, pixie, food words, gothic modifiers, digital damage, and small spelling mutations.</p><p>The generator uses curated word banks instead of gluing random pastel nouns together. It can still produce something embarrassing. That is part of the service.</p><a href="foidslop-usernames">Read the username field guide</a></section></main>${scriptData('username-generator-data', usernames)}<script src="slop-tools.js?v=20260906-1" defer></script>${footer(route)}`;
}

function renderTaxonomyPage() {
  const route = 'culture/slop-taxonomy';
  const title = 'The Slop Taxonomy';
  const description = 'A visual taxonomy of food slop, media slop, content slop, and posting slop, with foidslop, guyslop, wifechow, AI slop, and related branches.';
  const schema = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, url: canonical(route), description, hasPart: taxonomy.branches.flatMap(branch => branch.items).map(item => ({ '@type': 'Thing', name: item.name, url: `${BASE_URL}${item.href}` })) },
    breadcrumb(route, title)
  ];
  const branches = taxonomy.branches.map(branch => `<section class="taxonomy-branch"><div class="taxonomy-branch-head"><span>SLOP / ${esc(branch.name)}</span><h2>${esc(branch.name)}</h2><p>${esc(branch.description)}</p></div><div class="taxonomy-nodes">${branch.items.map(item => `<a href="${esc(item.href)}"><strong>${esc(item.name)}</strong><span>${esc(item.note)}</span></a>`).join('')}</div></section>`).join('');
  return `${head(route, title, description, schema)}${header(route)}<main id="main" class="culture-index taxonomy-page"><p class="content-eyebrow">Reference desk / the chart</p><h1>The Slop Taxonomy</h1><p class="article-deck">One word became a suffix. The suffix became departments. The departments now require a chart.</p><div class="taxonomy-root"><strong>SLOP</strong><span>Bulk, repetition, genre, insult, affection, or all five at once.</span></div><div class="taxonomy-grid">${branches}</div><section class="culture-tool-links"><a href="why-everything-is-slop"><strong>Why everything is slop</strong><span>Read the language history.</span></a><a href="../dictionary"><strong>Slop Dictionary</strong><span>Open the vocabulary department.</span></a><a href="is-it-foidslop"><strong>Slop Trial</strong><span>Put the taxonomy to a vote.</span></a></section></main>${footer(route)}`;
}

function renderAboutPage() {
  const route = 'about';
  const title = 'About foidslop';
  const description = 'foidslop publishes one recipe for one person every day, plus a culture desk for foidslop, internet slang, media, usernames, and slop taxonomy.';
  const schema = [
    { '@context': 'https://schema.org', '@type': 'AboutPage', name: title, url: canonical(route), description },
    breadcrumb(route, title)
  ];
  return `${head(route, title, description, schema)}${header(route, '')}<main id="main" class="article-page culture-article"><p class="content-eyebrow">About / publication notes</p><h1>foidslop</h1><p class="article-deck">One recipe for one person every day. Internet taxonomy when dinner is handled.</p><section><h2>What is this?</h2><p>foidslop started as a daily recipe publication for one person. Food is still the daily product.</p><p>The culture desk handles the rest: foidslop media, slang, usernames, games, aesthetics, the Slop Dictionary, community trials, and whatever category gets invented next.</p></section><section><h2>How it is made</h2><p>Recipes, dictionary entries, culture pieces, rankings, and source notes are curated in this repository and published as a static site. Reader recipe ratings and Slop Trial votes use first-party Cloudflare Pages Functions.</p><p>Corrections, sourcing rules, recipe standards, and the boring paperwork live on the Editorial Standards page so they do not have to live in the footer.</p></section><p class="article-cta"><a href="editorial-standards">Editorial standards</a><a href="privacy#contact">Contact</a><a href="culture">Culture desk</a></p></main>${footer(route)}`;
}

function weeklyIndex(length) {
  const stamp = Date.parse(`${today}T12:00:00Z`);
  return Math.abs(Math.floor(stamp / 604800000)) % length;
}
function patchHome() {
  const file = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<!-- culture-products:start -->[\s\S]*?<!-- culture-products:end -->/g, '');
  const article = culture.articles[weeklyIndex(culture.articles.length)];
  const trial = trials.items[weeklyIndex(trials.items.length)];
  const block = `<!-- culture-products:start --><div class="zine-culture-week"><a href="culture/${article.slug}"><span>FIELD NOTE</span><strong>${esc(article.title)}</strong><small>${esc(article.deck)}</small></a><a href="culture/is-it-foidslop?item=${trial.id}"><span>SLOP TRIAL</span><strong>Is ${esc(trial.name)} foidslop?</strong><small>Vote yes or no and see the community verdict.</small></a><a href="culture/username-generator"><span>GENERATOR</span><strong>Need a worse username?</strong><small>Soft nouns, gothic damage, controlled vowel crimes.</small></a></div><!-- culture-products:end -->`;
  if (!html.includes('<!-- culture-expansion:end -->')) throw new Error('Homepage culture module is missing');
  html = html.replace('<!-- culture-expansion:end -->', `${block}<!-- culture-expansion:end -->`);
  html = html.replace(/css\/culture\.css\?v=[0-9-]+/g, `css/culture.css?v=${STYLE_VERSION}`);
  const sameAs = JSON.stringify(identity.sameAs, null, 6).replace(/^/gm, '    ').trimStart();
  html = html.replace(/"sameAs": \[[\s\S]*?\n    \]/, `"sameAs": ${sameAs}`);
  write('index.html', html);
}

function patchExistingCultureMeta() {
  const targets = [
    ...dictionary.entries.map(entry => ({ route: entry.route || `dictionary/${entry.slug}`, label: entry.title, evidence: entry.evidence })),
    ...culture.articles.map(article => ({ route: `culture/${article.slug}`, label: article.title, evidence: article.evidence })),
    { route: 'culture', label: 'Culture' },
    { route: 'dictionary', label: 'The Slop Dictionary' },
    { route: 'culture/slop-index', label: 'The Foidslop Media Index' }
  ];
  for (const target of targets) {
    const file = path.join(ROOT, `${target.route}.html`);
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, 'utf8');
    html = html.replace(/css\/culture\.css\?v=[0-9-]+/g, `css/culture.css?v=${STYLE_VERSION}`)
      .replace(/\.\.\/css\/culture\.css\?v=[0-9-]+/g, `../css/culture.css?v=${STYLE_VERSION}`);
    html = html.replace(/<script type="application\/ld\+json" data-culture-breadcrumb>[\s\S]*?<\/script>/g, '');
    html = html.replace('</head>', `<script type="application/ld+json" data-culture-breadcrumb>${jsonLd(breadcrumb(target.route, target.label))}</script>\n</head>`);
    const first = target.evidence?.[0];
    if (first) {
      const image = `${BASE_URL}/${first.image}`;
      html = html.replace(/<meta property="og:image" content="[^"]+">/, `<meta property="og:image" content="${image}">`)
        .replace(/<meta name="twitter:image" content="[^"]+">/, `<meta name="twitter:image" content="${image}">`);
    }
    write(`${target.route}.html`, html);
  }
}

function patchSitemap() {
  const file = path.join(ROOT, 'sitemap.xml');
  let xml = fs.readFileSync(file, 'utf8');
  const routes = ['culture/is-it-foidslop', 'culture/username-generator', 'culture/slop-taxonomy', 'about'];
  for (const route of routes) xml = xml.replace(new RegExp(`<url><loc>${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/loc>[\\s\\S]*?<\\/url>\\n?`, 'g'), '');
  const additions = routes.map(route => `<url><loc>${BASE_URL}/${route}</loc><lastmod>${today}</lastmod></url>`).join('\n');
  xml = xml.replace('</urlset>', `${additions}\n</urlset>`);
  write('sitemap.xml', xml);
}

function patchRedirects() {
  const file = path.join(ROOT, '_redirects');
  let text = fs.readFileSync(file, 'utf8').replace(/\n?# culture-products:start[\s\S]*?# culture-products:end\n?/g, '\n');
  const routes = ['culture/is-it-foidslop', 'culture/username-generator', 'culture/slop-taxonomy', 'about'];
  const block = `# culture-products:start\n${routes.map(route => `/${route}.html /${route} 301`).join('\n')}\n# culture-products:end`;
  write('_redirects', `${text.trim()}\n\n${block}\n`);
}

function patchCultureFeed() {
  const file = path.join(ROOT, 'culture', 'feed.xml');
  if (!fs.existsSync(file)) return;
  let xml = fs.readFileSync(file, 'utf8').replace(/<!-- culture-products:start -->[\s\S]*?<!-- culture-products:end -->/g, '');
  const entries = [
    ['Is It Foidslop?', 'culture/is-it-foidslop', 'Community yes-or-no Slop Trials with live verdicts.'],
    ['Foidslop Username Generator', 'culture/username-generator', 'A curated foidslop username generator.'],
    ['The Slop Taxonomy', 'culture/slop-taxonomy', 'A visual map of food, media, content, and posting slop.']
  ].map(([title, route, summary]) => `<entry><title>${title}</title><id>${BASE_URL}/${route}</id><link href="${BASE_URL}/${route}"/><updated>${today}T12:00:00Z</updated><summary>${summary}</summary></entry>`).join('');
  xml = xml.replace('</feed>', `<!-- culture-products:start -->${entries}<!-- culture-products:end --></feed>`);
  write('culture/feed.xml', xml);
}

function checkGenerated() {
  const required = ['culture/is-it-foidslop.html', 'culture/username-generator.html', 'culture/slop-taxonomy.html', 'culture/slop-tools.js', 'about.html'];
  for (const file of required) if (!fs.existsSync(path.join(ROOT, file))) throw new Error(`Missing generated culture product: ${file}`);
  const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  if (!home.includes('zine-culture-week') || !home.includes('culture/is-it-foidslop')) throw new Error('Homepage weekly culture product strip is missing');
}

const errors = validate();
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
if (checkOnly) {
  console.log(`Culture products source is valid: ${trials.items.length} trials, ${Object.keys(usernames.categories).length} username departments, ${taxonomy.branches.length} taxonomy branches.`);
  process.exit(0);
}

write('culture/is-it-foidslop.html', renderTrialPage());
write('culture/username-generator.html', renderUsernamePage());
write('culture/slop-taxonomy.html', renderTaxonomyPage());
write('about.html', renderAboutPage());
patchHome();
patchExistingCultureMeta();
patchSitemap();
patchRedirects();
patchCultureFeed();
checkGenerated();
console.log('Published Is It Foidslop?, username generator, Slop Taxonomy, weekly culture strip, and About page.');
