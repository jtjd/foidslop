#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'scripts', 'daily-publish.js');
let source = fs.readFileSync(file, 'utf8');
let changed = false;

const duplicateBefore = `    for (const meal of meals.filter(item => item.status !== 'retired')) {\n      if (!seen.has(meal[field])) seen.set(meal[field], []);\n      seen.get(meal[field]).push(meal.slug);\n    }`;
const duplicateAfter = `    for (const meal of meals.filter(item => item.status !== 'retired')) {\n      if (!meal[field]) continue;\n      if (!seen.has(meal[field])) seen.set(meal[field], []);\n      seen.get(meal[field]).push(meal.slug);\n    }`;

if (!source.includes(duplicateAfter)) {
  if (!source.includes(duplicateBefore)) throw new Error('Could not locate discovery-copy duplicate validation block');
  source = source.replace(duplicateBefore, duplicateAfter);
  changed = true;
}

const yieldBefore = '    totalTime: `PT${total}M`, recipeYield: meal.serves,';
const yieldAfter = '    totalTime: `PT${total}M`, recipeYield: `${meal.serves} serving${String(meal.serves) === \'1\' ? \'\' : \'s\'}`,';
if (!source.includes(yieldAfter)) {
  if (!source.includes(yieldBefore)) throw new Error('Could not locate Recipe recipeYield assignment');
  source = source.replace(yieldBefore, yieldAfter);
  changed = true;
}

if (changed) fs.writeFileSync(file, source);
console.log(changed ? 'Patched publisher source.' : 'Publisher source already patched.');
