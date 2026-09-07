const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const culture = JSON.parse(fs.readFileSync('data/culture-articles.json', 'utf8'));
const products = fs.readFileSync('scripts/publish-culture-products.js', 'utf8');
const theme = fs.readFileSync('css/theme.css', 'utf8');
const css = fs.readFileSync('css/culture.css', 'utf8');
const showcase = fs.readFileSync('css/culture-showcase.css', 'utf8');
test('username article has no unrelated portrait receipt', () => {
  const article = culture.articles.find(item => item.slug === 'foidslop-usernames');
  assert.ok(article); assert.equal((article.evidence || []).length, 0);
  assert.ok(article.sources.some(source => source.url.includes('reddit.com')));
});
test('Slop Trial uses the compact topical layout', () => {
  assert.match(products, /slop-trial-page/);
  assert.match(products, /slop-trial-main/);
  assert.match(products, /slop-trial-why/);
  assert.match(products, /slop-trial-on-deck/);
  assert.match(showcase, /grid-template-columns:minmax\(0,1\.35fr\) minmax\(300px,\.65fr\)/);
});
test('article titles and receipts have explicit caps', () => {
  assert.match(theme, /culture-article:not\(\.foidslop-primer\) > h1/);
  assert.match(theme, /max-width: 1040px/);
  assert.match(css, /max-height: 620px/);
  assert.match(css, /width: auto/);
});
test('mid-width header removes decorative center copy', () => {
  assert.match(theme, /min-width: 801px\) and \(max-width: 1180px/);
  assert.match(theme, /site-header-center \{ display: none; \}/);
});
