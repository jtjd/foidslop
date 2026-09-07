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
  /emotional accounting department/i
];

test('Slop Trial defaults to a sourced current-events pool', () => {
  const current = trials.items.filter(item => item.kind === 'current');
  assert.ok(current.length >= 8);
  for (const item of current) {
    assert.match(item.sourceUrl, /^https:\/\//);
    assert.ok(item.whyNow.length >= 25);
    assert.match(item.activeFrom, /^2026-/);
    assert.match(item.activeUntil, /^2026-/);
  }
});

test('Slop Trial copy stays direct instead of fake-clever', () => {
  const text = JSON.stringify(trials) + page + script;
  for (const pattern of cheesy) assert.doesNotMatch(text, pattern);
  assert.match(page, /Vote on what is making the rounds right now/);
  assert.match(page, /Why now/);
  assert.match(page, /Current picks/);
});

test('Slop Trial page has a compact topical layout', () => {
  assert.match(page, /slop-trial-modes/);
  assert.match(page, /slop-trial-main/);
  assert.match(page, /slop-trial-meter/);
  assert.match(page, /data-trial-source/);
  assert.match(script, /const isCurrent/);
  assert.match(script, /dailyPick/);
});

