#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'data', 'published-recipe-copy-overrides.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
data.revisionDate = '2026-09-07';
data.entries ||= {};
data.entries['mochi-matcha-tea'] = {
  headnote: 'Whisk the matcha with hot water before adding the frothed oat milk so the tea stays smooth and evenly suspended. Serve the mochi on the side so its chewy texture stays distinct from the drink.',
  substitutions: 'Dairy milk, soy milk, or almond milk can replace oat milk. Strawberry, matcha, or another filled mochi all work, and maple syrup can replace honey if you want the latte slightly sweeter.',
  storage: 'Matcha is best whisked and served immediately. Keep mochi and oat milk refrigerated or frozen according to their package directions, then prepare only the amount you plan to eat.'
};
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
console.log('Added bespoke editorial coverage for mochi-matcha-tea.');
