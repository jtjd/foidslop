#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { buildSubstitutions, buildStorage, buildHeadnote } = require('./lib/recipe-extras');

const ROOT = process.cwd();
const DB_FILE = path.join(ROOT, 'data', 'foidslop-meals.json');
const OVERRIDES_FILE = path.join(ROOT, 'data', 'recipe-copy-overrides.json');
const checkOnly = process.argv.includes('--check');

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const config = JSON.parse(fs.readFileSync(OVERRIDES_FILE, 'utf8'));
const overrides = config.entries || {};
const allowedFields = new Set(['headnote', 'substitutions', 'storage', 'seoTitle', 'seoDescription', 'notes']);
const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());

const knownGeneric = /Whatever protein or hearty filling|Anything crunchy works for scooping|frozen versions cook directly|crisp or warm as intended/i;

function normalize(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function generatedEditorialCopy(meal, field) {
  if (field === 'headnote') return buildHeadnote(meal);
  if (field === 'substitutions') return buildSubstitutions(meal);
  if (field === 'storage') return buildStorage(meal);
  return '';
}

function shouldRemoveGeneratedCopy(meal, field, value) {
  const text = normalize(value);
  if (!text) return false;
  if (knownGeneric.test(text)) return true;
  // Category templates remain useful as drafting prompts, but exact generator
  // output is not publish-ready editorial copy. Omit it rather than swapping
  // one deterministic filler paragraph for another.
  return text === normalize(generatedEditorialCopy(meal, field));
}

let changedMeals = 0;
let removedFields = 0;
let appliedOverrides = 0;

for (const meal of db.meals || []) {
  if (meal.status === 'retired') continue;
  let touched = false;
  const override = overrides[meal.slug];

  if (override) {
    for (const [field, value] of Object.entries(override)) {
      if (!allowedFields.has(field)) throw new Error(`Unsupported override field ${field} for ${meal.slug}`);
      if (typeof value !== 'string' || !value.trim()) throw new Error(`Empty override field ${field} for ${meal.slug}`);
      if (meal[field] !== value.trim()) {
        meal[field] = value.trim();
        touched = true;
        appliedOverrides += 1;
      }
    }
  }

  for (const field of ['headnote', 'substitutions', 'storage']) {
    if (override && Object.hasOwn(override, field)) continue;
    if (shouldRemoveGeneratedCopy(meal, field, meal[field])) {
      delete meal[field];
      touched = true;
      removedFields += 1;
    }
  }

  if (touched) {
    if (meal.status === 'published') meal.dateModified = config.revisionDate || today;
    changedMeals += 1;
  }
}

if (checkOnly) {
  console.log(`${changedMeals} meal(s) need editorial remediation (${appliedOverrides} override field(s), ${removedFields} generated field(s)).`);
  process.exit(changedMeals ? 1 : 0);
}

fs.writeFileSync(DB_FILE, `${JSON.stringify(db, null, 2)}\n`);
console.log(`Editorial remediation updated ${changedMeals} meal(s): ${appliedOverrides} curated field(s) applied, ${removedFields} generated field(s) removed.`);
