#!/usr/bin/env node

/**
 * Deterministic static-site publisher for foidslop.
 *
 * The release date is derived from the meal id (meal 1 = 2026-05-01), so a
 * missed scheduled run cannot leave the site behind. Re-running for the same
 * date produces the same public state.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SLOP_DIR = path.join(ROOT, 'slop');
const RECIPE_HUB_DIR = path.join(ROOT, 'recipes');
const DB_FILE = path.join(ROOT, 'foidslop-meals.json');
const BASE_URL = 'https://foidslop.com';
const FIRST_RELEASE = new Date('2026-05-01T12:00:00Z');
const TZ = 'America/New_York';

function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function xml(value) { return esc(value); }
function isoDate(date) { return date.toISOString().slice(0, 10); }
function releaseDate(meal) {
  if (meal.publishDate) return new Date(`${meal.publishDate}T12:00:00Z`);
  const date = new Date(FIRST_RELEASE);
  date.setUTCDate(date.getUTCDate() + Number(meal.id) - 1);
  return date;
}
function prettyDate(date) {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}
function shortDate(date) {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}
function newYorkDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(now).reduce((out, part) => (out[part.type] = part.value, out), {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function minutes(value) {
  const match = String(value || '').match(/\d+/);
  return match ? Number(match[0]) : 0;
}
function duration(value) { return `PT${minutes(value)}M`; }
function recipeUrl(meal) { return `${BASE_URL}/slop/${meal.slug}`; }
function imageUrl(meal) { return `${BASE_URL}/slop/img/${meal.slug}.jpg`; }
function schemaImages(meal) { return [imageUrl(meal), `${BASE_URL}/slop/img/${meal.slug}-4x3.jpg`, `${BASE_URL}/slop/img/${meal.slug}-16x9.jpg`]; }
function titleLines(name) {
  const words = name.toUpperCase().split(/\s+/);
  const midpoint = Math.ceil(words.length / 2);
  const first = esc(words.slice(0, midpoint).join(' '));
  const second = esc(words.slice(midpoint).join(' '));
  return second ? `${first}<br>${second}.` : `${first}.`;
}
function jsonLd(data) { return JSON.stringify(data, null, 2).replace(/<\//g, '<\\/'); }

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const meals = (db.meals || db).slice().sort((a, b) => a.id - b.id);

let dateOverride = null;
let setOverride = null;
let validateOnly = false;
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i] === '--date') dateOverride = process.argv[++i];
  else if (process.argv[i] === '--set') setOverride = process.argv[++i];
  else if (process.argv[i] === '--check') validateOnly = true;
}

const today = dateOverride || newYorkDate();
if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) throw new Error(`Invalid --date value: ${today}`);
let published = meals.filter(meal => isoDate(releaseDate(meal)) <= today && meal.status !== 'retired');
if (setOverride) {
  const selected = meals.find(meal => meal.slug === setOverride || String(meal.id) === String(setOverride));
  if (!selected) throw new Error(`Unknown meal: ${setOverride}`);
  published = meals.filter(meal => meal.id <= selected.id && meal.status !== 'retired');
}
if (!published.length) throw new Error(`No meals are published by ${today}`);
const current = published[published.length - 1];

for (const meal of meals) {
  if (meal.status !== 'retired') meal.status = isoDate(releaseDate(meal)) <= today ? 'published' : 'scheduled';
}
db.meals = meals;
db.count = meals.length;
db.generated = `${today}T00:00:00.000Z`;

function validate() {
  const errors = [];
  const ids = new Set();
  const slugs = new Set();
  for (const meal of meals) {
    if (ids.has(meal.id)) errors.push(`Duplicate id: ${meal.id}`);
    if (slugs.has(meal.slug)) errors.push(`Duplicate slug: ${meal.slug}`);
    ids.add(meal.id); slugs.add(meal.slug);
    if (!meal.name || !meal.slug || !meal.description) errors.push(`Missing required content for meal ${meal.id}`);
    if (!Array.isArray(meal.ingredients) || !meal.ingredients.length) errors.push(`Missing ingredients: ${meal.slug}`);
    if (!Array.isArray(meal.steps) || !meal.steps.length) errors.push(`Missing steps: ${meal.slug}`);
    if (releaseDate(meal).toString() === 'Invalid Date') errors.push(`Invalid release date: ${meal.slug}`);
  }
  for (const meal of published) {
    const image = path.join(SLOP_DIR, 'img', `${meal.slug}.jpg`);
    if (!fs.existsSync(image)) errors.push(`Missing published image: ${meal.slug}`);
  }
  if (errors.length) throw new Error(`Content validation failed:\n- ${errors.join('\n- ')}`);
}
validate();
if (validateOnly) {
  console.log(`Validated ${meals.length} meals; ${published.length} published through ${today}.`);
  process.exit(0);
}
fs.writeFileSync(DB_FILE, `${JSON.stringify(db, null, 2)}\n`);

function commonHead({ title, description, canonical, image = `${BASE_URL}/og-image.jpg`, type = 'website', root = '' }) {
  return `
<script src="${root}cookie-consent.js" data-ga-id="G-VT527DETQ2"></script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" href="${root}favicon.ico">
<link rel="apple-touch-icon" sizes="180x180" href="${root}apple-touch-icon.png">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="${type}">
<meta property="og:image" content="${image}">
<meta property="og:image:alt" content="${esc(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${image}">
<link rel="alternate" type="application/atom+xml" title="foidslop — Daily Recipes" href="${BASE_URL}/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap">
<link rel="stylesheet" href="${root}css/global.css">`;
}

function header(root = '', active = '') {
  const homeUrl = root || '/';
  return `<header class="site-header" id="site-header">
  <a href="${homeUrl}" aria-label="foidslop home"><img src="${root}logo.webp" alt="foidslop" class="logo" width="120" height="30"></a>
  <div class="header-right">
    <a href="${homeUrl}" class="nav-link${active === 'home' ? ' active' : ''}">Home</a>
    <a href="${root}slop/${current.slug}" class="nav-link${active === 'today' ? ' active' : ''}">Slop of the Day</a>
    <a href="${root}slop/archive" class="nav-link${active === 'archive' ? ' active' : ''}">Archive</a>
    <a href="${root}what-is-foidslop" class="nav-link${active === 'meaning' ? ' active' : ''}">Meaning</a>
    <a href="https://shop.foidslop.com/" target="_blank" rel="noopener noreferrer" class="header-cta">Shop Now</a>
    <button class="nav-hamburger" id="nav-hamburger" aria-label="Open navigation" aria-expanded="false" aria-controls="nav-dropdown"><span></span><span></span><span></span></button>
  </div>
  <nav class="nav-dropdown" id="nav-dropdown" aria-label="Site navigation" aria-hidden="true">
    <a href="${homeUrl}" class="nav-dropdown-link">Home</a>
    <a href="${root}slop/${current.slug}" class="nav-dropdown-link">Slop of the Day</a>
    <a href="${root}slop/archive" class="nav-dropdown-link">Slop Archive</a>
    <a href="${root}what-is-foidslop" class="nav-dropdown-link">What is foidslop?</a>
    <a href="https://shop.foidslop.com/" class="nav-dropdown-link nav-dropdown-shop" target="_blank" rel="noopener noreferrer">Shop Now ↗</a>
  </nav>
</header>`;
}

function footer(root = '') {
  return `<footer><div class="footer-inner">
  <span class="footer-copy">&copy; ${new Date().getFullYear()} foidslop</span>
  <nav class="footer-links" aria-label="Footer navigation">
    <a href="${root}what-is-foidslop">What is foidslop?</a><span class="footer-dot"></span>
    <a href="${root}editorial-standards">Editorial standards</a><span class="footer-dot"></span>
    <a href="${root}privacy">Privacy</a>
  </nav>
</div></footer>`;
}

const siteScript = `<script>
const header=document.getElementById('site-header'),button=document.getElementById('nav-hamburger'),menu=document.getElementById('nav-dropdown');
if(button&&menu){button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!open));menu.setAttribute('aria-hidden',String(open));button.classList.toggle('open',!open);menu.classList.toggle('open',!open)});}
</script>`;

function relatedMeals(meal) {
  return published.filter(candidate => candidate.slug !== meal.slug)
    .map(candidate => ({ candidate, score: (candidate.category === meal.category ? 4 : 0) + candidate.tags.filter(tag => meal.tags.includes(tag)).length }))
    .sort((a, b) => b.score - a.score || b.candidate.id - a.candidate.id).slice(0, 4).map(item => item.candidate);
}

function recipeCard(meal, prefix = '') {
  return `<article class="related-card"><a href="${prefix}slop/${meal.slug}">
    <picture><source type="image/webp" srcset="${prefix}slop/img/${meal.slug}-480.webp 480w, ${prefix}slop/img/${meal.slug}-768.webp 768w" sizes="(max-width: 560px) 100vw, (max-width: 960px) 50vw, 25vw"><img src="${prefix}slop/img/${meal.slug}.jpg" alt="${esc(meal.imageAlt || meal.name)}" width="360" height="360" loading="lazy"></picture>
    <span>${esc(meal.name)}</span></a></article>`;
}

function renderRecipe(meal, index) {
  const date = releaseDate(meal);
  const previous = published[index - 1];
  const next = published[index + 1];
  const total = minutes(meal.prep) + minutes(meal.cook);
  const schema = {
    '@context': 'https://schema.org', '@type': 'Recipe', '@id': `${recipeUrl(meal)}#recipe`,
    mainEntityOfPage: recipeUrl(meal), name: meal.name, description: meal.description,
    image: schemaImages(meal), author: { '@type': 'Organization', name: 'foidslop', url: BASE_URL },
    datePublished: isoDate(date), keywords: meal.tags.join(', '), recipeCategory: meal.category,
    recipeCuisine: meal.cuisine, prepTime: duration(meal.prep), cookTime: duration(meal.cook),
    totalTime: `PT${total}M`, recipeYield: meal.serves,
    recipeIngredient: meal.ingredients.map(item => `${item.amount} ${item.name}`),
    recipeInstructions: meal.steps.map(step => ({ '@type': 'HowToStep', name: step.name, text: step.text }))
  };
  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
    { '@type': 'ListItem', position: 2, name: 'Slop Archive', item: `${BASE_URL}/slop/archive` },
    { '@type': 'ListItem', position: 3, name: meal.name, item: recipeUrl(meal) }
  ] };
  const related = relatedMeals(meal);
  return `<!DOCTYPE html><html lang="en"><head>${commonHead({
    title: `${meal.name} Recipe | foidslop`, description: `${meal.description} An easy recipe for one with ingredients and step-by-step instructions.`,
    canonical: recipeUrl(meal), image: imageUrl(meal), type: 'article', root: '../'
  })}
<script type="application/ld+json">${jsonLd([schema, breadcrumb])}</script>
<link rel="stylesheet" href="../css/slop-page.css?v=20260713-2"></head><body>
<a href="#main" class="sr-only focusable">Skip to content</a>${header('../', meal.slug === current.slug ? 'today' : '')}
<div class="slop-header"><p class="slop-eyebrow">Slop of the Day — ${prettyDate(date)}</p><h1 class="slop-title">${titleLines(meal.name)}</h1>
<div class="slop-meta"><span class="slop-date">Published ${prettyDate(date)}</span><div class="slop-tags">${meal.tags.map(tag => `<span class="slop-tag">${esc(tag)}</span>`).join('')}</div></div></div>
<main id="main"><div class="slop-body"><div class="slop-image-panel"><picture><source type="image/webp" srcset="img/${meal.slug}-480.webp 480w, img/${meal.slug}-768.webp 768w" sizes="(max-width: 900px) 100vw, 50vw"><img src="img/${meal.slug}.jpg" alt="${esc(meal.imageAlt || meal.name)}" width="768" height="768" loading="eager" fetchpriority="high"></picture><span class="slop-image-caption">${esc(meal.name)} — foidslop</span></div>
<div class="slop-content"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="../">Home</a><span>/</span><a href="./archive">Archive</a><span>/</span><span class="current">${esc(meal.name)}</span></nav>
<p class="slop-desc">${esc(meal.description)}</p><p class="section-label">At a Glance</p><div class="slop-stats" role="list">
<div class="slop-stat"><div class="slop-stat-label">Prep</div><div class="slop-stat-value">${esc(meal.prep)}</div></div><div class="slop-stat"><div class="slop-stat-label">Cook</div><div class="slop-stat-value">${esc(meal.cook)}</div></div><div class="slop-stat"><div class="slop-stat-label">Serves</div><div class="slop-stat-value">${esc(meal.serves)}</div></div><div class="slop-stat"><div class="slop-stat-label">Difficulty</div><div class="slop-stat-value">${esc(meal.difficulty)}</div></div></div>
<p class="section-label">Ingredients</p><ul class="ingredients-list">${meal.ingredients.map(item => `<li class="ingredient-item"><span class="ingredient-name">${esc(item.name)}</span><span class="ingredient-amount">${esc(item.amount)}</span></li>`).join('')}</ul>
<p class="section-label">Method</p><ol class="steps-list">${meal.steps.map((step, stepIndex) => `<li class="step-item"><span class="step-number">${String(stepIndex + 1).padStart(2, '0')}</span><div class="step-content"><p class="step-name">${esc(step.name)}</p><p class="step-text">${esc(step.text)}</p></div></li>`).join('')}</ol>
<div class="slop-notes"><p class="slop-notes-label">Slop Notes</p><p>${esc(meal.notes)}</p></div>
<p class="recipe-trust">Recipe by foidslop · <a href="../editorial-standards">How we create our recipes</a></p></div></div>
<section class="related-recipes" aria-labelledby="related-title"><p class="section-label">Keep eating</p><h2 id="related-title">Related recipes</h2><div class="related-grid">${related.map(item => recipeCard(item, '../')).join('')}</div></section>
<nav class="slop-nav" aria-label="Other slops">${previous ? `<a href="./${previous.slug}" class="slop-nav-item prev"><span class="slop-nav-dir">← Previous Slop</span><span class="slop-nav-name">${esc(previous.name)}</span><span class="slop-nav-date">${prettyDate(releaseDate(previous))}</span></a>` : '<span></span>'}${next ? `<a href="./${next.slug}" class="slop-nav-item next"><span class="slop-nav-dir">Next Slop →</span><span class="slop-nav-name">${esc(next.name)}</span><span class="slop-nav-date">${prettyDate(releaseDate(next))}</span></a>` : `<a href="./today" class="slop-nav-item next"><span class="slop-nav-dir">Next Slop →</span><span class="slop-nav-name">Check back tomorrow</span></a>`}</nav></main>
${footer('../')}${siteScript}</body></html>`;
}

function updateHomepage() {
  const file = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  const recent = published.slice(-16, -1).map(meal => `<div class="scroll-card"><a href="slop/${meal.slug}"><div class="scroll-card-img"><img src="slop/img/${meal.slug}.jpg" alt="${esc(meal.imageAlt || meal.name)}" width="400" height="400" loading="lazy"></div><div class="scroll-card-info"><div class="scroll-card-name">${esc(meal.name)}</div><div class="scroll-card-price">${shortDate(releaseDate(meal))}</div></div></a></div>`).join('\n      ');
  html = html.replace(/(<a href=")slop\/[a-z0-9-]+(?:\.html)?(" class="hero-sotd")/g, `$1slop/${current.slug}$2`)
    .replace(/(<a href=")slop\/[a-z0-9-]+(?:\.html)?(" class="nav-link" id="sotd-nav)/g, `$1slop/${current.slug}$2`)
    .replace(/slop\/[a-z0-9-]+(?:\.html)?(?=" class="nav-dropdown-link" id="sotd-nav-mobile)/g, `slop/${current.slug}`)
    .replace(/slop\/[a-z0-9-]+(?:\.html)?(?=" class="hero-sotd-banner)/g, `slop/${current.slug}`)
    .replace(/slop\/[a-z0-9-]+(?:\.html)?(?=" class="daily-slop-img-link)/g, `slop/${current.slug}`)
    .replace(/slop\/[a-z0-9-]+(?:\.html)?(?=" class="btn-shop daily-slop-btn)/g, `slop/${current.slug}`)
    .replace(/(id="sotd-link" aria-label="Today's slop: )[^\"]+/, `$1${esc(current.name)}`)
    .replace(/(<img src="slop\/img\/)[^"]+(" id="sotd-img" alt=")[^"]+/, `$1${current.slug}.jpg$2${esc(current.imageAlt || current.name)}`)
    .replace(/(<p class="hero-sotd-name" id="sotd-title">)[^<]+/, `$1${esc(current.name)}`)
    .replace(/(<p class="hero-sotd-desc" id="sotd-desc">)[^<]+/, `$1${esc(current.description)}`)
    .replace(/(class="hero-sotd-banner-image">\s*<img src="slop\/img\/)[^"]+(" alt=")[^"]+/, `$1${current.slug}.jpg$2${esc(current.imageAlt || current.name)}`)
    .replace(/(class="hero-sotd-banner-text">[\s\S]*?<p class="hero-sotd-name">)[^<]+/, `$1${esc(current.name)}`)
    .replace(/(class="hero-sotd-banner-text">[\s\S]*?<p class="hero-sotd-desc">)[^<]+/, `$1${esc(current.description)}`)
    .replace(/(<h2 class="slop-counter-number"[^>]*>)[^<]+/, `$1${String(current.id).padStart(3, '0')}`)
    .replace(/(<h3 class="slop-counter-title"[^>]*>)[^<]+/, `$1${esc(current.name)}`)
    .replace(/(<p class="slop-counter-desc"[^>]*>)[^<]+/, `$1${esc(current.description)}`)
    .replace(/(<img src="slop\/img\/)[^"]+(" id="slop-counter-img" alt=")[^"]+/, `$1${current.slug}.jpg$2${esc(current.imageAlt || current.name)}`)
    .replace(/(<!-- RECENTLY_EATEN_START -->)[\s\S]*?(<!-- RECENTLY_EATEN_END -->)/, `$1\n      ${recent}\n      $2`)
    .replace(/href="index\.html"/g, 'href="/"')
    .replace(/privacy\.html/g, 'privacy')
    .replace(/slop\/archive\.html/g, 'slop/archive')
    .replace(/slop\/([a-z0-9-]+)\.html/g, 'slop/$1');
  fs.writeFileSync(file, html);
}

function archiveCard(meal) {
  return `<article class="archive-card reveal"><a href="./${meal.slug}"><div class="archive-card-img"><picture><source type="image/webp" srcset="img/${meal.slug}-480.webp 480w, img/${meal.slug}-768.webp 768w" sizes="(max-width: 560px) 100vw, (max-width: 960px) 50vw, 33vw"><img src="img/${meal.slug}.jpg" alt="${esc(meal.imageAlt || meal.name)}" width="600" height="600" loading="lazy"></picture></div><div class="archive-card-body"><p class="archive-card-name">${esc(meal.name)}</p><div class="archive-card-meta"><span class="archive-card-date">${shortDate(releaseDate(meal))}</span><div class="archive-card-tags">${meal.tags.slice(0, 2).map(tag => `<span class="archive-card-tag">${esc(tag)}</span>`).join('')}</div></div></div></a></article>`;
}

function updateArchive() {
  const file = path.join(SLOP_DIR, 'archive.html');
  let html = fs.readFileSync(file, 'utf8');
  const archiveSchema = { '@context': 'https://schema.org', '@type': 'ItemList', name: 'foidslop Recipe Archive', itemListElement: published.slice().reverse().map((meal, index) => ({ '@type': 'ListItem', position: index + 1, url: recipeUrl(meal), name: meal.name })) };
  html = html.replace(/<link rel="canonical" href="[^"]+">/, `<link rel="canonical" href="${BASE_URL}/slop/archive">`)
    .replace(/<meta property="og:url" content="[^"]+">/, `<meta property="og:url" content="${BASE_URL}/slop/archive">`)
    .replace(/<a href="\.\/[^"]+" class="nav-link" id="sotd-link">/, `<a href="./${current.slug}" class="nav-link" id="sotd-link">`)
    .replace(/<a href="\.\/[^"]+" class="nav-dropdown-link" id="sotd-nav-dropdown">/, `<a href="./${current.slug}" class="nav-dropdown-link" id="sotd-nav-dropdown">`)
    .replace(/(<a href="\.\/)[^"]+(" class="featured-slop)/, `$1${current.slug}$2`)
    .replace(/(class="featured-image reveal-clip">\s*<img src="img\/)[^"]+(" alt=")[^"]+/, `$1${current.slug}.jpg$2${esc(current.imageAlt || current.name)}`)
    .replace(/(<p class="featured-eyebrow">)[^<]+/, `$1${prettyDate(releaseDate(current))}`)
    .replace(/(<h2 class="featured-title">)[\s\S]*?(<\/h2>)/, `$1${titleLines(current.name)}$2`)
    .replace(/(<p class="featured-desc">)[^<]+/, `$1${esc(current.description)}`)
    .replace(/(<p class="featured-date">Published )[^<]+/, `$1${prettyDate(releaseDate(current))}`)
    .replace(/(<span class="archive-count"[^>]*>)[^<]+/, `$1${published.length} recipes`)
    .replace(/(<section class="archive-grid"[^>]*>)[\s\S]*?(<\/section>)/, `$1\n${published.slice().reverse().map(archiveCard).join('\n')}\n$2`)
    .replace(/\.html(?=["'])/g, '');
  const schemaTag = `<script id="archive-schema" type="application/ld+json">${jsonLd(archiveSchema)}</script>`;
  if (html.includes('id="archive-schema"')) html = html.replace(/<script id="archive-schema"[\s\S]*?<\/script>/, schemaTag);
  else html = html.replace('</head>', `${schemaTag}\n<link rel="alternate" type="application/atom+xml" title="foidslop — Daily Recipes" href="${BASE_URL}/feed.xml">\n</head>`);
  fs.writeFileSync(file, html);
}

const hubs = [
  { slug: 'quick', title: 'Quick Recipes for One', description: 'Fast, low-effort recipes for one when dinner needs to happen now.', filter: meal => meal.tags.includes('Quick') },
  { slug: 'no-cook', title: 'No-Cook Recipes for One', description: 'No-stove, no-oven meals built from good ingredients and almost no effort.', filter: meal => meal.tags.includes('No Cook') },
  { slug: 'for-one', title: 'Easy Recipes for One', description: 'Single-serving dinners, snacks, bowls, toast, and comfort food without leftovers.', filter: meal => String(meal.serves) === '1' },
  { slug: 'vegetarian', title: 'Vegetarian Recipes for One', description: 'Low-effort vegetarian meals for one, from snack plates to pasta and toast.', filter: meal => meal.tags.includes('Vegetarian') }
];

function renderListingPage({ title, description, canonical, meals: listed, root, eyebrow, intro, active = '' }) {
  const schema = { '@context': 'https://schema.org', '@type': 'ItemList', name: title, itemListElement: listed.slice(0, 30).map((meal, index) => ({ '@type': 'ListItem', position: index + 1, url: recipeUrl(meal), name: meal.name })) };
  return `<!DOCTYPE html><html lang="en"><head>${commonHead({ title: `${title} | foidslop`, description, canonical, root })}<script type="application/ld+json">${jsonLd(schema)}</script><link rel="stylesheet" href="${root}css/content.css"></head><body><a href="#main" class="sr-only focusable">Skip to content</a>${header(root, active)}<main id="main" class="content-page"><header class="content-hero"><p class="content-eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1><p>${esc(intro || description)}</p></header><div class="content-grid">${listed.map(meal => recipeCard(meal, root)).join('')}</div><nav class="hub-links" aria-label="Recipe collections"><a href="${root}girl-dinner-ideas">Girl dinner ideas</a>${hubs.map(hub => `<a href="${root}recipes/${hub.slug}">${esc(hub.title)}</a>`).join('')}</nav></main>${footer(root)}${siteScript}</body></html>`;
}

function buildHubs() {
  fs.mkdirSync(RECIPE_HUB_DIR, { recursive: true });
  for (const hub of hubs) {
    const listed = published.filter(hub.filter).slice().reverse();
    fs.writeFileSync(path.join(RECIPE_HUB_DIR, `${hub.slug}.html`), renderListingPage({ ...hub, canonical: `${BASE_URL}/recipes/${hub.slug}`, meals: listed, root: '../', eyebrow: 'Recipe collection' }));
  }
  const girls = published.filter(meal => meal.tags.includes('No Cook') || meal.category === 'Snack Plate' || meal.category === 'Toast').slice().reverse();
  fs.writeFileSync(path.join(ROOT, 'girl-dinner-ideas.html'), renderListingPage({ title: 'Girl Dinner Ideas', description: 'Easy girl dinner ideas: snack plates, toast, bowls, and no-cook recipes made for one.', canonical: `${BASE_URL}/girl-dinner-ideas`, meals: girls, root: '', eyebrow: 'Low effort, high satisfaction', intro: 'A girl dinner can be a snack plate, excellent toast, a bowl of something comforting, or whatever makes feeding yourself feel possible.' }));
}

function renderEditorialPages() {
  const definitionSchema = { '@context': 'https://schema.org', '@type': 'Article', headline: 'What Is Foidslop?', description: 'The meaning and origin of foidslop, its relationship to girl dinner, and why this site reclaims the term.', author: { '@type': 'Organization', name: 'foidslop' }, mainEntityOfPage: `${BASE_URL}/what-is-foidslop` };
  fs.writeFileSync(path.join(ROOT, 'what-is-foidslop.html'), `<!DOCTYPE html><html lang="en"><head>${commonHead({ title: 'What Is Foidslop? Meaning, Origin & Girl Dinner', description: 'What does foidslop mean? Learn the slang term’s origin, its connection to girl dinner, and how foidslop reclaims it through daily recipes.', canonical: `${BASE_URL}/what-is-foidslop` })}<script type="application/ld+json">${jsonLd(definitionSchema)}</script><link rel="stylesheet" href="css/content.css"></head><body>${header('', 'meaning')}<main class="article-page"><p class="content-eyebrow">Internet slang, reclaimed</p><h1>What is foidslop?</h1><p class="article-deck">Foidslop is internet slang for the low-effort, aesthetically specific meals often associated with “girl dinner”—toast, snack plates, smoothies, cottage-cheese bowls, tinned fish, and whatever else counts as feeding yourself without staging a production.</p><h2>The honest origin</h2><p>The word is built from “foid,” a derogatory term for women that emerged from misogynistic online communities, and “slop.” That origin is dehumanizing. This site does not endorse it or pretend it is harmless.</p><h2>Why reclaim it?</h2><p>foidslop takes the insult and points it somewhere more useful: toward the small, improvised meals people make for themselves. The food does not need to be nutritionally perfect, traditionally plated, or labor intensive to deserve care.</p><h2>How is it related to girl dinner?</h2><p>Girl dinner became a name for assembling snacks, bread, cheese, fruit, pickles, tinned fish, or leftovers into a meal for one. Foidslop is the sharper and more internet-poisoned cousin of that idea. Here it becomes a daily recipe format: one approachable meal, with actual ingredients and instructions.</p><h2>Examples of foidslop</h2><ul><li>Avocado or ricotta toast</li><li>Cheese, fruit, bread, and pickles</li><li>Upgraded instant noodles</li><li>Cottage-cheese and yogurt bowls</li><li>Tinned-fish and mezze plates</li></ul><p class="article-cta"><a href="girl-dinner-ideas">Browse girl dinner ideas</a> or <a href="slop/archive">see the full recipe archive</a>.</p></main>${footer('')}${siteScript}</body></html>`);
  fs.writeFileSync(path.join(ROOT, 'editorial-standards.html'), `<!DOCTYPE html><html lang="en"><head>${commonHead({ title: 'How foidslop Recipes Get Made', description: 'A candid look at how foidslop develops, checks, illustrates, and updates its daily recipes for one.', canonical: `${BASE_URL}/editorial-standards` })}<link rel="stylesheet" href="css/content.css"></head><body>${header('')}<main class="article-page"><p class="content-eyebrow">Behind the slop</p><h1>How foidslop gets made</h1><p class="article-deck">One recipe goes up every day. The goal is not to turn dinner into a project. It is to give you a clear, good-looking idea for feeding one person with a reasonable amount of effort.</p><h2>What counts as a recipe here?</h2><p>Sometimes it is pasta with a real method. Sometimes it is excellent things arranged on toast. Both count. Every recipe gets a complete ingredient list, realistic timing, and directions that should make sense without a life story before step one.</p><h2>Are the recipes tested?</h2><p>foidslop is a daily recipe project, not a professional test kitchen. We check that the quantities, timing, and method agree with each other before a recipe is published, but we do not describe a recipe as professionally tested when it has not been. Kitchens and ingredients vary, so use your judgment and taste as you go.</p><h2>Substitutions are allowed</h2><p>These recipes are meant to bend. If you have a different cheese, the wrong shape of pasta, or one less herb than the list demands, dinner can probably continue. Suggested swaps are practical ideas, not promises that every version will behave exactly the same.</p><h2>No imaginary nutrition precision</h2><p>We do not publish calorie counts or health claims just to make a page look more complete. A recipe is not medical advice, and nutrition numbers will only appear when there is a reliable basis for them.</p><h2>About the pictures</h2><p>The picture should give you an honest sense of the finished meal and help you decide whether you want to make it. It may be styled, but it should still resemble what the recipe produces. We also describe what is shown so the same information is available to people who cannot see the image.</p><h2>When something is wrong</h2><p>Recipes can be corrected. When an ingredient, measurement, or instruction needs a meaningful fix, we update the recipe itself rather than quietly changing its publication date and pretending it is new.</p><p class="article-cta"><a href="slop/archive">Browse the recipe archive</a> <a href="what-is-foidslop">Why the name foidslop?</a></p></main>${footer('')}${siteScript}</body></html>`);
}

function buildSitemap() {
  const staticUrls = [
    ['', today], ['slop/archive', today], ['what-is-foidslop', today], ['editorial-standards', today], ['girl-dinner-ideas', today],
    ...hubs.map(hub => [`recipes/${hub.slug}`, today])
  ];
  const body = staticUrls.map(([url, lastmod]) => `<url><loc>${BASE_URL}/${url}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n') + '\n' + published.map(meal => `<url><loc>${recipeUrl(meal)}</loc><lastmod>${isoDate(releaseDate(meal))}</lastmod><image:image><image:loc>${imageUrl(meal)}</image:loc><image:title>${xml(meal.name)}</image:title></image:image></url>`).join('\n');
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${body}\n</urlset>\n`);
}

function buildFeed() {
  const entries = published.slice(-20).reverse().map(meal => `<entry><title>${xml(meal.name)}</title><link href="${recipeUrl(meal)}"/><id>${recipeUrl(meal)}</id><published>${isoDate(releaseDate(meal))}T05:00:00Z</published><updated>${isoDate(releaseDate(meal))}T05:00:00Z</updated><summary>${xml(meal.description)}</summary></entry>`).join('\n');
  fs.writeFileSync(path.join(ROOT, 'feed.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom"><title>foidslop — Daily Recipes</title><link href="${BASE_URL}/feed.xml" rel="self"/><link href="${BASE_URL}/"/><id>${BASE_URL}/</id><updated>${today}T05:00:00Z</updated>${entries}</feed>\n`);
}

function buildRedirects() {
  const lines = [`/slop/today  /slop/${current.slug}  301`, '/index.html  /  301', '/slop/archive.html  /slop/archive  301', '/privacy.html  /privacy  301', '/what-is-foidslop.html  /what-is-foidslop  301', '/editorial-standards.html  /editorial-standards  301', '/girl-dinner-ideas.html  /girl-dinner-ideas  301'];
  for (const hub of hubs) lines.push(`/recipes/${hub.slug}.html  /recipes/${hub.slug}  301`);
  for (const meal of published) lines.push(`/slop/${meal.slug}.html  /slop/${meal.slug}  301`);
  fs.writeFileSync(path.join(ROOT, '_redirects'), `${lines.join('\n')}\n`);
}

function removeFuturePages() {
  const keep = new Set(published.map(meal => `${meal.slug}.html`).concat('archive.html'));
  for (const file of fs.readdirSync(SLOP_DIR).filter(name => name.endsWith('.html'))) {
    if (!keep.has(file)) fs.unlinkSync(path.join(SLOP_DIR, file));
  }
}

for (const [index, meal] of published.entries()) fs.writeFileSync(path.join(SLOP_DIR, `${meal.slug}.html`), renderRecipe(meal, index));
removeFuturePages();
updateHomepage();
updateArchive();
buildHubs();
renderEditorialPages();
buildSitemap();
buildFeed();
buildRedirects();
console.log(`Published ${current.name} (${today}); ${published.length} public recipes.`);
