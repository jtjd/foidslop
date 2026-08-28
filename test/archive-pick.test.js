const test = require('node:test');
const assert = require('node:assert');
const { chooseArchivePick, RECENT_COUNT } = require('../scripts/lib/archive-pick');

const meals = Array.from({ length: 20 }, (_, index) => ({ id: index + 1, slug: `meal-${index + 1}` }));

test('daily filing-cabinet rotation changes while excluding recent issues', () => {
  const first = chooseArchivePick(meals, '2026-08-27', 'daily');
  const next = chooseArchivePick(meals, '2026-08-28', 'daily');
  const recent = new Set(meals.slice(-RECENT_COUNT).map(meal => meal.slug));
  assert.notEqual(first.slug, next.slug);
  assert.equal(recent.has(first.slug), false);
  assert.equal(recent.has(next.slug), false);
});

test('weekly filing-cabinet rotation stays stable within a week', () => {
  const first = chooseArchivePick(meals, '2026-08-27', 'weekly');
  const sameWeek = chooseArchivePick(meals, '2026-08-28', 'weekly');
  const nextWeek = chooseArchivePick(meals, '2026-09-03', 'weekly');
  assert.equal(first.slug, sameWeek.slug);
  assert.notEqual(first.slug, nextWeek.slug);
});
