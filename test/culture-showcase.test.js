const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('username generator renders as a flagship handle lab', () => {
  const html = fs.readFileSync('culture/username-generator.html', 'utf8');
  assert.match(html, /username-lab-page/);
  assert.equal((html.match(/data-username-tab=/g) || []).length, 6);
  assert.equal((html.match(/data-username-variant/g) || []).length, 3);
  assert.match(html, /culture-showcase\.css/);
  assert.match(html, /username-generator\.js/);
});

test('foidslop pillar renders as the flagship primer', () => {
  const html = fs.readFileSync('what-is-foidslop.html', 'utf8');
  assert.match(html, /foidslop-primer/);
  assert.match(html, /FOID<\/span><b>\+<\/b><span>SLOP/);
  assert.equal((html.match(/foidslop-category-card/g) || []).length, 4);
  assert.match(html, /culture\/receipts\/foid-r9k-2018\.webp/);
  assert.match(html, /culture\/receipts\/girl-dinner-2023\.webp/);
  assert.match(html, /culture-showcase\.css/);
});
