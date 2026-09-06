#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { buildSubstitutions, buildStorage, buildHeadnote, buildSeoDescription } = require('./lib/recipe-extras');

const ROOT = process.cwd();
const DB_FILE = path.join(ROOT, 'data', 'foidslop-meals.json');
const OVERRIDES_FILE = path.join(ROOT, 'data', 'recipe-copy-overrides.json');
const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const config = JSON.parse(fs.readFileSync(OVERRIDES_FILE, 'utf8'));
const overrides = config.entries || {};

const noCookHeatLanguage = /\b(reheat|reheated|warm(?:ing|ed)?|cook(?:ed|ing)?|brown(?:ed|ing)?|simmer(?:ed|ing)?|roast(?:ed|ing)?|heat)\b/i;
const badPastaSwap = /^Different short pasta shapes swap freely here\. No ([^?]+)\? Pecorino, asiago, or extra-black-pepper parmesan covers the same role in the sauce\.$/;
const suspiciousHeadnote = /\b(save some cooking water|save a little cooking water|finish in the sauce|brown or bloom|give .* enough heat or seasoning|cook the filling until hot|warm .* gently)\b/i;
const genericDiscovery = /Whatever protein or hearty filling|Anything crunchy works for scooping|frozen versions cook directly|crisp or warm as intended/i;

function isNoCook(meal) {
  return /^0\s*m?$/i.test(String(meal.cook || '').trim()) || (meal.tags || []).some(tag => /^no cook$/i.test(String(tag)));
}

function normalize(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

const findings = [];
function add(meal, field, reason, severity = 'review') {
  findings.push({ id: meal.id, slug: meal.slug, status: meal.status, field, reason, severity, value: normalize(meal[field]) });
}

for (const meal of db.meals || []) {
  if (meal.status === 'retired') continue;
  const override = overrides[meal.slug] || {};
  const generated = {
    headnote: buildHeadnote(meal),
    substitutions: buildSubstitutions(meal),
    storage: buildStorage(meal),
    seoDescription: buildSeoDescription(meal)
  };

  for (const field of Object.keys(generated)) {
    if (normalize(meal[field]) && normalize(meal[field]) === normalize(generated[field])) {
      add(meal, field, 'exact category-template output', field === 'headnote' ? 'review' : 'template');
    }
  }

  if (isNoCook(meal) && noCookHeatLanguage.test(normalize(meal.headnote)) && !override.headnote) {
    add(meal, 'headnote', 'no-cook recipe uses cooking/heat language without curated override', 'error');
  }
  if (isNoCook(meal) && noCookHeatLanguage.test(normalize(meal.storage)) && !override.storage) {
    add(meal, 'storage', 'no-cook recipe storage tells the reader to cook/reheat/warm', 'error');
  }
  if (badPastaSwap.test(normalize(meal.substitutions)) && !override.substitutions) {
    add(meal, 'substitutions', 'generated pasta swap proposes hard cheese as a replacement for an unrelated ingredient', 'error');
  }
  if (suspiciousHeadnote.test(normalize(meal.headnote)) && !override.headnote) {
    add(meal, 'headnote', 'headnote contains a known category-template technique phrase that may not fit the recipe', 'review');
  }
  if (genericDiscovery.test([meal.headnote, meal.substitutions, meal.storage].map(normalize).join(' '))) {
    add(meal, 'discovery', 'known generic discovery-copy phrase', 'error');
  }
}

const published = findings.filter(item => item.status === 'published');
const scheduled = findings.filter(item => item.status === 'scheduled');
const counts = findings.reduce((out, item) => {
  const key = `${item.status}:${item.severity}:${item.field}`;
  out[key] = (out[key] || 0) + 1;
  return out;
}, {});

console.log(`Editorial quality audit: ${published.length} published finding(s), ${scheduled.length} scheduled finding(s).`);
console.log('Counts:', JSON.stringify(counts, null, 2));
console.log('\nPUBLISHED FINDINGS');
for (const item of published) console.log(JSON.stringify(item));
console.log('\nSCHEDULED FINDINGS');
for (const item of scheduled) console.log(JSON.stringify(item));
