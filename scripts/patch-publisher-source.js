#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'scripts', 'daily-publish.js');
let source = fs.readFileSync(file, 'utf8');
let changed = false;

function replaceOnce(before, after, label) {
  if (source.includes(after)) return;
  if (!source.includes(before)) throw new Error(`Could not locate ${label}`);
  source = source.replace(before, after);
  changed = true;
}

replaceOnce(
  `    for (const meal of meals.filter(item => item.status !== 'retired')) {\n      if (!seen.has(meal[field])) seen.set(meal[field], []);\n      seen.get(meal[field]).push(meal.slug);\n    }`,
  `    for (const meal of meals.filter(item => item.status !== 'retired')) {\n      if (!meal[field]) continue;\n      if (!seen.has(meal[field])) seen.set(meal[field], []);\n      seen.get(meal[field]).push(meal.slug);\n    }`,
  'discovery-copy duplicate validation block'
);

replaceOnce(
  '    totalTime: `PT${total}M`, recipeYield: meal.serves,',
  '    totalTime: `PT${total}M`, recipeYield: `${meal.serves} serving${String(meal.serves) === \'1\' ? \'\' : \'s\'}`,',
  'Recipe recipeYield assignment'
);

replaceOnce(
  '    if (!meal.name || !meal.slug || !meal.description || !meal.headnote || !meal.seoTitle || !meal.seoDescription) errors.push(`Missing required content for meal ${meal.id}`);',
  '    if (!meal.name || !meal.slug || !meal.description || !meal.seoTitle || !meal.seoDescription) errors.push(`Missing required content for meal ${meal.id}`);',
  'required recipe content validation'
);

replaceOnce(
  "  return [meal.name, meal.description, meal.headnote, meal.category, meal.cuisine, ...meal.tags, ...meal.ingredients.map(item => item.name)].join(' ').toLowerCase();",
  "  return [meal.name, meal.description, meal.headnote || '', meal.category, meal.cuisine, ...meal.tags, ...meal.ingredients.map(item => item.name)].join(' ').toLowerCase();",
  'archive search headnote handling'
);

const renderBefore = '<p class="slop-desc">${esc(meal.description)}</p><p class="slop-headnote">${esc(meal.headnote)}</p>${editorialSection}<p class="section-label">At a Glance</p>';
const renderAfter = '<p class="slop-desc">${esc(meal.description)}</p>${meal.headnote ? `<p class="slop-headnote">${esc(meal.headnote)}</p>` : \'\'}${editorialSection}<p class="section-label">At a Glance</p>';
replaceOnce(renderBefore, renderAfter, 'recipe headnote rendering');

if (changed) fs.writeFileSync(file, source);
console.log(changed ? 'Patched publisher source.' : 'Publisher source already patched.');
