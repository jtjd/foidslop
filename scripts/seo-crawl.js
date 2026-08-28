#!/usr/bin/env node

/**
 * Small production crawl with no third-party dependencies.
 *
 * It checks the sitemap pages, their canonical/indexability signals, every
 * internal anchor discovered on those pages, and every same-origin asset
 * referenced by the HTML. Use --base-url to crawl a preview deployment.
 */
const BASE_FLAG = process.argv.indexOf('--base-url');
const BASE = new URL(BASE_FLAG > -1 ? process.argv[BASE_FLAG + 1] : 'https://foidslop.com');
const PRODUCTION_ORIGIN = 'https://foidslop.com';
const ROOT_URL = `${BASE.origin}/`;
const SITEMAP_URL = new URL('/sitemap.xml', ROOT_URL).href;
const ROBOTS_URL = new URL('/robots.txt', ROOT_URL).href;
const errors = [];
const pages = new Map();
const resources = new Map();
const TIMEOUT_MS = 20000;
const CONCURRENCY = 10;

if (!BASE_FLAG || !process.argv[BASE_FLAG + 1]) {
  // The default is production, but normalise it here so URL resolution is
  // always rooted and never depends on a missing trailing slash.
}
BASE.pathname = '/';
BASE.search = '';
BASE.hash = '';

function addError(message) {
  errors.push(message);
}

function pageUrl(value, base = ROOT_URL) {
  let url = new URL(value, base);
  if (url.origin !== BASE.origin) {
    if (BASE.origin !== PRODUCTION_ORIGIN && url.origin === PRODUCTION_ORIGIN) {
      url = new URL(`${url.pathname}${url.search}`, ROOT_URL);
    } else return null;
  }
  url.hash = '';
  return url;
}

function canonicalMatches(url, canonical) {
  let actual;
  try { actual = new URL(canonical, url); } catch { return false; }
  const expected = new URL(url);
  if (BASE.origin === PRODUCTION_ORIGIN) return actual.href === expected.href;
  return actual.origin === PRODUCTION_ORIGIN
    && actual.pathname === expected.pathname
    && actual.search === expected.search
    && !actual.hash;
}

function addResource(value, source) {
  const url = pageUrl(value, source);
  if (!url) return;
  resources.set(url.href, source);
}

function extractAttributeRefs(html, attribute) {
  const refs = [];
  const pattern = new RegExp(`\\b${attribute}\\s*=\\s*["']([^"']+)["']`, 'gi');
  for (const match of html.matchAll(pattern)) refs.push(match[1]);
  return refs;
}

function parseSitemap(xml) {
  return [...xml.matchAll(/<url>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<\/url>/g)]
    .map(match => match[1].trim())
    .filter(Boolean);
}

function parseSitemapLastmods(xml) {
  return [...xml.matchAll(/<url>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<lastmod>([^<]+)<\/lastmod>[\s\S]*?<\/url>/g)]
    .map(match => ({ url: match[1].trim(), lastmod: match[2].trim() }));
}

async function fetchUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': 'foidslop-seo-monitor/1.0', accept: '*/*' },
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(url, label) {
  let response;
  try {
    response = await fetchUrl(url);
  } catch (error) {
    addError(`${label}: request failed (${error.message})`);
    return null;
  }
  if (!response.ok) {
    addError(`${label}: HTTP ${response.status}`);
    return null;
  }
  return response.text();
}

async function mapLimit(items, limit, worker) {
  const output = [];
  let cursor = 0;
  async function runner() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runner));
  return output;
}

async function checkPage(url) {
  let response;
  try {
    response = await fetchUrl(url);
  } catch (error) {
    addError(`${url}: request failed (${error.message})`);
    return;
  }
  if (!response.ok) {
    addError(`${url}: HTTP ${response.status}`);
    return;
  }
  const html = await response.text();
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) addError(`${url}: expected HTML, got ${contentType || 'unknown content type'}`);
  const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  if (!canonicalMatches(url, canonical)) addError(`${url}: canonical is ${canonical || '(missing)'}`);
  if (/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(html)) addError(`${url}: sitemap page is noindex`);

  pages.set(url, html);
  for (const href of extractAttributeRefs(html, 'href')) {
    const target = pageUrl(href, url);
    if (!target) continue;
    if (/\.html(?:$|[?#])/i.test(target.pathname)) addError(`${url}: internal link uses redirecting .html URL ${href}`);
    pages.set(target.href, pages.get(target.href) || null);
  }
  for (const src of extractAttributeRefs(html, 'src')) addResource(src, url);
  for (const srcset of extractAttributeRefs(html, 'srcset')) {
    for (const candidate of srcset.split(',').map(value => value.trim()).filter(Boolean)) addResource(candidate.split(/\s+/)[0], url);
  }
  for (const href of extractAttributeRefs(html, 'href')) addResource(href, url);
}

async function checkTarget(url, label) {
  let response;
  try {
    response = await fetchUrl(url);
  } catch (error) {
    addError(`${label}: request failed (${error.message})`);
    return;
  }
  if (!response.ok) addError(`${label}: HTTP ${response.status}`);
}

async function main() {
  const robots = await fetchText(ROBOTS_URL, ROBOTS_URL);
  const sitemapDeclarations = robots
    ? [...robots.matchAll(/^Sitemap:\s*(\S+)\s*$/gim)].map(match => match[1])
    : [];
  const acceptedSitemaps = [SITEMAP_URL];
  if (BASE.origin !== PRODUCTION_ORIGIN) acceptedSitemaps.push(`${PRODUCTION_ORIGIN}/sitemap.xml`);
  if (robots && !acceptedSitemaps.some(sitemapUrl => sitemapDeclarations.includes(sitemapUrl))) {
    addError(`${ROBOTS_URL}: missing sitemap declaration for ${SITEMAP_URL}`);
  }
  const sitemap = await fetchText(SITEMAP_URL, SITEMAP_URL);
  if (!sitemap) throw new Error('Unable to crawl sitemap.');
  const sitemapUrls = parseSitemap(sitemap);
  if (!sitemapUrls.length) addError(`${SITEMAP_URL}: contains no page URLs`);
  if (new Set(sitemapUrls).size !== sitemapUrls.length) addError(`${SITEMAP_URL}: contains duplicate page URLs`);
  for (const entry of parseSitemapLastmods(sitemap)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.lastmod) || Number.isNaN(new Date(`${entry.lastmod}T00:00:00Z`).getTime())) {
      addError(`${SITEMAP_URL}: invalid lastmod for ${entry.url}`);
    }
  }
  const localSitemapUrls = sitemapUrls.map(url => pageUrl(url)).filter(Boolean).map(url => url.href);
  if (localSitemapUrls.length !== sitemapUrls.length) addError(`${SITEMAP_URL}: contains a URL outside the crawl host`);

  await mapLimit(localSitemapUrls, CONCURRENCY, checkPage);
  const linkedPages = [...pages.entries()].filter(([, html]) => html === null).map(([url]) => url);
  await mapLimit(linkedPages, CONCURRENCY, async url => checkTarget(url, `Internal link ${url}`));
  await mapLimit([...resources.entries()], CONCURRENCY, async ([url, source]) => checkTarget(url, `Resource ${url} referenced by ${source}`));

  if (errors.length) {
    console.error(`SEO crawl failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):\n- ${errors.join('\n- ')}`);
    process.exit(1);
  }
  console.log(`SEO crawl passed: ${localSitemapUrls.length} sitemap pages, ${linkedPages.length} linked pages checked, ${resources.size} same-origin resources checked.`);
}

main().catch(error => {
  console.error(`SEO crawl failed: ${error.message}`);
  process.exit(1);
});

module.exports = { parseSitemap, parseSitemapLastmods };
