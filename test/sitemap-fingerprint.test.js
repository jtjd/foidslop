const test = require('node:test');
const assert = require('node:assert');
const { sitemapFingerprint } = require('../scripts/lib/sitemap-fingerprint');

test('sitemap fingerprint ignores volatile site chrome', () => {
  const first = '<body><header>Issue 118</header><main><h1>Guide</h1></main><footer>2026</footer></body>';
  const next = '<body><header>Issue 119</header><main><h1>Guide</h1></main><footer>2027</footer></body>';
  assert.equal(sitemapFingerprint(first), sitemapFingerprint(next));
});

test('sitemap fingerprint changes with substantive page content', () => {
  const first = '<body><main><h1>Guide</h1><p>Six recipes.</p></main></body>';
  const next = '<body><main><h1>Guide</h1><p>Seven recipes.</p></main></body>';
  assert.notEqual(sitemapFingerprint(first), sitemapFingerprint(next));
});
