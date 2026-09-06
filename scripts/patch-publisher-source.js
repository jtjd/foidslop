#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function patchFile(relative, transforms) {
  const file = path.join(process.cwd(), relative);
  let source = fs.readFileSync(file, 'utf8');
  let changed = false;

  for (const { before, after, label } of transforms) {
    if (source.includes(after)) continue;
    if (!source.includes(before)) throw new Error(`Could not locate ${label} in ${relative}`);
    source = source.replace(before, after);
    changed = true;
  }

  if (changed) fs.writeFileSync(file, source);
  return changed;
}

const publisherChanged = patchFile('scripts/daily-publish.js', [
  {
    label: 'discovery-copy duplicate validation block',
    before: `    for (const meal of meals.filter(item => item.status !== 'retired')) {\n      if (!seen.has(meal[field])) seen.set(meal[field], []);\n      seen.get(meal[field]).push(meal.slug);\n    }`,
    after: `    for (const meal of meals.filter(item => item.status !== 'retired')) {\n      if (!meal[field]) continue;\n      if (!seen.has(meal[field])) seen.set(meal[field], []);\n      seen.get(meal[field]).push(meal.slug);\n    }`
  },
  {
    label: 'Recipe recipeYield assignment',
    before: '    totalTime: `PT${total}M`, recipeYield: meal.serves,',
    after: '    totalTime: `PT${total}M`, recipeYield: `${meal.serves} serving${String(meal.serves) === \'1\' ? \'\' : \'s\'}`,'
  },
  {
    label: 'required recipe content validation',
    before: '    if (!meal.name || !meal.slug || !meal.description || !meal.headnote || !meal.seoTitle || !meal.seoDescription) errors.push(`Missing required content for meal ${meal.id}`);',
    after: '    if (!meal.name || !meal.slug || !meal.description || !meal.seoTitle || !meal.seoDescription) errors.push(`Missing required content for meal ${meal.id}`);'
  },
  {
    label: 'archive search headnote handling',
    before: "  return [meal.name, meal.description, meal.headnote, meal.category, meal.cuisine, ...meal.tags, ...meal.ingredients.map(item => item.name)].join(' ').toLowerCase();",
    after: "  return [meal.name, meal.description, meal.headnote || '', meal.category, meal.cuisine, ...meal.tags, ...meal.ingredients.map(item => item.name)].join(' ').toLowerCase();"
  },
  {
    label: 'recipe headnote rendering',
    before: '<p class="slop-desc">${esc(meal.description)}</p><p class="slop-headnote">${esc(meal.headnote)}</p>${editorialSection}<p class="section-label">At a Glance</p>',
    after: '<p class="slop-desc">${esc(meal.description)}</p>${meal.headnote ? `<p class="slop-headnote">${esc(meal.headnote)}</p>` : \'\'}${editorialSection}<p class="section-label">At a Glance</p>'
  }
]);

const seoChanged = patchFile('scripts/seo-check.js', [
  {
    label: 'HTML headnote requirement',
    before: '  if (!html.includes(\'class="slop-headnote"\')) errors.push(`${file}: missing recipe headnote`);',
    after: '  // Headnotes are optional editorial enhancements; core recipe content and schema remain required.'
  },
  {
    label: 'source discovery-copy requirement',
    before: '    if (!meal.name || !meal.slug || !meal.description || !meal.headnote || !meal.seoTitle || !meal.seoDescription) errors.push(`${meal.slug}: incomplete discovery copy`);',
    after: '    if (!meal.name || !meal.slug || !meal.description || !meal.seoTitle || !meal.seoDescription) errors.push(`${meal.slug}: incomplete discovery copy`);'
  },
  {
    label: 'volume two required fields',
    before: "  const expectedFields = ['id', 'name', 'slug', 'description', 'tags', 'prep', 'cook', 'serves', 'difficulty', 'cuisine', 'category', 'ingredients', 'steps', 'notes', 'photo_search', 'publishDate', 'status', 'imageAlt', 'headnote', 'seoTitle', 'seoDescription'];",
    after: "  const expectedFields = ['id', 'name', 'slug', 'description', 'tags', 'prep', 'cook', 'serves', 'difficulty', 'cuisine', 'category', 'ingredients', 'steps', 'notes', 'photo_search', 'publishDate', 'status', 'imageAlt', 'seoTitle', 'seoDescription'];"
  }
]);

console.log(`${publisherChanged ? 'Patched' : 'Verified'} publisher source; ${seoChanged ? 'patched' : 'verified'} SEO validator.`);
