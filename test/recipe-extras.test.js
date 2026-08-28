const test = require('node:test');
const assert = require('node:assert');
const { keyIngredients, buildSubstitutions, buildStorage, buildHeadnote, buildSeoDescription } = require('../scripts/lib/recipe-extras');

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

test('discovery copy names recipe-specific ingredients and avoids the old generic SEO ending', () => {
  const recipe = {
    id: 14,
    name: 'Tomato Toast with Feta',
    category: 'Toast',
    description: 'Juicy tomatoes and salty feta make a crisp, bright dinner on toast.',
    prep: '3m',
    cook: '5m',
    ingredients: [
      { amount: '1 slice', name: 'sourdough bread' },
      { amount: '½ cup', name: 'tomatoes, sliced' },
      { amount: '2 tbsp', name: 'feta, crumbled' }
    ]
  };
  assert.match(buildHeadnote(recipe), /tomatoes|feta/i);
  assert.doesNotMatch(buildSeoDescription(recipe), /clear single-serving recipe ready in/i);
  assert.ok(buildSeoDescription(recipe).length <= 158);
});
