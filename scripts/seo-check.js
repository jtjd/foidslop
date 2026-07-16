#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const errors = [];
const htmlFiles = [];
const publicRootSources = new Map();

for (const [directory, files] of Object.entries({
  'assets/js': ['archive.js', 'cookie-consent.js', 'recipe-tools.js', 'theme.js'],
  'assets/brand': ['logo.png', 'logo.webp', 'brand-icon.png', 'og-image.png', 'favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'android-chrome-192x192.png', 'android-chrome-512x512.png'],
  'assets/shop': ['DJTNIP.png', 'DJTNIP-hq.avif', 'DJTNIP-hq.webp', 'CarModel.png', 'CarModel-hq.avif', 'CarModel-hq.webp', 'MerchModel.png', 'MerchModel-hq.avif', 'MerchModel-hq.webp']
})) {
  for (const file of files) publicRootSources.set(file, path.join(ROOT, directory, file));
}

function publicSourceCandidate(absolute) {
  const relative = path.relative(ROOT, absolute);
  return relative && !relative.includes(path.sep) ? publicRootSources.get(relative) : null;
}

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['.git', '.deploy', 'node_modules'].includes(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html') && !entry.name.startsWith('homepage-example')) htmlFiles.push(full);
  }
}
walk(ROOT);

const canonicals = new Map();
for (const file of htmlFiles) {
  const relative = path.relative(ROOT, file);
  const html = fs.readFileSync(file, 'utf8');
  if (html.includes('—')) errors.push(`${relative}: contains an em dash`);
  if (!['404.html'].includes(relative)) {
    const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
    if (!canonical && relative !== 'privacy.html') errors.push(`${relative}: missing canonical`);
    if (canonical) {
      if (/\.html(?:$|[?#])/.test(canonical)) errors.push(`${relative}: canonical redirects (${canonical})`);
      if (canonicals.has(canonical)) errors.push(`${relative}: duplicate canonical also used by ${canonicals.get(canonical)}`);
      canonicals.set(canonical, relative);
    }
  }
  if (/href="(?:\.\.\/|\.\/|\/)?[^"#?]+\.html(?:["?#])/.test(html) && !['404.html'].includes(relative)) {
    errors.push(`${relative}: contains an internal .html link`);
  }
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(match[1]); } catch (error) { errors.push(`${relative}: invalid JSON-LD (${error.message})`); }
  }
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (/^(?:https?:|mailto:|tel:|#)/.test(href)) continue;
    const clean = href.split(/[?#]/)[0];
    if (!clean || clean === '/') continue;
    const absolute = clean.startsWith('/') ? path.join(ROOT, clean) : path.resolve(path.dirname(file), clean);
    const candidates = [absolute, `${absolute}.html`, path.join(absolute, 'index.html'), publicSourceCandidate(absolute)].filter(Boolean);
    if (clean === '/slop/today' || clean === 'slop/today' || clean === './today') continue;
    if (!candidates.some(candidate => fs.existsSync(candidate))) errors.push(`${relative}: broken internal link ${href}`);
  }
}

const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
if (locations.some(location => location.endsWith('.html'))) errors.push('sitemap.xml: contains redirecting .html URLs');
if (new Set(locations).size !== locations.length) errors.push('sitemap.xml: duplicate URLs');
for (const location of locations.filter(location => !location.includes('/slop/img/'))) {
  if (!canonicals.has(location)) errors.push(`sitemap.xml: no matching canonical page for ${location}`);
}

const recipeFiles = fs.readdirSync(path.join(ROOT, 'slop')).filter(file => file.endsWith('.html') && file !== 'archive.html');
const recipeLocations = locations.filter(location => /\/slop\/[^/]+$/.test(location) && !location.endsWith('/archive'));
if (recipeFiles.length !== recipeLocations.length) errors.push(`recipe count mismatch: ${recipeFiles.length} files vs ${recipeLocations.length} sitemap URLs`);

for (const file of recipeFiles) {
  const slug = file.replace(/\.html$/, '');
  const imageDirectory = path.join(ROOT, 'slop', 'img');
  const sourceName = fs.existsSync(path.join(imageDirectory, `${slug}.png`)) ? `${slug}.png` : `${slug}.jpg`;
  const expected = [sourceName, `${slug}-480.webp`, `${slug}-768.webp`, `${slug}-4x3.jpg`, `${slug}-16x9.jpg`];
  for (const image of expected) if (!fs.existsSync(path.join(imageDirectory, image))) errors.push(`${file}: missing image variant ${image}`);
  const source = path.join(imageDirectory, sourceName);
  const signature = fs.existsSync(source) ? fs.readFileSync(source).subarray(0, 8).toString('hex') : '';
  if (sourceName.endsWith('.jpg') && !signature.startsWith('ffd8')) errors.push(`${file}: .jpg source is not JPEG data`);
  if (sourceName.endsWith('.png') && !signature.startsWith('89504e47')) errors.push(`${file}: .png source is not PNG data`);
}
if (!fs.existsSync(path.join(ROOT, 'assets', 'brand', 'og-image.png'))) errors.push('missing transparent og-image.png');

const requiredCollections = ['pasta', 'toast', 'snack-plates', 'comfort-food', '15-minute'];
for (const slug of requiredCollections) {
  const file = path.join(ROOT, 'recipes', `${slug}.html`);
  if (!fs.existsSync(file)) errors.push(`missing generated collection: recipes/${slug}.html`);
  if (!locations.includes(`https://foidslop.com/recipes/${slug}`)) errors.push(`sitemap.xml: missing recipes/${slug}`);
}
const foidArticle = path.join(ROOT, 'what-does-foid-mean.html');
if (!fs.existsSync(foidArticle)) errors.push('missing editorial page: what-does-foid-mean.html');
if (!locations.includes('https://foidslop.com/what-does-foid-mean')) errors.push('sitemap.xml: missing what-does-foid-mean');
const homepage = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
if (!homepage.includes('Latest foidslop recipes')) errors.push('index.html: missing latest recipe ItemList');
if (homepage.includes('DJT Nippon Collection — foidslop')) errors.push('index.html: merchandise is still the primary ItemList');
const archive = fs.readFileSync(path.join(ROOT, 'slop', 'archive.html'), 'utf8');
if (!archive.includes('id="archive-search"') || !archive.includes('../archive.js')) errors.push('slop/archive.html: missing archive discovery controls');
for (const file of recipeFiles) {
  const html = fs.readFileSync(path.join(ROOT, 'slop', file), 'utf8');
  if (!html.includes('id="copy-ingredients"') || !html.includes('../recipe-tools.js')) errors.push(`${file}: missing recipe tools`);
  if (!html.includes('class="slop-headnote"')) errors.push(`${file}: missing recipe headnote`);
  if (!html.includes('max-image-preview:large')) errors.push(`${file}: missing large image preview directive`);
  if (!html.includes('"dateModified"')) errors.push(`${file}: missing recipe modification date`);
  if (!html.includes('id="step-1"') || !html.includes(`#step-1`)) errors.push(`${file}: missing stable recipe step anchors`);
  const slug = file.replace(/\.html$/, '');
  for (const suffix of ['wide', 'pin']) {
    if (!fs.existsSync(path.join(ROOT, 'slop', 'social', `${slug}-${suffix}.jpg`))) errors.push(`${file}: missing ${suffix} social canvas`);
  }
}

const primaryData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'foidslop-meals.json'), 'utf8'));
const volumeTwoPath = path.join(ROOT, 'data', 'foidslop-meals-volume-2.json');
const volumeTwoData = fs.existsSync(volumeTwoPath) ? JSON.parse(fs.readFileSync(volumeTwoPath, 'utf8')) : null;
const databases = [{ name: 'volume 1', data: primaryData }];
if (volumeTwoData) databases.push({ name: 'volume 2', data: volumeTwoData });
const database = databases.flatMap(databaseEntry => databaseEntry.data.meals);
const ids = new Set();
const slugs = new Set();
const normalizedNames = new Set();
const normalizeName = value => value.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
  .filter(token => token && !['a', 'and', 'for', 'in', 'of', 'on', 'the', 'to', 'with'].includes(token));
const normalizeIngredients = meal => meal.ingredients.flatMap(item => item.name.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/))
  .filter(token => token && !['and', 'or', 'to', 'taste', 'fresh', 'chopped', 'sliced', 'grated', 'cooked', 'canned', 'small', 'large', 'optional', 'oil', 'salt', 'pepper', 'water'].includes(token));
const jaccard = (left, right) => {
  const a = new Set(left); const b = new Set(right);
  const intersection = [...a].filter(value => b.has(value)).length;
  return intersection / new Set([...a, ...b]).size;
};

for (const { name: databaseName, data } of databases) {
  if (!Array.isArray(data.meals) || data.count !== data.meals.length) errors.push(`${databaseName}: count does not match meals array`);
  for (const meal of data.meals || []) {
    const normalizedName = normalizeName(meal.name || '').sort().join(' ');
    if (ids.has(meal.id)) errors.push(`${meal.slug}: duplicate recipe id ${meal.id}`);
    if (slugs.has(meal.slug)) errors.push(`${meal.slug}: duplicate recipe slug`);
    if (databaseName === 'volume 2' && normalizedNames.has(normalizedName)) errors.push(`${meal.slug}: duplicate normalized recipe name`);
    ids.add(meal.id); slugs.add(meal.slug); normalizedNames.add(normalizedName);
    if (!meal.name || !meal.slug || !meal.description || !meal.headnote || !meal.seoTitle || !meal.seoDescription) errors.push(`${meal.slug}: incomplete discovery copy`);
    if (!Array.isArray(meal.ingredients) || !meal.ingredients.length || meal.ingredients.some(item => !item.amount || !item.name)) errors.push(`${meal.slug}: incomplete ingredients`);
    if (!Array.isArray(meal.steps) || !meal.steps.length || meal.steps.some(step => !step.name || !step.text)) errors.push(`${meal.slug}: incomplete method`);
    if ((meal.description || '').length < 65 || (meal.notes || '').length < 55) errors.push(`${meal.slug}: thin description or notes`);
    if ((meal.steps || []).some(step => step.text.length < 55)) errors.push(`${meal.slug}: thin method step`);
    if (/—/.test(JSON.stringify(meal))) errors.push(`${meal.slug}: em dash in recipe data`);
    if (/high protein|protein packed|protein rich|pre or post workout|low carb alternative|much healthier/i.test(JSON.stringify(meal))) errors.push(`${meal.slug}: unsupported health or workout language`);
    if ((meal.seoTitle || '').length > 64 || (meal.seoDescription || '').length > 160) errors.push(`${meal.slug}: oversized search title or description`);
  }
}

if (volumeTwoData) {
  const staged = volumeTwoData.meals;
  const expectedFields = ['id', 'name', 'slug', 'description', 'tags', 'prep', 'cook', 'serves', 'difficulty', 'cuisine', 'category', 'ingredients', 'steps', 'notes', 'photo_search', 'publishDate', 'status', 'imageAlt', 'headnote', 'seoTitle', 'seoDescription'];
  if (staged.length !== 100) errors.push(`volume 2: expected 100 recipes, found ${staged.length}`);
  if (staged[0]?.id !== 201 || staged.at(-1)?.id !== 300) errors.push('volume 2: ids must run from 201 through 300');
  if (staged[0]?.publishDate !== '2026-11-17' || staged.at(-1)?.publishDate !== '2027-02-24') errors.push('volume 2: unexpected publication range');
  for (const [index, meal] of staged.entries()) {
    const expectedDate = new Date('2026-11-17T12:00:00Z');
    expectedDate.setUTCDate(expectedDate.getUTCDate() + index);
    if (meal.id !== 201 + index) errors.push(`${meal.slug}: volume 2 ids are not consecutive`);
    if (meal.publishDate !== expectedDate.toISOString().slice(0, 10)) errors.push(`${meal.slug}: volume 2 dates are not consecutive`);
    if (meal.status !== 'scheduled' || Object.hasOwn(meal, 'dateModified')) errors.push(`${meal.slug}: staged recipe has public modification state`);
    if (Object.keys(meal).join('|') !== expectedFields.join('|')) errors.push(`${meal.slug}: volume 2 field order or shape differs from the staged schema`);
    if (meal.serves !== '1') errors.push(`${meal.slug}: volume 2 recipe is not single-serving`);
    if (!Array.isArray(meal.tags) || !meal.tags.length || !meal.photo_search || !meal.imageAlt) errors.push(`${meal.slug}: incomplete classification or image brief`);
    if (!/^\d+m$/.test(meal.prep) || !/^\d+m$/.test(meal.cook)) errors.push(`${meal.slug}: invalid time format`);
    if (meal.ingredients.some(item => /^\s*\d+(?:\.\d+)?\s*g\b/i.test(item.amount))) errors.push(`${meal.slug}: metric-first ingredient amount`);
    if (meal.tags.includes('No Cook') && meal.cook !== '0m') errors.push(`${meal.slug}: no-cook recipe has nonzero cook time`);
    if (!meal.tags.includes('No Cook') && meal.steps.length < 2) errors.push(`${meal.slug}: cooked recipe needs preparation and cooking steps`);
  }
  const holidayCounts = Object.fromEntries(['Thanksgiving', 'Hanukkah', 'Christmas', 'Kwanzaa', 'New Year', 'Lunar New Year', 'Valentine']
    .map(holiday => [holiday, staged.filter(meal => meal.tags.includes(holiday)).length]));
  const expectedHolidayCounts = { Thanksgiving: 8, Hanukkah: 3, Christmas: 7, Kwanzaa: 2, 'New Year': 4, 'Lunar New Year': 3, Valentine: 3 };
  if (JSON.stringify(holidayCounts) !== JSON.stringify(expectedHolidayCounts)) errors.push(`volume 2: incorrect holiday allocation ${JSON.stringify(holidayCounts)}`);
  if (staged.filter(meal => meal.tags.includes('Holiday')).length !== 30) errors.push('volume 2: holiday recipe count must be 30');
  if (staged.filter(meal => meal.tags.includes('No Cook')).length < 35) errors.push('volume 2: fewer than 35 no-cook recipes');
  if (staged.filter(meal => (Number.parseInt(meal.prep) || 0) + (Number.parseInt(meal.cook) || 0) <= 15).length < 65) errors.push('volume 2: fewer than 65 recipes at 15 minutes or less');
  if (staged.filter(meal => meal.tags.includes('Vegetarian')).length < 40) errors.push('volume 2: fewer than 40 vegetarian recipes');
  for (const [stagedIndex, stagedMeal] of staged.entries()) {
    const stagedTokens = normalizeName(stagedMeal.name);
    const comparisons = [...primaryData.meals, ...staged.slice(0, stagedIndex)];
    for (const existingMeal of comparisons) {
      const existingTokens = normalizeName(existingMeal.name);
      if (stagedTokens.length > 2 && existingTokens.length > 2 && jaccard(stagedTokens, existingTokens) >= 0.72) {
        errors.push(`${stagedMeal.slug}: title is too similar to existing recipe ${existingMeal.slug}`);
      }
      const ingredientSimilarity = jaccard(normalizeIngredients(stagedMeal), normalizeIngredients(existingMeal));
      if (stagedMeal.category === existingMeal.category && ingredientSimilarity >= 0.68) {
        errors.push(`${stagedMeal.slug}: ingredients are too similar to existing recipe ${existingMeal.slug}`);
      }
    }
  }
}

for (const asset of ['DJTNIP-hq.avif', 'DJTNIP-hq.webp', 'CarModel-hq.avif', 'CarModel-hq.webp', 'MerchModel-hq.avif', 'MerchModel-hq.webp']) {
  if (!fs.existsSync(path.join(ROOT, 'assets', 'shop', asset))) errors.push(`missing homepage derivative: ${asset}`);
}
if (!homepage.includes('DJTNIP-hq.avif') || !homepage.includes('<picture>')) errors.push('index.html: missing responsive high-quality homepage artwork');
for (const slug of [...requiredCollections, 'quick', 'no-cook', 'for-one', 'vegetarian']) {
  const html = fs.readFileSync(path.join(ROOT, 'recipes', `${slug}.html`), 'utf8');
  if (!html.includes('class="collection-guide"')) errors.push(`recipes/${slug}.html: missing collection guide`);
}
if (!archive.includes('class="archive-intro"') || !archive.includes('mushrooms, feta, pasta')) errors.push('slop/archive.html: missing enriched archive introduction');
const pinterestRss = fs.readFileSync(path.join(ROOT, 'pinterest-rss.xml'), 'utf8');
if (!pinterestRss.includes('/slop/social/')) errors.push('pinterest-rss.xml: missing Pinterest canvas URLs');
const pinterestItems = [...pinterestRss.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(match => match[1]);
const pinterestLinks = pinterestItems.map(item => (item.match(/<link>([^<]+)<\/link>/) || [])[1]).filter(Boolean);
const pinterestGuids = pinterestItems.map(item => (item.match(/<guid[^>]*>([^<]+)<\/guid>/) || [])[1]).filter(Boolean);
const pinterestImages = pinterestItems.map(item => (item.match(/<enclosure[^>]+url="([^"]+)"/) || [])[1]).filter(Boolean);
const pinterestMediaImages = pinterestItems.map(item => (item.match(/<media:content[^>]+url="([^"]+)"/) || [])[1]).filter(Boolean);
if (!pinterestItems.length) errors.push('pinterest-rss.xml: no RSS items');
if (new Set(pinterestLinks).size !== pinterestLinks.length) errors.push('pinterest-rss.xml: duplicate recipe links');
if (new Set(pinterestGuids).size !== pinterestGuids.length) errors.push('pinterest-rss.xml: duplicate recipe GUIDs');
if (pinterestLinks.some((link, index) => link !== pinterestGuids[index])) errors.push('pinterest-rss.xml: GUID does not match recipe link');
if (pinterestImages.some((image, index) => image !== pinterestMediaImages[index])) errors.push('pinterest-rss.xml: enclosure and media image URLs differ');
if (pinterestImages.some(image => !/\/slop\/social\/[^/]+-pin\.jpg$/.test(image))) errors.push('pinterest-rss.xml: noncanonical Pinterest image URL');

const redirects = fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8');
if (!/^\/slop\/today\s+\/slop\/[a-z0-9-]+\s+301/m.test(redirects)) errors.push('_redirects: missing clean /slop/today destination');

if (errors.length) {
  console.error(`SEO validation failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
const stagedSummary = volumeTwoData ? `, ${volumeTwoData.meals.length} staged recipes` : '';
console.log(`SEO validation passed: ${htmlFiles.length} HTML files, ${recipeFiles.length} published recipes, ${locations.length} sitemap pages${stagedSummary}.`);
