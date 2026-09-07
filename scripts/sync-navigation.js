#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CHECK_ONLY = process.argv.includes('--check');
const NAV_STYLE = '/css/navigation.css?v=20260907-1';
const PINTEREST = 'https://www.pinterest.com/foidslop/';
const SKIP_DIRS = new Set(['.git', '.deploy', 'node_modules']);

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
}

const meals = readJson('data/foidslop-meals.json').meals || readJson('data/foidslop-meals.json');
const published = meals
  .filter(meal => meal.status === 'published' && meal.slug)
  .sort((a, b) => String(a.publishDate || '').localeCompare(String(b.publishDate || '')) || Number(a.id || 0) - Number(b.id || 0));
if (!published.length) throw new Error('Navigation sync could not resolve the current published recipe.');
const current = published.at(-1);

const editorialSlugs = new Set(
  fs.existsSync(path.join(ROOT, 'data', 'editorial-pages.json'))
    ? readJson('data/editorial-pages.json').map(page => page.slug).filter(Boolean)
    : []
);
editorialSlugs.add('girl-dinner-ideas');

function walk(dir, output = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(target, output);
    else if (entry.name.endsWith('.html')) output.push(target);
  }
  return output;
}

function routeFor(file) {
  let route = path.relative(ROOT, file).replace(/\\/g, '/').replace(/\.html$/, '');
  if (route === 'index') route = '';
  else if (route.endsWith('/index')) route = route.slice(0, -'/index'.length);
  return route;
}

function activeSection(route) {
  if (route === `slop/${current.slug}`) return 'today';
  if (route === 'culture' || route.startsWith('culture/')) return 'culture';
  if (route === 'dictionary' || route.startsWith('dictionary/') || route === 'what-is-foidslop' || route === 'what-does-foid-mean') return 'dictionary';
  if (route === 'slop/archive' || route.startsWith('slop/archive/') || route.startsWith('recipes/') || route.startsWith('slop/') || editorialSlugs.has(route)) return 'archive';
  return '';
}

function navLink(href, label, key, active, extra = '') {
  const isActive = active === key;
  return `<a href="${href}" class="nav-link${extra}${isActive ? ' active' : ''}"${isActive ? ' aria-current="page"' : ''}>${label}</a>`;
}

function dropdownLink(href, label, key, active) {
  const isActive = active === key;
  return `<a href="${href}" class="nav-dropdown-link${isActive ? ' active' : ''}"${isActive ? ' aria-current="page"' : ''}>${label}</a>`;
}

function header(centerHtml, active) {
  const today = `/slop/${current.slug}`;
  return `<header class="site-header" id="site-header">
  <a href="/" aria-label="foidslop home"><picture><source type="image/webp" srcset="/logo-header.webp"><img src="/logo-header.png" alt="FOID SLOP" class="logo" width="126" height="74"></picture></a>
  <div class="site-header-center">${centerHtml || 'Daily slop / made for one / etc.'}</div>
  <div class="header-right">
    <button class="theme-toggle" type="button" aria-label="Switch color theme" aria-pressed="true"><span class="theme-toggle-mark" aria-hidden="true">*</span><span class="theme-toggle-label">Light mode</span></button>
    ${navLink(today, 'Today', 'today', active, ' header-today')}
    ${navLink('/slop/archive', 'Archive', 'archive', active)}
    ${navLink('/culture', 'Culture', 'culture', active)}
    ${navLink('/dictionary', 'Dictionary', 'dictionary', active)}
    ${navLink('/#dispatch', 'Dispatch', 'dispatch', active, ' header-dispatch')}
    <button class="nav-hamburger" id="nav-hamburger" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="nav-dropdown"><span></span><span></span><span></span></button>
  </div>
  <nav class="nav-dropdown" id="nav-dropdown" aria-label="Mobile navigation" aria-hidden="true">
    ${dropdownLink(today, 'Today', 'today', active)}
    ${dropdownLink('/slop/archive', 'Archive', 'archive', active)}
    ${dropdownLink('/culture', 'Culture', 'culture', active)}
    ${dropdownLink('/dictionary', 'Dictionary', 'dictionary', active)}
    ${dropdownLink('/#dispatch', 'Dispatch', 'dispatch', active)}
  </nav>
</header>`;
}

function footer() {
  return `<footer><div class="footer-inner">
  <span class="footer-copy">&copy; ${new Date().getFullYear()} foidslop</span>
  <nav class="footer-links" aria-label="Footer navigation">
    <a href="/what-is-foidslop">What is foidslop?</a><span class="footer-dot"></span>
    <a href="/slop/archive">Recipes</a><span class="footer-dot"></span>
    <a href="/dictionary">Dictionary</a><span class="footer-dot"></span>
    <a href="/culture">Culture</a><span class="footer-dot"></span>
    <a href="${PINTEREST}" rel="external">Pinterest</a><span class="footer-dot"></span>
    <a href="/feed.xml" type="application/atom+xml">RSS</a><span class="footer-dot"></span>
    <a href="/about">About</a><span class="footer-dot"></span>
    <a href="/privacy">Privacy</a>
  </nav>
</div></footer>`;
}

function removeLegacyNavScripts(html) {
  return html.replace(/<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?(?:nav-hamburger|nav-dropdown)[\s\S]*?<\/script>\s*/gi, '');
}

function injectNavigationStylesheet(html) {
  if (html.includes('/css/navigation.css') || html.includes('css/navigation.css')) return html;
  const tag = `<link rel="stylesheet" href="${NAV_STYLE}">`;
  const themePattern = /(<link\b[^>]*href="[^"]*css\/theme\.css(?:\?v=[^"]*)?"[^>]*>)/i;
  if (themePattern.test(html)) return html.replace(themePattern, `$1\n${tag}`);
  return html.replace('</head>', `${tag}\n</head>`);
}

function transform(file, source) {
  const route = routeFor(file);
  const active = activeSection(route);
  let html = removeLegacyNavScripts(source);
  const siteHeader = html.match(/<header\b[^>]*class="[^"]*\bsite-header\b[^"]*"[^>]*>[\s\S]*?<\/header>/i);
  const errorHeader = html.match(/<header\b[^>]*class="[^"]*\berror-header\b[^"]*"[^>]*>[\s\S]*?<\/header>/i);
  const oldHeader = siteHeader || errorHeader;
  if (!oldHeader) throw new Error(`${path.relative(ROOT, file)}: missing site header`);
  const center = oldHeader[0].match(/<(?:div|span)\b[^>]*class="[^"]*(?:site-header-center|error-header-center)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|span)>/i)?.[1]?.trim() || '';
  html = html.replace(oldHeader[0], header(center, active));

  const existingFooter = html.match(/<footer\b[\s\S]*?<\/footer>/i);
  if (existingFooter) html = html.replace(existingFooter[0], footer());
  else html = html.replace('</body>', `${footer()}\n</body>`);

  html = injectNavigationStylesheet(html);
  return html;
}

const files = walk(ROOT);
const changed = [];
const errors = [];

for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const source = fs.readFileSync(file, 'utf8');
  let next;
  try { next = transform(file, source); }
  catch (error) { errors.push(error.message); continue; }

  const headerMatch = next.match(/<header\b[^>]*class="[^"]*\bsite-header\b[^"]*"[^>]*>[\s\S]*?<\/header>/i)?.[0] || '';
  const footerMatch = next.match(/<footer\b[\s\S]*?<\/footer>/i)?.[0] || '';
  for (const label of ['Today', 'Archive', 'Culture', 'Dictionary', 'Dispatch']) {
    if (!headerMatch.includes(`>${label}</a>`)) errors.push(`${rel}: primary navigation is missing ${label}`);
  }
  for (const label of ['What is foidslop?', 'Recipes', 'Dictionary', 'Culture', 'Pinterest', 'RSS', 'About', 'Privacy']) {
    if (!footerMatch.includes(`>${label}</a>`)) errors.push(`${rel}: footer navigation is missing ${label}`);
  }
  if (!/id="nav-hamburger"/.test(headerMatch) || !/id="nav-dropdown"/.test(headerMatch)) errors.push(`${rel}: mobile navigation controls are missing`);
  if (/culture\/is-it-foidslop\?item=/.test(next)) errors.push(`${rel}: stale Slop Trial query navigation remains`);
  if (/<a\b[^>]*href="[^"]+\.html(?:[?#][^"]*)?"/i.test(next)) errors.push(`${rel}: internal .html navigation remains`);
  if (!next.includes('/css/navigation.css')) errors.push(`${rel}: navigation stylesheet is missing`);
  if (source !== next) {
    changed.push(rel);
    if (!CHECK_ONLY) fs.writeFileSync(file, next);
  }
}

if (errors.length) {
  console.error(`Navigation validation failed with ${errors.length} issue(s):`);
  errors.slice(0, 100).forEach(error => console.error(`- ${error}`));
  process.exit(1);
}
if (CHECK_ONLY && changed.length) {
  console.error(`Navigation is out of sync on ${changed.length} page(s):`);
  changed.slice(0, 100).forEach(file => console.error(`- ${file}`));
  process.exit(1);
}
console.log(`${CHECK_ONLY ? 'Validated' : 'Synchronized'} navigation across ${files.length} HTML pages${changed.length ? ` (${changed.length} updated)` : ''}. Current Today route: /slop/${current.slug}.`);
