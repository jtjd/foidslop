#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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

const hardCheese = /\b(parmesan|pecorino|asiago|romano)\b/i;
const generatedPastaSwap = /^Different short pasta shapes swap freely here\. No ([^?]+)\? Pecorino, asiago, or extra-black-pepper parmesan covers the same role in the sauce\.$/;
const noCookHeatLanguage = /\b(reheat|reheated|warm(?:ing|ed)?|cook(?:ed|ing)?|brown(?:ed|ing)?|simmer(?:ed|ing)?|roast(?:ed|ing)?|heat)\b/i;
const knownGeneric = /Whatever protein or hearty filling|Anything crunchy works for scooping|frozen versions cook directly|crisp or warm as intended/i;

function isNoCook(meal) {
  return /^0\s*m?$/i.test(String(meal.cook || '').trim()) || (meal.tags || []).some(tag => /^no cook$/i.test(String(tag)));
}

function isClearlyBadGeneratedPastaSwap(value) {
  const match = String(value || '').match(generatedPastaSwap);
  if (!match) return false;
  return !hardCheese.test(match[1]);
}

function shouldRemoveOptionalCopy(meal, field, value) {
  const text = String(value || '').trim();
  if (!text) return false;
  if (knownGeneric.test(text)) return true;
  if (field === 'substitutions' && isClearlyBadGeneratedPastaSwap(text)) return true;
  if (field === 'storage' && isNoCook(meal) && noCookHeatLanguage.test(text)) return true;
  return false;
}

let changedMeals = 0;
let removedFields = 0;
let appliedOverrides = 0;

for (const meal of db.meals || []) {
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

  for (const field of ['substitutions', 'storage']) {
    if (override && Object.hasOwn(override, field)) continue;
    if (shouldRemoveOptionalCopy(meal, field, meal[field])) {
      delete meal[field];
      touched = true;
      removedFields += 1;
    }
  }

  if (isNoCook(meal) && noCookHeatLanguage.test(String(meal.headnote || '')) && !(override && override.headnote)) {
    // Headnotes are required by the publisher, so do not silently replace them with
    // more generated prose. Fail instead: this recipe needs an intentional edit.
    throw new Error(`No-cook recipe has heat/cooking language in headnote: ${meal.slug}`);
  }

  if (touched) {
    if (meal.status === 'published') meal.dateModified = config.revisionDate || today;
    changedMeals += 1;
  }
}

if (checkOnly) {
  console.log(`${changedMeals} meal(s) need editorial remediation (${appliedOverrides} override field(s), ${removedFields} bad optional field(s)).`);
  process.exit(changedMeals ? 1 : 0);
}

fs.writeFileSync(DB_FILE, `${JSON.stringify(db, null, 2)}\n`);
console.log(`Editorial remediation updated ${changedMeals} meal(s): ${appliedOverrides} curated field(s) applied, ${removedFields} bad optional field(s) removed.`);
