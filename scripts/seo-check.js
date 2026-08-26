#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const ratings = require('./lib/ratings');

const ROOT = process.cwd();
const errors = [];
const htmlFiles = [];
const publicRootSources = new Map();
const homepageConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'homepage.json'), 'utf8'));
const weeklyQueue = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'weekly-polls.json'), 'utf8'));
const { validateQueue } = require('./weekly-community');

for (const [directory, files] of Object.entries({
  'assets/js': ['archive.js', 'cookie-consent.js', 'home.js', 'recipe-tools.js', 'theme.js'],
  'assets/brand': ['logo.png', 'logo.webp', 'brand-icon.png', 'og-image.png', 'favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'android-chrome-192x192.png', 'android-chrome-512x512.png']
})) {
  for (const file of files) publicRootSources.set(file, path.join(ROOT, directory, file));
}

function publicSourceCandidate(absolute) {
  const relative = path.relative(ROOT, absolute);
  return relative && !relative.includes(path.sep) ? publicRootSources.get(relative) : null;
}

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['.git', '.deploy', 'node_modules', 'fourthwall'].includes(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html') && !entry.name.startsWith('homepage-example')) htmlFiles.push(full);
  }
}
walk(ROOT);

const canonicals = new Map();
const titleViolations = [];
for (const file of htmlFiles) {
  const relative = path.relative(ROOT, file);
  const html = fs.readFileSync(file, 'utf8');
  if (/fonts\.(googleapis|gstatic)\.com/.test(html)) errors.push(`${relative}: loads Google Fonts remotely instead of self-hosted /fonts`);
}
for (const file of htmlFiles) {
  const relative = path.relative(ROOT, file);
  const html = fs.readFileSync(file, 'utf8');
  if (html.includes('—')) errors.push(`${relative}: contains an em dash`);
  const pageTitle = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  const pageCanonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  const indexable = pageCanonical && !/noindex/.test(html) && relative !== 'privacy.html';
  if (pageTitle && indexable && /\|\s*foidslop\s*$/i.test(pageTitle)) titleViolations.push(relative);
  if (/shop\.foidslop\.com|occasional objects|objects department|DJT Nippon/i.test(html)) errors.push(`${relative}: contains retired store promotion`);
  if (/until those services are connected|weekly dispatch is active|community form is active|future saved-recipes feature/i.test(html)) {
    errors.push(`${relative}: contains stale publication-service copy`);
  }
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
    if (/^\/?fonts\/[\w.-]+\.woff2$/.test(clean)) candidates.push(path.join(ROOT, 'assets', 'fonts', clean.replace(/^\/?fonts\//, '')));
    if (/^\.?\/?page-\d+$/.test(clean)) candidates.push(path.join(ROOT, 'slop', 'archive', `${clean.replace(/^\.?\//, '')}.html`));
    if (/(?:^|\/)slop\/today$/.test(clean) || clean === './today') continue;
    if (!candidates.some(candidate => fs.existsSync(candidate))) errors.push(`${relative}: broken internal link ${href}`);
  }
}
if (titleViolations.length) errors.push(`titles still end with the brand suffix: ${titleViolations.join(', ')}`);

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
for (const landmark of ['id="dispatch"', 'id="week-title"', 'id="find-title"', 'id="table-title"', 'id="filing-cabinet"', 'data-random-recipe']) {
  if (!homepage.includes(landmark)) errors.push(`index.html: missing community homepage landmark ${landmark}`);
}
for (const label of ['Today</a>', 'Archive</a>', 'Dispatch</a>']) {
  if (!homepage.includes(label)) errors.push(`index.html: missing primary navigation item ${label.replace('</a>', '')}`);
}
if (!homepage.includes('home.js?v=') || !fs.existsSync(path.join(ROOT, 'assets', 'js', 'home.js'))) errors.push('index.html: missing homepage interaction script');
if (!/<link rel="preload" as="image"[^>]+slop\/img\/[^"]+-768\.webp/.test(homepage)) errors.push('index.html: today image is not preloaded');
const randomPoolMatch = homepage.match(/<script id="random-recipe-pool" type="application\/json">([\s\S]*?)<\/script>/);
let homepageRandomPool = [];
if (!randomPoolMatch) errors.push('index.html: missing random recipe pool');
else {
  try {
    homepageRandomPool = JSON.parse(randomPoolMatch[1]);
    if (!Array.isArray(homepageRandomPool) || new Set(homepageRandomPool).size !== homepageRandomPool.length) errors.push('index.html: invalid or duplicate random recipe pool');
  } catch (error) {
    errors.push(`index.html: invalid random recipe JSON (${error.message})`);
  }
}
if (homepageConfig.newsletter.enabled) {
  if (!/<form class="dispatch-form" action="https:\/\/[^"]+" method="post" data-newsletter-form>/.test(homepage)) errors.push('index.html: enabled newsletter is missing an HTTPS POST form');
  if (!/<label for="dispatch-primary-email">Email address<\/label>/.test(homepage)) errors.push('index.html: newsletter email field has no visible label');
} else if (!homepage.includes('data-newsletter-state="inactive"') || homepage.includes('data-newsletter-form')) {
  errors.push('index.html: inactive newsletter must not render a collecting form');
}
if (homepageConfig.community.enabled) {
  if (!homepage.includes('data-track="community_submit_click"')) errors.push('index.html: enabled community module is missing the submission action');
  if (homepageConfig.community.status === 'open' && !homepage.includes('data-track="community_vote_click"')) errors.push('index.html: open community poll is missing its vote action');
  if (!homepage.includes(`data-poll-id="${homepageConfig.community.pollId}"`)) errors.push('index.html: community poll id does not match homepage config');
  if (homepageConfig.community.status === 'open' && !homepage.includes(`poll_id=${homepageConfig.community.pollId}`)) errors.push('index.html: Tally vote link is missing its poll id');
} else if (!homepage.includes('Community submissions are currently unavailable.')) {
  errors.push('index.html: inactive community module needs an honest inactive state');
}
const checkInbox = fs.readFileSync(path.join(ROOT, 'check-inbox.html'), 'utf8');
if (!checkInbox.includes('<meta name="robots" content="noindex,follow">')) errors.push('check-inbox.html: confirmation page must be noindex');
if (!checkInbox.includes('Check your<br>inbox.') || !checkInbox.includes('logo.webp')) errors.push('check-inbox.html: missing branded confirmation content');
if (locations.includes('https://foidslop.com/check-inbox')) errors.push('sitemap.xml: noindex confirmation page must not be listed');
const subscribed = fs.readFileSync(path.join(ROOT, 'subscribed.html'), 'utf8');
if (!subscribed.includes('<meta name="robots" content="noindex,follow">')) errors.push('subscribed.html: confirmation page must be noindex');
if (!subscribed.includes('You’re<br>in.') || !subscribed.includes('logo.webp')) errors.push('subscribed.html: missing branded success content');
if (locations.includes('https://foidslop.com/subscribed')) errors.push('sitemap.xml: noindex success page must not be listed');
const privacy = fs.readFileSync(path.join(ROOT, 'privacy.html'), 'utf8');
for (const required of ['Kit', 'Tally', 'dispatch@foidslop.com', 'GitHub Actions', 'manually removed']) {
  if (!privacy.includes(required)) errors.push(`privacy.html: missing active-service disclosure (${required})`);
}
const archive = fs.readFileSync(path.join(ROOT, 'slop', 'archive.html'), 'utf8');
if (!archive.includes('id="archive-search"') || !archive.includes('../archive.js')) errors.push('slop/archive.html: missing archive discovery controls');
let ratingsCache = null;
try {
  ratingsCache = ratings.normalizeSummaries(JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ratings.json'), 'utf8')));
} catch { }
if (!ratingsCache) errors.push('data/ratings.json is missing or not a valid ratings cache');
for (const file of recipeFiles) {
  const html = fs.readFileSync(path.join(ROOT, 'slop', file), 'utf8');
  if (!html.includes('id="copy-ingredients"') || !html.includes('../recipe-tools.js')) errors.push(`${file}: missing recipe tools`);
  if (!html.includes('id="rate-recipe"') || !html.includes('id="rate-summary"')) errors.push(`${file}: missing reader rating widget`);
  for (const marker of ['class="share-row"', 'id="copy-page-link"', 'class="image-pin"']) {
    if (!html.includes(marker)) errors.push(`${file}: missing sharing feature ${marker}`);
  }
  if (homepageConfig.newsletter.enabled && !html.includes('data-newsletter-form')) errors.push(`${file}: enabled newsletter is missing the inline signup form`);
  if (!html.includes('class="keep-browsing"')) errors.push(`${file}: missing keep-browsing collection links`);
  const slug = file.replace(/\.html$/, '');
  let sawRecipeSchema = false;
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let parsed;
    try { parsed = JSON.parse(match[1]); } catch { continue; }
    for (const node of Array.isArray(parsed) ? parsed : [parsed]) {
      if (!node || node['@type'] !== 'Recipe') continue;
      sawRecipeSchema = true;
      const expected = ratingsCache ? ratings.aggregateRatingSchema(`https://foidslop.com/slop/${slug}`, ratingsCache[slug]) : null;
      if (node.aggregateRating && !expected) errors.push(`${file}: aggregateRating present without enough cached votes`);
      if (expected && JSON.stringify(node.aggregateRating) !== JSON.stringify(expected)) {
        errors.push(`${file}: aggregateRating disagrees with data/ratings.json; rerun publish`);
      }
    }
  }
  if (!sawRecipeSchema) errors.push(`${file}: missing Recipe schema`);
  if (!html.includes('class="slop-headnote"')) errors.push(`${file}: missing recipe headnote`);
  if (!html.includes('max-image-preview:large')) errors.push(`${file}: missing large image preview directive`);
  if (!html.includes('"dateModified"')) errors.push(`${file}: missing recipe modification date`);
  if (!html.includes('id="step-1"') || !html.includes(`#step-1`)) errors.push(`${file}: missing stable recipe step anchors`);
  for (const suffix of ['wide', 'pin']) {
    if (!fs.existsSync(path.join(ROOT, 'slop', 'social', `${slug}-${suffix}.jpg`))) errors.push(`${file}: missing ${suffix} social canvas`);
  }
}

const primaryData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'foidslop-meals.json'), 'utf8'));
try {
  validateQueue(weeklyQueue, primaryData);
} catch (error) {
  errors.push(error.message);
}
const publishedHomepageSlugs = new Set(primaryData.meals.filter(meal => meal.status === 'published').map(meal => meal.slug));
if (homepageRandomPool.some(slug => !publishedHomepageSlugs.has(slug))) errors.push('index.html: random recipe pool contains an unpublished or unknown recipe');
const latestPublished = primaryData.meals.filter(meal => meal.status === 'published')
  .sort((a, b) => a.publishDate.localeCompare(b.publishDate) || a.id - b.id).at(-1);
if (latestPublished && homepageRandomPool.includes(latestPublished.slug)) errors.push('index.html: random recipe pool includes today’s recipe');
const configuredArchivePick = primaryData.meals.find(meal => meal.slug === homepageConfig.archivePickSlug);
if (!configuredArchivePick) errors.push(`homepage config: unknown archive pick ${homepageConfig.archivePickSlug}`);
else if (configuredArchivePick.status !== 'published') errors.push(`homepage config: archive pick is not published (${homepageConfig.archivePickSlug})`);
const databases = [{ name: 'primary database', data: primaryData }];
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
    if (meal.id >= 201 && meal.id <= 300 && normalizedNames.has(normalizedName)) errors.push(`${meal.slug}: duplicate normalized recipe name`);
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

const volumeTwo = primaryData.meals.filter(meal => meal.id >= 201 && meal.id <= 300);
{
  const staged = volumeTwo;
  const expectedFields = ['id', 'name', 'slug', 'description', 'tags', 'prep', 'cook', 'serves', 'difficulty', 'cuisine', 'category', 'ingredients', 'steps', 'notes', 'photo_search', 'publishDate', 'status', 'imageAlt', 'headnote', 'seoTitle', 'seoDescription'];
  if (staged.length !== 100) errors.push(`volume 2: expected 100 recipes, found ${staged.length}`);
  if (staged[0]?.id !== 201 || staged.at(-1)?.id !== 300) errors.push('volume 2: ids must run from 201 through 300');
  if (staged[0]?.publishDate !== '2026-11-17' || staged.at(-1)?.publishDate !== '2027-02-24') errors.push('volume 2: unexpected publication range');
  for (const [index, meal] of staged.entries()) {
    const expectedDate = new Date('2026-11-17T12:00:00Z');
    expectedDate.setUTCDate(expectedDate.getUTCDate() + index);
    if (meal.id !== 201 + index) errors.push(`${meal.slug}: volume 2 ids are not consecutive`);
    if (meal.publishDate !== expectedDate.toISOString().slice(0, 10)) errors.push(`${meal.slug}: volume 2 dates are not consecutive`);
    if (expectedFields.some(field => !Object.hasOwn(meal, field))) errors.push(`${meal.slug}: volume 2 recipe is missing a required field`);
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
    const comparisons = [
      ...primaryData.meals.filter(meal => meal.id < 201 || meal.id > 300),
      ...staged.slice(0, stagedIndex)
    ];
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

if (!homepage.includes('class="zine-today-image"') || !homepage.includes('<picture>')) errors.push('index.html: missing responsive today-recipe artwork');
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

const BASE = 'https://foidslop.com';
const nyToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
let editorialPages = [];
try {
  editorialPages = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'editorial-pages.json'), 'utf8'));
  if (!Array.isArray(editorialPages) || !editorialPages.length) throw new Error('empty');
} catch {
  errors.push('data/editorial-pages.json is missing, invalid, or lists no roundup pages');
  editorialPages = [];
}
const editorialLive = page => page.slug && !(page.notBefore && nyToday < page.notBefore);
for (const page of editorialPages) {
  if (!editorialLive(page)) {
    const leakedSitemap = locations.includes(`${BASE}/${page.slug}`);
    if (leakedSitemap) errors.push(`sitemap.xml: scheduled page ${page.slug} must stay out of the sitemap until ${page.notBefore}`);
    continue;
  }
  const file = path.join(ROOT, `${page.slug}.html`);
  if (!fs.existsSync(file)) { errors.push(`missing generated editorial page: ${page.slug}.html`); continue; }
  if (!locations.includes(`${BASE}/${page.slug}`)) errors.push(`sitemap.xml: missing editorial page ${page.slug}`);
  if (!new RegExp(`^\\/${page.slug}\\.html\\s+\\/${page.slug}\\s+301$`, 'm').test(redirects)) errors.push(`_redirects: missing editorial redirect for ${page.slug}`);
  const html = fs.readFileSync(file, 'utf8');
  const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  if (canonical !== `${BASE}/${page.slug}`) errors.push(`${page.slug}.html: canonical does not match its slug`);
  if (!html.includes('"@type": "FAQPage"') || !html.includes('class="collection-faq"')) errors.push(`${page.slug}.html: missing FAQ schema or visible FAQ section`);
}
const girlsHtml = fs.readFileSync(path.join(ROOT, 'girl-dinner-ideas.html'), 'utf8');
if (!girlsHtml.includes('"@type": "FAQPage"')) errors.push('girl-dinner-ideas.html: missing FAQPage schema');
if (!girlsHtml.includes('class="collection-faq"')) errors.push('girl-dinner-ideas.html: missing visible FAQ section');

const defaultOg = `${BASE}/og-image.png`;
for (const hub of ['quick', 'no-cook', 'for-one', 'vegetarian', 'pasta', 'toast', 'snack-plates', 'comfort-food', '15-minute']) {
  const html = fs.readFileSync(path.join(ROOT, 'recipes', `${hub}.html`), 'utf8');
  if ((html.match(/<meta property="og:image" content="([^"]+)"/) || [])[1] === defaultOg) errors.push(`recipes/${hub}.html: still uses the default og:image instead of a lead-recipe canvas`);
}
if (girlsHtml.match(/<meta property="og:image" content="([^"]+)"/)?.[1] === defaultOg) errors.push('girl-dinner-ideas.html: still uses the default og:image');

const { ARCHIVE_CHUNK } = require('./lib/publication-order');
const archiveManifestMatch = archive.match(/<script id="archive-manifest" type="application\/json">([\s\S]*?)<\/script>/);
if (!archiveManifestMatch) errors.push('slop/archive.html: missing archive manifest for older recipes');
else {
  try {
    const entries = JSON.parse(archiveManifestMatch[1]);
    const pastCount = recipeFiles.length - 1;
    const renderedCards = (archive.match(/class="archive-card"/g) || []).length;
    const expectedRendered = Math.min(pastCount, ARCHIVE_CHUNK);
    if (!Array.isArray(entries)) throw new Error('not an array');
    if (renderedCards !== expectedRendered) errors.push(`slop/archive.html: expected ${expectedRendered} server-rendered cards, found ${renderedCards}`);
    if (entries.length !== Math.max(pastCount - ARCHIVE_CHUNK, 0)) errors.push(`slop/archive.html: manifest holds ${entries.length} entries, expected ${Math.max(pastCount - ARCHIVE_CHUNK, 0)}`);
  } catch (error) {
    errors.push(`slop/archive.html: invalid archive manifest (${error.message})`);
  }
}

{
  const month = Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', month: '2-digit' }).format(new Date()));
  const inSeason = editorialPages.filter(page => editorialLive(page) && (!Array.isArray(page.seasonMonths) || !page.seasonMonths.length || page.seasonMonths.includes(month)));
  if (inSeason.length && !homepage.includes(`class="zine-roundup" href="${inSeason[0].slug}"`)) {
    errors.push(`index.html: missing seasonal roundup tile for ${inSeason[0].slug}`);
  }
}

const llms = fs.readFileSync(path.join(ROOT, 'llms.txt'), 'utf8');
for (const page of editorialPages) {
  const listed = llms.includes(`${BASE}/${page.slug}`);
  if (editorialLive(page) && !listed && page.slug !== 'girl-dinner-ideas') errors.push(`llms.txt: missing live roundup ${page.slug}`);
  if (!editorialLive(page) && listed) errors.push(`llms.txt: dormant roundup ${page.slug} must not be listed until ${page.notBefore}`);
}
if (!fs.existsSync(path.join(ROOT, '_headers'))) {
  errors.push('missing _headers file (caching and security headers)');
} else {
  const headers = fs.readFileSync(path.join(ROOT, '_headers'), 'utf8');
  for (const required of ['/fonts/*', 'immutable', 'X-Content-Type-Options']) {
    if (!headers.includes(required)) errors.push(`_headers: missing ${required} rule`);
  }
}
const forOne = fs.readFileSync(path.join(ROOT, 'recipes', 'for-one.html'), 'utf8');
if (!forOne.includes('<h1>Easy Dinner Ideas for One</h1>') || !forOne.includes('<title>118+ Easy Dinner Ideas for One</title>')) {
  errors.push('recipes/for-one.html: head-term title drifted from Dinner Ideas for One');
}
for (const file of recipeFiles.slice(0, 3)) {
  const html = fs.readFileSync(path.join(ROOT, 'slop', file), 'utf8');
  if ((html.match(/loading="eager"/g) || []).length < 1) { errors.push(`${file}: no eager first-card images on related grid`); break; }
}

{
  const expectedPages = Math.max(Math.ceil((recipeFiles.length - 1 - ARCHIVE_CHUNK) / ARCHIVE_CHUNK), 0);
  const archiveDir = path.join(ROOT, 'slop', 'archive');
  const onDisk = fs.existsSync(archiveDir)
    ? fs.readdirSync(archiveDir).filter(name => /^page-\d+\.html$/.test(name)).map(name => Number(name.match(/\d+/)[0])).sort((a, b) => a - b)
    : [];
  if (JSON.stringify(onDisk) !== JSON.stringify(Array.from({ length: expectedPages }, (_, index) => index + 2))) {
    errors.push(`slop/archive/: expected pagination pages ${expectedPages ? `2..${expectedPages + 1}` : '(none)'}, found [${onDisk.join(', ')}]`);
  }
  for (const n of onDisk) {
    const html = fs.readFileSync(path.join(archiveDir, `page-${n}.html`), 'utf8');
    if ((html.match(/class="archive-card"/g) || []).length === 0) errors.push(`slop/archive/page-${n}.html: no server-rendered cards`);
    if (!html.includes(`rel="canonical" href="${BASE}/slop/archive/page-${n}"`)) errors.push(`slop/archive/page-${n}.html: canonical mismatch`);
  }
  if (locations.some(location => location.includes('/slop/archive/page-'))) errors.push('sitemap.xml: pagination pages must stay out of the sitemap');
  for (const n of onDisk) {
    if (!new RegExp(`^/slop/archive/page-${n}\\.html\\s+/slop/archive/page-${n}\\s+301$`, 'm').test(redirects)) errors.push(`_redirects: missing archive pagination redirect for page-${n}`);
  }
}
{
  const undeferred = htmlFiles.filter(file => {
    const html = fs.readFileSync(file, 'utf8');
    return /<script src="[^"]*cookie-consent\.js[^"]*"(?![^>]*\bdefer\b)[^>]*><\/script>/.test(html);
  });
  if (undeferred.length) errors.push(`cookie-consent.js must load with defer on: ${undeferred.slice(0, 5).map(file => path.relative(ROOT, file)).join(', ')}`);
}
{
  const sample = fs.readFileSync(path.join(ROOT, 'slop', recipeFiles[0]), 'utf8');
  if (!sample.includes('og:image:width') || !sample.includes('og:image:height')) errors.push('recipe head is missing og:image dimensions');
}

for (const functionFile of ['functions/api/rate.js', 'functions/api/ratings.js']) {
  if (!fs.existsSync(path.join(ROOT, functionFile))) errors.push(`missing ratings endpoint: ${functionFile}`);
}
for (const font of ['css/fonts.css', 'assets/fonts/bebas-neue-400.woff2', 'assets/fonts/inter-var.woff2']) {
  if (!fs.existsSync(path.join(ROOT, font))) errors.push(`missing self-hosted font asset: ${font}`);
}
{
  const community = homepageConfig.community;
  const expected = community && community.enabled && /^https:/.test(community.submissionUrl || '');
  for (const file of recipeFiles) {
    const html = fs.readFileSync(path.join(ROOT, 'slop', file), 'utf8');
    if (expected && !html.includes('class="report-prompt"')) errors.push(`${file}: enabled community module is missing the reader report prompt`);
    if (!html.includes('pinterest.com/foidslop')) errors.push(`${file}: footer is missing the Pinterest profile link`);
  }
  if (!homepage.includes('"sameAs"') || !homepage.includes('pinterest.com/foidslop')) {
    errors.push('index.html: Organization schema is missing Pinterest sameAs');
  }
}
try {
  const pingConfig = require('./lib/ping-config');
  if (!/^[a-f0-9]{32}$/.test(pingConfig.KEY)) errors.push('scripts/lib/ping-config.js: IndexNow key must be 32 hex characters');
} catch {
  errors.push('scripts/lib/ping-config.js is missing or invalid');
}

if (errors.length) {
  console.error(`SEO validation failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`SEO validation passed: ${htmlFiles.length} HTML files, ${recipeFiles.length} published recipes, ${locations.length} sitemap pages, ${volumeTwo.length} volume 2 recipes.`);
