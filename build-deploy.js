#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, '.deploy');
const meals = JSON.parse(fs.readFileSync(path.join(ROOT, 'foidslop-meals.json'), 'utf8')).meals;
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const publishedSlugs = new Set(meals
  .filter(meal => meal.publishDate <= today && meal.status !== 'retired')
  .filter(meal => fs.existsSync(path.join(ROOT, 'slop', `${meal.slug}.html`)))
  .map(meal => meal.slug));

function copyFile(relative) {
  const source = path.join(ROOT, relative);
  if (!fs.existsSync(source)) throw new Error(`Missing public file: ${relative}`);
  const destination = path.join(OUTPUT, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function copyDirectory(relative, filter = () => true) {
  const source = path.join(ROOT, relative);
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) copyDirectory(child, filter);
    else if (filter(child, entry.name)) copyFile(child);
  }
}

fs.rmSync(OUTPUT, { recursive: true, force: true });
fs.mkdirSync(OUTPUT, { recursive: true });

for (const file of [
  'index.html', '404.html', 'privacy.html', 'what-is-foidslop.html', 'what-does-foid-mean.html',
  'editorial-standards.html', 'girl-dinner-ideas.html', 'feed.xml', 'pinterest-rss.xml', 'sitemap.xml',
  'robots.txt', 'llms.txt', 'site.webmanifest', '_redirects', 'archive.js', 'cookie-consent.js',
  'recipe-tools.js', 'theme.js', 'logo.png', 'logo.webp', 'brand-icon.png', 'og-image.png',
  'favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png',
  'android-chrome-192x192.png', 'android-chrome-512x512.png', 'DJTNIP.png', 'DJTNIP-hq.avif',
  'DJTNIP-hq.webp', 'CarModel.png', 'CarModel-hq.avif', 'CarModel-hq.webp', 'MerchModel.png',
  'MerchModel-hq.avif', 'MerchModel-hq.webp'
]) copyFile(file);

copyDirectory('css');
copyDirectory('recipes');
for (const file of fs.readdirSync(path.join(ROOT, 'slop'))) {
  if (file.endsWith('.html')) copyFile(path.join('slop', file));
}
copyDirectory(path.join('slop', 'img'), (relative, name) => {
  const slug = name.replace(/-(?:480|768)\.webp$/, '').replace(/-(?:4x3|16x9)\.jpg$/, '').replace(/\.(?:jpg|png)$/, '');
  if (name === `${slug}.jpg` && fs.existsSync(path.join(ROOT, 'slop', 'img', `${slug}.png`))) return false;
  return publishedSlugs.has(slug);
});
copyDirectory(path.join('slop', 'social'), (relative, name) => publishedSlugs.has(name.replace(/-(?:wide|pin)\.jpg$/, '')));

const forbidden = ['daily-publish.js', 'optimize-images.js', 'seo-check.js', 'upgrade-recipe-content.js', 'foidslop-meals.json', 'foidslop-meals-volume-2.json'];
for (const file of forbidden) {
  if (fs.existsSync(path.join(OUTPUT, file))) throw new Error(`Private build file leaked into deployment: ${file}`);
}

console.log(`Built a public-only deployment in ${OUTPUT} for ${publishedSlugs.size} recipes.`);
