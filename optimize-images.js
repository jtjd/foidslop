#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const SLOP = path.join(ROOT, 'slop');
const SOCIAL = path.join(SLOP, 'social');
const meals = JSON.parse(fs.readFileSync(path.join(ROOT, 'foidslop-meals.json'), 'utf8')).meals;
const force = process.argv.includes('--force');
const dateArg = process.argv.includes('--date')
  ? process.argv[process.argv.indexOf('--date') + 1]
  : new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const magick = ['magick', 'convert'].find(command => spawnSync(command, ['-version'], { stdio: 'ignore' }).status === 0);
const avifenc = spawnSync('avifenc', ['--version'], { stdio: 'ignore' }).status === 0 ? 'avifenc' : null;
const avifdec = spawnSync('avifdec', ['--version'], { stdio: 'ignore' }).status === 0 ? 'avifdec' : null;

if (!magick) throw new Error('ImageMagick is required.');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr || result.stdout}`);
  return result;
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

function metric(source, output, name) {
  const result = spawnSync(magick, ['compare', '-metric', name, source, output, 'null:'], { encoding: 'utf8' });
  const value = Number.parseFloat(result.stderr || result.stdout);
  if (![0, 1].includes(result.status) || !Number.isFinite(value)) throw new Error(`Could not calculate ${name} for ${output}`);
  return value;
}

function buildHomepageImages() {
  const assets = ['DJTNIP', 'CarModel', 'MerchModel'];
  for (const name of assets) {
    const source = path.join(ROOT, `${name}.png`);
    const avif = path.join(ROOT, `${name}-hq.avif`);
    const webp = path.join(ROOT, `${name}-hq.webp`);
    if (!fs.existsSync(source)) throw new Error(`Missing homepage source image: ${source}`);

    if (!isCurrent(source, avif)) {
      if (!avifenc) {
        if (!fs.existsSync(avif)) throw new Error('avifenc is required to create the homepage AVIF files.');
      } else {
        run(avifenc, ['--yuv', '444', '--qcolor', '97', '--qalpha', '100', '--speed', '6', '--ignore-exif', '--ignore-xmp', source, avif]);
      }
    }
    if (!isCurrent(source, webp)) run(magick, [source, '-strip', '-quality', '95', webp]);

    const decoded = path.join('/tmp', `${name}-hq-${process.pid}.png`);
    if (avifdec) run(avifdec, ['--png-compress', '1', avif, decoded]);
    else run(magick, [avif, decoded]);
    const psnr = metric(source, decoded, 'PSNR');
    const sourceSize = `${run(magick, ['identify', '-format', '%wx%h', source]).stdout}`;
    const avifSize = `${run(magick, ['identify', '-format', '%wx%h', decoded]).stdout}`;
    const [width, height] = sourceSize.split('x').map(Number);
    const dssimRaw = metric(source, decoded, 'DSSIM');
    const dssim = dssimRaw > 1 ? dssimRaw / (width * height) : dssimRaw;
    if (psnr < 45 || dssim > 0.005) throw new Error(`${name}-hq.avif missed the visual quality threshold: PSNR ${psnr}, normalized DSSIM ${dssim}`);
    fs.unlinkSync(decoded);
    if (sourceSize !== avifSize) throw new Error(`${name}-hq.avif changed dimensions from ${sourceSize} to ${avifSize}`);
  }

  const logoSource = path.join(ROOT, 'logo.png');
  const logoWebp = path.join(ROOT, 'logo.webp');
  if (!isCurrent(logoSource, logoWebp)) run(magick, [logoSource, '-strip', '-define', 'webp:lossless=true', logoWebp]);
}

function socialCanvas(meal, source, output, kind) {
  const isPin = kind === 'pin';
  const width = isPin ? 1000 : 1280;
  const height = isPin ? 1500 : 720;
  const args = [
    '-size', `${width}x${height}`, 'xc:#f2efe7',
    '(', source, '-auto-orient', '-resize', `${isPin ? '768x768' : '720x720'}>`, ')',
    '-gravity', isPin ? 'north' : 'east', '-geometry', isPin ? '+0+90' : '+0+0', '-composite'
  ];
  if (isPin) {
    args.push(
      '(', '-background', 'none', '-fill', '#111111', '-font', 'DejaVu-Sans-Bold', '-pointsize', '62', '-gravity', 'center', '-size', '840x250', `caption:${meal.name.toUpperCase()}`, ')',
      '-gravity', 'south', '-geometry', '+0+170', '-composite',
      '-fill', '#111111', '-font', 'DejaVu-Sans-Bold', '-pointsize', '30', '-gravity', 'south', '-annotate', '+0+62', 'FOIDSLOP / RECIPE FOR ONE'
    );
  } else {
    args.push(
      '(', '-background', 'none', '-fill', '#111111', '-font', 'DejaVu-Sans-Bold', '-pointsize', '54', '-gravity', 'center', '-size', '470x360', `caption:${meal.name.toUpperCase()}`, ')',
      '-gravity', 'west', '-geometry', '+38-34', '-composite',
      '-fill', '#111111', '-font', 'DejaVu-Sans-Bold', '-pointsize', '22', '-gravity', 'southwest', '-annotate', '+42+42', 'FOIDSLOP / RECIPE FOR ONE'
    );
  }
  args.push('-strip', '-interlace', 'Plane', '-sampling-factor', '4:4:4', '-quality', '94', output);
  run(magick, args);
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
    if (!isCurrent(source, output)) run(magick, [source, '-auto-orient', ...variant.args, '-strip', output]);
  }
  return source;
}

function buildSocialImages() {
  fs.mkdirSync(SOCIAL, { recursive: true });
  const published = meals.filter(meal => releaseDate(meal) <= dateArg && meal.status !== 'retired');
  let created = 0;
  for (const meal of published) {
    const source = prepareRecipeAssets(meal);
    for (const kind of ['wide', 'pin']) {
      const output = path.join(SOCIAL, `${meal.slug}-${kind}.jpg`);
      if (!isCurrent(source, output)) {
        socialCanvas(meal, source, output, kind);
        created += 1;
      }
    }
  }
  return { published: published.length, created };
}

buildHomepageImages();
const result = buildSocialImages();
console.log(`Prepared high-quality homepage assets and ${result.created} social canvases for ${result.published} published recipes.`);
console.log('Recipe photos and their existing visible variants were not changed.');
