#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const WEB_ROOT      = process.cwd();
const SLOP_DIR      = path.join(WEB_ROOT, 'slop');
const INDEX_FILE    = path.join(SLOP_DIR, 'archive.html');
const HOME_FILE     = path.join(WEB_ROOT, 'index.html');
const REDIRECTS_FILE = path.join(WEB_ROOT, '_redirects');
const DB_FILE       = path.join(WEB_ROOT, 'foidslop-meals.json');

function escHtml(str) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function prettyDate(d) { return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
function shortDate(d) { return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }

function buildArchiveCard(slug, mealName, shortDateStr, tags) {
    const firstTag = tags[0] || '';
    const secondTag = tags[1] || '';
    const tagHTML = [firstTag, secondTag].filter(Boolean).map(t => `              <span class="archive-card-tag">${escHtml(t)}</span>`).join('\n');
    return `    <article class="archive-card reveal">\n      <a href="./${slug}.html" aria-label="Read recipe: ${escHtml(mealName)}">\n        <div class="archive-card-img">\n          <img src="img/${slug}.jpg" alt="${escHtml(mealName)}" width="600" height="450" loading="lazy">\n        </div>\n        <div class="archive-card-body">\n          <p class="archive-card-name">${escHtml(mealName)}</p>\n          <div class="archive-card-meta">\n            <span class="archive-card-date">${escHtml(shortDateStr)}</span>\n            <div class="archive-card-tags">\n${tagHTML}\n            </div>\n          </div>\n        </div>\n      </a>\n    </article>`;
}

function updateHomepage(slug, mealName, description) {
    if (!fs.existsSync(HOME_FILE)) return;
    let html = fs.readFileSync(HOME_FILE, 'utf8');
    html = html
    .replace(/(<a href="slop\/)([^"]+)(\.html" class="hero-sotd")/, `$1${slug}$3`)
    .replace(/(class="hero-sotd" id="sotd-link" aria-label="Today's slop: )[^"]+(")/, `$1${escHtml(mealName)}$2`)
    .replace(/(<img src="slop\/img\/)([^"]+)(\.jpg" id="sotd-img")/, `$1${slug}$3`)
    .replace(/(id="sotd-img" alt=")([^"]+)(")/, `$1${escHtml(mealName)}$3`)
    .replace(/(<p class="hero-sotd-name"[^>]*>)[^<]+(<\/p>)/, `$1${escHtml(mealName)}$2`)
    .replace(/(<p class="hero-sotd-desc"[^>]*>)[^<]+(<\/p>)/, `$1${escHtml(description.slice(0, 100))}$2`)
    .replace(/(<a href="slop\/)([^"]+)(\.html" class="nav-link" id="sotd-nav")/, `$1${slug}$3`)
    .replace(/(<a href="slop\/)([^"]+)(\.html" class="nav-dropdown-link" id="sotd-nav-mobile")/, `$1${slug}$3`)
    .replace(/(<a href="slop\/)([^"]+)(\.html" class="hero-sotd-banner" aria-label="Today's slop: )[^"]+(")/, `$1${slug}$3${escHtml(mealName)}$4`)
    .replace(/(class="hero-sotd-banner-image">[\s\S]*?<img src="slop\/img\/)([^"]+)(\.jpg")/, `$1${slug}$3`)
    .replace(/(class="hero-sotd-banner-image">[\s\S]*?alt=")([^"]+)(")/, `$1${escHtml(mealName)}$3`)
    .replace(/(class="hero-sotd-banner-text">[\s\S]*?<p class="hero-sotd-name">)[^<]+(<\/p>)/, `$1${escHtml(mealName)}$2`)
    .replace(/(class="hero-sotd-banner-text">[\s\S]*?<p class="hero-sotd-desc">)[^<]+(<\/p>)/, `$1${escHtml(description.slice(0, 100))}$2`);
    fs.writeFileSync(HOME_FILE, html, 'utf8');
}

// --- Main Logic ---
const args = process.argv.slice(2);
let setSlug = null;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--set' && args[i+1]) {
        const val = args[i+1];
        if (!isNaN(val)) {
            const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
            const meals = db.meals || db;
            const meal = meals.find(m => m.id == val);
            if (meal) setSlug = meal.slug;
        } else {
            setSlug = val;
        }
    }
}

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const meals = db.meals || db;

let targetIndex = -1;

if (setSlug) {
    // Manual override mode: feature this EXACT recipe
    targetIndex = meals.findIndex(m => m.slug === setSlug);
    console.log(`Manual override: Setting current meal to ${setSlug}`);
} else {
    // Automatic daily mode: read _redirects to find current meal
    let currentSlug = null;
    if (fs.existsSync(REDIRECTS_FILE)) {
        const content = fs.readFileSync(REDIRECTS_FILE, 'utf8');
        const match = content.match(/\/slop\/today\s+\/slop\/([^\s]+)\.html/);
        if (match) currentSlug = match[1];
    }

    let currentIndex = meals.findIndex(m => m.slug === currentSlug);
    if (currentIndex === -1) currentIndex = 0;

    // Advance to the NEXT meal
    targetIndex = currentIndex + 1;
    if (targetIndex >= meals.length) targetIndex = 0; // Loop back to 0
}

const todaysMeal = meals[targetIndex];

if (!todaysMeal) {
    console.log('No meal found.');
    process.exit(0);
}

console.log(`Updating site to feature: ${todaysMeal.name} (${todaysMeal.slug})`);

const dateObj = new Date();

// 1. Update Homepage
updateHomepage(todaysMeal.slug, todaysMeal.name, todaysMeal.description);

// 2. Update Redirects
let lines = [];
if (fs.existsSync(REDIRECTS_FILE)) {
    lines = fs.readFileSync(REDIRECTS_FILE, 'utf8').split('\n').filter(l => l.trim() && !l.startsWith('/slop/today'));
}
lines.unshift(`/slop/today  /slop/${todaysMeal.slug}.html  301`);
fs.writeFileSync(REDIRECTS_FILE, lines.join('\n') + '\n');

// 3. Rebuild Archive Dynamically
if (fs.existsSync(INDEX_FILE)) {
    let html = fs.readFileSync(INDEX_FILE, 'utf8');

    const articleRegex = /<article class="archive-card[\s\S]*?<\/article>/g;
    let existingCards = html.match(articleRegex) || [];

    // Remove todaysMeal if it somehow exists already to prevent dupes
    existingCards = existingCards.filter(card => !card.includes(`href="./${todaysMeal.slug}.html"`));

    // Create the new card for today
    const newCardHTML = buildArchiveCard(todaysMeal.slug, todaysMeal.name, shortDate(dateObj), todaysMeal.tags);

    // Create a list of valid slugs (meals 0 to targetIndex) to filter out future meals
    const validSlugs = new Set(meals.slice(0, targetIndex + 1).map(m => m.slug));

    // Filter out future cards
    let keptCards = existingCards.filter(card => {
        const match = card.match(/href="\.\/([^\s]+)\.html"/);
        return match && validSlugs.has(match[1]);
    });

    // Prepend the new card for today
    let finalCards = [newCardHTML].concat(keptCards);
    const newCardsHTML = '\n    ' + finalCards.join('\n\n    ') + '\n  ';
    html = html.replace(/(<section class="archive-grid"[^>]*>)[\s\S]*?(<\/section>)/, `$1${newCardsHTML}$2`);

    // Update the featured block on the archive page
    const featuredTagsHTML = todaysMeal.tags.map(t => `        <span class="featured-tag">${escHtml(t)}</span>`).join('\n');
    const words = todaysMeal.name.split(' ');
    const titleLine1 = words.slice(0, -1).join(' ');
    const titleLine2 = words[words.length - 1];
    const titleHTML = titleLine1 ? `${escHtml(titleLine1)}<br>${escHtml(titleLine2)}.` : `${escHtml(todaysMeal.name)}.`;

    html = html
    .replace(/(<a href="\.\/)([^"]+)(\.html" class="featured-slop)/, `$1${todaysMeal.slug}$3`)
    .replace(/(aria-label="Read today's slop: )[^"]+(")/, `$1${escHtml(todaysMeal.name)}$2`)
    .replace(/(<img src="img\/)([^"]+)(\.jpg"[^>]*class="[^"]*"[^>]*>|[^>]*alt="[^"]*")/, (m) => m.replace(/src="img\/[^"]+\.jpg"/, `src="img/${todaysMeal.slug}.jpg"`))
    .replace(/(class="featured-image reveal-clip">[\s\S]*?alt=")([^"]+)(")/, `$1${escHtml(todaysMeal.name)}$3`)
    .replace(/(<p class="featured-eyebrow">)[^<]+(<\/p>)/, `$1${escHtml(prettyDate(dateObj))}$2`)
    .replace(/(<h2 class="featured-title">)[\s\S]*?(<\/h2>)/, `$1${titleHTML}$2`)
    .replace(/(<p class="featured-desc">)[^<]+(<\/p>)/, `$1${escHtml(todaysMeal.description.slice(0, 220))}$2`)
    .replace(/(<div class="featured-tags">)[\s\S]*?(<\/div>)/, `$1\n${featuredTagsHTML}\n      $2`)
    .replace(/(<p class="featured-date">Published )[^<]+(<\/p>)/, `$1${escHtml(prettyDate(dateObj))}$2`)
    .replace(/(<a href="\.\/)([^"]+)(\.html" class="nav-link" id="sotd-link">)/, `$1${todaysMeal.slug}$3`);

    const totalCards = finalCards.length;
    html = html.replace(/(<span class="archive-count"[^>]*>)[^<]*(<\/span>)/, `$1${totalCards} recipe${totalCards !== 1 ? 's' : ''}$2`);

    fs.writeFileSync(INDEX_FILE, html, 'utf8');
}

console.log('Successfully updated homepage, archive, and redirects.');
