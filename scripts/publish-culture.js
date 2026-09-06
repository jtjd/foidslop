#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BASE_URL = 'https://foidslop.com';
const DICTIONARY_FILE = path.join(ROOT, 'data', 'dictionary.json');
const CULTURE_FILE = path.join(ROOT, 'data', 'culture-articles.json');
const INDEX_FILE = path.join(ROOT, 'data', 'slop-index.json');
const STYLE_VERSION = '20260906-2';
const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const dateIndex = args.indexOf('--date');
const requestedDate = dateIndex >= 0 ? args[dateIndex + 1] : process.env.PUBLISH_DATE;
const today = requestedDate || new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());

function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function jsonLd(value) { return JSON.stringify(value, null, 2).replace(/<\//g, '<\\/'); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function write(file, content) { ensureDir(path.dirname(file)); fs.writeFileSync(file, content); }
function routeFile(route) { return path.join(ROOT, `${route}.html`); }
function canonical(route) { return route ? `${BASE_URL}/${route}` : BASE_URL; }
function iso(value) { return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')); }
function flattenStrings(value, output = []) {
  if (typeof value === 'string') output.push(value);
  else if (Array.isArray(value)) value.forEach(item => flattenStrings(item, output));
  else if (value && typeof value === 'object') Object.values(value).forEach(item => flattenStrings(item, output));
  return output;
}

const dictionary = readJson(DICTIONARY_FILE);
const culture = readJson(CULTURE_FILE);
const slopIndex = readJson(INDEX_FILE);
const dictionaryBySlug = new Map(dictionary.entries.map(entry => [entry.slug, entry]));
const cultureBySlug = new Map(culture.articles.map(article => [article.slug, article]));

const bannedStyle = [
  /\u2014/,
  /\bdelve(?:s|d)?\b/i,
  /\btapestry\b/i,
  /\bin today(?:'s|’s) (?:digital )?(?:world|landscape)\b/i,
  /\bit is important to (?:note|remember|understand)\b/i,
  /\bserves as a testament\b/i,
  /\bnavigate the complexities\b/i,
  /\bnot just .+ but also\b/i
];

function validateEvidence(owner, evidence, sectionCount, errors) {
  for (const [index, receipt] of (evidence || []).entries()) {
    const label = `${owner} evidence ${index + 1}`;
    for (const field of ['image', 'alt', 'caption', 'sourceLabel', 'sourceUrl']) {
      if (!String(receipt[field] || '').trim()) errors.push(`${label}: missing ${field}`);
    }
    if (!Number.isInteger(receipt.afterSection) || receipt.afterSection < 0 || receipt.afterSection >= sectionCount) errors.push(`${label}: invalid afterSection`);
    if (!/^culture\/receipts\/[a-z0-9-]+\.webp$/.test(receipt.image || '')) errors.push(`${label}: image must be a local WebP receipt`);
    if (!/^https:\/\//.test(receipt.sourceUrl || '')) errors.push(`${label}: invalid sourceUrl`);
    const imageFile = path.join(ROOT, receipt.image || '');
    if (!fs.existsSync(imageFile)) errors.push(`${label}: missing local image ${receipt.image}`);
    else if (fs.statSync(imageFile).size > 750000) errors.push(`${label}: image exceeds 750 KB`);
    if (!Number.isInteger(receipt.width) || receipt.width < 1 || !Number.isInteger(receipt.height) || receipt.height < 1) errors.push(`${label}: missing image dimensions`);
  }
}

function validateSource() {
  const errors = [];
  for (const [label, source] of [['dictionary', dictionary], ['culture', culture], ['slop index', slopIndex]]) {
    if (!iso(source.revisionDate)) errors.push(`${label}: invalid revisionDate`);
    for (const text of flattenStrings(source)) {
      for (const pattern of bannedStyle) if (pattern.test(text)) errors.push(`${label}: banned style pattern ${pattern} in ${JSON.stringify(text.slice(0, 100))}`);
    }
  }
  const seenDictionary = new Set();
  for (const entry of dictionary.entries || []) {
    if (!entry.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug)) errors.push(`dictionary: invalid slug ${entry.slug}`);
    if (seenDictionary.has(entry.slug)) errors.push(`dictionary: duplicate slug ${entry.slug}`);
    seenDictionary.add(entry.slug);
    for (const field of ['term', 'title', 'seoTitle', 'description', 'deck', 'definition']) if (!String(entry[field] || '').trim()) errors.push(`dictionary ${entry.slug}: missing ${field}`);
    if (!Array.isArray(entry.sections) || entry.sections.length < 3) errors.push(`dictionary ${entry.slug}: needs at least three sections`);
    if ((entry.seoTitle || '').length > 68) errors.push(`dictionary ${entry.slug}: seoTitle too long`);
    if ((entry.description || '').length < 90 || (entry.description || '').length > 180) errors.push(`dictionary ${entry.slug}: description should be 90-180 chars`);
    for (const slug of entry.related || []) if (!dictionaryBySlug.has(slug)) errors.push(`dictionary ${entry.slug}: unknown related slug ${slug}`);
    for (const source of entry.sources || []) if (!/^https:\/\//.test(source.url || '')) errors.push(`dictionary ${entry.slug}: invalid source URL`);
    validateEvidence(`dictionary ${entry.slug}`, entry.evidence, entry.sections.length, errors);
  }
  if (dictionaryBySlug.get('foidslop')?.route !== 'what-is-foidslop') errors.push('dictionary: foidslop must preserve /what-is-foidslop');
  if (dictionaryBySlug.get('foid')?.route !== 'what-does-foid-mean') errors.push('dictionary: foid must preserve /what-does-foid-mean');

  const seenCulture = new Set();
  for (const article of culture.articles || []) {
    if (!article.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug)) errors.push(`culture: invalid slug ${article.slug}`);
    if (seenCulture.has(article.slug)) errors.push(`culture: duplicate slug ${article.slug}`);
    seenCulture.add(article.slug);
    for (const field of ['title', 'seoTitle', 'description', 'eyebrow', 'deck']) if (!String(article[field] || '').trim()) errors.push(`culture ${article.slug}: missing ${field}`);
    if (!Array.isArray(article.sections) || article.sections.length < 4) errors.push(`culture ${article.slug}: needs at least four sections`);
    for (const slug of article.dictionaryLinks || []) if (!dictionaryBySlug.has(slug)) errors.push(`culture ${article.slug}: unknown dictionary slug ${slug}`);
    for (const source of article.sources || []) if (!/^https:\/\//.test(source.url || '')) errors.push(`culture ${article.slug}: invalid source URL`);
    validateEvidence(`culture ${article.slug}`, article.evidence, article.sections.length, errors);
  }
  if (!Array.isArray(slopIndex.items) || slopIndex.items.length < 8) errors.push('slop index: needs at least eight entries');
  const ids = new Set();
  for (const item of slopIndex.items || []) {
    if (!item.id || ids.has(item.id)) errors.push(`slop index: invalid or duplicate id ${item.id}`);
    ids.add(item.id);
    for (const field of ['name', 'type', 'tumblrResidue', 'actuallyGood', 'verdict']) if (!String(item[field] || '').trim()) errors.push(`slop index ${item.id}: missing ${field}`);
    for (const field of ['foidDensity', 'yearning', 'maleUnderstandability', 'slopFactor']) if (!Number.isFinite(Number(item[field]))) errors.push(`slop index ${item.id}: invalid ${field}`);
  }
  return errors;
}

function prefixFor(route) {
  if (route === 'culture' || route === 'dictionary') return '../';
  const depth = route.split('/').filter(Boolean).length;
  return depth > 1 ? '../'.repeat(depth - 1) : '';
}
function dictionaryRoute(entry) { return entry.route || `dictionary/${entry.slug}`; }
function dictionaryHref(slug, fromRoute) {
  const entry = dictionaryBySlug.get(slug);
  const target = dictionaryRoute(entry);
  const prefix = prefixFor(fromRoute);
  return `${prefix}${target}`;
}
function commonHead({ route, title, description, type = 'article', schema, rootFeed = false }) {
  const prefix = prefixFor(route);
  return `<!DOCTYPE html><html lang="en"><head>\n<script src="${prefix}cookie-consent.js?v=20260713-4" data-ga-id="G-VT527DETQ2" defer></script>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<link rel="icon" type="image/webp" sizes="512x512" href="/brand-icon.webp">\n<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">\n<link rel="manifest" href="${prefix}site.webmanifest">\n<title>${esc(title)}</title>\n<meta name="description" content="${esc(description)}">\n<meta name="robots" content="index,follow,max-image-preview:large">\n<link rel="canonical" href="${canonical(route)}">\n<meta property="og:site_name" content="foidslop">\n<meta property="og:title" content="${esc(title)}">\n<meta property="og:description" content="${esc(description)}">\n<meta property="og:url" content="${canonical(route)}">\n<meta property="og:type" content="${type}">\n<meta property="og:image" content="${BASE_URL}/og-image.png">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="${esc(title)}">\n<meta name="twitter:description" content="${esc(description)}">\n<meta name="twitter:image" content="${BASE_URL}/og-image.png">\n<link rel="alternate" type="application/atom+xml" title="foidslop culture" href="${BASE_URL}/culture/feed.xml">${rootFeed ? `\n<link rel="alternate" type="application/atom+xml" title="foidslop daily recipes" href="${BASE_URL}/feed.xml">` : ''}\n<link rel="preload" as="font" type="font/woff2" href="/fonts/inter-var.woff2" crossorigin>\n<link rel="preload" as="font" type="font/woff2" href="/fonts/bebas-neue-400.woff2" crossorigin>\n<link rel="stylesheet" href="${prefix}css/fonts.css?v=20260826-1">\n<link rel="stylesheet" href="${prefix}css/global.css?v=20260827-1">\n<link rel="stylesheet" href="${prefix}css/content.css?v=20260827-1">\n<link rel="stylesheet" href="${prefix}css/culture.css?v=${STYLE_VERSION}">\n<link rel="stylesheet" href="${prefix}css/theme.css?v=20260827-2">\n<script src="${prefix}theme.js?v=20260713-5"></script>\n<script type="application/ld+json">${jsonLd(schema)}</script>\n</head>`;
}
function header(route, active = '') {
  const prefix = prefixFor(route);
  const link = (href, label, key) => `<a href="${prefix}${href}" class="nav-link${active === key ? ' active' : ''}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`;
  return `<body><a href="#main" class="sr-only focusable">Skip to content</a><header class="site-header" id="site-header">\n  <a href="${prefix || '/'}" aria-label="foidslop home"><picture><source type="image/webp" srcset="${prefix}logo-header.webp"><img src="${prefix}logo-header.png" alt="FOID SLOP" class="logo" width="126" height="74"></picture></a>\n  <div class="site-header-center">Daily slop / culture / etc.</div>\n  <div class="header-right">\n    <button class="theme-toggle" type="button" aria-label="Switch color theme" aria-pressed="true"><span class="theme-toggle-mark" aria-hidden="true">*</span><span class="theme-toggle-label">Light mode</span></button>\n    ${link('slop/archive', 'Archive', 'archive')}\n    ${link('culture', 'Culture', 'culture')}\n    ${link('dictionary', 'Dictionary', 'dictionary')}\n    <a href="${prefix || '/'}#dispatch" class="nav-link header-dispatch">Dispatch</a>\n  </div>\n</header>`;
}
function footer(route) {
  const prefix = prefixFor(route);
  return `<footer><div class="footer-inner"><span class="footer-copy">&copy; 2026 foidslop</span><nav class="footer-links" aria-label="Footer navigation"><a href="${prefix}what-is-foidslop">What is foidslop?</a><span class="footer-dot"></span><a href="${prefix}dictionary">Dictionary</a><span class="footer-dot"></span><a href="${prefix}culture">Culture</a><span class="footer-dot"></span><a href="${prefix}slop/archive">Recipes</a><span class="footer-dot"></span><a href="${prefix}feed.xml">RSS</a><span class="footer-dot"></span><a href="${prefix}privacy">Privacy</a></nav></div></footer></body></html>`;
}
function sourceList(sources) {
  if (!sources?.length) return '';
  return `<section class="culture-sources"><p class="content-eyebrow">Sources / receipts</p><ul>${sources.map(source => `<li><a href="${esc(source.url)}" rel="external">${esc(source.label)}</a></li>`).join('')}</ul></section>`;
}
function receiptHtml(receipt, route) {
  const prefix = prefixFor(route);
  const transcript = receipt.transcript ? `<details class="culture-receipt-transcript"><summary>Transcript</summary><p>${esc(receipt.transcript)}</p></details>` : '';
  return `<figure class="culture-receipt"><a class="culture-receipt-image" href="${prefix}${esc(receipt.image)}"><img src="${prefix}${esc(receipt.image)}" alt="${esc(receipt.alt)}" width="${receipt.width}" height="${receipt.height}" loading="lazy" decoding="async"></a><figcaption><span class="content-eyebrow">Receipt</span><p>${esc(receipt.caption)}</p><a href="${esc(receipt.sourceUrl)}" rel="external">Source: ${esc(receipt.sourceLabel)}</a>${transcript}</figcaption></figure>`;
}
function sectionHtml(sections, evidence = [], route = '') {
  return sections.map((section, index) => {
    const receipts = evidence.filter(receipt => receipt.afterSection === index).map(receipt => receiptHtml(receipt, route)).join('');
    return `<section><h2>${esc(section.heading)}</h2>${section.paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}</section>${receipts}`;
  }).join('');
}
function relatedDictionary(entry, route) {
  const items = (entry.related || []).map(slug => dictionaryBySlug.get(slug)).filter(Boolean);
  if (!items.length) return '';
  return `<section class="culture-related"><p class="content-eyebrow">Related vocabulary</p><div class="culture-card-grid">${items.map(item => `<a class="culture-card" href="${dictionaryHref(item.slug, route)}"><span>${esc(item.term)}</span><strong>${esc(item.title)}</strong><p>${esc(item.definition)}</p></a>`).join('')}</div></section>`;
}
function renderDictionaryEntry(entry) {
  const route = dictionaryRoute(entry);
  const schema = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: entry.title, description: entry.description, datePublished: '2026-09-06', dateModified: dictionary.revisionDate, author: { '@type': 'Organization', name: 'foidslop', url: BASE_URL }, publisher: { '@type': 'Organization', name: 'foidslop', url: BASE_URL, logo: { '@type': 'ImageObject', url: `${BASE_URL}/brand-icon.webp` } }, mainEntityOfPage: canonical(route), about: [entry.term, 'internet slang'] },
    { '@context': 'https://schema.org', '@type': 'DefinedTerm', name: entry.term, description: entry.definition, url: canonical(route), inDefinedTermSet: `${BASE_URL}/dictionary` }
  ];
  return `${commonHead({ route, title: entry.seoTitle, description: entry.description, schema, rootFeed: true })}${header(route, 'dictionary')}<main id="main" class="article-page culture-article"><p class="content-eyebrow">Slop Dictionary / ${esc(entry.term)}</p><h1>${esc(entry.title)}</h1><p class="article-deck">${esc(entry.deck)}</p><aside class="culture-definition"><span>Short version</span><p>${esc(entry.definition)}</p></aside>${sectionHtml(entry.sections, entry.evidence, route)}${sourceList(entry.sources)}${relatedDictionary(entry, route)}<p class="article-cta"><a href="${prefixFor(route)}dictionary">Open the Slop Dictionary</a><a href="${prefixFor(route)}culture">Read Culture</a><a href="${prefixFor(route)}slop/archive">Eat something</a></p></main>${footer(route)}`;
}
function renderDictionaryIndex() {
  const route = 'dictionary';
  const entries = dictionary.entries.slice().sort((a, b) => a.term.localeCompare(b.term));
  const schema = { '@context': 'https://schema.org', '@type': 'DefinedTermSet', name: 'The Slop Dictionary', description: 'Internet vocabulary for foidslop, girl dinner, mogging, slop, and everything around them.', url: canonical(route), hasDefinedTerm: entries.map(entry => ({ '@type': 'DefinedTerm', name: entry.term, url: canonical(dictionaryRoute(entry)) })) };
  return `${commonHead({ route, title: 'The Slop Dictionary: Internet Slang Explained', description: 'Internet vocabulary nobody should reasonably need explained: foidslop, foid, femoid, mog, looksmaxxing, AI slop, girl dinner, and more.', schema })}${header(route, 'dictionary')}<main id="main" class="culture-index"><p class="content-eyebrow">Reference desk / internet vocabulary</p><h1>The Slop Dictionary</h1><p class="article-deck">Foid. Mog. Girl dinner. AI slop. The words keep multiplying.</p><div class="dictionary-list">${entries.map(entry => `<a href="${dictionaryRoute(entry).startsWith('dictionary/') ? entry.slug : `../${dictionaryRoute(entry)}`}" class="dictionary-row"><strong>${esc(entry.term)}</strong><span>${esc(entry.definition)}</span></a>`).join('')}</div></main>${footer(route)}`;
}
function cultureRelated(article) {
  const items = culture.articles.filter(candidate => candidate.slug !== article.slug).slice(0, 3);
  return `<section class="culture-related"><p class="content-eyebrow">More from the culture desk</p><div class="culture-card-grid">${items.map(item => `<a class="culture-card" href="${item.slug}"><span>${esc(item.eyebrow.replace('Field notes / ', ''))}</span><strong>${esc(item.title)}</strong><p>${esc(item.deck)}</p></a>`).join('')}</div></section>`;
}
function renderCultureArticle(article) {
  const route = `culture/${article.slug}`;
  const schema = { '@context': 'https://schema.org', '@type': 'Article', headline: article.title, description: article.description, datePublished: '2026-09-06', dateModified: culture.revisionDate, author: { '@type': 'Organization', name: 'foidslop', url: BASE_URL }, publisher: { '@type': 'Organization', name: 'foidslop', url: BASE_URL, logo: { '@type': 'ImageObject', url: `${BASE_URL}/brand-icon.webp` } }, mainEntityOfPage: canonical(route), about: article.dictionaryLinks || [] };
  const glossary = (article.dictionaryLinks || []).map(slug => dictionaryBySlug.get(slug)).filter(Boolean);
  return `${commonHead({ route, title: article.seoTitle, description: article.description, schema })}${header(route, 'culture')}<main id="main" class="article-page culture-article"><p class="content-eyebrow">${esc(article.eyebrow)}</p><h1>${esc(article.title)}</h1><p class="article-deck">${esc(article.deck)}</p>${sectionHtml(article.sections, article.evidence, route)}${glossary.length ? `<aside class="culture-glossary"><span>Vocabulary involved</span>${glossary.map(entry => `<a href="../${dictionaryRoute(entry)}">${esc(entry.term)}</a>`).join('')}</aside>` : ''}${sourceList(article.sources)}${cultureRelated(article)}</main>${footer(route)}`;
}
function renderCultureIndex() {
  const route = 'culture';
  const schema = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'foidslop Culture', description: 'Foidslop, slang, and other internet categories.', url: canonical(route), hasPart: culture.articles.map(article => ({ '@type': 'Article', headline: article.title, url: `${BASE_URL}/culture/${article.slug}` })) };
  return `${commonHead({ route, title: 'Culture: Foidslop, Slang and Internet Taxonomy', description: 'Foidslop media, usernames, slop vocabulary, girl dinner, internet taxonomy, and other extremely online subjects.', schema })}${header(route, 'culture')}<main id="main" class="culture-index"><p class="content-eyebrow">The culture desk</p><h1>Field notes from internet culture.</h1><p class="article-deck">Food is still daily. The rest gets filed here.</p><div class="culture-feature-grid">${culture.articles.map((article, index) => `<a class="culture-feature${index === 0 ? ' culture-feature--lead' : ''}" href="${article.slug}"><span>${esc(article.eyebrow.replace('Field notes / ', ''))}</span><strong>${esc(article.title)}</strong><p>${esc(article.deck)}</p></a>`).join('')}<a class="culture-feature" href="slop-index"><span>classification desk</span><strong>The Foidslop Media Index</strong><p>Extremely serious measurements of foid density, yearning, Tumblr residue, and other peer-reviewed metrics.</p></a></div><section class="culture-index-dictionary"><p class="content-eyebrow">Need a word explained?</p><h2>The Slop Dictionary</h2><p>Mog. Femoid. AI slop. Looksmaxxing. Words from 4chan, Reddit, TikTok, fandoms, forums, and everywhere else they escape to.</p><a href="../dictionary">Open the dictionary</a></section></main>${footer(route)}`;
}
function renderSlopIndex() {
  const route = 'culture/slop-index';
  const schema = { '@context': 'https://schema.org', '@type': 'ItemList', name: slopIndex.title, description: slopIndex.description, itemListElement: slopIndex.items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name })) };
  return `${commonHead({ route, title: slopIndex.title, description: slopIndex.description, schema })}${header(route, 'culture')}<main id="main" class="culture-index slop-index"><p class="content-eyebrow">Classification desk / extremely serious metrics</p><h1>${esc(slopIndex.title)}</h1><p class="article-deck">${esc(slopIndex.description)}</p><div class="slop-index-grid">${slopIndex.items.map(item => `<article class="slop-index-card"><div class="slop-index-card-head"><span>${esc(item.type)}</span><strong>${esc(item.name)}</strong></div><dl><div><dt>Foid Density</dt><dd>${item.foidDensity}%</dd></div><div><dt>Yearning</dt><dd>${item.yearning}%</dd></div><div><dt>Male Understandability</dt><dd>${item.maleUnderstandability}%</dd></div><div><dt>Tumblr Residue</dt><dd>${esc(item.tumblrResidue)}</dd></div><div><dt>Slop Factor</dt><dd>${Number(item.slopFactor).toFixed(1)}</dd></div><div><dt>Actually Good</dt><dd>${esc(item.actuallyGood)}</dd></div></dl><p>${esc(item.verdict)}</p></article>`).join('')}</div><p class="slop-index-note">Methodology: vibes, screenshots, rewatch frequency, fandom residue, and one extremely biased spreadsheet.</p></main>${footer(route)}`;
}
function renderCultureFeed() {
  const entries = culture.articles.map(article => `<entry><title>${esc(article.title)}</title><id>${BASE_URL}/culture/${article.slug}</id><link href="${BASE_URL}/culture/${article.slug}"/><updated>${culture.revisionDate}T12:00:00Z</updated><summary>${esc(article.description)}</summary></entry>`).join('');
  return `<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>foidslop culture</title><id>${BASE_URL}/culture</id><link href="${BASE_URL}/culture/feed.xml" rel="self"/><link href="${BASE_URL}/culture"/><updated>${culture.revisionDate}T12:00:00Z</updated>${entries}</feed>`;
}
function patchHome() {
  const file = path.join(ROOT, 'index.html');
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<!-- culture-expansion:start -->[\s\S]*?<!-- culture-expansion:end -->/g, '');
  if (!html.includes('css/culture.css')) html = html.replace('</head>', `<link rel="stylesheet" href="css/culture.css?v=${STYLE_VERSION}">\n</head>`);
  if (!html.includes('property="og:site_name"')) html = html.replace('<meta property="og:title"', '<meta property="og:site_name" content="foidslop">\n<meta property="og:title"');
  html = html.replace('"@type": "WebSite",\n    "name": "foidslop",', '"@type": "WebSite",\n    "name": "foidslop",\n    "alternateName": ["Foid Slop", "foidslop.com"],');
  if (!html.includes('href="culture" class="nav-link"')) html = html.replace(/(<a href="slop\/archive"[^>]*>Archive<\/a>)/, '$1\n    <a href="culture" class="nav-link">Culture</a>');
  const module = `<!-- culture-expansion:start --><section class="zine-culture" aria-labelledby="culture-desk-title"><div class="zine-section-head"><h2 id="culture-desk-title">Elsewhere in the slop</h2><a href="culture">Open culture desk</a></div><div class="zine-culture-grid">${culture.articles.slice(0, 3).map(article => `<a href="culture/${article.slug}"><span>${esc(article.eyebrow.replace('Field notes / ', ''))}</span><strong>${esc(article.title)}</strong><p>${esc(article.deck)}</p></a>`).join('')}</div><div class="zine-culture-bottom"><a href="dictionary"><strong>Slop Dictionary</strong><span>Internet vocabulary for foidslop, girl dinner, mogging, slop, and everything around them.</span></a><a href="culture/slop-index"><strong>Foidslop Media Index</strong><span>Yearning has now been quantified. The spreadsheet is thriving.</span></a></div></section><!-- culture-expansion:end -->`;
  html = html.replace('<footer>', `${module}<footer>`);
  write(file, html);
}
function patchNavigation() {
  const roots = [ROOT, path.join(ROOT, 'recipes'), path.join(ROOT, 'slop'), path.join(ROOT, 'slop', 'archive')];
  for (const dir of roots) {
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
      const file = path.join(dir, entry.name);
      if (file.includes(`${path.sep}culture${path.sep}`) || file.includes(`${path.sep}dictionary${path.sep}`)) continue;
      let html = fs.readFileSync(file, 'utf8');
      if (!html.includes('class="site-header"') || /class="nav-link[^\"]*">Culture<\/a>/.test(html)) continue;
      const rel = path.relative(ROOT, file).replace(/\\/g, '/');
      const depth = rel.split('/').length - 1;
      const prefix = depth ? '../'.repeat(depth) : '';
      html = html.replace(/(<a href="[^"]*slop\/archive"[^>]*>Archive<\/a>)/, `$1\n    <a href="${prefix}culture" class="nav-link">Culture</a>`);
      write(file, html);
    }
  }
}
function patchSitemap() {
  const file = path.join(ROOT, 'sitemap.xml');
  if (!fs.existsSync(file)) return;
  let xml = fs.readFileSync(file, 'utf8');
  xml = xml.replace(/<url><loc>https:\/\/foidslop\.com\/(?:culture|dictionary)(?:\/[^<]*)?<\/loc>[\s\S]*?<\/url>\n?/g, '');
  const routes = [
    { route: 'culture', date: culture.revisionDate },
    ...culture.articles.map(article => ({ route: `culture/${article.slug}`, date: culture.revisionDate })),
    { route: 'culture/slop-index', date: slopIndex.revisionDate },
    { route: 'dictionary', date: dictionary.revisionDate },
    ...dictionary.entries.filter(entry => !entry.route).map(entry => ({ route: `dictionary/${entry.slug}`, date: dictionary.revisionDate }))
  ];
  const additions = routes.map(item => `<url><loc>${BASE_URL}/${item.route}</loc><lastmod>${item.date}</lastmod></url>`).join('\n');
  xml = xml.replace('</urlset>', `${additions}\n</urlset>`);
  write(file, xml);
}
function patchRedirects() {
  const file = path.join(ROOT, '_redirects');
  if (!fs.existsSync(file)) return;
  let text = fs.readFileSync(file, 'utf8').replace(/\n?# culture-expansion:start[\s\S]*?# culture-expansion:end\n?/g, '\n');
  const routes = ['culture', ...culture.articles.map(a => `culture/${a.slug}`), 'culture/slop-index', 'dictionary', ...dictionary.entries.filter(entry => !entry.route).map(entry => `dictionary/${entry.slug}`)];
  const block = `# culture-expansion:start\n${routes.map(route => `/${route}.html /${route} 301`).join('\n')}\n/culture/index.html /culture 301\n/dictionary/index.html /dictionary 301\n# culture-expansion:end`;
  write(file, `${text.trim()}\n\n${block}\n`);
}
function generate() {
  ensureDir(path.join(ROOT, 'culture'));
  ensureDir(path.join(ROOT, 'dictionary'));
  for (const entry of dictionary.entries) write(routeFile(dictionaryRoute(entry)), renderDictionaryEntry(entry));
  write(path.join(ROOT, 'dictionary', 'index.html'), renderDictionaryIndex());
  for (const article of culture.articles) write(path.join(ROOT, 'culture', `${article.slug}.html`), renderCultureArticle(article));
  write(path.join(ROOT, 'culture', 'index.html'), renderCultureIndex());
  write(path.join(ROOT, 'culture', 'slop-index.html'), renderSlopIndex());
  write(path.join(ROOT, 'culture', 'feed.xml'), renderCultureFeed());
  patchHome();
  patchNavigation();
  patchSitemap();
  patchRedirects();
}

const errors = validateSource();
if (errors.length) {
  console.error(`Culture validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
if (checkOnly) {
  console.log(`Culture source valid: ${dictionary.entries.length} dictionary entries, ${culture.articles.length} articles, ${slopIndex.items.length} index entries.`);
  process.exit(0);
}
generate();
console.log(`Published culture expansion for ${today}: ${dictionary.entries.length} dictionary entries, ${culture.articles.length} articles, ${slopIndex.items.length} media classifications.`);
