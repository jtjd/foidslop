const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const db = JSON.parse(fs.readFileSync(path.join(root, 'data', 'foidslop-meals.json'), 'utf8'));
const config = JSON.parse(fs.readFileSync(path.join(root, 'data', 'recipe-copy-overrides.json'), 'utf8'));
const mealsBySlug = new Map(db.meals.map(meal => [meal.slug, meal]));
const allowedFields = new Set(['headnote', 'substitutions', 'storage', 'seoTitle', 'seoDescription', 'notes']);

test('editorial overrides only target real recipes and supported fields', () => {
  assert.match(config.revisionDate, /^\d{4}-\d{2}-\d{2}$/);
  for (const [slug, override] of Object.entries(config.entries || {})) {
    assert.ok(mealsBySlug.has(slug), `unknown override recipe: ${slug}`);
    assert.ok(Object.keys(override).length > 0, `empty override: ${slug}`);
    for (const [field, value] of Object.entries(override)) {
      assert.ok(allowedFields.has(field), `unsupported field ${field} on ${slug}`);
      assert.equal(typeof value, 'string');
      assert.ok(value.trim().length >= 60, `thin ${field} override on ${slug}`);
      assert.ok(!value.includes('—'), `em dash in ${field} override on ${slug}`);
    }
  }
});

test('known semantic offenders have curated replacements', () => {
  const zucchini = config.entries['zucchini-noodles-pesto'];
  assert.ok(zucchini);
  assert.doesNotMatch(zucchini.headnote, /pasta water|finish in the sauce/i);
  assert.doesNotMatch(zucchini.substitutions, /short pasta shapes|pecorino.*same role/i);

  const skewers = config.entries['antipasto-skewers'];
  assert.ok(skewers);
  assert.doesNotMatch(skewers.headnote, /give .* heat|cook|reheat/i);
});

test('curated overrides stay recipe-specific', () => {
  for (const [slug, override] of Object.entries(config.entries || {})) {
    const meal = mealsBySlug.get(slug);
    const haystack = Object.values(override).join(' ').toLowerCase();
    const ingredientWords = (meal.ingredients || [])
      .flatMap(item => String(item.name || '').toLowerCase().split(/[^a-z]+/))
      .filter(word => word.length >= 5);
    assert.ok(ingredientWords.some(word => haystack.includes(word)), `override for ${slug} does not mention a recipe ingredient`);
  }
});
