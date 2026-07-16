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
const MERCH_PRODUCTS = [
  { name: 'DJT Nippon Premium Tee', price: '$24.99', url: 'https://shop.foidslop.com/products/djt-nippon-premium-tee', image: 'https://imgproxy.fourthwall.dev/2YP3EYknOMIdQ6QXx7L7CEqJnAp4FZjfAbE8CIlK4kI/w:1920/sm:1/enc/wK4D1NeZvrt7N5wk/PUZXwiy5qnXIlcMv/UU-dENRmYZU8KRL4/JuZwWbw0sG1zmlZJ/QoRcs-E0AQ6sn12T/6cNI8eYCPSzWaiTw/TeND9kIV35ot4CSr/FtojfX5KG8wDP7tj/3vdlVr1TRydOC1Ej/zMCKATSKIs8UT1Bd/BDEqVotxrp_QC2RX/hn7b82AleqnYbVfl/GzKc4IwCKzKPD_Vv/q_hw2XoeQoXmtM6l/xR-9JtM0HAc.jpg' },
  { name: 'DJT Nippon Heavy Tee', price: '$23.99', url: 'https://shop.foidslop.com/products/djt-nippon-heavy-tee', image: 'https://imgproxy.fourthwall.dev/waK-pQcdCo98u7G3QjfH4HBnguGaVV0xtTsHypKsYyw/w:1920/sm:1/enc/rN2Jw4uAk7J_46jF/cE9BEPrts5QB4fN_/VOvWTxwJiGeG713J/9mk7Afrin-ftx7Gm/qHvbhR4e1FW9JU6Q/oBqAXmzw6de4auKp/H3TmzFljySeQFsbN/DUq6gjEWcD4Ainyr/sOoaV2BwgCnSCTs8/lMHUhM9UIvgDdA8S/Oq-RIFVv-c5CEmky/Qf1EOt5pa9oFD2Ea/wfTWA1wt9Q73qLwv/hhYTGl1Nml_w4aM4/TyxZozfIjNU.jpg' },
  { name: 'DJT Nippon Premium Relaxed Hoodie', price: '$49.99', url: 'https://shop.foidslop.com/products/djt-nippin-premium-heavy-hoodie', image: 'https://imgproxy.fourthwall.dev/qh-a7PeUhC23XLqDUwiRItX5j-ZuwOGXA7fymi81QRU/w:1920/sm:1/enc/hTgl50E6REpt2YMz/0tWMrwa4MtCkJwPf/w3v2g7tjxYVRAlDX/BwGaGY3CCw8ygo6C/gCtVkr8OqaNKWy3b/o554x9fiXrXMTofF/LfVj53jvG8gR1ome/vcYe-izLRDwRok0c/VWl351ShQ7WOBioE/8TqI_BnBGwEEGwpq/N-NvCgS768aSmkna/FcvzX7dUVLb4l4Ly/5Aon3R8LVShKMTs1/krQgw60cQDExR-YF/-DILEup9SpM.jpg' },
  { name: 'DJT Nippon Mug', price: 'From $8.95', url: 'https://shop.foidslop.com/products/djt-nippon-mug', image: 'https://imgproxy.fourthwall.dev/F0zoKTHInVH7fAt21dOfvAyaxef5Ab-S82lJV8AdwQM/w:1920/sm:1/enc/L8lKpeEDXA48z-gp/WOzuIq6z4VZcdmdT/oUPf1rqZdANianIf/jovHIjOs_Enz_lFQ/X_Iop77stTvdG4Az/WQ72-14PrUrTp49z/rlXn6NN_dR59QYrB/bkwkXar7T4pZd1X3/0OYu3oYa1bs6YINw/YRDreG_XVBPPZN5g/LxPsKRb4GQxVoYJX/7TGOsAGN286T3bLe/rXft0sXAQmFfZbqp/mH_5UeLOHwVpwruX/UpR85BT5-fs.jpg' },
  { name: 'DJT Nippon Matte Paper Poster', price: '$8.50', url: 'https://shop.foidslop.com/products/djt-nippon-matte-paper-poster', image: 'https://imgproxy.fourthwall.dev/fOS45BZS7utD9OOenoIsnMXjryD8wa7M5LHBdxCU0CM/w:1920/sm:1/enc/SmtLSDrCanrLbIff/a6lcQoNOFU_6-_J_/PXSwxTSPLb24ymNs/DdJfKGc0hmyRbFPC/f0MNBSOVCbKS8JS4/dkIgFJ00dvNvrZ8_/9yNDsnjxUIcsxN7O/dr7a9FJRpDJT7CYj/6mFgmR5z1i9OvTmL/9eT-y3FELxyJzLEh/hbAJTbHuh-WGWexY/haHKbg2ZFQEIHqbM/oAZGzC2rAfTTx43a/JYGTN4hoYZBiJHBr/OJAWAh4Duf8.jpg' },
  { name: 'DJT Nippon Framed Matte Poster', price: '$23.35', url: 'https://shop.foidslop.com/products/djt-nippon-framed-high-quality-matte-poster', image: 'https://imgproxy.fourthwall.dev/F14Lne3b8uOHlJUKErm64LD8BSgs8G1Md7JfXUtuu7A/w:1920/sm:1/enc/NyhDLyCmrOcheBJz/O_IiHyhKxTHVCR6U/xTTIfSXJMlWgMnN_/j4Z8lLaNuC11KO71/dlZ8snQ0whw_jpn0/BrVXZmbvRB93Vn9J/mF2E5DzTRkPNnzx_/3QgcvDPw7JcP9gI7/2sdmYtpYXiGsp-8w/ve08dsrL8f26B-OE/2Efx4JmzGn7Gm_Wb/B4Rp9suc4B7lPiVv/Vt1t8_-elutBL_7a/MNwuLmhTnhcKWJxB/lxoNosLTHrM.jpg' }
];
const LOCAL_MERCH_ASSETS = {
  hero: { avif: 'DJTNIP-hq.avif', webp: 'DJTNIP-hq.webp', fallback: 'DJTNIP.png' },
  lifestyle: { avif: 'CarModel-hq.avif', webp: 'CarModel-hq.webp', fallback: 'CarModel.png' },
  poster: { avif: 'DJTNIP-hq.avif', webp: 'DJTNIP-hq.webp', fallback: 'DJTNIP.png' },
  model: { avif: 'MerchModel-hq.avif', webp: 'MerchModel-hq.webp', fallback: 'MerchModel.png' }
};

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
function imageFile(meal) { return fs.existsSync(path.join(SLOP_DIR, 'img', `${meal.slug}.png`)) ? `${meal.slug}.png` : `${meal.slug}.jpg`; }
function imageUrl(meal) { return `${BASE_URL}/slop/img/${imageFile(meal)}`; }
function socialImageUrl(meal) { return `${BASE_URL}/slop/social/${meal.slug}-wide.jpg`; }
function pinterestImageUrl(meal) { return `${BASE_URL}/slop/social/${meal.slug}-pin.jpg`; }
function schemaImages(meal) { return [imageUrl(meal), `${BASE_URL}/slop/img/${meal.slug}-4x3.jpg`, `${BASE_URL}/slop/img/${meal.slug}-16x9.jpg`]; }
function merchPicture(asset, alt, attributes = '') {
  return `<picture><source type="image/avif" srcset="${asset.avif}"><source type="image/webp" srcset="${asset.webp}"><img src="${asset.fallback}" alt="${esc(alt)}" ${attributes}></picture>`;
}
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
let feedsOnly = false;
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i] === '--date') dateOverride = process.argv[++i];
  else if (process.argv[i] === '--set') setOverride = process.argv[++i];
  else if (process.argv[i] === '--check') validateOnly = true;
  else if (process.argv[i] === '--feeds-only') feedsOnly = true;
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
    if (!meal.name || !meal.slug || !meal.description || !meal.headnote || !meal.seoTitle || !meal.seoDescription) errors.push(`Missing required content for meal ${meal.id}`);
    if (!Array.isArray(meal.ingredients) || !meal.ingredients.length) errors.push(`Missing ingredients: ${meal.slug}`);
    if (!Array.isArray(meal.steps) || !meal.steps.length) errors.push(`Missing steps: ${meal.slug}`);
    if (meal.steps.some(step => !step.name || !step.text || step.text.length < 55)) errors.push(`Thin recipe step: ${meal.slug}`);
    if (/\u2014/.test(JSON.stringify(meal))) errors.push(`Em dash in recipe content: ${meal.slug}`);
    if (releaseDate(meal).toString() === 'Invalid Date') errors.push(`Invalid release date: ${meal.slug}`);
  }
  for (const meal of published) {
    const image = path.join(SLOP_DIR, 'img', imageFile(meal));
    if (!fs.existsSync(image)) errors.push(`Missing published image: ${meal.slug}`);
  }
  if (errors.length) throw new Error(`Content validation failed:\n- ${errors.join('\n- ')}`);
}
validate();
if (validateOnly) {
  console.log(`Validated ${meals.length} meals; ${published.length} published through ${today}.`);
  process.exit(0);
}
if (feedsOnly) {
  buildFeed();
  buildPinterestFeed();
  console.log(`Built feeds for ${published.length} published recipes through ${today}.`);
  process.exit(0);
}
fs.writeFileSync(DB_FILE, `${JSON.stringify(db, null, 2)}\n`);

function commonHead({ title, description, canonical, image = `${BASE_URL}/og-image.png`, type = 'website', root = '' }) {
  return `
<script src="${root}cookie-consent.js?v=20260713-4" data-ga-id="G-VT527DETQ2"></script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="p:domain_verify" content="7bdfbfde1745ec62bc759913fcc45642">
<link rel="icon" type="image/png" sizes="512x512" href="/brand-icon.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="${root}site.webmanifest">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index,follow,max-image-preview:large">
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
<link rel="alternate" type="application/atom+xml" title="foidslop: Daily Recipes" href="${BASE_URL}/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap">
<link rel="stylesheet" href="${root}css/global.css">
<script src="${root}theme.js?v=20260713-5"></script>`;
}

function header(root = '', active = '') {
  const homeUrl = root || '/';
  return `<header class="site-header" id="site-header">
  <a href="${homeUrl}" aria-label="foidslop home"><picture><source type="image/webp" srcset="${root}logo.webp"><img src="${root}logo.png" alt="FOID SLOP" class="logo" width="126" height="74"></picture></a>
  <div class="site-header-center">Daily recipes / occasional objects / Issue ${String(current.id).padStart(3, '0')}</div>
  <div class="header-right">
    <button class="theme-toggle" type="button" aria-label="Switch color theme" aria-pressed="true"><span class="theme-toggle-mark" aria-hidden="true">*</span><span class="theme-toggle-label">Light mode</span></button>
    <a href="${root}slop/archive" class="nav-link${active === 'archive' ? ' active' : ''}">Archive</a>
    <a href="https://shop.foidslop.com/" target="_blank" rel="noopener noreferrer" class="nav-link header-shop">Shop</a>
  </div>
</header>`;
}

function footer(root = '') {
  return `<footer><div class="footer-inner">
  <span class="footer-copy">&copy; ${new Date().getFullYear()} foidslop</span>
  <nav class="footer-links" aria-label="Footer navigation">
    <a href="${root}what-is-foidslop">What is foidslop?</a><span class="footer-dot"></span>
    <a href="${root}what-does-foid-mean">Foid meaning</a><span class="footer-dot"></span>
    <a href="${root}editorial-standards">Editorial standards</a><span class="footer-dot"></span>
    <a href="${root}feed.xml" type="application/atom+xml">RSS</a><span class="footer-dot"></span>
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
    <picture><source type="image/webp" srcset="${prefix}slop/img/${meal.slug}-480.webp 480w, ${prefix}slop/img/${meal.slug}-768.webp 768w" sizes="(max-width: 560px) 100vw, (max-width: 960px) 50vw, 25vw"><img src="${prefix}slop/img/${imageFile(meal)}" alt="${esc(meal.imageAlt || meal.name)}" width="360" height="360" loading="lazy"></picture>
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
    image: schemaImages(meal), author: { '@type': 'Organization', name: 'foidslop', url: BASE_URL, logo: `${BASE_URL}/brand-icon.png` },
    datePublished: isoDate(date), dateModified: meal.dateModified || isoDate(date), keywords: meal.tags.join(', '), recipeCategory: meal.category,
    recipeCuisine: meal.cuisine, prepTime: duration(meal.prep), cookTime: duration(meal.cook),
    totalTime: `PT${total}M`, recipeYield: meal.serves,
    recipeIngredient: meal.ingredients.map(item => `${item.amount} ${item.name}`),
    recipeInstructions: meal.steps.map((step, stepIndex) => ({ '@type': 'HowToStep', name: step.name, text: step.text, url: `${recipeUrl(meal)}#step-${stepIndex + 1}` }))
  };
  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
    { '@type': 'ListItem', position: 2, name: 'Slop Archive', item: `${BASE_URL}/slop/archive` },
    { '@type': 'ListItem', position: 3, name: meal.name, item: recipeUrl(meal) }
  ] };
  const related = relatedMeals(meal);
  return `<!DOCTYPE html><html lang="en"><head>${commonHead({
    title: meal.seoTitle, description: meal.seoDescription,
    canonical: recipeUrl(meal), image: fs.existsSync(path.join(SLOP_DIR, 'social', `${meal.slug}-wide.jpg`)) ? socialImageUrl(meal) : imageUrl(meal), type: 'article', root: '../'
  })}
<script type="application/ld+json">${jsonLd([schema, breadcrumb])}</script>
<link rel="stylesheet" href="../css/slop-page.css?v=20260713-5"><link rel="stylesheet" href="../css/theme.css?v=20260713-4"></head><body>
<a href="#main" class="sr-only focusable">Skip to content</a>${header('../', meal.slug === current.slug ? 'today' : '')}
<div class="slop-header"><p class="slop-eyebrow">Slop of the Day / ${prettyDate(date)}</p><h1 class="slop-title">${titleLines(meal.name)}</h1>
<div class="slop-meta"><span class="slop-date">Published ${prettyDate(date)}</span><div class="slop-tags">${meal.tags.map(tag => `<span class="slop-tag">${esc(tag)}</span>`).join('')}</div></div></div>
<main id="main"><div class="slop-body"><div class="slop-image-panel"><picture><source type="image/webp" srcset="img/${meal.slug}-480.webp 480w, img/${meal.slug}-768.webp 768w" sizes="(max-width: 900px) 100vw, 50vw"><img src="img/${imageFile(meal)}" alt="${esc(meal.imageAlt || meal.name)}" width="768" height="768" loading="eager" fetchpriority="high"></picture><span class="slop-image-caption">${esc(meal.name)} / foidslop</span></div>
<div class="slop-content"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="../">Home</a><span>/</span><a href="./archive">Archive</a><span>/</span><span class="current">${esc(meal.name)}</span></nav>
<p class="slop-desc">${esc(meal.description)}</p><p class="slop-headnote">${esc(meal.headnote)}</p><p class="section-label">At a Glance</p><div class="slop-stats" role="list">
<div class="slop-stat"><div class="slop-stat-label">Prep</div><div class="slop-stat-value">${esc(meal.prep)}</div></div><div class="slop-stat"><div class="slop-stat-label">Cook</div><div class="slop-stat-value">${esc(meal.cook)}</div></div><div class="slop-stat"><div class="slop-stat-label">Serves</div><div class="slop-stat-value">${esc(meal.serves)}</div></div><div class="slop-stat"><div class="slop-stat-label">Difficulty</div><div class="slop-stat-value">${esc(meal.difficulty)}</div></div></div>
<div class="recipe-tools" aria-label="Recipe tools"><button type="button" class="recipe-tool" id="print-recipe">Print recipe</button><button type="button" class="recipe-tool" id="copy-ingredients">Copy ingredients</button><span class="recipe-tool-status" id="recipe-tool-status" role="status" aria-live="polite"></span></div>
<p class="section-label">Ingredients</p><ul class="ingredients-list">${meal.ingredients.map((item, ingredientIndex) => `<li class="ingredient-item"><label><input type="checkbox" class="ingredient-check"><span class="ingredient-name">${esc(item.name)}</span><span class="ingredient-amount">${esc(item.amount)}</span></label></li>`).join('')}</ul>
<p class="section-label">Method</p><ol class="steps-list">${meal.steps.map((step, stepIndex) => `<li class="step-item" id="step-${stepIndex + 1}"><span class="step-number">${String(stepIndex + 1).padStart(2, '0')}</span><div class="step-content"><p class="step-name">${esc(step.name)}</p><p class="step-text">${esc(step.text)}</p></div></li>`).join('')}</ol>
${meal.substitutions ? `<div class="recipe-extra"><p class="recipe-extra-label">Easy swaps</p><p>${esc(meal.substitutions)}</p></div>` : ''}${meal.storage ? `<div class="recipe-extra"><p class="recipe-extra-label">Storage</p><p>${esc(meal.storage)}</p></div>` : ''}
<div class="slop-notes"><p class="slop-notes-label">Slop Notes</p><p>${esc(meal.notes)}</p></div>
<p class="recipe-trust">Recipe by foidslop · <a href="../editorial-standards">How we create our recipes</a></p></div></div>
<section class="related-recipes" aria-labelledby="related-title"><p class="section-label">Keep eating</p><h2 id="related-title">Related recipes</h2><div class="related-grid">${related.map(item => recipeCard(item, '../')).join('')}</div></section>
<nav class="slop-nav" aria-label="Other slops">${previous ? `<a href="./${previous.slug}" class="slop-nav-item prev"><span class="slop-nav-dir">Previous Slop</span><span class="slop-nav-name">${esc(previous.name)}</span><span class="slop-nav-date">${prettyDate(releaseDate(previous))}</span></a>` : '<span></span>'}${next ? `<a href="./${next.slug}" class="slop-nav-item next"><span class="slop-nav-dir">Next Slop</span><span class="slop-nav-name">${esc(next.name)}</span><span class="slop-nav-date">${prettyDate(releaseDate(next))}</span></a>` : `<a href="./today" class="slop-nav-item next"><span class="slop-nav-dir">Next Slop</span><span class="slop-nav-name">Check back tomorrow</span></a>`}</nav></main>
${footer('../')}${siteScript}<script src="../recipe-tools.js"></script></body></html>`;
}

function renderHomepageBase() {
  const recent = published.slice(-5, -1).reverse();
  const cards = recent.map(meal => `<a class="zine-recipe-card" href="slop/${meal.slug}"><img src="slop/img/${imageFile(meal)}" alt="${esc(meal.imageAlt || meal.name)}" width="600" height="600" loading="lazy"><p>${esc(meal.name)}</p><small>${shortDate(releaseDate(meal))}</small></a>`).join('');
  const products = [Object.assign({}, MERCH_PRODUCTS[0], { image: LOCAL_MERCH_ASSETS.lifestyle }), Object.assign({}, MERCH_PRODUCTS[4], { image: LOCAL_MERCH_ASSETS.poster }), Object.assign({}, MERCH_PRODUCTS[2], { image: LOCAL_MERCH_ASSETS.model })].map((product, index) => `<figure><a href="${product.url}" target="_blank" rel="noopener noreferrer">${merchPicture(product.image, `${product.name} from foidslop`, 'width="720" height="900" loading="lazy" decoding="async"')}<figcaption>Object ${String(index + 1).padStart(3, '0')} / ${esc(product.name)} / ${esc(product.price)}</figcaption></a></figure>`).join('');
  const latestRecipes = [current, ...recent];
  const recipeSchema = latestRecipes.map((meal, index) => ({ '@type': 'ListItem', position: index + 1, url: recipeUrl(meal), name: meal.name, image: imageUrl(meal) }));
  const schema = [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'foidslop', url: BASE_URL, description: 'Approachable daily recipes made for one, plus occasional clothing, prints, and other objects from foidslop.' }, { '@context': 'https://schema.org', '@type': 'Organization', name: 'foidslop', url: BASE_URL, logo: `${BASE_URL}/brand-icon.png`, sameAs: ['https://shop.foidslop.com'] }, { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Latest foidslop recipes', url: `${BASE_URL}/slop/archive`, itemListElement: recipeSchema }];
  return `<!DOCTYPE html><html lang="en"><head>${commonHead({ title: 'foidslop | Daily Recipes for One and Occasional Objects', description: 'Approachable daily recipes made for one, plus occasional clothing, prints, and other objects from foidslop.', canonical: `${BASE_URL}/` })}<link rel="preload" as="image" href="${LOCAL_MERCH_ASSETS.hero.avif}" type="image/avif" fetchpriority="high"><link rel="stylesheet" href="css/home-redesign.css?v=20260715-1"><link rel="stylesheet" href="css/theme.css?v=20260713-4"><script type="application/ld+json">${jsonLd(schema)}</script></head><body><a href="#main" class="sr-only focusable">Skip to content</a><main id="main" class="zine-home">${header()}<div id="top"><section class="zine-hero"><div class="zine-hero-copy"><div><div class="zine-kicker">A small publication for one</div><h1>Daily<br><span>slop.</span><br>Dinner, etc.</h1><p class="zine-deck">One approachable recipe every day. A few things to wear when the internet demands it.</p></div><div class="zine-note"><span>Vol. 01 / 2026</span><strong>Read / Wear / Repeat</strong></div></div><a class="zine-art" href="${MERCH_PRODUCTS[0].url}" target="_blank" rel="noopener noreferrer">${merchPicture(LOCAL_MERCH_ASSETS.hero, `${MERCH_PRODUCTS[0].name} from foidslop`, 'width="900" height="1100" loading="eager" fetchpriority="high" decoding="async"')}<span class="zine-art-label">DJT Nippon / Drop 001</span></a></section><section class="zine-dispatch"><div class="zine-dispatch-intro"><div class="zine-kicker">Slop of the Day</div><h2>Eat<br>this.</h2><p>Filed every day from the department of feeding yourself without making it a whole thing.</p></div><div class="zine-dispatch-photo"><span class="zine-tape"></span><img src="slop/img/${imageFile(current)}" alt="${esc(current.imageAlt || current.name)}" width="768" height="768"></div><div class="zine-dispatch-copy"><div class="zine-number">${String(current.id).padStart(3, '0')}</div><h3>${titleLines(current.name)}</h3><p>${esc(current.description)}</p><a class="zine-read" href="slop/${current.slug}">Open today’s slop</a></div></section><section><div class="zine-section-head"><h2>Recent issues</h2><span>${published.length} recipes / start anywhere</span></div><div class="zine-recipe-index">${cards}</div></section><section class="zine-objects"><div class="zine-section-head"><h2>Objects department</h2><span>Drop 001 / Available now</span></div><div class="zine-objects-intro"><p>Things you do not need, made for people who know exactly what they like.</p><p>DJT Nippon is the first collection. Tees, hoodies, posters, and mugs from the foidslop objects department.</p></div><div class="zine-object-spread">${products}</div></section><section class="zine-find"><div class="zine-find-copy"><div class="zine-kicker">The index</div><h2>Find<br>dinner.</h2><p>Quick, no-cook, vegetarian, for one. There is a filing system for whatever this is.</p></div><nav class="zine-find-links" aria-label="Recipe collections"><a href="recipes/quick">Quick</a><a href="recipes/no-cook">No-cook</a><a href="recipes/for-one">For one</a><a href="recipes/vegetarian">Vegetarian</a><a href="girl-dinner-ideas">Girl dinner</a><a href="slop/archive">Full archive</a></nav></section><section class="zine-signature"><picture><source type="image/webp" srcset="logo.webp"><img src="logo.png" alt="FOID SLOP, recipes, ideas, misery made for one" width="1009" height="596" loading="lazy" decoding="async"></picture><p>A daily recipe project and an occasional objects department. Same publication. Different problems.</p></section></div></main>${footer('')}${siteScript}</body></html>`;
}

function renderHomepage() {
  const collectionLinks = '<nav class="zine-find-links" aria-label="Recipe collections"><a href="recipes/quick">Quick</a><a href="recipes/no-cook">No-cook</a><a href="recipes/for-one">For one</a><a href="recipes/vegetarian">Vegetarian</a><a href="recipes/pasta">Pasta</a><a href="recipes/toast">Toast</a><a href="recipes/snack-plates">Snack plates</a><a href="recipes/comfort-food">Comfort food</a><a href="recipes/15-minute">15-minute</a><a href="girl-dinner-ideas">Girl dinner</a><a href="slop/archive">Full archive</a></nav>';
  return renderHomepageBase()
    .replaceAll('One approachable recipe for one every day, plus an occasional objects department from foidslop.', 'Approachable daily recipes made for one, plus occasional clothing, prints, and other objects from foidslop.')
    .replace(`<div class="zine-dispatch-photo"><span class="zine-tape"></span><img src="slop/img/${imageFile(current)}"`, `<div class="zine-dispatch-photo"><span class="zine-tape"></span><a class="zine-dispatch-image" href="slop/${current.slug}"><img src="slop/img/${imageFile(current)}"`)
    .replace('width="768" height="768"></div><div class="zine-dispatch-copy">', 'width="768" height="768"></a></div><div class="zine-dispatch-copy">')
    .replace(/<nav class="zine-find-links"[\s\S]*?<\/nav>/, collectionLinks)
    .replace('</section></div></main>', '<a class="zine-rss" href="feed.xml" type="application/atom+xml">Follow the daily slop via RSS</a></section></div></main>');
}

function updateHomepage() {
  fs.writeFileSync(path.join(ROOT, 'index.html'), renderHomepage());
}

function archiveCard(meal) {
  const filters = [meal.tags.includes('Quick') && 'quick', meal.tags.includes('No Cook') && 'no-cook', meal.tags.includes('Vegetarian') && 'vegetarian', (meal.category === 'Pasta' || meal.tags.includes('Pasta')) && 'pasta', (meal.category === 'Toast' || meal.tags.includes('Toast')) && 'toast', meal.category === 'Snack Plate' && 'snack-plates', meal.tags.includes('Comfort') && 'comfort'].filter(Boolean).join(' ');
  const search = [meal.name, meal.description, meal.headnote, meal.category, meal.cuisine, ...meal.tags, ...meal.ingredients.map(item => item.name)].join(' ').toLowerCase();
  return `<article class="archive-card" data-search="${esc(search)}" data-filters="${filters}"><a href="./${meal.slug}"><div class="archive-card-img"><picture><source type="image/webp" srcset="img/${meal.slug}-480.webp 480w, img/${meal.slug}-768.webp 768w" sizes="(max-width: 560px) 100vw, (max-width: 960px) 50vw, 33vw"><img src="img/${imageFile(meal)}" alt="${esc(meal.imageAlt || meal.name)}" width="600" height="600" loading="lazy"></picture></div><div class="archive-card-body"><p class="archive-card-name">${esc(meal.name)}</p><div class="archive-card-meta"><span class="archive-card-date">${shortDate(releaseDate(meal))}</span><div class="archive-card-tags">${meal.tags.slice(0, 2).map(tag => `<span class="archive-card-tag">${esc(tag)}</span>`).join('')}</div></div></div></a></article>`;
}

function archiveControls(count) {
  const filters = [['all', 'All'], ['quick', 'Quick'], ['no-cook', 'No cook'], ['vegetarian', 'Vegetarian'], ['pasta', 'Pasta'], ['toast', 'Toast'], ['snack-plates', 'Snack plates'], ['comfort', 'Comfort']];
  return `<div class="archive-intro"><p class="archive-label">The complete recipe index</p><h2>Find something good to eat</h2><p>Search by recipe, ingredient, or craving. Try mushrooms, feta, pasta, no cook, or anything else already in your kitchen. Every recipe is written for one person, so you can make dinner without planning for a week of leftovers.</p></div><div class="archive-header"><span class="archive-label">Past Slops</span><span class="archive-count" id="archive-count">${count} recipes</span></div>
  <section class="archive-tools" aria-label="Search and filter recipes">
    <label class="archive-search-label" for="archive-search">Search the archive</label>
    <input class="archive-search" id="archive-search" type="search" placeholder="Pasta, toast, cheese…" autocomplete="off">
    <div class="archive-filters" role="group" aria-label="Filter recipes">${filters.map(([value, label], index) => `<button type="button" class="archive-filter${index === 0 ? ' active' : ''}" data-filter="${value}" aria-pressed="${index === 0 ? 'true' : 'false'}">${label}</button>`).join('')}</div>
    <p class="archive-results" id="archive-results" role="status" aria-live="polite">Showing ${count} recipes</p>
  </section>`;
}

function updateArchive() {
  const file = path.join(SLOP_DIR, 'archive.html');
  let html = fs.readFileSync(file, 'utf8');
  const past = published.slice(0, -1).reverse();
  const archiveSchema = { '@context': 'https://schema.org', '@type': 'ItemList', name: 'foidslop Recipe Archive', itemListElement: published.slice().reverse().map((meal, index) => ({ '@type': 'ListItem', position: index + 1, url: recipeUrl(meal), name: meal.name })) };
  html = html.replace(/<div class="archive-intro">[\s\S]*?<\/div>/g, '')
    .replace(/<title>[\s\S]*?<\/title>/, '<title>Recipe Archive for One | foidslop</title>')
    .replace(/<meta name="description" content="[^"]+">/, '<meta name="description" content="Search every published foidslop recipe by name, ingredient, cuisine, or craving. Clear single-serving recipes with new ideas added daily.">')
    .replace(/<meta property="og:title" content="[^"]+">/, '<meta property="og:title" content="Recipe Archive for One | foidslop">')
    .replace(/<meta property="og:description" content="[^"]+">/, '<meta property="og:description" content="Search every published foidslop recipe by name, ingredient, cuisine, or craving.">')
    .replace(/<meta name="twitter:title" content="[^"]+">/, '<meta name="twitter:title" content="Recipe Archive for One | foidslop">')
    .replace(/<meta name="twitter:description" content="[^"]+">/, '<meta name="twitter:description" content="Search every published foidslop recipe by name, ingredient, cuisine, or craving.">')
    .replace(/<link rel="canonical" href="[^"]+">/, `<link rel="canonical" href="${BASE_URL}/slop/archive">`)
    .replace(/[ \t]*<link rel="stylesheet" href="\.\.\/css\/theme\.css">\r?\n?/g, '')
    .replace(/[ \t]*<script src="\.\.\/theme\.js"><\/script>\r?\n?/g, '')
    .replace('<link rel="stylesheet" href="../css/global.css">', '<link rel="stylesheet" href="../css/global.css">\n<script src="../theme.js?v=20260713-5"></script>')
    .replace('<link rel="stylesheet" href="../css/slop-archive.css?v=20260713-5">', '<link rel="stylesheet" href="../css/slop-archive.css?v=20260713-5">\n<link rel="stylesheet" href="../css/theme.css?v=20260713-4">')
    .replace(/<button class="theme-toggle(?: nav-dropdown-link)?"[\s\S]*?<\/button>/g, '')
    .replace(/href="\.\.\/index"/g, 'href="../"')
    .replace(/<header class="site-header"[\s\S]*?<\/header>/, header('../', 'archive'))
    .replace(/<meta property="og:url" content="[^"]+">/, `<meta property="og:url" content="${BASE_URL}/slop/archive">`)
    .replace(/<a href="\.\/[^"]+" class="nav-link" id="sotd-link">/, `<a href="./${current.slug}" class="nav-link" id="sotd-link">`)
    .replace(/<a href="\.\/[^"]+" class="nav-dropdown-link" id="sotd-nav-dropdown">/, `<a href="./${current.slug}" class="nav-dropdown-link" id="sotd-nav-dropdown">`)
    .replace(/(<a href="\.\/)[^"]+(" class="featured-slop)/, `$1${current.slug}$2`)
    .replace(/class="featured-slop(?: reveal)?"/, 'class="featured-slop"')
    .replace(/class="featured-image(?: reveal-clip)?"/, 'class="featured-image"')
    .replace(/(class="featured-slop" aria-label=")[^"]+/, `$1Read today's slop: ${esc(current.name)}`)
    .replace(/(class="featured-image">\s*<img src="img\/)[^"]+(" alt=")[^"]+/, `$1${imageFile(current)}$2${esc(current.imageAlt || current.name)}`)
    .replace(/(<p class="featured-eyebrow">)[^<]+/, `$1${prettyDate(releaseDate(current))}`)
    .replace(/(<h2 class="featured-title">)[\s\S]*?(<\/h2>)/, `$1${titleLines(current.name)}$2`)
    .replace(/(<p class="featured-desc">)[^<]+/, `$1${esc(current.description)}`)
    .replace(/(<div class="featured-tags">)[\s\S]*?(<\/div>)/, `$1${current.tags.slice(0, 3).map(tag => `<span class="featured-tag">${esc(tag)}</span>`).join('')}$2`)
    .replace(/(<p class="featured-date">Published )[^<]+/, `$1${prettyDate(releaseDate(current))}`)
    .replace(/<div class="archive-header">[\s\S]*?<section class="archive-grid"/, `${archiveControls(past.length)}\n  <section class="archive-grid"`)
    .replace(/(<a href="https:\/\/shop\.foidslop\.com\/"[^>]*class="header-cta">)/, '<button class="theme-toggle" type="button" aria-label="Switch color theme" aria-pressed="true"><span class="theme-toggle-mark" aria-hidden="true">*</span><span class="theme-toggle-label">Light mode</span></button>$1')
    .replace(/(<section class="archive-grid"[^>]*>)[\s\S]*?(<\/section>)/, `$1\n${past.map(archiveCard).join('\n')}\n$2`)
    .replace('id="archive-load-more" style="display: none;"', 'id="archive-load-more"')
    .replace(/<div class="archive-load-more" id="archive-load-more"(?: hidden)?>/, '<div class="archive-load-more" id="archive-load-more" hidden>')
    .replace(/<div class="archive-empty" id="archive-empty"(?: hidden)?>/, '<div class="archive-empty" id="archive-empty" hidden>')
    .replace('More slops coming soon. Check back tomorrow.', 'No recipes match that search. Try another word or filter.')
    .replace(/<footer>[\s\S]*?<\/footer>/, footer('../'))
    .replace(/<script src="\.\.\/archive\.js"><\/script>\s*/g, '')
    .replace(/<script>\s*\/\/ Set copyright year[\s\S]*?<\/script>\s*/g, '')
    .replace(/\.html(?=["'])/g, '');
  const schemaTag = `<script id="archive-schema" type="application/ld+json">${jsonLd(archiveSchema)}</script>`;
  if (html.includes('id="archive-schema"')) html = html.replace(/<script id="archive-schema"[\s\S]*?<\/script>/, schemaTag);
  else html = html.replace('</head>', `${schemaTag}\n<link rel="alternate" type="application/atom+xml" title="foidslop: Daily Recipes" href="${BASE_URL}/feed.xml">\n</head>`);
  if (!html.includes('max-image-preview:large')) html = html.replace('</title>', '</title>\n<meta name="robots" content="index,follow,max-image-preview:large">');
  html = html.replace(/—/g, ':').replace('</body>', '<script src="../archive.js"></script>\n</body>');
  fs.writeFileSync(file, html);
}

const hubs = [
  { slug: 'quick', title: 'Quick Recipes for One', description: 'Fast, low-effort recipes for one when dinner needs to happen now.', intro: 'These are the recipes for nights when hunger has already arrived. Most use one pan, one bowl, or no cookware at all, with enough texture and seasoning to feel like dinner rather than a compromise.', guideTitle: 'How to make a quick dinner feel complete', guide: ['Start with the ingredient that takes longest, even if that only means putting water on to boil.', 'Use one sharp or bright finish such as lemon, pickles, hot sauce, herbs, or a good shower of black pepper.', 'Keep a few fast foundations around: bread, eggs, noodles, canned beans, frozen rice, and something creamy.'], filter: meal => meal.tags.includes('Quick') },
  { slug: 'no-cook', title: 'No-Cook Recipes for One', description: 'No-stove, no-oven meals built from good ingredients and almost no effort.', intro: 'No-cook dinner works best when it has contrast. Pair something creamy with something crisp, add salt or acid, and put bread or crackers nearby. The recipes here turn that loose formula into an actual meal.', guideTitle: 'A useful no-cook formula', guide: ['Choose a base such as yogurt, cottage cheese, hummus, tinned fish, or a good cheese.', 'Add produce for crunch and freshness, then something briny or acidic to wake everything up.', 'Finish with bread, crackers, pita, or chips so the plate has enough substance.'], filter: meal => meal.tags.includes('No Cook') },
  { slug: 'for-one', title: 'Easy Recipes for One', description: 'Single-serving dinners, snacks, bowls, toast, and comfort food without leftovers.', intro: 'Cooking for one should not require dividing a family recipe by four and hoping for the best. These recipes begin with a single serving, realistic cookware, and quantities that make sense for one hungry person.', guideTitle: 'Cooking for one without waste', guide: ['Buy flexible ingredients that can move between toast, pasta, bowls, and snack plates.', 'Freeze bread, cooked grains, and extra portions of sauces before they become a problem.', 'Treat the serving size as a starting point. A bigger appetite can add bread, greens, or an egg.'], filter: meal => String(meal.serves) === '1' },
  { slug: 'vegetarian', title: 'Vegetarian Recipes for One', description: 'Low-effort vegetarian meals for one, from snack plates to pasta and toast.', intro: 'This collection leans on beans, eggs, cheese, vegetables, noodles, and grains. The point is not to imitate a meat-centered dinner. It is to build something satisfying from ingredients that already taste good together.', guideTitle: 'Build flavor without extra work', guide: ['Brown mushrooms, toast bread, and let cheese take on color whenever the recipe allows it.', 'Use beans, eggs, yogurt, tofu, or cheese to give a light meal more staying power.', 'Finish with acid and texture. Lemon, vinegar, pickles, seeds, and toasted nuts do a lot.'], filter: meal => meal.tags.includes('Vegetarian') },
  { slug: 'pasta', title: 'Easy Pasta Recipes for One', description: 'Small-batch pasta recipes for one, from pantry staples to proper comfort food.', intro: 'A single bowl of pasta is one of the easiest dinners to scale well. The recipes here use measured portions, small pans, and enough pasta water to turn a handful of ingredients into a glossy sauce.', guideTitle: 'Better pasta for one', guide: ['Salt the cooking water and reserve some before draining. That starchy water is part of the sauce.', 'Move the pasta into the sauce while it is still firm, then finish cooking the two together.', 'For most appetites, 3.5 ounces or 100 grams of dried pasta makes a generous single serving.'], filter: meal => meal.category === 'Pasta' || meal.tags.includes('Pasta') },
  { slug: 'toast', title: 'Toast Recipes for One', description: 'Toast recipes that turn bread and a few good toppings into an actual meal for one.', intro: 'Toast becomes dinner when the bread is properly crisp and the topping brings enough flavor and substance. These recipes cover creamy, briny, cheesy, savory, and sweet versions without making toast pretend to be something else.', guideTitle: 'The difference between toast and good toast', guide: ['Use bread thick enough to stay crisp beneath the topping.', 'Season each layer, especially mild ingredients such as avocado, ricotta, mushrooms, and tomatoes.', 'Add the wettest toppings at the last minute so the bread keeps its crunch.'], filter: meal => meal.category === 'Toast' || meal.tags.includes('Toast') },
  { slug: 'snack-plates', title: 'Snack Plate Ideas for One', description: 'Low-effort snack plates with cheese, fruit, bread, pickles, fish, and whatever else works.', intro: 'A snack plate is a meal with the assembly exposed. Aim for a few distinct flavors and textures, give everything enough room on the plate, and stop when it looks like the amount you actually want to eat.', guideTitle: 'Build a snack plate that eats like dinner', guide: ['Pick one anchor such as cheese, tinned fish, hummus, eggs, or cured meat.', 'Add something crisp, something fresh, and something sharp or briny.', 'Bread and crackers are not decoration. Include enough to carry the rest of the plate.'], filter: meal => meal.category === 'Snack Plate' },
  { slug: 'comfort-food', title: 'Comfort Food Recipes for One', description: 'Comforting recipes for one when dinner should be warm, easy, and worth eating.', intro: 'Comfort food can be creamy pasta, a crisp grilled sandwich, a baked potato, or a bowl of noodles with exactly the right amount of heat. These recipes keep the portions practical without sanding off the parts that make them comforting.', guideTitle: 'Small-batch comfort food', guide: ['Use a small skillet, saucepan, or baking dish so a single portion cooks evenly.', 'Let cheese melt fully and give onions, mushrooms, and butter time to brown.', 'Balance richness with mustard, vinegar, lemon, pickles, herbs, or chilli.'], filter: meal => meal.tags.includes('Comfort') },
  { slug: '15-minute', title: '15-Minute Recipes for One', description: 'Fast recipes for one with no more than fifteen minutes of combined prep and cooking.', intro: 'Every recipe in this collection fits within fifteen minutes of stated prep and cooking time. Read the short method first, gather what you need, and dinner should stay inside that window.', guideTitle: 'Make the fifteen minutes count', guide: ['Use pre-cooked grains, canned beans, quick noodles, and ingredients that are good straight from the package.', 'Prep while water boils or the pan heats, but do not rush the step that creates browning.', 'Keep the finish simple. One sauce, one herb, or one crunchy topping is enough.'], filter: meal => minutes(meal.prep) + minutes(meal.cook) <= 15 }
];

function renderListingPage({ title, description, canonical, meals: listed, root, eyebrow, intro, guideTitle, guide = [], active = '' }) {
  const schema = { '@context': 'https://schema.org', '@type': 'ItemList', name: title, itemListElement: listed.slice(0, 30).map((meal, index) => ({ '@type': 'ListItem', position: index + 1, url: recipeUrl(meal), name: meal.name })) };
  return `<!DOCTYPE html><html lang="en"><head>${commonHead({ title: `${title} | foidslop`, description, canonical, root })}<script type="application/ld+json">${jsonLd(schema)}</script><link rel="stylesheet" href="${root}css/content.css?v=20260715-1"><link rel="stylesheet" href="${root}css/theme.css?v=20260713-4"></head><body><a href="#main" class="sr-only focusable">Skip to content</a>${header(root, active)}<main id="main" class="content-page"><header class="content-hero"><p class="content-eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1><p>${esc(intro || description)}</p><span class="collection-count">${listed.length} recipes in this collection</span></header><div class="content-grid">${listed.map(meal => recipeCard(meal, root)).join('')}</div>${guide.length ? `<section class="collection-guide"><p class="content-eyebrow">A better starting point</p><h2>${esc(guideTitle)}</h2><ul>${guide.map(item => `<li>${esc(item)}</li>`).join('')}</ul></section>` : ''}<nav class="hub-links" aria-label="Recipe collections"><a href="${root}girl-dinner-ideas">Girl dinner ideas</a>${hubs.map(hub => `<a href="${root}recipes/${hub.slug}">${esc(hub.title)}</a>`).join('')}</nav></main>${footer(root)}${siteScript}</body></html>`;
}

function buildHubs() {
  fs.mkdirSync(RECIPE_HUB_DIR, { recursive: true });
  for (const hub of hubs) {
    const listed = published.filter(hub.filter).slice().reverse();
    fs.writeFileSync(path.join(RECIPE_HUB_DIR, `${hub.slug}.html`), renderListingPage({ ...hub, canonical: `${BASE_URL}/recipes/${hub.slug}`, meals: listed, root: '../', eyebrow: 'Recipe collection' }));
  }
  const girls = published.filter(meal => meal.tags.includes('No Cook') || meal.category === 'Snack Plate' || meal.category === 'Toast').slice().reverse();
  fs.writeFileSync(path.join(ROOT, 'girl-dinner-ideas.html'), renderListingPage({ title: 'Girl Dinner Ideas', description: 'Easy girl dinner ideas with snack plates, toast, bowls, and no-cook recipes made for one.', canonical: `${BASE_URL}/girl-dinner-ideas`, meals: girls, root: '', eyebrow: 'Low effort, high satisfaction', intro: 'Girl dinner can be a snack plate, excellent toast, a bowl of something comforting, or whatever makes feeding yourself feel possible. The best version has contrast, enough food to satisfy you, and no need to justify itself.', guideTitle: 'What makes a good girl dinner?', guide: ['Start with what you genuinely want to eat, not what a complete dinner is supposed to look like.', 'Mix textures and temperatures so the plate stays interesting from the first bite to the last.', 'A loose collection of food still benefits from seasoning, a squeeze of lemon, or something pickled.'] }));
}

function renderEditorialPages() {
  const definitionSchema = { '@context': 'https://schema.org', '@type': 'Article', headline: 'What Is Foidslop?', description: 'The meaning and origin of foidslop, its relationship to girl dinner, and why this site reclaims the term.', author: { '@type': 'Organization', name: 'foidslop', url: BASE_URL, logo: `${BASE_URL}/brand-icon.png` }, mainEntityOfPage: `${BASE_URL}/what-is-foidslop` };
  fs.writeFileSync(path.join(ROOT, 'what-is-foidslop.html'), `<!DOCTYPE html><html lang="en"><head>${commonHead({ title: 'What Is Foidslop? Meaning, Origin & Girl Dinner', description: 'What does foidslop mean? Learn the slang term’s origin, its connection to girl dinner, and how foidslop reclaims it through daily recipes.', canonical: `${BASE_URL}/what-is-foidslop` })}<script type="application/ld+json">${jsonLd(definitionSchema)}</script><link rel="stylesheet" href="css/content.css"><link rel="stylesheet" href="css/theme.css?v=20260713-4"></head><body>${header('', 'meaning')}<main class="article-page"><p class="content-eyebrow">Internet slang, reclaimed</p><h1>What is foidslop?</h1><p class="article-deck">Foidslop is internet slang for the low-effort, aesthetically specific meals often associated with “girl dinner”: toast, snack plates, smoothies, cottage-cheese bowls, tinned fish, and whatever else counts as feeding yourself without staging a production.</p><h2>The honest origin</h2><p>The word is built from “foid,” a derogatory term for women that emerged from misogynistic online communities, and “slop.” That origin is dehumanizing. This site does not endorse it or pretend it is harmless.</p><h2>Why reclaim it?</h2><p>foidslop takes the insult and points it somewhere more useful: toward the small, improvised meals people make for themselves. The food does not need to be nutritionally perfect, traditionally plated, or labor intensive to deserve care.</p><h2>How is it related to girl dinner?</h2><p>Girl dinner became a name for assembling snacks, bread, cheese, fruit, pickles, tinned fish, or leftovers into a meal for one. Foidslop is the sharper and more internet-poisoned cousin of that idea. Here it becomes a daily recipe format: one approachable meal, with actual ingredients and instructions.</p><h2>Examples of foidslop</h2><ul><li>Avocado or ricotta toast</li><li>Cheese, fruit, bread, and pickles</li><li>Upgraded instant noodles</li><li>Cottage-cheese and yogurt bowls</li><li>Tinned-fish and mezze plates</li></ul><p class="article-cta"><a href="girl-dinner-ideas">Browse girl dinner ideas</a> or <a href="slop/archive">see the full recipe archive</a>.</p></main>${footer('')}${siteScript}</body></html>`);
  fs.writeFileSync(path.join(ROOT, 'editorial-standards.html'), `<!DOCTYPE html><html lang="en"><head>${commonHead({ title: 'How foidslop Recipes Get Made', description: 'How foidslop writes clear single-serving recipes, handles measurements, and keeps its recipe archive useful.', canonical: `${BASE_URL}/editorial-standards` })}<link rel="stylesheet" href="css/content.css?v=20260715-1"><link rel="stylesheet" href="css/theme.css?v=20260713-4"></head><body>${header('')}<main class="article-page"><p class="content-eyebrow">Behind the slop</p><h1>How foidslop gets made</h1><p class="article-deck">One recipe goes up every day. The aim is simple: give one person a clear, appealing way to feed themselves without turning dinner into a project.</p><h2>What counts as a recipe here?</h2><p>Sometimes it is pasta with a real method. Sometimes it is excellent things arranged on toast. Both count. A useful recipe tells you what to buy, how much to use, what order to do things in, and how to recognize when the food is ready.</p><h2>Written for one from the start</h2><p>These are not family recipes divided until the numbers look small. Quantities, cookware, timing, and yield are written around a single serving. Appetite varies, of course, so bread, greens, fruit, or an egg can round out a lighter plate.</p><h2>Measurements that make sense</h2><p>US measurements come first. Weight is included when it makes the result more accurate, especially for pasta, cheese, and other ingredients that are awkward to measure by volume. Oven temperatures appear in Fahrenheit followed by Celsius.</p><h2>Clear methods, not busywork</h2><p>Steps follow the real stages of the recipe. Browning, simmering, assembling, and finishing stay separate when that makes the method easier to follow. Timing and visual cues are included where they matter. A genuine assembly recipe can still have one step if splitting it would only create extra scrolling.</p><h2>Flexible where it helps</h2><p>These recipes are meant to bend. A different cheese, another pasta shape, or the herb already in your refrigerator can often work. The notes call out the details that matter most, such as drying chickpeas before roasting or saving pasta water before draining.</p><h2>Food safety stays plain</h2><p>Recipes that cook meat, fish, or eggs include a clear doneness cue where one is needed. Keep raw ingredients separate, refrigerate leftovers promptly, and reheat them until hot throughout.</p><h2>Useful updates</h2><p>The archive is maintained as a working collection. If an ingredient, measurement, or instruction needs a meaningful fix, the recipe itself is updated while its original publication date stays in place.</p><p class="article-cta"><a href="slop/archive">Browse the recipe archive</a> <a href="what-is-foidslop">Why the name foidslop?</a></p></main>${footer('')}${siteScript}</body></html>`);

  const foidArticleDate = '2026-07-13';
  const foidArticleDescription = 'Foid is derogatory incel slang for women. Learn where the term comes from, why it is offensive, and how foidslop reclaims the name.';
  const foidArticleSchema = {
    '@context': 'https://schema.org', '@type': 'Article', headline: 'What Does Foid Mean? Slang Definition and Origin',
    description: foidArticleDescription, image: `${BASE_URL}/og-image.png`, datePublished: foidArticleDate, dateModified: foidArticleDate,
    author: { '@type': 'Organization', name: 'foidslop', url: BASE_URL },
    publisher: { '@type': 'Organization', name: 'foidslop', url: BASE_URL, logo: { '@type': 'ImageObject', url: `${BASE_URL}/brand-icon.png` } },
    mainEntityOfPage: `${BASE_URL}/what-does-foid-mean`, about: ['foid', 'femoid', 'incel slang', 'internet slang']
  };
  fs.writeFileSync(path.join(ROOT, 'what-does-foid-mean.html'), `<!DOCTYPE html><html lang="en"><head>${commonHead({ title: 'What Does Foid Mean? Slang Definition & Origin', description: foidArticleDescription, canonical: `${BASE_URL}/what-does-foid-mean`, type: 'article' })}<meta property="article:published_time" content="${foidArticleDate}"><meta property="article:modified_time" content="${foidArticleDate}"><script type="application/ld+json">${jsonLd(foidArticleSchema)}</script><link rel="stylesheet" href="css/content.css"><link rel="stylesheet" href="css/theme.css?v=20260713-4"></head><body>${header('', 'meaning')}<main id="main" class="article-page"><p class="content-eyebrow">Internet slang, explained</p><h1>What does “foid” mean?</h1><p class="article-deck"><strong>The short answer:</strong> “Foid” is derogatory internet slang for a woman. It comes from “femoid” and is associated with incel communities that use the word to make women sound less than human.</p><p class="article-meta">Published July 13, 2026 · foidslop editorial</p><aside class="article-callout"><span>In plain English</span><p>It is not a neutral synonym for “woman.” It is an insult with a deliberately dehumanizing origin.</p></aside><h2>Where does the word “foid” come from?</h2><p>“Foid” is a shortened form of “femoid.” The longer word combines “female” with “humanoid” or “android,” framing women as a separate, mechanical kind of being rather than as people. The <a href="https://www.adl.org/resources/backgrounder/incels-involuntary-celibates" rel="external">Anti-Defamation League’s guide to incel terminology</a> describes it as a derogatory term used to reduce women to a subhuman group.</p><p>The word developed inside online incel culture. “Incel” is short for “involuntary celibate,” but the communities associated with that label have built a much larger ideology around resentment, sexual entitlement, and hostility toward women. In that vocabulary, “foid” does more than identify gender: it signals the speaker’s contempt.</p><h2>Is “foid” a slur?</h2><p>People differ over which offensive words receive the formal label “slur,” but the practical answer is straightforward: “foid” functions as a misogynistic and dehumanizing insult. It is normally used to talk about women as a category, not to describe a specific behavior or idea.</p><p>That context matters when the term appears in a joke, username, meme, or unfamiliar piece of internet language. Someone can repeat a word without knowing its history, but the history does not disappear. Using it casually can still reproduce the contempt built into it.</p><h2>What is the difference between “foid” and “femoid”?</h2><p>There is no meaningful difference in intent. “Foid” is simply the clipped form of “femoid.” Both words belong to the same vocabulary and carry the same dehumanizing idea. “Moid,” a later parallel term aimed at men, does not make the original word neutral.</p><h2>Then why is this site called foidslop?</h2><p><a href="what-is-foidslop">foidslop takes the insult apart and redirects it</a>. Here, the name refers to the small, improvised meals people make for themselves: toast, pasta, snack plates, bowls, tinned fish, and other food that can be dismissed as unserious or insufficiently domestic.</p><p>The publication does not pretend the first half of its name is harmless. The point is reclamation: take a term meant to diminish women, attach it to the ordinary work of feeding yourself, and turn the result into something useful. On foidslop, that means one approachable recipe for one person every day.</p><h2>Sources and further reading</h2><ul class="article-sources"><li><a href="https://www.adl.org/resources/backgrounder/incels-involuntary-celibates" rel="external">Anti-Defamation League: Incels (Involuntary Celibates)</a></li><li><a href="https://www.adl.org/resources/article/online-poll-results-provide-new-insights-incel-community" rel="external">Anti-Defamation League: Online Poll Results Provide New Insights into Incel Community</a></li><li><a href="https://www.icct.nl/sites/default/files/2023-01/Special-Edition-Volume-2.pdf" rel="external">International Centre for Counter-Terrorism: Incel Radical Milieu and External Locus of Control</a></li></ul><p class="article-cta"><a href="what-is-foidslop">What is foidslop?</a><a href="girl-dinner-ideas">Browse girl dinner ideas</a><a href="slop/archive">Open the recipe archive</a></p></main>${footer('')}${siteScript}</body></html>`);

  const whatPageFile = path.join(ROOT, 'what-is-foidslop.html');
  const whatPageRelated = '<section class="article-related" aria-labelledby="what-related-title"><p class="content-eyebrow">Editorial / read more</p><h2 id="what-related-title">Keep reading</h2><div class="article-related-grid"><a href="what-does-foid-mean"><span>Slang, explained</span><strong>What does “foid” mean?</strong><em>The term behind the name, without pretending its origin is harmless.</em></a><a href="editorial-standards"><span>Behind the slop</span><strong>How foidslop gets made</strong><em>How the daily recipes are developed, checked, illustrated, and corrected.</em></a></div></section>';
  const whatPage = fs.readFileSync(whatPageFile, 'utf8').replace('The word is built from “foid,”', 'The word is built from <a href="what-does-foid-mean">“foid,”</a>').replace('</main>', `${whatPageRelated}</main>`);
  fs.writeFileSync(whatPageFile, whatPage);

  const foidPageFile = path.join(ROOT, 'what-does-foid-mean.html');
  const foidPageRelated = '<section class="article-related" aria-labelledby="foid-related-title"><p class="content-eyebrow">Editorial / read more</p><h2 id="foid-related-title">Keep reading</h2><div class="article-related-grid"><a href="what-is-foidslop"><span>Meaning &amp; origin</span><strong>What is foidslop?</strong><em>How an insult became a daily recipe publication for one.</em></a><a href="editorial-standards"><span>Behind the slop</span><strong>How foidslop gets made</strong><em>How the daily recipes are developed, checked, illustrated, and corrected.</em></a></div></section>';
  const foidPage = fs.readFileSync(foidPageFile, 'utf8').replace('<p class="article-cta">', `${foidPageRelated}<p class="article-cta">`);
  fs.writeFileSync(foidPageFile, foidPage);
}

function buildSitemap() {
  const staticUrls = [
    ['', today], ['slop/archive', today], ['what-is-foidslop', today], ['what-does-foid-mean', '2026-07-13'], ['editorial-standards', today], ['girl-dinner-ideas', today],
    ...hubs.map(hub => [`recipes/${hub.slug}`, today])
  ];
  const body = staticUrls.map(([url, lastmod]) => `<url><loc>${BASE_URL}/${url}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n') + '\n' + published.map(meal => `<url><loc>${recipeUrl(meal)}</loc><lastmod>${meal.dateModified || isoDate(releaseDate(meal))}</lastmod><image:image><image:loc>${imageUrl(meal)}</image:loc><image:title>${xml(meal.name)}</image:title></image:image></url>`).join('\n');
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${body}\n</urlset>\n`);
}

function buildFeed() {
  const entries = published.slice(-20).reverse().map(meal => `<entry><title>${xml(meal.name)}</title><link href="${recipeUrl(meal)}"/><id>${recipeUrl(meal)}</id><published>${isoDate(releaseDate(meal))}T05:00:00Z</published><updated>${isoDate(releaseDate(meal))}T05:00:00Z</updated><summary>${xml(meal.description)}</summary></entry>`).join('\n');
  fs.writeFileSync(path.join(ROOT, 'feed.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom"><title>foidslop: Daily Recipes</title><link href="${BASE_URL}/feed.xml" rel="self"/><link href="${BASE_URL}/"/><id>${BASE_URL}/</id><updated>${today}T05:00:00Z</updated>${entries}</feed>\n`);
}

function buildPinterestFeed() {
  const entries = published.slice().reverse().map(meal => {
    const socialPath = path.join(SLOP_DIR, 'social', `${meal.slug}-pin.jpg`);
    const image = fs.existsSync(socialPath) ? pinterestImageUrl(meal) : imageUrl(meal);
    const imagePath = fs.existsSync(socialPath) ? socialPath : path.join(SLOP_DIR, 'img', imageFile(meal));
    const size = fs.statSync(imagePath).size;
    const date = releaseDate(meal).toUTCString();
    return `<item><title>${xml(meal.name)}</title><description>${xml(meal.description)}</description><link>${recipeUrl(meal)}</link><guid isPermaLink="true">${recipeUrl(meal)}</guid><pubDate>${date}</pubDate><enclosure url="${image}" length="${size}" type="image/jpeg"/><media:content url="${image}" type="image/jpeg" medium="image"/></item>`;
  }).join('\n');
  fs.writeFileSync(path.join(ROOT, 'pinterest-rss.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/"><channel><title>foidslop recipes</title><link>${BASE_URL}/</link><description>Daily recipes made for one from foidslop.</description><lastBuildDate>${new Date(`${today}T05:00:00Z`).toUTCString()}</lastBuildDate>${entries}</channel></rss>\n`);
}

function buildRedirects() {
  const lines = [`/slop/today  /slop/${current.slug}  301`, '/index.html  /  301', '/slop/archive.html  /slop/archive  301', '/privacy.html  /privacy  301', '/what-is-foidslop.html  /what-is-foidslop  301', '/what-does-foid-mean.html  /what-does-foid-mean  301', '/editorial-standards.html  /editorial-standards  301', '/girl-dinner-ideas.html  /girl-dinner-ideas  301'];
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
buildPinterestFeed();
buildRedirects();
console.log(`Published ${current.name} (${today}); ${published.length} public recipes.`);
