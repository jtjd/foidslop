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

// Reads the date directly from the generated HTML file to ensure perfect sync
function getMealDate(slug) {
    const filePath = path.join(SLOP_DIR, `${slug}.html`);
    if (!fs.existsSync(filePath)) return new Date(); // Fallback to today if HTML doesn't exist
    const html = fs.readFileSync(filePath, 'utf8');
    const dateMatch = html.match(/Slop of the Day — ([^<]+)</);
    if (dateMatch && dateMatch[1]) {
        const dateObj = new Date(dateMatch[1].trim());
        if (!isNaN(dateObj.getTime())) return dateObj;
    }
    return new Date(); // Fallback
}

function buildArchiveCard(slug, mealName, shortDateStr, tags) {
    const firstTag = tags[0] || '';
    const secondTag = tags[1] || '';
    const tagHTML = [firstTag, secondTag].filter(Boolean).map(t => `              <span class="archive-card-tag">${escHtml(t)}</span>`).join('\n');
    return `    <article class="archive-card reveal">\n      <a href="./${slug}.html" aria-label="Read recipe: ${escHtml(mealName)}">\n        <div class="archive-card-img">\n          <img src="img/${slug}.jpg" alt="${escHtml(mealName)}" width="600" height="450" loading="lazy">\n        </div>\n        <div class="archive-card-body">\n          <p class="archive-card-name">${escHtml(mealName)}</p>\n          <div class="archive-card-meta">\n            <span class="archive-card-date">${escHtml(shortDateStr)}</span>\n            <div class="archive-card-tags">\n${tagHTML}\n            </div>\n          </div>\n        </div>\n      </a>\n    </article>`;
}

function buildRecentCard(slug, mealName, dateStr) {
    return `<div class="scroll-card"><a href="slop/${slug}.html" aria-label="Read recipe: ${escHtml(mealName)}"><div class="scroll-card-img"><img src="slop/img/${slug}.jpg" alt="${escHtml(mealName)}" width="400" height="400" loading="lazy"></div><div class="scroll-card-info"><div class="scroll-card-name">${escHtml(mealName)}</div><div class="scroll-card-price">${escHtml(dateStr)}</div></div></a></div>`;
}

function updateHomepage(todaysMeal, meals, targetIndex, dateObj) {
    if (!fs.existsSync(HOME_FILE)) return;
    let html = fs.readFileSync(HOME_FILE, 'utf8');

    const slug = todaysMeal.slug;
    const mealName = todaysMeal.name;
    const description = todaysMeal.description;

    // Update Hero SOTD
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

    // Update Daily Slop Section (Full Width)
    const counterStr = `${String(todaysMeal.id).padStart(3, '0')}`;
    html = html.replace(/(<h2 class="slop-counter-number"[^>]*>)[^<]*(<\/h2>)/, `$1${counterStr}$2`);
    html = html.replace(/(<h3 class="slop-counter-title"[^>]*>)[^<]*(<\/h3>)/, `$1${escHtml(mealName)}$2`);
    html = html.replace(/(<p class="slop-counter-desc"[^>]*>)[^<]*(<\/p>)/, `$1${escHtml(description.slice(0, 150))}$2`);
    html = html.replace(/(<a href="slop\/)([^"]+)(\.html" class="daily-slop-img-link" id="slop-counter-img-link")/, `$1${slug}$3`);
    html = html.replace(/(<img src="slop\/img\/)([^"]+)(\.jpg" id="slop-counter-img")/, `$1${slug}$3`);
    html = html.replace(/(id="slop-counter-img" alt=")([^"]+)(")/, `$1${escHtml(mealName)}$3`);
    html = html.replace(/(<a href="slop\/)([^"]+)(\.html" class="btn-shop daily-slop-btn" id="slop-counter-link")/, `$1${slug}$3`);

    // Update Recently Eaten Carousel using bulletproof markers (15 items)
    // FIX: Removed wrap-around logic so it doesn't show future meals on early days
    let recentCards = [];
    for (let i = 15; i >= 1; i--) {
        let idx = targetIndex - i;
        if (idx >= 0) {
            const m = meals[idx];
            let d = new Date(dateObj);
            d.setDate(d.getDate() - i);
            recentCards.push(buildRecentCard(m.slug, m.name, shortDate(d)));
        }
    }
    const recentHTML = recentCards.join('\n      ');
    html = html.replace(/(<!-- RECENTLY_EATEN_START -->)[\s\S]*?(<!-- RECENTLY_EATEN_END -->)/, `$1\n      ${recentHTML}\n      $2`);

    fs.writeFileSync(HOME_FILE, html, 'utf8');
}

function updatePrevNextNav(prevSlugToUpdate, newSlug, newMealName, newPrettyDate) {
    const prevFile = path.join(SLOP_DIR, `${prevSlugToUpdate}.html`);
    if (!fs.existsSync(prevFile)) return;
    let html = fs.readFileSync(prevFile, 'utf8');
    const nextPlaceholderRe = /<a href="[^"]*" class="slop-nav-item next"[^>]*>[\s\S]*?<\/a>/;
    const newNextBlock = `<a href="./${newSlug}.html" class="slop-nav-item next" aria-label="Next slop: ${escHtml(newMealName)}">\n    <span class="slop-nav-dir">Next Slop →</span>\n    <span class="slop-nav-name">${escHtml(newMealName)}</span>\n    <span class="slop-nav-date">${escHtml(newPrettyDate)}</span>\n  </a>`;
    if (nextPlaceholderRe.test(html)) {
        html = html.replace(nextPlaceholderRe, newNextBlock);
        fs.writeFileSync(prevFile, html, 'utf8');
        console.log(`  ✔ Updated next-nav on ${prevSlugToUpdate}.html`);
    }
}

function resetNextNav(currentSlug) {
    const currentFile = path.join(SLOP_DIR, `${currentSlug}.html`);
    if (!fs.existsSync(currentFile)) return;
    let html = fs.readFileSync(currentFile, 'utf8');
    const nextLinkRe = /<a href="[^"]*" class="slop-nav-item next"[^>]*>[\s\S]*?<\/a>/;
    const placeholderBlock = `<a href="#" class="slop-nav-item next" aria-label="No next slop yet" id="next-nav">\n    <span class="slop-nav-dir">Next Slop →</span>\n    <span class="slop-nav-name">—</span>\n    <span class="slop-nav-date">Check back tomorrow</span>\n  </a>`;
    if (nextLinkRe.test(html)) {
        html = html.replace(nextLinkRe, placeholderBlock);
        fs.writeFileSync(currentFile, html, 'utf8');
        console.log(`  ✔ Reset next-nav on ${currentSlug}.html to placeholder`);
    }
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
    targetIndex = meals.findIndex(m => m.slug === setSlug);
    console.log(`Manual override: Setting current meal to ${setSlug}`);
} else {
    let currentSlug = null;
    if (fs.existsSync(REDIRECTS_FILE)) {
        const content = fs.readFileSync(REDIRECTS_FILE, 'utf8');
        const match = content.match(/\/slop\/today\s+\/slop\/([^\s]+)\.html/);
        if (match) currentSlug = match[1];
    }
    let currentIndex = meals.findIndex(m => m.slug === currentSlug);
    if (currentIndex === -1) currentIndex = 0;
    targetIndex = currentIndex + 1;
    if (targetIndex >= meals.length) targetIndex = 0;
}

const todaysMeal = meals[targetIndex];

if (!todaysMeal) {
    console.log('No meal found.');
    process.exit(0);
}

console.log(`Updating site to feature: ${todaysMeal.name} (${todaysMeal.slug})`);

// Get the exact date from the generated HTML file to keep everything in sync
const dateObj = getMealDate(todaysMeal.slug);
console.log(`Using date: ${prettyDate(dateObj)} (synced from HTML file)`);

// 1. Update Homepage
updateHomepage(todaysMeal, meals, targetIndex, dateObj);

// 2. Update Prev/Next Navs
resetNextNav(todaysMeal.slug);
if (meals[targetIndex - 1]) {
    // We pass the prettyDate of the current meal so the previous page knows when the next one is "scheduled"
    updatePrevNextNav(meals[targetIndex - 1].slug, todaysMeal.slug, todaysMeal.name, prettyDate(dateObj));
}

// 3. Update Redirects
let lines = [];
if (fs.existsSync(REDIRECTS_FILE)) {
    lines = fs.readFileSync(REDIRECTS_FILE, 'utf8').split('\n').filter(l => l.trim() && !l.startsWith('/slop/today'));
}
lines.unshift(`/slop/today  /slop/${todaysMeal.slug}.html  301`);
fs.writeFileSync(REDIRECTS_FILE, lines.join('\n') + '\n');

// 4. Rebuild Archive Dynamically (Generates ALL cards up to targetIndex from scratch)
if (fs.existsSync(INDEX_FILE)) {
    let html = fs.readFileSync(INDEX_FILE, 'utf8');

    // Generate cards for ALL meals up to the current target index
    let allArchiveCards = [];
    for (let i = targetIndex; i >= 0; i--) {
        const m = meals[i];
        // Read the date from the generated HTML file for this specific meal
        const mDate = getMealDate(m.slug);
        allArchiveCards.push(buildArchiveCard(m.slug, m.name, shortDate(mDate), m.tags));
    }

    const newCardsHTML = '\n    ' + allArchiveCards.join('\n\n    ') + '\n  ';
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

    const totalCards = allArchiveCards.length;
    html = html.replace(/(<span class="archive-count"[^>]*>)[^<]*(<\/span>)/, `$1${totalCards} recipe${totalCards !== 1 ? 's' : ''}$2`);
    fs.writeFileSync(INDEX_FILE, html, 'utf8');
}

console.log('Successfully updated homepage, archive, and redirects.');
