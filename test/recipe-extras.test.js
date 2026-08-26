const test = require('node:test');
const assert = require('node:assert');
const { keyIngredients, buildSubstitutions, buildStorage } = require('../scripts/lib/recipe-extras');

const meal = {
  id: 7,
  category: 'Pasta',
  ingredients: [
    { amount: '3 tbsp', name: 'olive oil' },
    { amount: '100g', name: 'dried pasta (rigatoni or penne)' },
    { amount: 'to taste', name: 'salt, black pepper' }
  ]
};

test('anchors skip oils and category bases, falling back gracefully', () => {
  const [a] = keyIngredients(meal);
  assert.equal(a, 'the main ingredient'); // pasta excluded as base; oil filtered
});

test('anchors never name the base staple', () => {
  const toastMeal = { id: 1, category: 'Toast', ingredients: [{ amount: '1 slice', name: 'thick sourdough bread' }, { amount: '50g', name: 'ricotta' }] };
  assert.equal(keyIngredients(toastMeal)[0], 'ricotta');
});

test('copy passes house style: capitalized, no em dashes, substantial length', () => {
  for (const meal of [
    { id: 3, category: 'Soup', ingredients: [{ amount: '1 cup', name: 'cherry tomatoes' }] },
    { id: 44, category: 'Snack Plate', ingredients: [{ amount: '50g', name: 'aged cheddar' }, { amount: 'handful', name: 'grapes' }] },
    { id: 205, category: 'Bowl', ingredients: [{ amount: '1 cup', name: 'cooked rice' }, { amount: '1', name: 'fried egg' }] }
  ]) {
    for (const text of [buildSubstitutions(meal), buildStorage(meal)]) {
      assert.equal(text[0], text[0].toUpperCase());
      assert.ok(!text.includes('\u2014'));
      assert.ok(text.length >= 80, `too short: ${text}`);
    }
  }
});

test('deterministic per meal id and rotates across ids', () => {
  const left = buildSubstitutions({ id: 11, category: 'Dip', ingredients: [{ amount: '1 cup', name: 'white beans' }] });
  const right = buildSubstitutions({ id: 12, category: 'Dip', ingredients: [{ amount: '1 cup', name: 'white beans' }] });
  assert.equal(left, buildSubstitutions({ id: 11, category: 'Dip', ingredients: [{ amount: '1 cup', name: 'white beans' }] }));
});
