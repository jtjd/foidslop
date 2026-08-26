const test = require('node:test');
const assert = require('node:assert');
const { KEY, HOST, HOSTNAME, selectUpdatedUrls, pingPayload } = require('../scripts/lib/ping-config');

const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${HOST}/</loc><lastmod>2026-08-25</lastmod></url>
<url><loc>${HOST}/slop/baked-feta-pasta</loc><lastmod>2026-08-26</lastmod></url>
<url><loc>${HOST}/soup-for-one</loc><lastmod>2026-08-26</lastmod></url>
<url><loc>${HOST}/slop/old-recipe</loc><lastmod>2026-01-01</lastmod></url>
</urlset>`;

test('IndexNow key is a deployable 32-hex key with matching host metadata', () => {
  assert.match(KEY, /^[a-f0-9]{32}$/);
  assert.equal(HOSTNAME, new URL(HOST).hostname);
});

test('selectUpdatedUrls keeps the homepage plus URLs changed since the cutoff date', () => {
  const urls = selectUpdatedUrls(SITEMAP, '2026-08-26');
  assert.ok(urls.includes(`${HOST}/`));
  assert.ok(urls.includes(`${HOST}/slop/baked-feta-pasta`));
  assert.ok(urls.includes(`${HOST}/soup-for-one`));
  assert.ok(!urls.includes(`${HOST}/slop/old-recipe`));
});

test('pingPayload follows the IndexNow JSON contract', () => {
  const urls = [`${HOST}/`, `${HOST}/slop/baked-feta-pasta`];
  assert.deepEqual(pingPayload(urls), {
    host: HOSTNAME,
    key: KEY,
    keyLocation: `${HOST}/${KEY}.txt`,
    urlList: urls
  });
});
