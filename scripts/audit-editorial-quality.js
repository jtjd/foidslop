#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { buildSubstitutions, buildStorage, buildHeadnote, buildSeoDescription } = require('./lib/recipe-extras');

const ROOT = process.cwd();
const DB_FILE = path.join(ROOT, 'data', 'foidslop-meals.json');
const OVERRIDES_FILE = path.join(ROOT, 'data', 'recipe-copy-overrides.json');
const PUBLISHED_OVERRIDES_FILE = path.join(ROOT, 'data', 'published-recipe-copy-overrides.json');
const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const config = JSON.parse(fs.readFileSync(OVERRIDES_FILE, 'utf8'));
const publishedConfig = JSON.parse(fs.readFileSync(PUBLISHED_OVERRIDES_FILE, 'utf8'));
const overrides = {
  ...(config.entries || {}),
  ...(publishedConfig.entries || {})
};
const publishedOverrides = Object.fromEntries(
  (db.meals || [])
    .filter(meal => meal.status === 'published' && overrides[meal.slug])
    .map(meal => [meal.slug, overrides[meal.slug]])
);

const badPastaSwap = /^Different short pasta shapes swap freely here\. No ([^?]+)\? Pecorino, asiago, or extra-black-pepper parmesan covers the same role in the sauce\.$/;
const suspiciousHeadnote = /\b(save some cooking water|save a little cooking water|finish in the sauce|brown or bloom|give .* enough heat or seasoning|cook the filling until hot)\b/i;
const genericDiscovery = /Whatever protein or hearty filling|Anything crunchy works for scooping|frozen versions cook directly|crisp or warm as intended|Protein here is a suggestion|Swap .* freely and let the sauce and timing lead/i;
const brokenEnding = /\b(?:a|an|and|for|from|in|of|the|to|with)\.$/i;

function normalize(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

const findings = [];
const seoTemplateInfo = [];
function add(meal, field, reason, severity = 'review') {
  findings.push({ id: meal.id, slug: meal.slug, status: meal.status, field, reason, severity, value: normalize(meal[field]) });
}

for (const meal of db.meals || []) {
  if (meal.status === 'retired') continue;
  const override = overrides[meal.slug] || {};
  const generatedBody = {
    headnote: buildHeadnote(meal),
    substitutions: buildSubstitutions(meal),
    storage: buildStorage(meal)
  };

  if (meal.status === 'published') {
    const bespoke = publishedOverrides[meal.slug];
    if (!bespoke) add(meal, 'discovery', 'published recipe is missing its bespoke editorial override', 'error');
    else {
      if (!normalize(bespoke.headnote)) add(meal, 'headnote', 'published recipe is missing a bespoke headnote', 'error');
      if (!normalize(bespoke.substitutions) && !normalize(bespoke.storage)) {
        add(meal, 'discovery', 'published recipe has no bespoke supplemental editorial guidance', 'error');
      }
    }
  }

  for (const [field, generated] of Object.entries(generatedBody)) {
    if (normalize(meal[field]) && normalize(meal[field]) === normalize(generated)) {
      add(meal, field, 'exact category-template body copy remains after remediation', 'error');
    }
  }

  if (badPastaSwap.test(normalize(meal.substitutions)) && !override.substitutions) {
    add(meal, 'substitutions', 'pasta swap proposes hard cheese as a replacement for an unrelated ingredient', 'error');
  }
  if (suspiciousHeadnote.test(normalize(meal.headnote)) && !override.headnote) {
    add(meal, 'headnote', 'headnote contains a known category-template technique phrase that may not fit the recipe', 'review');
  }
  if (genericDiscovery.test([meal.headnote, meal.substitutions, meal.storage].map(normalize).join(' '))) {
    add(meal, 'discovery', 'known generic discovery-copy phrase', 'error');
  }

  const seo = normalize(meal.seoDescription);
  if (seo && seo === normalize(buildSeoDescription(meal))) seoTemplateInfo.push(meal.slug);
  if (seo && brokenEnding.test(seo)) add(meal, 'seoDescription', 'SEO description appears truncated mid-sentence', 'error');
}

const published = findings.filter(item => item.status === 'published');
const scheduled = findings.filter(item => item.status === 'scheduled');
const errors = findings.filter(item => item.severity === 'error');
const counts = findings.reduce((out, item) => {
  const key = `${item.status}:${item.severity}:${item.field}`;
  out[key] = (out[key] || 0) + 1;
  return out;
}, {});

console.log(`Editorial quality audit: ${published.length} published actionable finding(s), ${scheduled.length} scheduled actionable finding(s).`);
console.log(`Bespoke published coverage: ${Object.keys(publishedOverrides).length}/${(db.meals || []).filter(item => item.status === 'published').length}.`);
console.log(`SEO descriptions still using the deterministic description helper: ${seoTemplateInfo.length} (informational; descriptions remain required).`);
console.log('Counts:', JSON.stringify(counts, null, 2));
if (published.length) {
  console.log('\nPUBLISHED FINDINGS');
  for (const item of published) console.log(JSON.stringify(item));
}
if (scheduled.length) {
  console.log('\nSCHEDULED FINDINGS');
  for (const item of scheduled) console.log(JSON.stringify(item));
}
if (errors.length) process.exitCode = 1;
