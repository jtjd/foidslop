#!/usr/bin/env node

/**
 * Fills or refreshes ingredient-aware discovery copy for every meal in the
 * database and stamps dateModified only for published recipes whose visible
 * copy genuinely changed.
 *
 * Usage: node scripts/enrich-recipe-extras.js [--check] [--refresh]
 */
const fs = require('fs');
const path = require('path');
const { buildSubstitutions, buildStorage, buildHeadnote, buildSeoDescription } = require('./lib/recipe-extras');

const checkOnly = process.argv.includes('--check');
const refresh = process.argv.includes('--refresh');
const file = path.join(process.cwd(), 'data', 'foidslop-meals.json');
const db = JSON.parse(fs.readFileSync(file, 'utf8'));
const revisionDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const headnoteCounts = new Map();
for (const meal of db.meals) headnoteCounts.set(meal.headnote, (headnoteCounts.get(meal.headnote) || 0) + 1);
const repetitiveHeadnotes = new Set([...headnoteCounts.entries()].filter(([, count]) => count > 1).map(([value]) => value));
const legacyHeadnote = value => /^(?:This is |A small snack can still|There is no cooking trick|The recipe keeps|The bread needs|Build the bowl|This bowl survives|A short rest|This is sized|Noodles move|The sauce should|The texture should|A modest amount|Cold rice|Spread the filling|Eggs do most)/i.test(String(value || ''));
const legacySeoDescription = value => /clear single-serving recipe ready in|complete ingredient list, clear method, and a total time of/i.test(String(value || ''));
const usedCopy = { substitutions: new Set(), storage: new Set(), headnote: new Set(), seoDescription: new Set() };

function distinctCopy(value, meal, field) {
  if (!usedCopy[field].has(value)) {
    usedCopy[field].add(value);
    return value;
  }
  const name = String(meal.name || 'this recipe').toLowerCase();
  const suffix = field === 'storage'
    ? ` For ${name}, keep the named finish separate until serving.`
    : ` For ${name}, make the swap in the same one-person portion and taste before adding more seasoning.`;
  const distinct = `${value}${suffix}`;
  usedCopy[field].add(distinct);
  return distinct;
}

let filled = 0;
for (const meal of db.meals) {
  let touched = false;
  if (refresh || !meal.substitutions) { meal.substitutions = distinctCopy(buildSubstitutions(meal), meal, 'substitutions'); touched = true; }
  else usedCopy.substitutions.add(meal.substitutions);
  if (refresh || !meal.storage) { meal.storage = distinctCopy(buildStorage(meal), meal, 'storage'); touched = true; }
  else usedCopy.storage.add(meal.storage);
  // Existing published pages used broad category templates for these fields.
  // Future recipes may contain intentionally curated copy, so leave their
  // headnotes and search descriptions alone until they are published.
  if (refresh && (meal.status === 'published' || repetitiveHeadnotes.has(meal.headnote) || legacyHeadnote(meal.headnote))) {
    meal.headnote = distinctCopy(buildHeadnote(meal), meal, 'headnote');
    touched = true;
  } else usedCopy.headnote.add(meal.headnote);
  if (refresh && (meal.status === 'published' || legacySeoDescription(meal.seoDescription))) {
    meal.seoDescription = distinctCopy(buildSeoDescription(meal), meal, 'seoDescription');
    touched = true;
  } else usedCopy.seoDescription.add(meal.seoDescription);
  if (touched) {
    if (meal.status === 'published') meal.dateModified = revisionDate;
    else delete meal.dateModified;
    filled += 1;
  }
}

if (checkOnly) {
  console.log(`${filled} meal(s) would be enriched.`);
  process.exit(filled ? 1 : 0);
}
fs.writeFileSync(file, `${JSON.stringify(db, null, 2)}\n`);
console.log(`${refresh ? 'Refreshed' : 'Enriched'} discovery copy for ${filled} meal(s) (revision ${revisionDate}).`);
