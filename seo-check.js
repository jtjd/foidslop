#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const errors = [];
const htmlFiles = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
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
    const candidates = [absolute, `${absolute}.html`, path.join(absolute, 'index.html')];
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
  const expected = [`${slug}.jpg`, `${slug}-480.webp`, `${slug}-768.webp`, `${slug}-4x3.jpg`, `${slug}-16x9.jpg`];
  for (const image of expected) if (!fs.existsSync(path.join(imageDirectory, image))) errors.push(`${file}: missing image variant ${image}`);
  const jpeg = path.join(imageDirectory, `${slug}.jpg`);
  if (fs.existsSync(jpeg) && fs.readFileSync(jpeg).subarray(0, 2).toString('hex') !== 'ffd8') errors.push(`${file}: .jpg source is not JPEG data`);
}
if (!fs.existsSync(path.join(ROOT, 'og-image.png'))) errors.push('missing transparent og-image.png');

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
}

const redirects = fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8');
if (!/^\/slop\/today\s+\/slop\/[a-z0-9-]+\s+301/m.test(redirects)) errors.push('_redirects: missing clean /slop/today destination');

if (errors.length) {
  console.error(`SEO validation failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`SEO validation passed: ${htmlFiles.length} HTML files, ${recipeFiles.length} recipes, ${locations.length} sitemap pages.`);
