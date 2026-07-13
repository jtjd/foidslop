#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const meals = JSON.parse(fs.readFileSync(path.join(ROOT, 'foidslop-meals.json'), 'utf8')).meals;
const firstRelease = new Date('2026-05-01T12:00:00Z');
const dateArg = process.argv.includes('--date') ? process.argv[process.argv.indexOf('--date') + 1] : new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const imageMagick = ['magick', 'convert'].find(command => spawnSync(command, ['-version'], { stdio: 'ignore' }).status === 0);
if (!imageMagick) throw new Error('ImageMagick is required (expected `magick` or `convert`).');

function releaseDate(meal) {
  const date = new Date(firstRelease);
  date.setUTCDate(date.getUTCDate() + meal.id - 1);
  return date.toISOString().slice(0, 10);
}
function run(args) {
  const result = spawnSync(imageMagick, args, { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`ImageMagick failed: ${imageMagick} ${args.join(' ')}`);
}

const published = meals.filter(meal => releaseDate(meal) <= dateArg && meal.status !== 'retired');
for (const meal of published) {
  const directory = path.join(ROOT, 'slop', 'img');
  const source = path.join(directory, `${meal.slug}.jpg`);
  if (!fs.existsSync(source)) throw new Error(`Missing image: ${source}`);
  const variants = [`${meal.slug}-480.webp`, `${meal.slug}-768.webp`, `${meal.slug}-4x3.jpg`, `${meal.slug}-16x9.jpg`].map(file => path.join(directory, file));
  const signature = fs.readFileSync(source).subarray(0, 2).toString('hex');
  if (signature === 'ffd8' && variants.every(file => fs.existsSync(file))) continue;
  const temporary = path.join(directory, `.${meal.slug}-${process.pid}.tmp.jpg`);
  run([source, '-auto-orient', '-resize', '768x768^', '-gravity', 'center', '-extent', '768x768', '-strip', '-interlace', 'Plane', '-quality', '82', temporary]);
  fs.renameSync(temporary, source);
  run([source, '-resize', '480x480', '-strip', '-quality', '78', variants[0]]);
  run([source, '-strip', '-quality', '80', variants[1]]);
  run([source, '-resize', '768x576^', '-gravity', 'center', '-extent', '768x576', '-strip', '-quality', '82', variants[2]]);
  run([source, '-resize', '768x432^', '-gravity', 'center', '-extent', '768x432', '-strip', '-quality', '82', variants[3]]);
}

const socialSource = path.join(ROOT, 'og-image.png');
const socialOutput = path.join(ROOT, 'og-image.jpg');
if (!fs.existsSync(socialOutput) && fs.existsSync(socialSource)) run([socialSource, '-resize', '1200x630^', '-gravity', 'center', '-extent', '1200x630', '-strip', '-interlace', 'Plane', '-quality', '84', socialOutput]);
console.log(`Optimized ${published.length} published recipe images through ${dateArg}.`);
