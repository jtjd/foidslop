const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const trials = JSON.parse(fs.readFileSync('data/slop-trials.json', 'utf8'));
const page = fs.readFileSync('culture/is-it-foidslop.html', 'utf8');
const script = fs.readFileSync('culture/slop-tools.js', 'utf8');

const cheesy = [
  /science advances/i,
  /community court/i,
  /launch specimens/i,
  /cast judgment/i,
  /jury remains corruptible/i,
  /historically significant anyway/i,
  /advanced yearning technology/i,
  /emotional accounting department/i,
  /expensive yearning/i,
  /very bad psychedelic night/i,
  /five minutes of actual gameplay/i,
  /relentless outfit discourse/i,
  /feed is quiet/i,
  /making the rounds/i
];

test('Slop Trial defaults to a sourced current-events pool with safe visuals', () => {
  const current = trials.items.filter(item => item.kind === 'current');
  assert.ok(current.length >= 8);
  for (const item of current) {
    assert.match(item.sourceUrl, /^https:\/\//);
    assert.ok(item.whyNow.length >= 25);
    assert.match(item.activeFrom, /^2026-/);
    assert.match(item.activeUntil, /^2026-/);
    assert.match(item.socialImage, /^\/culture\/trials\/social\/[a-z0-9-]+\.png$/);
    assert.ok(fs.existsSync(item.socialImage.replace(/^\//, '')), `missing ${item.socialImage}`);
    if (item.image) {
      assert.match(item.image, /^\/culture\/trials\/[a-z0-9-]+\.webp$/);
      assert.ok(item.imageAlt && item.imageAlt.length >= 20);
      assert.ok(fs.existsSync(item.image.replace(/^\//, '')), `missing ${item.image}`);
    }
  }
});

test('Slop Trial copy stays direct instead of fake-clever', () => {
  const text = JSON.stringify(trials) + page + script;
  for (const pattern of cheesy) assert.doesNotMatch(text, pattern);
  assert.match(page, /things from this week(?:&#39;|')s feed\. Vote yes or no\. See the split\./);
  assert.match(page, /Why now/);
  assert.match(page, /Closest calls/);
});

test('Slop Trial is image-led and uses button navigation', () => {
  assert.match(page, /data-trial-image/);
  assert.doesNotMatch(page, /data-trial-image-fallback/);
  assert.match(page, /data-trial-category="all"/);
  assert.match(page, /data-trial-progress/);
  assert.match(page, /data-trial-disputed/);
  assert.doesNotMatch(page, /<select[^>]*data-trial-filter/);
  assert.match(script, /navigator\.share/);
  assert.match(script, /loadAllResults/);
  assert.match(script, /updateProgress/);
  assert.match(script, /renderCategories/);
});
