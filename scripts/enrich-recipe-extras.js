#!/usr/bin/env node

/**
 * Fills missing substitutions/storage copy for every meal in the database and
 * stamps dateModified so freshness signals reflect the genuine content change.
 * Idempotent: fields are never overwritten once present.
 *
 * Usage: node scripts/enrich-recipe-extras.js [--check]
 */
const fs = require('fs');
const path = require('path');
const { buildSubstitutions, buildStorage } = require('./lib/recipe-extras');

const checkOnly = process.argv.includes('--check');
const file = path.join(process.cwd(), 'data', 'foidslop-meals.json');
const db = JSON.parse(fs.readFileSync(file, 'utf8'));
const revisionDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

let filled = 0;
for (const meal of db.meals) {
  let touched = false;
  if (!meal.substitutions) { meal.substitutions = buildSubstitutions(meal); touched = true; }
  if (!meal.storage) { meal.storage = buildStorage(meal); touched = true; }
  if (touched) {
    meal.dateModified = revisionDate;
    filled += 1;
  }
}

if (checkOnly) {
  console.log(`${filled} meal(s) would be enriched.`);
  process.exit(filled ? 1 : 0);
}
fs.writeFileSync(file, `${JSON.stringify(db, null, 2)}\n`);
console.log(`Enriched ${filled} meal(s) with swaps and storage copy (revision ${revisionDate}).`);
