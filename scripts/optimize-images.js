#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const SLOP = path.join(ROOT, 'slop');
const SOCIAL = path.join(SLOP, 'social');
const DATA = path.join(ROOT, 'data');
const BRAND_ASSETS = path.join(ROOT, 'assets', 'brand');
const meals = JSON.parse(fs.readFileSync(path.join(DATA, 'foidslop-meals.json'), 'utf8')).meals;
const force = process.argv.includes('--force');
const refreshBrand = force || process.argv.includes('--refresh-brand');
const forcePins = process.argv.includes('--force-pins');
const slugArg = process.argv.includes('--slug')
  ? process.argv[process.argv.indexOf('--slug') + 1]
  : null;
const dateArg = process.argv.includes('--date')
  ? process.argv[process.argv.indexOf('--date') + 1]
  : new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const magick = ['magick', 'convert'].find(command => spawnSync(command, ['-version'], { stdio: 'ignore' }).status === 0);

if (!magick) throw new Error('ImageMagick is required.');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr || result.stdout}`);
  return result;
}

function imageInvocation(operation, args) {
  if (magick === 'magick') {
    return { command: magick, args: operation === 'convert' ? args : [operation, ...args] };
  }
  return { command: operation, args };
}

function runImage(operation, args, options = {}) {
  const invocation = imageInvocation(operation, args);
  return run(invocation.command, invocation.args, options);
}

function releaseDate(meal) {
  if (meal.publishDate) return meal.publishDate;
  const date = new Date('2026-05-01T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + meal.id - 1);
  return date.toISOString().slice(0, 10);
}

function isCurrent(source, output) {
  return fs.existsSync(output) && !force;
}

function buildBrandImages() {
  const logoSource = path.join(BRAND_ASSETS, 'logo.png');
  const logoWebp = path.join(BRAND_ASSETS, 'logo.webp');
  const logoHeaderPng = path.join(BRAND_ASSETS, 'logo-header.png');
  const logoHeaderWebp = path.join(BRAND_ASSETS, 'logo-header.webp');
  const iconSource = path.join(BRAND_ASSETS, 'brand-icon.png');
  const iconWebp = path.join(BRAND_ASSETS, 'brand-icon.webp');
  const iconSmallWebp = path.join(BRAND_ASSETS, 'brand-icon-192.webp');
  if (refreshBrand || !fs.existsSync(logoWebp)) {
    runImage('convert', [logoSource, '-auto-orient', '-strip', '-define', 'webp:method=6', '-quality', '86', logoWebp]);
  }
  if (refreshBrand || !fs.existsSync(logoHeaderPng)) {
    runImage('convert', [logoSource, '-auto-orient', '-resize', '252x149>', '-strip', '-define', 'png:compression-level=9', logoHeaderPng]);
  }
  if (refreshBrand || !fs.existsSync(logoHeaderWebp)) {
    runImage('convert', [logoSource, '-auto-orient', '-resize', '252x149>', '-strip', '-define', 'webp:method=6', '-quality', '86', logoHeaderWebp]);
  }
  if (refreshBrand || !fs.existsSync(iconWebp)) {
    runImage('convert', [iconSource, '-strip', '-define', 'webp:method=6', '-quality', '86', iconWebp]);
  }
  if (refreshBrand || !fs.existsSync(iconSmallWebp)) {
    runImage('convert', [iconSource, '-resize', '192x192!', '-strip', '-define', 'webp:method=6', '-quality', '86', iconSmallWebp]);
  }
}

function socialCanvas(meal, source, output, kind) {
  const isPin = kind === 'pin';
  const width = isPin ? 1000 : 1280;
  const height = isPin ? 1500 : 720;
  const args = isPin
    ? [source, '-auto-orient', '-resize', `${width}x${height}^`, '-gravity', 'center', '-extent', `${width}x${height}`]
    : [
      '-size', `${width}x${height}`, 'xc:#f2efe7',
      '(', source, '-auto-orient', '-resize', '720x720>', ')',
      '-gravity', 'east', '-geometry', '+0+0', '-composite',
      '(', '-background', 'none', '-fill', '#111111', '-font', 'DejaVu-Sans-Bold', '-pointsize', '54', '-gravity', 'center', '-size', '470x360', `caption:${meal.name.toUpperCase()}`, ')',
      '-gravity', 'west', '-geometry', '+38-34', '-composite',
      '-fill', '#111111', '-font', 'DejaVu-Sans-Bold', '-pointsize', '22', '-gravity', 'southwest', '-annotate', '+42+42', 'FOIDSLOP / RECIPE FOR ONE'
    ];
  args.push('-strip', '-interlace', 'Plane', '-sampling-factor', '4:4:4', '-quality', '94', output);
  runImage('convert', args);
}

function prepareRecipeAssets(meal) {
  const imageDirectory = path.join(SLOP, 'img');
  const legacyPath = path.join(imageDirectory, `${meal.slug}.jpg`);
  const pngPath = path.join(imageDirectory, `${meal.slug}.png`);
  if (!fs.existsSync(legacyPath) && !fs.existsSync(pngPath)) throw new Error(`Missing recipe image for ${meal.slug}`);

  let source = fs.existsSync(pngPath) ? pngPath : legacyPath;
  if (source === legacyPath) {
    const signature = fs.readFileSync(legacyPath).subarray(0, 8).toString('hex');
    if (signature.startsWith('89504e47')) {
      fs.copyFileSync(legacyPath, pngPath);
      source = pngPath;
    }
  }

  const variants = [
    { file: `${meal.slug}-480.webp`, args: ['-resize', '480x480>', '-quality', '88'] },
    { file: `${meal.slug}-768.webp`, args: ['-resize', '768x768>', '-quality', '90'] },
    { file: `${meal.slug}-4x3.jpg`, args: ['-resize', '768x576^', '-gravity', 'center', '-extent', '768x576', '-quality', '92'] },
    { file: `${meal.slug}-16x9.jpg`, args: ['-resize', '768x432^', '-gravity', 'center', '-extent', '768x432', '-quality', '92'] }
  ];
  for (const variant of variants) {
    const output = path.join(imageDirectory, variant.file);
    if (!isCurrent(source, output)) runImage('convert', [source, '-auto-orient', ...variant.args, '-strip', output]);
  }
  return source;
}

function buildSocialImages() {
  fs.mkdirSync(SOCIAL, { recursive: true });
  const published = slugArg
    ? meals.filter(meal => meal.slug === slugArg && meal.status !== 'retired')
    : meals.filter(meal => releaseDate(meal) <= dateArg && meal.status !== 'retired');
  if (slugArg && !published.length) throw new Error(`Unknown or retired recipe slug: ${slugArg}`);
  let created = 0;
  for (const meal of published) {
    const source = prepareRecipeAssets(meal);
    for (const kind of ['wide', 'pin']) {
      const output = path.join(SOCIAL, `${meal.slug}-${kind}.jpg`);
      if (!isCurrent(source, output) || (forcePins && kind === 'pin')) {
        socialCanvas(meal, source, output, kind);
        created += 1;
      }
    }
  }
  return { published: published.length, created };
}

buildBrandImages();
const result = buildSocialImages();
console.log(`Prepared brand assets and ${result.created} social canvases for ${result.published} recipe${result.published === 1 ? '' : 's'}.`);
console.log('Recipe photos and their existing visible variants were not changed.');
