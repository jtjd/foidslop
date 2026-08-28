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
const crypto = require('crypto');
const { chronological, releaseDate, ARCHIVE_CHUNK } = require('./lib/publication-order');
const { chooseArchivePick } = require('./lib/archive-pick');
const { sitemapFingerprint } = require('./lib/sitemap-fingerprint');
const ratings = require('./lib/ratings');

const ROOT = process.cwd();
const SLOP_DIR = path.join(ROOT, 'slop');
const RECIPE_HUB_DIR = path.join(ROOT, 'recipes');
const DB_FILE = path.join(ROOT, 'data', 'foidslop-meals.json');
const HOMEPAGE_FILE = path.join(ROOT, 'data', 'homepage.json');
const BASE_URL = 'https://foidslop.com';
const PINTEREST_URL = 'https://www.pinterest.com/foidslop/';
const SAME_AS = [PINTEREST_URL];
const TZ = 'America/New_York';
const GLOBAL_CSS_VERSION = '20260827-1';
const ARCHIVE_CSS_VERSION = '20260827-3';
const CONTENT_CSS_VERSION = '20260827-1';
const SLOP_CSS_VERSION = '20260827-2';
const THEME_CSS_VERSION = '20260827-2';

function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function xml(value) { return esc(value); }
function isoDate(date) { return date.toISOString().slice(0, 10); }
function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && isoDate(parsed) === value;
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
function effectiveDateModified(meal) {
  const publicationDate = isoDate(releaseDate(meal));
  const storedDate = isIsoDate(meal.dateModified) ? meal.dateModified : publicationDate;
  return storedDate < publicationDate ? publicationDate : storedDate;
}
function recipeKeywords(meal) {
  const excluded = new Set([meal.category, meal.cuisine].filter(Boolean).map(value => String(value).trim().toLowerCase()));
  return [...new Set((meal.tags || []).filter(tag => !excluded.has(String(tag).trim().toLowerCase())))];
}
function titleLines(name) {
  const words = name.toUpperCase().split(/\s+/);
  const midpoint = Math.ceil(words.length / 2);
  const first = esc(words.slice(0, midpoint).join(' '));
  const second = esc(words.slice(midpoint).join(' '));
  return second ? `${first}<br>${second}.` : `${first}.`;
}
function isLongSlopTitle(name) {
  const value = String(name || '').trim();
  const wordCount = value ? value.split(/\s+/).length : 0;
  return value.length >= 36 || wordCount >= 8;
}
function recipeTitleLines(name) {
  if (!isLongSlopTitle(name)) return titleLines(name);
  const words = String(name).toUpperCase().trim().split(/\s+/);
  if (words.length < 3) return titleLines(name);
  let best = null;
  for (let firstBreak = 1; firstBreak < words.length - 1; firstBreak += 1) {
    for (let secondBreak = firstBreak + 1; secondBreak < words.length; secondBreak += 1) {
      const lines = [
        words.slice(0, firstBreak).join(' '),
        words.slice(firstBreak, secondBreak).join(' '),
        words.slice(secondBreak).join(' ')
      ];
      const lengths = lines.map(line => line.length);
      const range = Math.max(...lengths) - Math.min(...lengths);
      const score = Math.max(...lengths) * 2 + range;
      if (!best || score < best.score) best = { lines, score };
    }
  }
  return best.lines.map((line, index) => `${esc(line)}${index === best.lines.length - 1 ? '.' : ''}`).join('<br>');
}
function slopTitleClass(name) {
  return isLongSlopTitle(name) ? 'slop-title slop-title--long' : 'slop-title';
}
function jsonLd(data) { return JSON.stringify(data, null, 2).replace(/<\//g, '<\\/'); }
function isHttpsUrl(value) {
  try { return new URL(value).protocol === 'https:'; } catch (error) { return false; }
}

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const homepage = JSON.parse(fs.readFileSync(HOMEPAGE_FILE, 'utf8'));
const meals = (db.meals || db).slice().sort((a, b) => a.id - b.id);

function loadRatingsCache() {
  try { return ratings.normalizeSummaries(JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ratings.json'), 'utf8'))); }
  catch { return {}; }
}
const ratingsCache = loadRatingsCache();
const ratingSummary = meal => (ratingsCache[meal.slug] && published.includes(meal) ? ratingsCache[meal.slug] : null);
function stripBrand(title) {
  return String(title || '').replace(/\s*\|\s*foidslop\s*$/i, '').trim();
}
const EDITORIAL_FILE = path.join(ROOT, 'data', 'editorial-pages.json');

function loadEditorialConfig() {
  if (!fs.existsSync(EDITORIAL_FILE)) return [];
  const pages = JSON.parse(fs.readFileSync(EDITORIAL_FILE, 'utf8'));
  if (!Array.isArray(pages)) throw new Error('data/editorial-pages.json must contain an array');
  return pages;
}

/** Root-level roundup pages get cross-linked from every listing page. */
function editorialNavLinks(excludeSlug = null) {
  return visibleEditorialPages()
    .filter(page => page.title && page.slug !== excludeSlug)
    .map(page => ({ href: page.slug, label: page.title }));
}

function editorialSelection(page) {
  const match = page.match || {};
  const includeSlugs = Array.isArray(match.slugs) ? match.slugs : [];
  const includeTags = Array.isArray(match.tags) ? match.tags : [];
  const includeCategories = Array.isArray(match.categories) ? match.categories : [];
  const excludeTags = Array.isArray(match.excludeTags) ? match.excludeTags : [];
  if (!includeSlugs.length && !includeTags.length && !includeCategories.length) return [];
  return published.filter(meal => {
    if (includeSlugs.length && !includeSlugs.includes(meal.slug)) return false;
    if (excludeTags.some(tag => meal.tags.includes(tag))) return false;
    if (includeTags.length && !includeTags.some(tag => meal.tags.includes(tag))) return false;
    if (includeCategories.length && !includeCategories.includes(meal.category)) return false;
    if (match.maxTotalMinutes != null && minutes(meal.prep) + minutes(meal.cook) > match.maxTotalMinutes) return false;
    return true;
  }).slice().reverse();
}

function validateEditorialConfig() {
  const errors = [];
  const seen = new Set();
  for (const page of loadEditorialConfig()) {
    if (!page.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.slug)) errors.push(`editorial page has an invalid slug: ${JSON.stringify(page.slug)}`);
    else if (seen.has(page.slug)) errors.push(`duplicate editorial page slug: ${page.slug}`);
    else seen.add(page.slug);
    for (const field of ['title', 'description', 'eyebrow', 'intro', 'guideTitle']) {
      if (typeof page[field] !== 'string' || !page[field].trim()) errors.push(`editorial page ${page.slug}: missing ${field}`);
    }
    if ((page.seoTitle || '').length > 64) errors.push(`editorial page ${page.slug}: seoTitle exceeds 64 characters`);
    if (Array.isArray(page.match?.slugs)) {
      for (const slug of page.match.slugs) {
        if (!meals.some(meal => meal.slug === slug)) errors.push(`editorial page ${page.slug}: unknown recipe slug ${slug}`);
      }
    }
    if (!Array.isArray(page.guide) || page.guide.length < 3) errors.push(`editorial page ${page.slug}: guide needs at least three items`);
    if (!Array.isArray(page.faqs) || page.faqs.length < 3 || page.faqs.some(item => !item.q || !item.a)) {
      errors.push(`editorial page ${page.slug}: needs at least three complete FAQ entries`);
    }
    // Scheduled pages skip the inventory check until they activate; a dormant
    // config must never break the daily build.
    if (page.notBefore && today < page.notBefore) continue;
    const listed = editorialSelection(page);
    const minimum = Number.isInteger(page.minRecipes) ? page.minRecipes : 8;
    if (listed.length < minimum) errors.push(`editorial page ${page.slug}: needs ${minimum} matching recipes, found ${listed.length}`);
  }
  return errors;
}

/** Month gating for seasonal roundups; pages always build, links rotate. */
function roundupInSeason(page, month) {
  if (!Array.isArray(page.seasonMonths) || !page.seasonMonths.length) return true;
  return page.seasonMonths.includes(month);
}

/** Scheduled pages (notBefore) stay fully configured but dormant until the date. */
function editorialActiveToday(page) {
  return !page.notBefore || today >= page.notBefore;
}

function visibleEditorialPages() {
  return loadEditorialConfig().filter(page => page.slug && editorialActiveToday(page));
}

function activeRoundups() {
  const month = Number(today.slice(5, 7));
  return visibleEditorialPages().filter(page => roundupInSeason(page, month));
}

function roundupMatchesMeal(page, meal) {
  const match = page.match || {};
  if (Array.isArray(match.excludeTags) && match.excludeTags.some(tag => meal.tags.includes(tag))) return false;
  const slugHit = Array.isArray(match.slugs) && match.slugs.includes(meal.slug);
  const tagHit = Array.isArray(match.tags) && match.tags.some(tag => meal.tags.includes(tag));
  const categoryHit = Array.isArray(match.categories) && match.categories.includes(meal.category);
  if (!slugHit && !tagHit && !categoryHit) return false;
  if (match.maxTotalMinutes != null && minutes(meal.prep) + minutes(meal.cook) > match.maxTotalMinutes) return false;
  return true;
}


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
let published = meals.filter(meal => isoDate(releaseDate(meal)) <= today && meal.status !== 'retired').sort(chronological);
if (setOverride) {
  const selected = meals.find(meal => meal.slug === setOverride || String(meal.id) === String(setOverride));
  if (!selected) throw new Error(`Unknown meal: ${setOverride}`);
  const selectedDate = releaseDate(selected);
  published = meals.filter(meal => releaseDate(meal) <= selectedDate && meal.status !== 'retired').sort(chronological);
}
if (!published.length) throw new Error(`No meals are published by ${today}`);
const current = published[published.length - 1];

for (const meal of meals) {
  const wasPublished = meal.status === 'published';
  if (meal.status === 'retired') continue;
  const release = isoDate(releaseDate(meal));
  meal.status = release <= today ? 'published' : 'scheduled';
  if (meal.status === 'published') {
    // A newly activated recipe must carry today's build date so its first
    // sitemap publication is eligible for IndexNow, while existing recipes
    // retain their honest content revision date.
    if (!wasPublished || !isIsoDate(meal.dateModified)) meal.dateModified = today;
    else meal.dateModified = effectiveDateModified(meal);
  } else {
    // A scheduled recipe has no public revision yet. Keeping a pre-publication
    // dateModified creates invalid Recipe metadata and stale sitemap lastmod.
    delete meal.dateModified;
  }
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
    if (meal.dateModified && !isIsoDate(meal.dateModified)) errors.push(`Invalid modification date: ${meal.slug}`);
    if (meal.dateModified && meal.dateModified < isoDate(releaseDate(meal))) errors.push(`Modification date precedes publication: ${meal.slug}`);
    if (meal.status === 'published' && meal.dateModified > today) errors.push(`Modification date is in the future: ${meal.slug}`);
    if (/Whatever protein or hearty filling|Anything crunchy works for scooping|frozen versions cook directly|crisp or warm as intended/i.test([meal.headnote, meal.storage, meal.substitutions].join(' '))) {
      errors.push(`Generic discovery copy needs editing: ${meal.slug}`);
    }
    if (meal.variations != null) {
      if (!meal.variationsTitle || !Array.isArray(meal.variations) || meal.variations.length < 6) {
        errors.push(`Recipe variations need a title and at least six entries: ${meal.slug}`);
      } else {
        const variationNames = new Set();
        for (const variation of meal.variations) {
          const variationName = String(variation?.name || '').trim();
          const variationText = String(variation?.text || '').trim();
          if (!variationName || variationText.length < 45) errors.push(`Thin recipe variation: ${meal.slug}`);
          if (variationNames.has(variationName.toLowerCase())) errors.push(`Duplicate recipe variation: ${meal.slug}`);
          variationNames.add(variationName.toLowerCase());
        }
      }
    }
  }
  for (const field of ['headnote', 'storage', 'substitutions', 'seoDescription']) {
    const seen = new Map();
    for (const meal of meals.filter(item => item.status !== 'retired')) {
      if (!seen.has(meal[field])) seen.set(meal[field], []);
      seen.get(meal[field]).push(meal.slug);
    }
    const duplicates = [...seen.values()].filter(slugs => slugs.length > 1);
    if (duplicates.length) errors.push(`Repeated discovery copy in ${field}: ${duplicates.slice(0, 3).map(slugs => slugs.join(', ')).join('; ')}`);
  }
  if (meals.some(meal => /clear single-serving recipe ready in|complete ingredient list, clear method, and a total time of/i.test(meal.seoDescription || ''))) {
    errors.push('Recipe SEO descriptions still use a generic template ending');
  }
  for (const meal of published) {
    const image = path.join(SLOP_DIR, 'img', imageFile(meal));
    if (!fs.existsSync(image)) errors.push(`Missing published image: ${meal.slug}`);
  }
  if (!homepage || typeof homepage !== 'object') errors.push('Missing homepage configuration');
  if (!homepage.newsletter?.promise || !homepage.newsletter?.cadence) errors.push('Homepage newsletter copy is incomplete');
  const newsletterHiddenFields = homepage.newsletter?.hiddenFields || {};
  if (typeof newsletterHiddenFields !== 'object' || Array.isArray(newsletterHiddenFields)) {
    errors.push('Newsletter hiddenFields must be an object');
  } else {
    for (const [name, value] of Object.entries(newsletterHiddenFields)) {
      if (!/^[A-Za-z][A-Za-z0-9_.-]*$/.test(name)) errors.push(`Newsletter hidden field name is invalid: ${name}`);
      if (!['string', 'number', 'boolean'].includes(typeof value)) errors.push(`Newsletter hidden field value is invalid: ${name}`);
    }
  }
  if (homepage.newsletter?.enabled) {
    if (!isHttpsUrl(homepage.newsletter.action)) errors.push('Enabled newsletter needs an HTTPS form action');
    if (!/^[A-Za-z][A-Za-z0-9_.-]*$/.test(homepage.newsletter.emailField || '')) errors.push('Newsletter emailField is invalid');
    if (!homepage.newsletter.providerName || !isHttpsUrl(homepage.newsletter.providerPrivacyUrl)) errors.push('Enabled newsletter needs provider privacy details');
  }
  if (!homepage.community?.question || !homepage.community?.deadline || !homepage.community?.promise) errors.push('Homepage community copy is incomplete');
  if (!Array.isArray(homepage.community?.choices) || homepage.community.choices.some(choice => !choice.label)) errors.push('Homepage community choices are invalid');
  if (homepage.community?.status !== 'idle' && homepage.community?.choices.length < 2) errors.push('An active or closed community poll needs at least two named choices');
  if (homepage.community?.enabled) {
    if (!isHttpsUrl(homepage.community.submissionUrl)) errors.push('Enabled community module needs an HTTPS submission URL');
    if (!homepage.community.providerName || !isHttpsUrl(homepage.community.providerPrivacyUrl)) errors.push('Enabled community module needs provider privacy details');
    if (!homepage.community.pollId || !['open', 'closed', 'idle'].includes(homepage.community.status)) errors.push('Enabled community module needs a poll id and valid status');
  }
  if (homepage.community?.featuredReader) {
    const feature = homepage.community.featuredReader;
    if (!feature.name || !feature.report || feature.permissionConfirmed !== true) errors.push('Featured reader needs a name, report, and confirmed publication permission');
    if (feature.recipeSlug && !published.some(meal => meal.slug === feature.recipeSlug)) errors.push(`Featured reader references an unpublished recipe: ${feature.recipeSlug}`);
  }
  if (!['daily', 'weekly'].includes(homepage.archivePickRotation)) errors.push('Homepage archivePickRotation must be daily or weekly');
  if (Object.hasOwn(homepage, 'archivePickSlug')) errors.push('Homepage archivePickSlug is retired; use archivePickRotation for automatic selection');
  errors.push(...validateEditorialConfig());
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
  const [ogWidth, ogHeight] = /-wide\.jpg$/.test(image) ? [1280, 720] : [1200, 630];
  return `
<script src="${root}cookie-consent.js?v=20260713-4" data-ga-id="G-VT527DETQ2" defer></script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="p:domain_verify" content="7bdfbfde1745ec62bc759913fcc45642">
<link rel="icon" type="image/webp" sizes="512x512" href="/brand-icon.webp">
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
<meta property="og:image:width" content="${ogWidth}">
<meta property="og:image:height" content="${ogHeight}">
<meta property="og:image:alt" content="${esc(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${image}">
<link rel="alternate" type="application/atom+xml" title="foidslop: Daily Recipes" href="${BASE_URL}/feed.xml">
<link rel="preload" as="font" type="font/woff2" href="/fonts/inter-var.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/fonts/bebas-neue-400.woff2" crossorigin>
<link rel="stylesheet" href="${root}css/fonts.css?v=20260826-1">
<link rel="stylesheet" href="${root}css/global.css?v=${GLOBAL_CSS_VERSION}">
<script src="${root}theme.js?v=20260713-5"></script>`;
}

function header(root = '', active = '') {
  const homeUrl = root || '/';
  return `<header class="site-header" id="site-header">
  <a href="${homeUrl}" aria-label="foidslop home"><picture><source type="image/webp" srcset="${root}logo-header.webp"><img src="${root}logo-header.png" alt="FOID SLOP" class="logo" width="126" height="74"></picture></a>
  <div class="site-header-center">Daily recipes / made for one / Issue ${String(current.id).padStart(3, '0')}</div>
  <div class="header-right">
    <button class="theme-toggle" type="button" aria-label="Switch color theme" aria-pressed="true"><span class="theme-toggle-mark" aria-hidden="true">*</span><span class="theme-toggle-label">Light mode</span></button>
    <a href="${root}slop/${current.slug}" class="nav-link header-today${active === 'today' ? ' active' : ''}"${active === 'today' ? ' aria-current="page"' : ''}>Today</a>
    <a href="${root}slop/archive" class="nav-link${active === 'archive' ? ' active' : ''}"${active === 'archive' ? ' aria-current="page"' : ''}>Archive</a>
    <a href="${root}#dispatch" class="nav-link header-dispatch">Dispatch</a>
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
    <a href="${PINTEREST_URL}" rel="external">Pinterest</a><span class="footer-dot"></span>
    <a href="${root}feed.xml" type="application/atom+xml">RSS</a><span class="footer-dot"></span>
    <a href="${root}privacy">Privacy</a><span class="footer-dot"></span>
    <a href="${root}privacy#contact">Contact</a>
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

function recipeCard(meal, prefix = '', eager = false) {
  const loading = eager ? 'eager" fetchpriority="high' : 'lazy';
  return `<article class="related-card"><a href="${prefix}slop/${meal.slug}">
    <picture><source type="image/webp" srcset="${prefix}slop/img/${meal.slug}-480.webp 480w, ${prefix}slop/img/${meal.slug}-768.webp 768w" sizes="(max-width: 560px) 100vw, (max-width: 960px) 50vw, 25vw"><img src="${prefix}slop/img/${imageFile(meal)}" alt="${esc(meal.imageAlt || meal.name)}" width="360" height="360" loading="${loading}" decoding="async"></picture>
    <span>${esc(meal.name)}</span></a></article>`;
}

function socialOrHeroImage(meal) {
  return fs.existsSync(path.join(SLOP_DIR, 'social', `${meal.slug}-wide.jpg`)) ? socialImageUrl(meal) : imageUrl(meal);
}

function pinterestShareUrl(meal) {
  const params = new URLSearchParams({
    url: recipeUrl(meal),
    media: pinterestImageUrl(meal),
    description: `${meal.name} from foidslop: ${meal.description}`
  });
  return `https://pinterest.com/pin/create/button/?${params.toString()}`;
}

function shareRow(meal) {
  const xHref = `https://twitter.com/intent/tweet?url=${encodeURIComponent(recipeUrl(meal))}&text=${encodeURIComponent(`${meal.name} for one`)}`;
  return `<div class="share-row" aria-label="Share this recipe"><span class="share-row-label">Share</span><a class="share-link" href="${pinterestShareUrl(meal)}" target="_blank" rel="noopener" data-track="pin_click">Pin it</a><a class="share-link" href="${xHref}" target="_blank" rel="noopener" data-track="share_click">Post</a><button type="button" class="share-link" id="copy-page-link" data-url="${recipeUrl(meal)}">Copy link</button></div>`;
}

function newsletterInlineSignup(root = '') {
  const newsletter = homepage.newsletter;
  if (!newsletter.enabled) return '';
  const hiddenFields = Object.entries(newsletter.hiddenFields || {})
    .map(([name, value]) => `<input type="hidden" name="${esc(name)}" value="${esc(String(value))}">`)
    .join('');
  return `<section class="dispatch-inline" aria-labelledby="dispatch-inline-title"><div class="dispatch-inline-copy"><span class="zine-kicker">The Weekly Slop</span><h2 id="dispatch-inline-title">${esc(newsletter.promise)}</h2></div><form class="dispatch-inline-form" action="${esc(newsletter.action)}" method="post" data-newsletter-form>${hiddenFields}<label class="sr-only" for="dispatch-inline-email">Email address</label><div class="dispatch-inline-row"><input id="dispatch-inline-email" name="${esc(newsletter.emailField)}" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com" required><button type="submit">Get the weekly slop</button></div></form><p class="dispatch-inline-privacy">${esc(newsletter.cadence)} Double opt-in. See the <a href="${root}privacy">privacy policy</a>.</p></section>`;
}

function reportPrompt() {
  const community = homepage.community;
  if (!community || !community.enabled || !isHttpsUrl(community.submissionUrl)) return '';
  return `<aside class="report-prompt"><span class="report-prompt-label">Made this slop?</span><p>Send a photo or a short field report. Reader reports can appear in The Table.</p><a href="${esc(community.submissionUrl)}" rel="external" data-track="recipe_report_click">Send a report</a></aside>`;
}

function renderRecipe(meal, index) {
  const date = releaseDate(meal);
  const previous = published[index - 1];
  const next = published[index + 1];
  const total = minutes(meal.prep) + minutes(meal.cook);
  const schema = {
    '@context': 'https://schema.org', '@type': 'Recipe', '@id': `${recipeUrl(meal)}#recipe`,
    mainEntityOfPage: recipeUrl(meal), name: meal.name, description: meal.description,
    image: schemaImages(meal), author: { '@type': 'Organization', name: 'foidslop', url: BASE_URL, logo: `${BASE_URL}/brand-icon.webp`, sameAs: SAME_AS },
    datePublished: isoDate(date), dateModified: effectiveDateModified(meal), ...(recipeKeywords(meal).length ? { keywords: recipeKeywords(meal).join(', ') } : {}), recipeCategory: meal.category,
    recipeCuisine: meal.cuisine, prepTime: duration(meal.prep), cookTime: duration(meal.cook),
    totalTime: `PT${total}M`, recipeYield: meal.serves,
    recipeIngredient: meal.ingredients.map(item => `${item.amount} ${item.name}`),
    recipeInstructions: meal.steps.map((step, stepIndex) => ({ '@type': 'HowToStep', name: step.name, text: step.text, url: `${recipeUrl(meal)}#step-${stepIndex + 1}` }))
  };
  const ratingSchema = ratings.aggregateRatingSchema(recipeUrl(meal), ratingSummary(meal));
  if (ratingSchema) schema.aggregateRating = ratingSchema;
  const summary = ratingSummary(meal);
  const primaryHub = hubsForMeal(meal)[0] || null;
  const breadcrumbMid = primaryHub
    ? { name: primaryHub.title, item: `${BASE_URL}/recipes/${primaryHub.slug}` }
    : { name: 'Slop Archive', item: `${BASE_URL}/slop/archive` };
  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
    { '@type': 'ListItem', position: 2, name: breadcrumbMid.name, item: breadcrumbMid.item },
    { '@type': 'ListItem', position: 3, name: meal.name, item: recipeUrl(meal) }
  ] };
  const related = relatedMeals(meal);
  const variations = Array.isArray(meal.variations) && meal.variations.length
    ? `<section class="recipe-variations" aria-labelledby="variation-title"><p class="section-label">Make it yours</p><h2 id="variation-title">${esc(meal.variationsTitle || 'Ways to change it')}</h2><ul>${meal.variations.map(item => `<li><strong>${esc(item.name)}</strong><span>${esc(item.text)}</span></li>`).join('')}</ul></section>`
    : '';
  return `<!DOCTYPE html><html lang="en"><head>${commonHead({
    title: stripBrand(meal.seoTitle), description: meal.seoDescription,
    canonical: recipeUrl(meal), image: fs.existsSync(path.join(SLOP_DIR, 'social', `${meal.slug}-wide.jpg`)) ? socialImageUrl(meal) : imageUrl(meal), type: 'article', root: '../'
  })}
<script type="application/ld+json">${jsonLd([schema, breadcrumb])}</script>
<link rel="stylesheet" href="../css/slop-page.css?v=${SLOP_CSS_VERSION}"><link rel="stylesheet" href="../css/theme.css?v=${THEME_CSS_VERSION}"></head><body>
<a href="#main" class="sr-only focusable">Skip to content</a>${header('../', meal.slug === current.slug ? 'today' : '')}
<div class="slop-header"><p class="slop-eyebrow">Slop of the Day / ${prettyDate(date)}</p><h1 class="${slopTitleClass(meal.name)}">${recipeTitleLines(meal.name)}</h1>
<div class="slop-meta"><span class="slop-date">Published ${prettyDate(date)}</span><div class="slop-tags">${meal.tags.map(tag => `<span class="slop-tag">${esc(tag)}</span>`).join('')}</div></div></div>
<main id="main"><div class="slop-body"><div class="slop-image-panel"><picture><source type="image/webp" srcset="img/${meal.slug}-480.webp 480w, img/${meal.slug}-768.webp 768w" sizes="(max-width: 900px) 100vw, 50vw"><img src="img/${imageFile(meal)}" alt="${esc(meal.imageAlt || meal.name)}" width="768" height="768" loading="eager" fetchpriority="high"></picture><a class="image-pin" href="${pinterestShareUrl(meal)}" target="_blank" rel="noopener" data-track="pin_click" aria-label="Save ${esc(meal.name)} to Pinterest">Pin</a><span class="slop-image-caption">${esc(meal.name)} / foidslop</span></div>
<div class="slop-content"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="../">Home</a><span>/</span>${primaryHub ? `<a href="../recipes/${primaryHub.slug}">${esc(primaryHub.title)}</a>` : `<a href="./archive">Archive</a>`}<span>/</span><span class="current">${esc(meal.name)}</span></nav>
${shareRow(meal)}
<p class="slop-desc">${esc(meal.description)}</p><p class="slop-headnote">${esc(meal.headnote)}</p><p class="section-label">At a Glance</p><div class="slop-stats" role="list">
<div class="slop-stat"><div class="slop-stat-label">Prep</div><div class="slop-stat-value">${esc(meal.prep)}</div></div><div class="slop-stat"><div class="slop-stat-label">Cook</div><div class="slop-stat-value">${esc(meal.cook)}</div></div><div class="slop-stat"><div class="slop-stat-label">Serves</div><div class="slop-stat-value">${esc(meal.serves)}</div></div><div class="slop-stat"><div class="slop-stat-label">Difficulty</div><div class="slop-stat-value">${esc(meal.difficulty)}</div></div></div>
<div class="recipe-tools" aria-label="Recipe tools"><button type="button" class="recipe-tool" id="print-recipe">Print recipe</button><button type="button" class="recipe-tool" id="copy-ingredients">Copy ingredients</button><span class="recipe-tool-status" id="recipe-tool-status" role="status" aria-live="polite"></span></div>
<div class="rate-recipe" id="rate-recipe" data-slug="${esc(meal.slug)}"><span class="rate-label">Rate this slop</span><div class="rate-stars">${[1, 2, 3, 4, 5].map(value => `<button type="button" class="rate-star${summary && value <= Math.round(summary.average) ? ' active' : ''}" data-value="${value}" aria-pressed="${summary && value <= Math.round(summary.average) ? 'true' : 'false'}" aria-label="Rate ${value} out of 5">${value}</button>`).join('')}</div><span class="rate-summary" id="rate-summary">${summary ? `Rated ${summary.average}/5 by ${summary.count} ${summary.count === 1 ? 'reader' : 'readers'}.` : 'Be the first to rate it.'}</span></div>
<p class="section-label">Ingredients</p><ul class="ingredients-list">${meal.ingredients.map((item, ingredientIndex) => `<li class="ingredient-item"><label><input type="checkbox" class="ingredient-check"><span class="ingredient-name">${esc(item.name)}</span><span class="ingredient-amount">${esc(item.amount)}</span></label></li>`).join('')}</ul>
<p class="section-label">Method</p><ol class="steps-list">${meal.steps.map((step, stepIndex) => `<li class="step-item" id="step-${stepIndex + 1}"><span class="step-number">${String(stepIndex + 1).padStart(2, '0')}</span><div class="step-content"><p class="step-name">${esc(step.name)}</p><p class="step-text">${esc(step.text)}</p></div></li>`).join('')}</ol>
${variations}${meal.substitutions ? `<div class="recipe-extra"><p class="recipe-extra-label">Easy swaps</p><p>${esc(meal.substitutions)}</p></div>` : ''}${meal.storage ? `<div class="recipe-extra"><p class="recipe-extra-label">Storage</p><p>${esc(meal.storage)}</p></div>` : ''}
<div class="slop-notes"><p class="slop-notes-label">Slop Notes</p><p>${esc(meal.notes)}</p></div>
<p class="recipe-trust">Recipe by foidslop · <a href="../editorial-standards">How we create our recipes</a></p>
${newsletterInlineSignup('../')}${reportPrompt()}</div></div>
${keepBrowsingLinks(meal)}
<section class="related-recipes" aria-labelledby="related-title"><p class="section-label">Keep eating</p><h2 id="related-title">Related recipes</h2><div class="related-grid">${related.map(item => recipeCard(item, '../')).join('')}</div></section>
<nav class="slop-nav" aria-label="Other slops">${previous ? `<a href="./${previous.slug}" class="slop-nav-item prev"><span class="slop-nav-dir">Previous Slop</span><span class="slop-nav-name">${esc(previous.name)}</span><span class="slop-nav-date">${prettyDate(releaseDate(previous))}</span></a>` : '<span></span>'}${next ? `<a href="./${next.slug}" class="slop-nav-item next"><span class="slop-nav-dir">Next Slop</span><span class="slop-nav-name">${esc(next.name)}</span><span class="slop-nav-date">${prettyDate(releaseDate(next))}</span></a>` : `<span class="slop-nav-item next"><span class="slop-nav-dir">Next Slop</span><span class="slop-nav-name">Check back tomorrow</span></span>`}</nav></main>
${footer('../')}${siteScript}<script src="../recipe-tools.js?v=20260826-1"></script></body></html>`;
}

function totalMinutes(meal) {
  return minutes(meal.prep) + minutes(meal.cook);
}

function homepageCard(meal) {
  const total = totalMinutes(meal);
  return `<article class="zine-recipe-card">
    <a href="slop/${meal.slug}" data-track="home_week_recipe" data-recipe="${esc(meal.slug)}">
      <picture><source type="image/webp" srcset="slop/img/${meal.slug}-480.webp 480w, slop/img/${meal.slug}-768.webp 768w" sizes="(max-width: 620px) 50vw, (max-width: 1000px) 33vw, 17vw"><img src="slop/img/${imageFile(meal)}" alt="${esc(meal.imageAlt || meal.name)}" width="600" height="600" loading="lazy" decoding="async"></picture>
      <div class="zine-recipe-card-copy"><p>${esc(meal.name)}</p><small>${shortDate(releaseDate(meal))} / ${total ? `${total} min` : 'No cook'} / ${esc(meal.category)}</small></div>
    </a>
  </article>`;
}

function newsletterSignup(id, repeated = false) {
  const newsletter = homepage.newsletter;
  if (repeated && !newsletter.enabled) return '';
  const hiddenFields = Object.entries(newsletter.hiddenFields || {})
    .map(([name, value]) => `<input type="hidden" name="${esc(name)}" value="${esc(String(value))}">`)
    .join('');
  const status = newsletter.enabled
    ? `<form class="dispatch-form" action="${esc(newsletter.action)}" method="post" data-newsletter-form>
        ${hiddenFields}
        <label for="${id}-email">Email address</label>
        <div class="dispatch-form-row"><input id="${id}-email" name="${esc(newsletter.emailField)}" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com" required><button type="submit">Get the weekly slop</button></div>
      </form>
      <p class="dispatch-privacy">${esc(newsletter.cadence)} Double opt-in. See the <a href="privacy">privacy policy</a> and <a href="${esc(newsletter.providerPrivacyUrl)}" rel="external">the ${esc(newsletter.providerName)} policy</a>.</p>`
    : `<div class="dispatch-pending" role="status"><strong>Email signup is currently unavailable.</strong><span>Follow the daily feed through <a href="feed.xml" type="application/atom+xml">RSS</a>.</span></div>`;
  return `<section class="zine-newsletter${repeated ? ' zine-newsletter-repeat' : ''}"${repeated ? '' : ' id="dispatch"'} aria-labelledby="${id}-title" data-newsletter-state="${newsletter.enabled ? 'active' : 'inactive'}">
    <div class="zine-newsletter-heading"><div class="zine-kicker">The Weekly Slop</div><h2 id="${id}-title">${repeated ? 'Still hungry?' : 'Come back on purpose.'}</h2></div>
    <div class="zine-newsletter-body"><p class="dispatch-promise">${esc(newsletter.promise)}</p>${status}</div>
  </section>`;
}

function renderCommunity() {
  const community = homepage.community;
  const featured = community.featuredReader && community.featuredReader.name && community.featuredReader.report
    ? `<aside class="table-feature"><span>Filed by ${esc(community.featuredReader.name)}</span><blockquote>${esc(community.featuredReader.report)}</blockquote>${community.featuredReader.recipeSlug ? `<a href="slop/${esc(community.featuredReader.recipeSlug)}">See the implicated recipe</a>` : ''}</aside>`
    : '';
  const winnerLabel = community.status === 'closed' && community.lastResult?.pollId === community.pollId
    ? community.lastResult.winnerLabel
    : null;
  const choices = community.choices.map((choice, index) => `<li${choice.label === winnerLabel ? ' class="table-choice-winner"' : ''}><span>${String(index + 1).padStart(2, '0')}</span>${esc(choice.label)}${choice.label === winnerLabel ? '<strong>Friday’s pick</strong>' : ''}</li>`).join('');
  const isOpen = community.enabled && community.status === 'open';
  const isClosed = community.enabled && community.status === 'closed';
  const actions = isOpen
    ? `<div class="table-actions"><a href="${esc(community.submissionUrl)}" rel="external" data-track="community_vote_click">Vote this week</a><a href="${esc(community.submissionUrl)}" rel="external" data-track="community_submit_click">Send a note or photo</a></div><p class="table-privacy">Submissions are moderated. Publication permission is requested in the form. See <a href="${esc(community.providerPrivacyUrl)}" rel="external">${esc(community.providerName)} privacy details</a>.</p>`
    : isClosed
      ? `<div class="table-actions"><a href="${esc(community.submissionUrl)}" rel="external" data-track="community_submit_click">Send a note or photo</a></div><p class="table-privacy">The vote is closed, but reader reports remain open. Publication permission is requested in the form. See <a href="${esc(community.providerPrivacyUrl)}" rel="external">${esc(community.providerName)} privacy details</a>.</p>`
      : community.enabled
        ? `<div class="table-actions"><a href="${esc(community.submissionUrl)}" rel="external" data-track="community_submit_click">Send a note or photo</a></div><p class="table-privacy">There is no vote this week. Reader reports remain open.</p>`
        : `<div class="table-pending" role="status">Community submissions are currently unavailable.</div>`;
  return `<section class="zine-table" id="table" aria-labelledby="table-title">
    <div class="zine-section-head"><h2 id="table-title">The Table</h2><span>Readers / questions / evidence</span></div>
    <div class="table-layout" data-poll-status="${esc(community.status || 'inactive')}" data-poll-id="${esc(community.pollId || '')}"><div class="table-intro"><div class="zine-kicker">${isClosed ? 'This week’s result' : 'Question of the week'}</div><h3>${esc(community.question)}</h3><p>${esc(community.promise)}</p><small>${esc(community.deadline)}</small></div><div class="table-vote"><ol>${choices}</ol>${actions}</div>${featured}</div>
  </section>`;
}

function renderArchivePick(meal) {
  if (!meal) return '';
  const total = totalMinutes(meal);
  return `<section class="zine-filing" id="filing-cabinet" data-archive-pick="${esc(meal.slug)}" data-archive-rotation="${esc(homepage.archivePickRotation)}" aria-labelledby="filing-title">
    <a class="filing-image" href="slop/${meal.slug}" data-track="archive_pick_open"><picture><source type="image/webp" srcset="slop/img/${meal.slug}-480.webp 480w, slop/img/${meal.slug}-768.webp 768w" sizes="(max-width: 800px) 100vw, 48vw"><img src="slop/img/${imageFile(meal)}" alt="${esc(meal.imageAlt || meal.name)}" width="768" height="768" loading="lazy" decoding="async"></picture></a>
    <div class="filing-copy"><div class="zine-kicker">From the filing cabinet</div><h2 id="filing-title">${titleLines(meal.name)}</h2><p>${esc(meal.description)}</p><div class="filing-meta">${shortDate(releaseDate(meal))} / ${total ? `${total} minutes` : 'No cooking'} / ${esc(meal.category)}</div><a class="zine-read" href="slop/${meal.slug}" data-track="archive_pick_open">Reopen this file</a></div>
  </section>`;
}

function seasonalRoundupTile() {
  const page = activeRoundups()[0];
  if (!page) return '';
  const count = editorialSelection(page).length;
  return `<a class="zine-roundup" href="${page.slug}" data-track="home_roundup_open"><span class="zine-kicker">The seasonal file</span><strong>${esc(page.title)}</strong><em>${esc(page.description)}</em><span class="zine-roundup-cta">${count} ideas inside / Open the roundup</span></a>`;
}

function renderHomepage() {
  const week = published.slice(-7, -1).reverse();
  const archivePick = chooseArchivePick(published, today, homepage.archivePickRotation);
  const randomPool = published.filter(meal => meal.slug !== current.slug).map(meal => meal.slug);
  const latestRecipes = [current, ...week];
  const recipeSchema = latestRecipes.map((meal, index) => ({ '@type': 'ListItem', position: index + 1, url: recipeUrl(meal), name: meal.name, image: imageUrl(meal) }));
  const description = 'One approachable recipe made for one every day, plus a searchable archive and a weekly dispatch from foidslop.';
  const schema = [
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'foidslop', url: BASE_URL, description },
    { '@context': 'https://schema.org', '@type': 'Organization', name: 'foidslop', url: BASE_URL, logo: `${BASE_URL}/brand-icon.webp`, sameAs: SAME_AS },
    { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Latest foidslop recipes', url: `${BASE_URL}/slop/archive`, itemListElement: recipeSchema }
  ];
  const total = totalMinutes(current);
  const randomDisabled = randomPool.length ? '' : ' disabled aria-disabled="true"';
  const intentLinks = [
    ['Dinner for one', 'recipes/for-one', 'dinner-for-one'],
    ['Fifteen minutes', 'recipes/15-minute', '15-minute'],
    ['I refuse to cook', 'recipes/no-cook', 'no-cook'],
    ['Pasta, obviously', 'recipes/pasta', 'pasta'],
    ['Something on toast', 'recipes/toast', 'toast'],
    ['Cheap comfort', 'recipes/comfort-food', 'comfort'],
    ['Cheap meals', 'cheap-meals-for-one', 'cheap-meals'],
    ['High-protein meals', 'high-protein-meals-for-one', 'high-protein']
  ].map(([label, href, intent]) => `<a href="${href}" data-track="home_intent_click" data-intent="${intent}">${label}</a>`).join('');
  return `<!DOCTYPE html><html lang="en"><head>${commonHead({ title: 'foidslop | Daily Recipes for One', description, canonical: `${BASE_URL}/` })}
<link rel="preload" as="image" href="slop/img/${current.slug}-768.webp" type="image/webp" imagesrcset="slop/img/${current.slug}-480.webp 480w, slop/img/${current.slug}-768.webp 768w" imagesizes="(max-width: 800px) 100vw, 42vw" fetchpriority="high">
<link rel="stylesheet" href="css/home-redesign.css?v=20260826-1"><link rel="stylesheet" href="css/theme.css?v=${THEME_CSS_VERSION}">
<script type="application/ld+json">${jsonLd(schema)}</script></head><body><a href="#main" class="sr-only focusable">Skip to content</a>
<main id="main" class="zine-home">${header('', 'home')}<div id="top">
  <section class="zine-hero" aria-labelledby="home-title">
    <div class="zine-hero-copy"><div><div class="zine-kicker">A small publication for one</div><h1 id="home-title">Daily<br><span>slop.</span><br>Dinner, etc.</h1><p class="zine-deck">One approachable recipe every day. Feeding yourself without turning it into a project.</p></div><div class="zine-note"><span>Vol. 01 / Issue ${String(current.id).padStart(3, '0')}</span><strong>Read / Cook / Return</strong></div></div>
    <article class="zine-today">
      <a class="zine-today-image" href="slop/${current.slug}" data-track="home_today_open"><picture><source type="image/webp" srcset="slop/img/${current.slug}-480.webp 480w, slop/img/${current.slug}-768.webp 768w" sizes="(max-width: 800px) 100vw, 42vw"><img src="slop/img/${imageFile(current)}" alt="${esc(current.imageAlt || current.name)}" width="768" height="768" loading="eager" fetchpriority="high" decoding="async"></picture></a>
      <div class="zine-today-copy"><div class="today-label"><span>Today’s slop / ${String(current.id).padStart(3, '0')}</span><span>${total ? `${total} min` : 'No cook'}</span></div><h2>${esc(current.name)}</h2><p>${esc(current.description)}</p><div class="today-actions"><a href="slop/${current.slug}" data-track="home_today_open">Open today’s slop</a><button type="button" data-random-recipe${randomDisabled}>Feed me something else</button></div><small>${randomPool.length ? 'New slop tomorrow.' : 'The archive starts here. New slop tomorrow.'}</small></div>
    </article>
  </section>
  ${newsletterSignup('dispatch-primary')}
  <section class="zine-week" aria-labelledby="week-title"><div class="zine-section-head"><h2 id="week-title">This week in slop</h2><span>Today plus ${week.length} earlier ${week.length === 1 ? 'issue' : 'issues'}</span></div>${week.length ? `<div class="zine-recipe-index">${week.map(homepageCard).join('')}</div>` : '<p class="zine-empty">The first issue is on the table. Come back tomorrow for another.</p>'}</section>
  <section class="zine-find" aria-labelledby="find-title"><div class="zine-find-copy"><div class="zine-kicker">The immediate problem</div><h2 id="find-title">What kind<br>of night is it?</h2><p>Choose the constraint, craving, or level of refusal currently running dinner.</p></div><nav class="zine-find-links" aria-label="Find a recipe for tonight">${intentLinks}<button type="button" data-random-recipe${randomDisabled}>I have no idea</button><a href="slop/archive" data-track="home_intent_click" data-intent="archive">Search everything</a></nav></section>
  ${seasonalRoundupTile()}
  ${renderCommunity()}
  ${renderArchivePick(archivePick)}
${newsletterSignup('dispatch-repeat', true)}
  <section class="zine-signature"><picture><source type="image/webp" srcset="logo.webp"><img src="logo.png" alt="FOID SLOP, recipes, ideas, misery made for one" width="1009" height="596" loading="lazy" decoding="async"></picture><p>A daily recipe publication for one person and whatever kind of night this is.</p><a class="zine-rss" href="feed.xml" type="application/atom+xml">Follow the daily slop via RSS</a></section>
</div></main>${footer('')}${siteScript}
<script id="random-recipe-pool" type="application/json">${jsonLd(randomPool)}</script><script src="home.js?v=20260717-1" defer></script></body></html>`;
}

function updateHomepage() {
  fs.writeFileSync(path.join(ROOT, 'index.html'), renderHomepage());
}

function archiveFiltersFor(meal) {
  return [meal.tags.includes('Quick') && 'quick', meal.tags.includes('No Cook') && 'no-cook', meal.tags.includes('Vegetarian') && 'vegetarian', (meal.category === 'Pasta' || meal.tags.includes('Pasta')) && 'pasta', (meal.category === 'Toast' || meal.tags.includes('Toast')) && 'toast', meal.category === 'Snack Plate' && 'snack-plates', meal.tags.includes('Comfort') && 'comfort'].filter(Boolean).join(' ');
}

function archiveSearchFor(meal) {
  return [meal.name, meal.description, meal.headnote, meal.category, meal.cuisine, ...meal.tags, ...meal.ingredients.map(item => item.name)].join(' ').toLowerCase();
}

function archiveCard(meal, eager = false, prefix = '') {
  const filters = archiveFiltersFor(meal);
  const search = archiveSearchFor(meal);
  const loading = eager ? 'eager" fetchpriority="high' : 'lazy';
  return `<article class="archive-card" data-search="${esc(search)}" data-filters="${filters}"><a href="${prefix}${meal.slug}"><div class="archive-card-img"><picture><source type="image/webp" srcset="${prefix}img/${meal.slug}-480.webp 480w, ${prefix}img/${meal.slug}-768.webp 768w" sizes="(max-width: 560px) 100vw, (max-width: 960px) 50vw, 33vw"><img src="${prefix}img/${imageFile(meal)}" alt="${esc(meal.imageAlt || meal.name)}" width="600" height="600" loading="${loading}" decoding="async"></picture></div><div class="archive-card-body"><p class="archive-card-name">${esc(meal.name)}</p><div class="archive-card-meta"><span class="archive-card-date">${shortDate(releaseDate(meal))}</span><div class="archive-card-tags">${meal.tags.slice(0, 2).map(tag => `<span class="archive-card-tag">${esc(tag)}</span>`).join('')}</div></div></div></a></article>`;
}

function archiveControls(count) {
  const filters = [['all', 'All'], ['quick', 'Quick'], ['no-cook', 'No cook'], ['vegetarian', 'Vegetarian'], ['pasta', 'Pasta'], ['toast', 'Toast'], ['snack-plates', 'Snack plates'], ['comfort', 'Comfort']];
  const introLinks = hubs
    .map(hub => ({ href: `../recipes/${hub.slug}`, label: hub.title, count: published.filter(hub.filter).length }))
    .filter(link => link.count >= 6);
  return `<div class="archive-intro"><p class="archive-label">The complete recipe index</p><h2>Find something good to eat</h2><p class="archive-intro-copy">Search by recipe, ingredient, or craving. Try mushrooms, feta, pasta, no cook, or anything else already in your kitchen. Every one of the ${count} recipes here is written for a single person and published fresh each morning, so dinner never turns into a week of leftovers.</p><nav class="archive-collections" aria-label="Browse by collection"><span class="archive-collections-label">Browse by collection</span><div class="archive-collections-list">${introLinks.map(link => `<a href="${link.href}"><strong>${esc(link.label)}</strong><span>${link.count} recipes</span></a>`).join('')}</div></nav></div><div class="archive-header"><span class="archive-label">Past Slops</span><span class="archive-count" id="archive-count">${count} recipes</span></div>
  <section class="archive-tools" aria-label="Search and filter recipes">
    <label class="archive-search-label" for="archive-search">Search the archive</label>
    <input class="archive-search" id="archive-search" type="search" placeholder="Pasta, toast, cheese…" autocomplete="off">
    <div class="archive-filters" role="group" aria-label="Filter recipes">${filters.map(([value, label], index) => `<button type="button" class="archive-filter${index === 0 ? ' active' : ''}" data-filter="${value}" aria-pressed="${index === 0 ? 'true' : 'false'}">${label}</button>`).join('')}</div>
    <p class="archive-results" id="archive-results" role="status" aria-live="polite">Showing ${count} recipes</p>
  </section>`;
}

/** Server-rendered pagination so crawlers and no-JS visitors reach every recipe. */
let archivePageFiles = [];

function renderArchivePage(pageNumber, chunkMeals, totalPages) {
  const canonical = `${BASE_URL}/slop/archive/page-${pageNumber}`;
  const newest = chunkMeals[0] ? shortDate(releaseDate(chunkMeals[0])) : '';
  const oldest = chunkMeals.length ? shortDate(releaseDate(chunkMeals[chunkMeals.length - 1])) : '';
  const title = `Recipe Archive, Page ${pageNumber}: Older Recipes for One`;
  const description = `Older foidslop recipes for one (${oldest} through ${newest}). Every issue is a complete single-serving meal; page ${pageNumber} of ${totalPages}.`;
  const schema = {
    '@context': 'https://schema.org', '@type': 'ItemList', name: `foidslop Recipe Archive, Page ${pageNumber}`,
    itemListElement: chunkMeals.map((meal, index) => ({ '@type': 'ListItem', position: index + 1, url: recipeUrl(meal), name: meal.name }))
  };
  const prevHref = pageNumber === 2 ? '../archive' : `./page-${pageNumber - 1}`;
  const nextHref = pageNumber < totalPages ? `./page-${pageNumber + 1}` : null;
  const pager = `<nav class="archive-pagination" aria-label="Archive pages"><a href="../archive">Search view</a><a href="${prevHref}">Previous page</a>${nextHref ? `<a href="${nextHref}">Next page</a>` : ''}</nav>`;
  return `<!DOCTYPE html><html lang="en"><head>${commonHead({ title, description, canonical, root: '../../', image: socialOrHeroImage(chunkMeals[0]) })}
<script type="application/ld+json">${jsonLd(schema)}</script>
<link rel="stylesheet" href="../../css/slop-archive.css?v=${ARCHIVE_CSS_VERSION}"><link rel="stylesheet" href="../../css/theme.css?v=${THEME_CSS_VERSION}"></head><body>
<a href="#main" class="sr-only focusable">Skip to content</a>${header('../../', 'archive')}
<main id="main" class="archive-page-static"><div class="archive-intro"><p class="archive-label">The older issues</p><h2>Every slop, page by page</h2><p class="archive-intro-copy">Issues published ${oldest} through ${newest}. Each card opens a complete single-serving recipe. For search and filters across all ${published.length - 1} past recipes, use the <a href="../archive">searchable archive</a>.</p></div>
<section class="archive-grid">${chunkMeals.map((meal, index) => archiveCard(meal, index < 2, '../')).join('\n')}</section>
${pager}</main>
${footer('../../')}${siteScript}</body></html>`;
}

function updateArchive() {
  const file = path.join(SLOP_DIR, 'archive.html');
  let html = fs.readFileSync(file, 'utf8');
  const past = published.slice(0, -1).reverse();
  const extraChunks = [];
  for (let index = ARCHIVE_CHUNK; index < past.length; index += ARCHIVE_CHUNK) {
    extraChunks.push(past.slice(index, index + ARCHIVE_CHUNK));
  }
  const totalPages = extraChunks.length + 1;
  archivePageFiles = extraChunks.map((chunk, index) => index + 2);
  const pagerNav = archivePageFiles.length
    ? `<nav class="archive-pagination" aria-label="Older archive pages"><span class="archive-pages-label">Older issues, page by page:</span>${archivePageFiles.map(n => `<a href="./archive/page-${n}">Page ${n}</a>`).join('')}</nav>`
    : '';
  const archiveSchema = { '@context': 'https://schema.org', '@type': 'ItemList', name: 'foidslop Recipe Archive', itemListElement: published.slice().reverse().map((meal, index) => ({ '@type': 'ListItem', position: index + 1, url: recipeUrl(meal), name: meal.name })) };
  html = html.replace(/(?:<\/nav><\/div>)+(?=<div class="archive-intro">)/g, '')
    .replace(/<div class="archive-intro">[\s\S]*?(?=<div class="archive-header">)/g, '')
    .replace(/<nav class="archive-pagination"[\s\S]*?<\/nav>\s*/g, '')
    .replace(/<title>[\s\S]*?<\/title>/, '<title>Search Every Recipe for One: The foidslop Archive</title>')
    .replace(/<meta name="description" content="[^"]+">/, '<meta name="description" content="Search every published foidslop recipe by name, ingredient, cuisine, or craving. Clear single-serving recipes with new ideas added daily.">')
    .replace(/<meta property="og:title" content="[^"]+">/, '<meta property="og:title" content="The foidslop Recipe Archive for One">')
    .replace(/<meta property="og:description" content="[^"]+">/, '<meta property="og:description" content="Search every published foidslop recipe by name, ingredient, cuisine, or craving.">')
    .replace(/<meta name="twitter:title" content="[^"]+">/, '<meta name="twitter:title" content="The foidslop Recipe Archive for One">')
    .replace(/<meta name="twitter:description" content="[^"]+">/, '<meta name="twitter:description" content="Search every published foidslop recipe by name, ingredient, cuisine, or craving.">')
    .replace(/<link rel="canonical" href="[^"]+">/, `<link rel="canonical" href="${BASE_URL}/slop/archive">`)
    .replace(/[ \t]*<link rel="stylesheet" href="\.\.\/css\/theme\.css(?:\?[^\"]*)?">\r?\n?/g, '')
    .replace(/[ \t]*<script src="\.\.\/theme\.js(?:\?[^\"]*)?"><\/script>\r?\n?/g, '')
    .replace(/<link rel="stylesheet" href="\.\.\/css\/global\.css(?:\?v=[^"]*)?">/, `<link rel="stylesheet" href="../css/global.css?v=${GLOBAL_CSS_VERSION}">\n<script src="../theme.js?v=20260713-5"></script>`)
    .replace(/<link rel="stylesheet" href="\.\.\/css\/slop-archive\.css(?:\?v=[^"]*)?">/, `<link rel="stylesheet" href="../css/slop-archive.css?v=${ARCHIVE_CSS_VERSION}">\n<link rel="stylesheet" href="../css/theme.css?v=${THEME_CSS_VERSION}">`)
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
    .replace(/(<div class="featured-image">)\s*(?:<picture>[\s\S]*?<\/picture>|<img[^>]*>)\s*(<span class="featured-badge")/, `$1\n      <picture><source type="image/webp" srcset="img/${current.slug}-480.webp 480w, img/${current.slug}-768.webp 768w" sizes="(max-width: 1024px) 100vw, 50vw"><img src="img/${imageFile(current)}" alt="${esc(current.imageAlt || current.name)}" width="768" height="768" loading="eager" fetchpriority="high" decoding="async"></picture>\n      $2`)
    .replace(/(<p class="featured-eyebrow">)[^<]+/, `$1${prettyDate(releaseDate(current))}`)
    .replace(/(<h2 class="featured-title">)[\s\S]*?(<\/h2>)/, `$1${titleLines(current.name)}$2`)
    .replace(/(<p class="featured-desc">)[^<]+/, `$1${esc(current.description)}`)
    .replace(/(<div class="featured-tags">)[\s\S]*?(<\/div>)/, `$1${current.tags.slice(0, 3).map(tag => `<span class="featured-tag">${esc(tag)}</span>`).join('')}$2`)
    .replace(/(<p class="featured-date">Published )[^<]+/, `$1${prettyDate(releaseDate(current))}`)
    .replace(/<div class="archive-header">[\s\S]*?<section class="archive-grid"/, `${archiveControls(past.length)}\n  <section class="archive-grid"`)
    .replace(/(<a href="https:\/\/shop\.foidslop\.com\/"[^>]*class="header-cta">)/, '<button class="theme-toggle" type="button" aria-label="Switch color theme" aria-pressed="true"><span class="theme-toggle-mark" aria-hidden="true">*</span><span class="theme-toggle-label">Light mode</span></button>$1')
    .replace(/(<section class="archive-grid"[^>]*>)[\s\S]*?(<\/section>)/, `$1\n${past.slice(0, ARCHIVE_CHUNK).map((meal, index) => archiveCard(meal, index < 2)).join('\n')}\n$2\n${pagerNav}`)
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
  html = html.replace(/—/g, ':');
  // Older recipes ship as a compact JSON manifest; archive.js hydrates the
  // same card markup client-side so page weight stays bounded as we grow.
  const manifestEntries = past.slice(ARCHIVE_CHUNK).map(meal => ({
    slug: meal.slug,
    name: meal.name,
    date: shortDate(releaseDate(meal)),
    tags: meal.tags.slice(0, 2),
    img: imageFile(meal),
    alt: meal.imageAlt || meal.name,
    search: archiveSearchFor(meal),
    filters: archiveFiltersFor(meal)
  }));
  const manifestTag = `<script id="archive-manifest" type="application/json">${jsonLd(manifestEntries)}</script>`;
  // Idempotent: strip any previously injected blocks before re-inserting, so
  // repeated publishes never stack manifests or loader scripts.
  html = html.replace(/<script id="archive-manifest"[\s\S]*?<\/script>\n?/g, '');
  html = html.replace(/<script src="\.\.\/archive\.js(?:\?v=[^"]*)?"><\/script>\n?/g, '');
  html = html.replace('</body>', `${manifestTag}\n<script src="../archive.js?v=20260828-1"></script>\n</body>`);
  fs.writeFileSync(file, html);
  // Static pagination: fresh directory every run so stale pages never linger.
  fs.rmSync(path.join(SLOP_DIR, 'archive'), { recursive: true, force: true });
  if (extraChunks.length) {
    fs.mkdirSync(path.join(SLOP_DIR, 'archive'), { recursive: true });
    extraChunks.forEach((chunk, index) => {
      fs.writeFileSync(path.join(SLOP_DIR, 'archive', `page-${index + 2}.html`), renderArchivePage(index + 2, chunk, totalPages));
    });
  }
}

const hubs = [
  { slug: 'quick', title: 'Quick Recipes for One', description: 'Fast, low-effort recipes for one when dinner needs to happen now.', intro: 'These are the recipes for nights when hunger has already arrived. Most use one pan, one bowl, or no cookware at all, with enough texture and seasoning to feel like dinner rather than a compromise.', guideTitle: 'How to make a quick dinner feel complete', guide: ['Start with the ingredient that takes longest, even if that only means putting water on to boil.', 'Use one sharp or bright finish such as lemon, pickles, hot sauce, herbs, or a good shower of black pepper.', 'Keep a few fast foundations around: bread, eggs, noodles, canned beans, frozen rice, and something creamy.'], filter: meal => meal.tags.includes('Quick'), faqs: [
    { q: 'What counts as a quick dinner here?', a: 'Every recipe in this collection fits within roughly fifteen minutes of combined prep and cooking, usually with one pan or none at all.' },
    { q: 'Do fast recipes still make a full meal?', a: 'Yes. Each one is written as a complete single serving, with enough substance and seasoning to feel like dinner rather than a snack.' },
    { q: 'What should I keep stocked for fast dinners?', a: 'Bread, eggs, noodles, canned beans, frozen rice, good cheese, and a few strong condiments cover most of these recipes from memory.' }
  ] },
  { slug: 'no-cook', title: 'No-Cook Recipes for One', description: 'No-stove, no-oven meals built from good ingredients and almost no effort.', intro: 'No-cook dinner works best when it has contrast. Pair something creamy with something crisp, add salt or acid, and put bread or crackers nearby. The recipes here turn that loose formula into an actual meal.', guideTitle: 'A useful no-cook formula', guide: ['Choose a base such as yogurt, cottage cheese, hummus, tinned fish, or a good cheese.', 'Add produce for crunch and freshness, then something briny or acidic to wake everything up.', 'Finish with bread, crackers, pita, or chips so the plate has enough substance.'], filter: meal => meal.tags.includes('No Cook'), faqs: [
    { q: 'Can you really make dinner without cooking?', a: 'Yes. These recipes assemble ready-to-eat ingredients such as tinned fish, cheese, bread, produce, and dips into a plate that eats like a real meal.' },
    { q: 'How do no-cook meals stay satisfying?', a: 'Contrast does the work: something creamy, something crisp, something briny or acidic, and enough bread or crackers to carry it all.' },
    { q: 'Are no-cook recipes right for hot days?', a: 'They are built for them. Nothing heats up the kitchen, and most come together in the time it takes to open a tin and slice something.' }
  ] },
  { slug: 'for-one', title: 'Easy Dinner Ideas for One', description: 'Dinner ideas for one: single-serving dinners, bowls, toast, and comfort food without leftovers.', intro: 'Cooking for one should not require dividing a family recipe by four and hoping for the best. These dinner ideas begin with a single serving, realistic cookware, and quantities that make sense for one hungry person.', guideTitle: 'Cooking for one without waste', guide: ['Buy flexible ingredients that can move between toast, pasta, bowls, and snack plates.', 'Freeze bread, cooked grains, and extra portions of sauces before they become a problem.', 'Treat the serving size as a starting point. A bigger appetite can add bread, greens, or an egg.'], filter: meal => String(meal.serves) === '1', faqs: [
    { q: 'Why cook single-serving recipes?', a: 'No leftovers to manage, no halving arithmetic, and no waste. Quantities, cookware, and timing are written around one plate from the start.' },
    { q: 'What if one serving is not enough?', a: 'Appetites vary. Add bread, greens, an egg, or more of whatever you liked most. Every recipe here holds up to small additions.' },
    { q: 'Do I need special equipment?', a: 'No. These recipes use a small pan, a baking sheet, a bowl, or nothing at all, which covers most kitchens.' }
  ] },
  { slug: 'vegetarian', title: 'Vegetarian Recipes for One', description: 'Low-effort vegetarian meals for one, from snack plates to pasta and toast.', intro: 'This collection leans on beans, eggs, cheese, vegetables, noodles, and grains. The point is not to imitate a meat-centered dinner. It is to build something satisfying from ingredients that already taste good together.', guideTitle: 'Build flavor without extra work', guide: ['Brown mushrooms, toast bread, and let cheese take on color whenever the recipe allows it.', 'Use beans, eggs, yogurt, tofu, or cheese to give a light meal more staying power.', 'Finish with acid and texture. Lemon, vinegar, pickles, seeds, and toasted nuts do a lot.'], filter: meal => meal.tags.includes('Vegetarian'), faqs: [
    { q: 'Are these vegetarian recipes complete meals?', a: 'Yes. Each recipe stands on its own as dinner for one, leaning on eggs, beans, cheese, tofu, vegetables, noodles, and grains.' },
    { q: 'Will these work for beginner cooks?', a: 'Most methods take a handful of steps and familiar ingredients. Where a step matters, the recipe describes what success looks like.' },
    { q: 'Where does the flavor come from without meat?', a: 'Browning, acid, brine, and texture. Mushrooms get browned, pickles and lemon sharpen rich ingredients, and toasted nuts or seeds finish the plate.' }
  ] },
  { slug: 'pasta', title: 'Easy Pasta Recipes for One', description: 'Small-batch pasta recipes for one, from pantry staples to proper comfort food.', intro: 'A single bowl of pasta is one of the easiest dinners to scale well. The recipes here use measured portions, small pans, and enough pasta water to turn a handful of ingredients into a glossy sauce.', guideTitle: 'Better pasta for one', guide: ['Salt the cooking water and reserve some before draining. That starchy water is part of the sauce.', 'Move the pasta into the sauce while it is still firm, then finish cooking the two together.', 'For most appetites, 3.5 ounces or 100 grams of dried pasta makes a generous single serving.'], filter: meal => meal.category === 'Pasta' || meal.tags.includes('Pasta'), faqs: [
    { q: 'How much pasta should I cook for one?', a: 'About 3.5 ounces, or 100 grams, of dried pasta makes a generous single serving for most appetites.' },
    { q: 'Why save pasta water?', a: 'The starch helps cheese, oil, or tomato emulsify into a glossy sauce instead of pooling at the bottom of the bowl.' },
    { q: 'Can I scale these pasta recipes up?', a: 'You can. Doubling works cleanly. Beyond that, taste and season as you go, since seasoning does not scale linearly.' }
  ] },
  { slug: 'toast', title: 'Toast Recipes for One', description: 'Toast recipes that turn bread and a few good toppings into an actual meal for one.', intro: 'Toast becomes dinner when the bread is properly crisp and the topping brings enough flavor and substance. These recipes cover creamy, briny, cheesy, savory, and sweet versions without making toast pretend to be something else.', guideTitle: 'The difference between toast and good toast', guide: ['Use bread thick enough to stay crisp beneath the topping.', 'Season each layer, especially mild ingredients such as avocado, ricotta, mushrooms, and tomatoes.', 'Add the wettest toppings at the last minute so the bread keeps its crunch.'], filter: meal => meal.category === 'Toast' || meal.tags.includes('Toast'), faqs: [
    { q: 'When does toast count as dinner?', a: 'When the bread is thick and properly crisp, the topping brings real substance, and there is enough of it to satisfy you. Every recipe here follows those rules.' },
    { q: 'What bread works best?', a: 'A sturdy sourdough or country loaf. Thin sandwich bread goes soggy under anything wet.' },
    { q: 'Sweet or savory?', a: 'Both. Savory versions lean on eggs, fish, cheese, and vegetables, while sweet ones balance honey, fruit, or jam against salt and fat.' }
  ] },
  { slug: 'snack-plates', title: 'Snack Plate Ideas for One', description: 'Low-effort snack plates with cheese, fruit, bread, pickles, fish, and whatever else works.', intro: 'A snack plate is a meal with the assembly exposed. Aim for a few distinct flavors and textures, give everything enough room on the plate, and stop when it looks like the amount you actually want to eat.', guideTitle: 'Build a snack plate that eats like dinner', guide: ['Pick one anchor such as cheese, tinned fish, hummus, eggs, or cured meat.', 'Add something crisp, something fresh, and something sharp or briny.', 'Bread and crackers are not decoration. Include enough to carry the rest of the plate.'], filter: meal => meal.category === 'Snack Plate', faqs: [
    { q: 'Is a snack plate really dinner?', a: 'Here it is. Anchor the plate with something substantial such as cheese, tinned fish, hummus, or eggs, then build texture and acidity around it.' },
    { q: 'How much food makes a plate?', a: 'Arrange what you actually want to eat, then stop. Three or four distinct items plus bread or crackers covers most appetites.' },
    { q: 'What should I buy first?', a: 'One good anchor, one crisp thing, one briny thing, and crackers. Nearly every plate here is a variation of that short list.' }
  ] },
  { slug: 'comfort-food', title: 'Comfort Food Recipes for One', description: 'Comforting recipes for one when dinner should be warm, easy, and worth eating.', intro: 'Comfort food can be creamy pasta, a crisp grilled sandwich, a baked potato, or a bowl of noodles with exactly the right amount of heat. These recipes keep the portions practical without sanding off the parts that make them comforting.', guideTitle: 'Small-batch comfort food', guide: ['Use a small skillet, saucepan, or baking dish so a single portion cooks evenly.', 'Let cheese melt fully and give onions, mushrooms, and butter time to brown.', 'Balance richness with mustard, vinegar, lemon, pickles, herbs, or chilli.'], filter: meal => meal.tags.includes('Comfort'), faqs: [
    { q: 'What makes comfort food comforting?', a: 'Warmth, richness, and familiarity handled with care: melted cheese, butter, noodles, and potatoes treated as the main event.' },
    { q: 'Are these heavy recipes?', a: 'Portions stay single-serving, so nothing lingers into tomorrow. Acid, herbs, or pickles keep the richer dishes in balance.' },
    { q: 'Can I make these ahead?', a: 'Some store well, and recipes include storage notes where that applies. Most comfort food is best eaten immediately.' }
  ] },
  { slug: '15-minute', title: '15-Minute Recipes for One', description: 'Fast recipes for one with no more than fifteen minutes of combined prep and cooking.', intro: 'Every recipe in this collection fits within fifteen minutes of stated prep and cooking time. Read the short method first, gather what you need, and dinner should stay inside that window.', guideTitle: 'Make the fifteen minutes count', guide: ['Use pre-cooked grains, canned beans, quick noodles, and ingredients that are good straight from the package.', 'Prep while water boils or the pan heats, but do not rush the step that creates browning.', 'Keep the finish simple. One sauce, one herb, or one crunchy topping is enough.'], filter: meal => minutes(meal.prep) + minutes(meal.cook) <= 15, faqs: [
    { q: 'Does fifteen minutes include prep time?', a: 'Yes. Combined prep and cooking stays within fifteen minutes for every recipe in this collection.' },
    { q: 'What keeps these recipes fast?', a: 'Ready-to-eat foundations: pre-cooked grains, canned beans, quick-cooking noodles, and ingredients that are good straight from the package.' },
    { q: 'How do I keep fast food from tasting rushed?', a: 'Do not skip the browning step, season every layer, and finish with one bright element such as lemon, vinegar, or fresh herbs.' }
  ] }
];

function faqSchema(faqs) {
  if (!faqs || !faqs.length) return null;
  return {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqs.map(item => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } }))
  };
}

function faqSection(faqs, heading) {
  if (!faqs || !faqs.length) return '';
  return `<section class="collection-faq" aria-labelledby="faq-title"><h2 id="faq-title">${esc(heading)}</h2>${faqs.map(item => `<div class="collection-faq-item"><h3>${esc(item.q)}</h3><p>${esc(item.a)}</p></div>`).join('')}</section>`;
}

function renderListingPage({ title, description, canonical, meals: listed, root, eyebrow, intro, guideTitle, guide = [], active = '', faqs = [], faqHeading = 'Common questions', extraLinks = [], seoTitle = '', ogImage = '' }) {
  const pageTitle = stripBrand(seoTitle) || `${listed.length}+ ${title}`;
  const headImage = ogImage || `${BASE_URL}/og-image.png`;
  const schemas = [{ '@context': 'https://schema.org', '@type': 'ItemList', name: title, itemListElement: listed.slice(0, 30).map((meal, index) => ({ '@type': 'ListItem', position: index + 1, url: recipeUrl(meal), name: meal.name })) }];
  const listingFaq = faqSchema(faqs);
  if (listingFaq) schemas.push(listingFaq);
  return `<!DOCTYPE html><html lang="en"><head>${commonHead({ title: pageTitle, description, canonical, root, image: headImage })}<script type="application/ld+json">${jsonLd(schemas)}</script><link rel="stylesheet" href="${root}css/content.css?v=20260826-1"><link rel="stylesheet" href="${root}css/theme.css?v=20260713-4"></head><body><a href="#main" class="sr-only focusable">Skip to content</a>${header(root, active)}<main id="main" class="content-page"><header class="content-hero"><p class="content-eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1><p>${esc(intro || description)}</p><span class="collection-count">${listed.length} recipes in this collection</span></header><div class="content-grid">${listed.map((meal, index) => recipeCard(meal, root, index < 2)).join('')}</div>${guide.length ? `<section class="collection-guide"><p class="content-eyebrow">A better starting point</p><h2>${esc(guideTitle)}</h2><ul>${guide.map(item => `<li>${esc(item)}</li>`).join('')}</ul></section>` : ''}${faqSection(faqs, faqHeading)}<nav class="hub-links" aria-label="Recipe collections"><a href="${root}girl-dinner-ideas">Girl dinner ideas</a>${hubs.map(hub => `<a href="${root}recipes/${hub.slug}">${esc(hub.title)}</a>`).join('')}${extraLinks.map(link => `<a href="${root}${link.href}">${esc(link.label)}</a>`).join('')}</nav></main>${footer(root)}${siteScript}</body></html>`;
}

const girlDinnerFaqs = [
  { q: 'What is a girl dinner?', a: 'A low-effort, assembly-style meal made for one: snack plates, excellent toast, bowls of comforting things, or any combination that feeds you without turning dinner into a project.' },
  { q: 'Where did girl dinner come from?', a: 'The phrase spread across TikTok in 2023 as women shared the unapologetically random plates they assembled for themselves. It has since become shorthand for casual, self-directed dinners.' },
  { q: 'How much food should a girl dinner include?', a: 'Enough to actually satisfy you. A useful check is something substantial plus produce plus something crunchy or bready; if the plate passes, it counts as dinner.' },
  { q: 'Are these ideas only for women?', a: 'No. The name is borrowed, but the format belongs to anyone eating alone who wants something good without a production.' },
  { q: 'What makes a good girl dinner?', a: 'Contrast and seasoning. Mix temperatures and textures, add salt, acid, or a squeeze of lemon, and stop worrying about what dinner is supposed to look like.' }
];

/** Distinct collection signals per hub; more matches means stronger relevance. */
function hubSignals(hub) {
  return [
    ['quick', meal => meal.tags.includes('Quick')],
    ['no-cook', meal => meal.tags.includes('No Cook')],
    ['vegetarian', meal => meal.tags.includes('Vegetarian')],
    ['pasta', meal => meal.category === 'Pasta' || meal.tags.includes('Pasta')],
    ['toast', meal => meal.category === 'Toast' || meal.tags.includes('Toast')],
    ['snack-plates', meal => meal.category === 'Snack Plate'],
    ['comfort-food', meal => meal.tags.includes('Comfort')],
    ['15-minute', meal => minutes(meal.prep) + minutes(meal.cook) <= 15]
  ].find(([slug]) => slug === hub.slug)?.[1];
}

/** Best-fit evergreen hubs for a recipe; "for-one" fits everything so it is excluded. */
function hubsForMeal(meal, limit = 2) {
  return hubs
    .filter(hub => hub.slug !== 'for-one')
    .map(hub => ({ hub, score: (hubSignals(hub)(meal) ? 1 : 0) }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.hub.slug.localeCompare(b.hub.slug))
    .slice(0, limit)
    .map(entry => entry.hub);
}

function roundupsForMeal(meal, limit = 2) {
  return activeRoundups().filter(page => roundupMatchesMeal(page, meal)).slice(0, limit);
}

function listingCount(kind, key) {
  if (kind === 'girl') return published.filter(meal => meal.tags.includes('No Cook') || meal.category === 'Snack Plate' || meal.category === 'Toast').length;
  const hub = hubs.find(entry => entry.slug === key);
  if (hub) return published.filter(hub.filter).length;
  const page = loadEditorialConfig().find(entry => entry.slug === key);
  return page ? editorialSelection(page).length : 0;
}

/** "Keep browsing" strip: up to two evergreen hubs plus up to two live roundups. */
function keepBrowsingLinks(meal, root = '../') {
  const links = [
    ...hubsForMeal(meal).map(hub => ({ href: `${root}recipes/${hub.slug}`, title: hub.title, count: listingCount('hub', hub.slug) })),
    ...roundupsForMeal(meal).map(page => ({ href: `${root}${page.slug}`, title: page.title, count: editorialSelection(page).length }))
  ];
  // Every recipe is single-serving, so "for-one" is always a valid fallback.
  if (!links.some(link => link.href.includes('recipes/'))) {
    links.push({ href: `${root}recipes/for-one`, title: hubs.find(hub => hub.slug === 'for-one').title, count: listingCount('hub', 'for-one') });
  }
  if (!links.length) return '';
  return `<nav class="keep-browsing" aria-label="Keep browsing collections"><p class="section-label">Keep browsing</p><div class="keep-links">${links.map(link => `<a href="${link.href}"><strong>${esc(link.title)}</strong><span>${link.count}+ ideas</span></a>`).join('')}</div></nav>`;
}

function buildHubs() {
  fs.mkdirSync(RECIPE_HUB_DIR, { recursive: true });
  const links = editorialNavLinks();
  for (const hub of hubs) {
    const listed = published.filter(hub.filter).slice().reverse();
    const ogImage = listed.length ? socialOrHeroImage(listed[0]) : `${BASE_URL}/og-image.png`;
    fs.writeFileSync(path.join(RECIPE_HUB_DIR, `${hub.slug}.html`), renderListingPage({ ...hub, canonical: `${BASE_URL}/recipes/${hub.slug}`, meals: listed, root: '../', eyebrow: 'Recipe collection', extraLinks: links, ogImage }));
  }
  const girls = published.filter(meal => meal.tags.includes('No Cook') || meal.category === 'Snack Plate' || meal.category === 'Toast').slice().reverse();
  fs.writeFileSync(path.join(ROOT, 'girl-dinner-ideas.html'), renderListingPage({
    title: 'Girl Dinner Ideas', description: 'Easy girl dinner ideas with snack plates, toast, bowls, and no-cook recipes made for one.', canonical: `${BASE_URL}/girl-dinner-ideas`,
    meals: girls, root: '', eyebrow: 'Low effort, high satisfaction', intro: 'Girl dinner can be a snack plate, excellent toast, a bowl of something comforting, or whatever makes feeding yourself feel possible. The best version has contrast, enough food to satisfy you, and no need to justify itself.',
    guideTitle: 'What makes a good girl dinner?', guide: ['Start with what you genuinely want to eat, not what a complete dinner is supposed to look like.', 'Mix textures and temperatures so the plate stays interesting from the first bite to the last.', 'A loose collection of food still benefits from seasoning, a squeeze of lemon, or something pickled.'],
    faqs: girlDinnerFaqs, faqHeading: 'Girl dinner questions',
    ogImage: girls.length ? socialOrHeroImage(girls[0]) : `${BASE_URL}/og-image.png`
  }));
}

function buildEditorialPages() {
  for (const page of loadEditorialConfig()) {
    const file = path.join(ROOT, `${page.slug}.html`);
    // Dormant scheduled pages must never linger from a future-dated build.
    if (page.notBefore && today < page.notBefore) {
      if (fs.existsSync(file)) fs.unlinkSync(file);
      continue;
    }
    const listed = editorialSelection(page);
    const minimum = Number.isInteger(page.minRecipes) ? page.minRecipes : 8;
    if (listed.length < minimum) throw new Error(`editorial page ${page.slug}: needs ${minimum} matching recipes, found ${listed.length}`);
    fs.writeFileSync(path.join(ROOT, `${page.slug}.html`), renderListingPage({
      title: page.title,
      description: page.description,
      seoTitle: page.seoTitle,
      canonical: `${BASE_URL}/${page.slug}`,
      meals: listed,
      root: '',
      eyebrow: page.eyebrow,
      intro: page.intro,
      guideTitle: page.guideTitle,
      guide: page.guide,
      faqs: page.faqs,
      faqHeading: page.faqHeading || 'Common questions',
      extraLinks: editorialNavLinks(page.slug),
      ogImage: listed.length ? socialOrHeroImage(listed[0]) : `${BASE_URL}/og-image.png`
    }));
  }
}

function renderEditorialPages() {
  const definitionSchema = { '@context': 'https://schema.org', '@type': 'Article', headline: 'What Is Foidslop?', description: 'The meaning and origin of foidslop, its relationship to girl dinner, and why this site reclaims the term.', author: { '@type': 'Organization', name: 'foidslop', url: BASE_URL, logo: `${BASE_URL}/brand-icon.webp`, sameAs: SAME_AS }, mainEntityOfPage: `${BASE_URL}/what-is-foidslop` };
  fs.writeFileSync(path.join(ROOT, 'what-is-foidslop.html'), `<!DOCTYPE html><html lang="en"><head>${commonHead({ title: 'What Is Foidslop? Meaning, Origin & Girl Dinner', description: 'What does foidslop mean? Learn the slang term’s origin, its connection to girl dinner, and how foidslop reclaims it through daily recipes.', canonical: `${BASE_URL}/what-is-foidslop` })}<script type="application/ld+json">${jsonLd(definitionSchema)}</script><link rel="stylesheet" href="css/content.css?v=${CONTENT_CSS_VERSION}"><link rel="stylesheet" href="css/theme.css?v=20260713-4"></head><body>${header('', 'meaning')}<main class="article-page"><p class="content-eyebrow">Internet slang, reclaimed</p><h1>What is foidslop?</h1><p class="article-deck">Foidslop is internet slang for the low-effort, aesthetically specific meals often associated with “girl dinner”: toast, snack plates, smoothies, cottage-cheese bowls, tinned fish, and whatever else counts as feeding yourself without staging a production.</p><h2>The honest origin</h2><p>The word is built from “foid,” a derogatory term for women that emerged from misogynistic online communities, and “slop.” That origin is dehumanizing. This site does not endorse it or pretend it is harmless.</p><h2>Why reclaim it?</h2><p>foidslop takes the insult and points it somewhere more useful: toward the small, improvised meals people make for themselves. The food does not need to be nutritionally perfect, traditionally plated, or labor intensive to deserve care.</p><h2>How is it related to girl dinner?</h2><p>Girl dinner became a name for assembling snacks, bread, cheese, fruit, pickles, tinned fish, or leftovers into a meal for one. Foidslop is the sharper and more internet-poisoned cousin of that idea. Here it becomes a daily recipe format: one approachable meal, with actual ingredients and instructions.</p><h2>Examples of foidslop</h2><ul><li>Avocado or ricotta toast</li><li>Cheese, fruit, bread, and pickles</li><li>Upgraded instant noodles</li><li>Cottage-cheese and yogurt bowls</li><li>Tinned-fish and mezze plates</li></ul><p class="article-cta"><a href="girl-dinner-ideas">Browse girl dinner ideas</a> or <a href="slop/archive">see the full recipe archive</a>.</p></main>${footer('')}${siteScript}</body></html>`);
  fs.writeFileSync(path.join(ROOT, 'editorial-standards.html'), `<!DOCTYPE html><html lang="en"><head>${commonHead({ title: 'How foidslop Recipes Get Made', description: 'How foidslop writes clear single-serving recipes, handles measurements, and keeps its recipe archive useful.', canonical: `${BASE_URL}/editorial-standards` })}<link rel="stylesheet" href="css/content.css?v=20260715-1"><link rel="stylesheet" href="css/theme.css?v=20260713-4"></head><body>${header('')}<main class="article-page"><p class="content-eyebrow">Behind the slop</p><h1>How foidslop gets made</h1><p class="article-deck">One recipe goes up every day. The aim is simple: give one person a clear, appealing way to feed themselves without turning dinner into a project.</p><h2>What counts as a recipe here?</h2><p>Sometimes it is pasta with a real method. Sometimes it is excellent things arranged on toast. Both count. A useful recipe tells you what to buy, how much to use, what order to do things in, and how to recognize when the food is ready.</p><h2>Written for one from the start</h2><p>These are not family recipes divided until the numbers look small. Quantities, cookware, timing, and yield are written around a single serving. Appetite varies, of course, so bread, greens, fruit, or an egg can round out a lighter plate.</p><h2>Measurements that make sense</h2><p>US measurements come first. Weight is included when it makes the result more accurate, especially for pasta, cheese, and other ingredients that are awkward to measure by volume. Oven temperatures appear in Fahrenheit followed by Celsius.</p><h2>Clear methods, not busywork</h2><p>Steps follow the real stages of the recipe. Browning, simmering, assembling, and finishing stay separate when that makes the method easier to follow. Timing and visual cues are included where they matter. A genuine assembly recipe can still have one step if splitting it would only create extra scrolling.</p><h2>Flexible where it helps</h2><p>These recipes are meant to bend. A different cheese, another pasta shape, or the herb already in your refrigerator can often work. The notes call out the details that matter most, such as drying chickpeas before roasting or saving pasta water before draining.</p><h2>Food safety stays plain</h2><p>Recipes that cook meat, fish, or eggs include a clear doneness cue where one is needed. Keep raw ingredients separate, refrigerate leftovers promptly, and reheat them until hot throughout.</p><h2>Useful updates</h2><p>The archive is maintained as a working collection. If an ingredient, measurement, or instruction needs a meaningful fix, the recipe itself is updated while its original publication date stays in place.</p><p class="article-cta"><a href="slop/archive">Browse the recipe archive</a> <a href="what-is-foidslop">Why the name foidslop?</a></p></main>${footer('')}${siteScript}</body></html>`);

  const foidArticleDate = '2026-07-13';
  const foidArticleModifiedDate = '2026-08-27';
  const foidArticleTitle = 'Foid Meaning in Slang: Definition, Origin & Is It a Slur?';
  const foidArticleDescription = 'Foid meaning in slang: learn what “foid” means, where the term comes from, whether it is a slur, and why it is considered offensive.';
  const foidArticleSchema = {
    '@context': 'https://schema.org', '@type': 'Article', headline: foidArticleTitle,
    description: foidArticleDescription, image: `${BASE_URL}/og-image.png`, datePublished: foidArticleDate, dateModified: foidArticleModifiedDate,
    author: { '@type': 'Organization', name: 'foidslop', url: BASE_URL, sameAs: SAME_AS },
    publisher: { '@type': 'Organization', name: 'foidslop', url: BASE_URL, sameAs: SAME_AS, logo: { '@type': 'ImageObject', url: `${BASE_URL}/brand-icon.webp` } },
    mainEntityOfPage: `${BASE_URL}/what-does-foid-mean`, about: ['foid', 'femoid', 'incel slang', 'internet slang']
  };
  fs.writeFileSync(path.join(ROOT, 'what-does-foid-mean.html'), `<!DOCTYPE html><html lang="en"><head>${commonHead({ title: 'What Does Foid Mean? Slang Definition & Origin', description: foidArticleDescription, canonical: `${BASE_URL}/what-does-foid-mean`, type: 'article' })}<meta property="article:published_time" content="${foidArticleDate}"><meta property="article:modified_time" content="${foidArticleDate}"><script type="application/ld+json">${jsonLd(foidArticleSchema)}</script><link rel="stylesheet" href="css/content.css?v=${CONTENT_CSS_VERSION}"><link rel="stylesheet" href="css/theme.css?v=20260713-4"></head><body>${header('', 'meaning')}<main id="main" class="article-page"><p class="content-eyebrow">Internet slang, explained</p><h1>What does “foid” mean?</h1><p class="article-deck"><strong>The short answer:</strong> “Foid” is derogatory internet slang for a woman. It comes from “femoid” and is associated with incel communities that use the word to make women sound less than human.</p><p class="article-meta">Published July 13, 2026 · foidslop editorial</p><aside class="article-callout"><span>In plain English</span><p>It is not a neutral synonym for “woman.” It is an insult with a deliberately dehumanizing origin.</p></aside><h2>Where does the word “foid” come from?</h2><p>“Foid” is a shortened form of “femoid.” The longer word combines “female” with “humanoid” or “android,” framing women as a separate, mechanical kind of being rather than as people. The <a href="https://www.adl.org/resources/backgrounder/incels-involuntary-celibates" rel="external">Anti-Defamation League’s guide to incel terminology</a> describes it as a derogatory term used to reduce women to a subhuman group.</p><p>The word developed inside online incel culture. “Incel” is short for “involuntary celibate,” but the communities associated with that label have built a much larger ideology around resentment, sexual entitlement, and hostility toward women. In that vocabulary, “foid” does more than identify gender: it signals the speaker’s contempt.</p><h2>Is “foid” a slur?</h2><p>People differ over which offensive words receive the formal label “slur,” but the practical answer is straightforward: “foid” functions as a misogynistic and dehumanizing insult. It is normally used to talk about women as a category, not to describe a specific behavior or idea.</p><p>That context matters when the term appears in a joke, username, meme, or unfamiliar piece of internet language. Someone can repeat a word without knowing its history, but the history does not disappear. Using it casually can still reproduce the contempt built into it.</p><h2>What is the difference between “foid” and “femoid”?</h2><p>There is no meaningful difference in intent. “Foid” is simply the clipped form of “femoid.” Both words belong to the same vocabulary and carry the same dehumanizing idea. “Moid,” a later parallel term aimed at men, does not make the original word neutral.</p><h2>Then why is this site called foidslop?</h2><p><a href="what-is-foidslop">foidslop takes the insult apart and redirects it</a>. Here, the name refers to the small, improvised meals people make for themselves: toast, pasta, snack plates, bowls, tinned fish, and other food that can be dismissed as unserious or insufficiently domestic.</p><p>The publication does not pretend the first half of its name is harmless. The point is reclamation: take a term meant to diminish women, attach it to the ordinary work of feeding yourself, and turn the result into something useful. On foidslop, that means one approachable recipe for one person every day.</p><h2>Sources and further reading</h2><ul class="article-sources"><li><a href="https://www.adl.org/resources/backgrounder/incels-involuntary-celibates" rel="external">Anti-Defamation League: Incels (Involuntary Celibates)</a></li><li><a href="https://www.adl.org/resources/article/online-poll-results-provide-new-insights-incel-community" rel="external">Anti-Defamation League: Online Poll Results Provide New Insights into Incel Community</a></li><li><a href="https://www.icct.nl/sites/default/files/2023-01/Special-Edition-Volume-2.pdf" rel="external">International Centre for Counter-Terrorism: Incel Radical Milieu and External Locus of Control</a></li></ul><p class="article-cta"><a href="what-is-foidslop">What is foidslop?</a><a href="girl-dinner-ideas">Browse girl dinner ideas</a><a href="slop/archive">Open the recipe archive</a></p></main>${footer('')}${siteScript}</body></html>`);

  const whatPageFile = path.join(ROOT, 'what-is-foidslop.html');
  const whatPageRelated = '<section class="article-related" aria-labelledby="what-related-title"><p class="content-eyebrow">Editorial / read more</p><h2 id="what-related-title">Keep reading</h2><div class="article-related-grid"><a href="what-does-foid-mean"><span>Slang, explained</span><strong>What does “foid” mean?</strong><em>The term behind the name, without pretending its origin is harmless.</em></a><a href="editorial-standards"><span>Behind the slop</span><strong>How foidslop gets made</strong><em>How the daily recipes are developed, checked, illustrated, and corrected.</em></a></div></section>';
  const whatPage = fs.readFileSync(whatPageFile, 'utf8').replace('The word is built from “foid,”', 'The word is built from <a href="what-does-foid-mean">“foid,”</a>').replace('</main>', `${whatPageRelated}</main>`);
  fs.writeFileSync(whatPageFile, whatPage);

  const foidPageFile = path.join(ROOT, 'what-does-foid-mean.html');
  const foidPageRelated = '<section class="article-related" aria-labelledby="foid-related-title"><p class="content-eyebrow">Editorial / read more</p><h2 id="foid-related-title">Keep reading</h2><div class="article-related-grid"><a href="what-is-foidslop"><span>Meaning &amp; origin</span><strong>What is foidslop?</strong><em>How an insult became a daily recipe publication for one.</em></a><a href="editorial-standards"><span>Behind the slop</span><strong>How foidslop gets made</strong><em>How the daily recipes are developed, checked, illustrated, and corrected.</em></a></div></section>';
  const escapedFoidArticleTitle = foidArticleTitle.replace(/&/g, '&amp;');
  const foidPage = fs.readFileSync(foidPageFile, 'utf8')
    .replace(/What Does Foid Mean\? Slang Definition &amp; Origin/g, escapedFoidArticleTitle)
    .replace(/What Does Foid Mean\? Slang Definition and Origin/g, foidArticleTitle)
    .replace(/Foid is derogatory incel slang for women\. Learn where the term comes from, why it is offensive, and how foidslop reclaims the name\./g, foidArticleDescription)
    .replace('dateModified": "2026-07-13"', `dateModified": "${foidArticleModifiedDate}"`)
    .replace('article:modified_time" content="2026-07-13"', `article:modified_time" content="${foidArticleModifiedDate}"`)
    .replace('<strong>The short answer:</strong>', '<strong>Foid meaning in slang:</strong>')
    .replace('Published July 13, 2026 · foidslop editorial', 'Published July 13, 2026 · Updated August 27, 2026 · foidslop editorial')
    .replace('<p class="article-cta">', `${foidPageRelated}<p class="article-cta">`);
  fs.writeFileSync(foidPageFile, foidPage);
}

function staticFileForUrl(url) {
  if (url === '') return path.join(ROOT, 'index.html');
  if (url === 'slop/archive') return path.join(SLOP_DIR, 'archive.html');
  if (url.startsWith('recipes/')) return path.join(RECIPE_HUB_DIR, `${url.slice('recipes/'.length)}.html`);
  return path.join(ROOT, `${url}.html`);
}

/** Keep the machine-readable index honest: active roundups listed, dormant ones absent. */
function updateLlmsTxt() {
  const file = path.join(ROOT, 'llms.txt');
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  const lines = visibleEditorialPages()
    .filter(page => page.slug !== 'girl-dinner-ideas')
    .map(page => `- [${page.title}](${BASE_URL}/${page.slug}): ${page.description}`);
  const block = `<!-- AUTO:ROUNDUPS START -->\n${lines.join('\n')}\n<!-- AUTO:ROUNDUPS END -->`;
  if (content.includes('<!-- AUTO:ROUNDUPS START -->')) {
    content = content.replace(/<!-- AUTO:ROUNDUPS START -->[\s\S]*?<!-- AUTO:ROUNDUPS END -->/, block);
  } else {
    content = content.replace(/\n## /, `\n## Roundup guides\n\n${block}\n\n## `);
  }
  fs.writeFileSync(file, content);
}

function buildSitemap() {
  let lastmodState = {};
  try { lastmodState = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'lastmod-state.json'), 'utf8')); } catch { }
  // Collection pages submit their lead recipe canvas so Google Images can
  // surface them; recipes already carry their own image entries.
  const girlsPool = published.filter(meal => meal.tags.includes('No Cook') || meal.category === 'Snack Plate' || meal.category === 'Toast').slice().reverse();
  const leadImage = (meal, title) => meal ? { loc: socialOrHeroImage(meal), title } : null;
  const staticUrlDefs = [
    { url: '', lastmod: today },
    { url: 'slop/archive', lastmod: today },
    { url: 'what-is-foidslop', lastmod: today },
    { url: 'what-does-foid-mean', lastmod: today },
    { url: 'editorial-standards', lastmod: today },
    { url: 'girl-dinner-ideas', lastmod: today, image: leadImage(girlsPool[0], 'Girl Dinner Ideas') },
    ...visibleEditorialPages().map(page => ({ url: page.slug, lastmod: today, image: leadImage(editorialSelection(page)[0], page.title) })),
    ...hubs.map(hub => ({ url: `recipes/${hub.slug}`, lastmod: today, image: leadImage(published.filter(hub.filter).slice().reverse()[0] || null, hub.title) }))
  ];
  // Static pages keep their previous lastmod until their substantive <main>
  // content changes. Global issue counters and navigation are intentionally
  // excluded so crawlers can trust freshness instead of learning to ignore it.
  const staticUrls = staticUrlDefs.map(def => {
    const file = staticFileForUrl(def.url);
    const source = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    const hash = crypto.createHash('sha1').update(sitemapFingerprint(source)).digest('hex');
    const previous = lastmodState[def.url];
    const unchanged = previous && previous.hash === hash && previous.lastmod <= today;
    const lastmod = unchanged ? previous.lastmod : today;
    lastmodState[def.url] = { hash, lastmod };
    return { url: def.url, lastmod, image: def.image };
  });
  fs.writeFileSync(path.join(ROOT, 'data', 'lastmod-state.json'), `${JSON.stringify(Object.fromEntries(Object.keys(lastmodState).sort().map(key => [key, lastmodState[key]])), null, 1)}\n`);
  const imageTag = entry => entry.image ? `<image:image><image:loc>${entry.image.loc}</image:loc><image:title>${xml(entry.image.title)}</image:title></image:image>` : '';
  const body = staticUrls.map(entry => `<url><loc>${BASE_URL}/${entry.url}</loc><lastmod>${entry.lastmod}</lastmod>${imageTag(entry)}</url>`).join('\n') + '\n' + published.map(meal => `<url><loc>${recipeUrl(meal)}</loc><lastmod>${effectiveDateModified(meal)}</lastmod><image:image><image:loc>${imageUrl(meal)}</image:loc><image:title>${xml(meal.name)}</image:title></image:image></url>`).join('\n');
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
  const lines = [`/slop/today  /slop/${current.slug}  302`, '/index.html  /  301', '/slop/archive.html  /slop/archive  301', '/privacy.html  /privacy  301', '/check-inbox.html  /check-inbox  301', '/subscribed.html  /subscribed  301', '/what-is-foidslop.html  /what-is-foidslop  301', '/what-does-foid-mean.html  /what-does-foid-mean  301', '/editorial-standards.html  /editorial-standards  301', '/girl-dinner-ideas.html  /girl-dinner-ideas  301'];
  for (const page of visibleEditorialPages()) lines.push(`/${page.slug}.html  /${page.slug}  301`);
  for (const n of archivePageFiles) lines.push(`/slop/archive/page-${n}.html  /slop/archive/page-${n}  301`);
  for (const hub of hubs) lines.push(`/recipes/${hub.slug}.html  /recipes/${hub.slug}  301`);
  for (const meal of published) lines.push(`/slop/${meal.slug}.html  /slop/${meal.slug}  301`);
  fs.writeFileSync(path.join(ROOT, '_redirects'), `${lines.join('\n')}\n`);
}

function updateStaticTodayLinks() {
  const files = ['404.html', 'privacy.html', 'check-inbox.html', 'subscribed.html'];
  const destination = `/slop/${current.slug}`;
  for (const relative of files) {
    const file = path.join(ROOT, relative);
    const source = fs.readFileSync(file, 'utf8');
    const updated = source.replace(/<a\b[^>]*>/gi, tag => {
      if (!/class="[^"]*(?:header-today|error-today|inbox-return)[^"]*"/i.test(tag)) return tag;
      return tag.replace(/href="[^"]*"/i, `href="${destination}"`);
    });
    fs.writeFileSync(file, updated);
  }
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
updateStaticTodayLinks();
buildEditorialPages();
buildHubs();
renderEditorialPages();
updateLlmsTxt();
buildSitemap();
buildFeed();
buildPinterestFeed();
buildRedirects();
console.log(`Published ${current.name} (${today}); ${published.length} public recipes.`);
