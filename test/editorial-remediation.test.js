const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const db = JSON.parse(fs.readFileSync(path.join(root, 'data', 'foidslop-meals.json'), 'utf8'));
const config = JSON.parse(fs.readFileSync(path.join(root, 'data', 'recipe-copy-overrides.json'), 'utf8'));
const publishedConfig = JSON.parse(fs.readFileSync(path.join(root, 'data', 'published-recipe-copy-overrides.json'), 'utf8'));
const mealsBySlug = new Map(db.meals.map(meal => [meal.slug, meal]));
const allowedFields = new Set(['headnote', 'substitutions', 'storage', 'seoTitle', 'seoDescription', 'notes']);
const mergedEntries = {
  ...(config.entries || {}),
  ...(publishedConfig.entries || {})
};

function validateConfig(source) {
  assert.match(source.revisionDate, /^\d{4}-\d{2}-\d{2}$/);
  for (const [slug, override] of Object.entries(source.entries || {})) {
    assert.ok(mealsBySlug.has(slug), `unknown override recipe: ${slug}`);
    assert.ok(Object.keys(override).length > 0, `empty override: ${slug}`);
    for (const [field, value] of Object.entries(override)) {
      assert.ok(allowedFields.has(field), `unsupported field ${field} on ${slug}`);
      assert.equal(typeof value, 'string');
      assert.ok(value.trim().length >= 60, `thin ${field} override on ${slug}`);
      assert.ok(!value.includes('—'), `em dash in ${field} override on ${slug}`);
      assert.doesNotMatch(value, /Protein here is a suggestion|Swap .* freely and let the sauce and timing lead/i, `legacy boilerplate in ${field} on ${slug}`);
    }
  }
}

test('editorial overrides only target real recipes and supported fields', () => {
  validateConfig(config);
  validateConfig(publishedConfig);
});

test('every published recipe has bespoke editorial coverage', () => {
  const published = db.meals.filter(meal => meal.status === 'published');
  const covered = published.filter(meal => mergedEntries[meal.slug]);
  assert.equal(covered.length, published.length, 'every published recipe must have bespoke editorial coverage in the merged override source');

  for (const meal of published) {
    const override = mergedEntries[meal.slug];
    assert.ok(override, `missing bespoke copy for ${meal.slug}`);
    assert.ok(override.headnote && override.headnote.trim().length >= 60, `missing/thin bespoke headnote for ${meal.slug}`);
    assert.ok(override.substitutions || override.storage, `missing useful supplemental copy for ${meal.slug}`);
  }
});

test('known semantic offenders have curated replacements', () => {
  const zucchini = mergedEntries['zucchini-noodles-pesto'];
  assert.ok(zucchini);
  assert.doesNotMatch(zucchini.headnote, /pasta water|finish in the sauce/i);
  assert.doesNotMatch(zucchini.substitutions, /short pasta shapes|pecorino.*same role/i);

  const skewers = mergedEntries['antipasto-skewers'];
  assert.ok(skewers);
  assert.doesNotMatch(skewers.headnote, /give .* heat|cook|reheat/i);

  for (const slug of ['classic-cheese-quesadilla', 'loaded-sweet-potato-black-beans', 'stuffed-bell-pepper-rice-feta', 'honey-garlic-butter-shrimp', 'tuna-melt-pita', 'brie-prosciutto-grilled-cheese']) {
    const override = mergedEntries[slug];
    assert.ok(override, `missing replacement for ${slug}`);
    assert.doesNotMatch(Object.values(override).join(' '), /Protein here is a suggestion|let the sauce and timing lead/i);
  }
});

test('curated overrides stay recipe-specific', () => {
  for (const [slug, override] of Object.entries(mergedEntries)) {
    const meal = mealsBySlug.get(slug);
    const haystack = Object.values(override).join(' ').toLowerCase();
    const ingredientWords = (meal.ingredients || [])
      .flatMap(item => String(item.name || '').toLowerCase().split(/[^a-z]+/))
      .filter(word => word.length >= 5);
    assert.ok(ingredientWords.some(word => haystack.includes(word)), `override for ${slug} does not mention a recipe ingredient`);
  }
});
