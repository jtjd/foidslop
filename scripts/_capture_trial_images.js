const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const sharp = require('sharp');

const root = process.cwd();
const trials = JSON.parse(fs.readFileSync(path.join(root, 'data/slop-trials.json'), 'utf8'));
const outputDir = path.join(root, 'culture', 'trials');
fs.mkdirSync(outputDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36'
  });
  const report = [];
  let realVisuals = 0;

  async function capture(item) {
    const page = await context.newPage();
    let mode = 'fallback';
    let imageUrl = '';
    const destination = path.join(root, item.image.replace(/^\//, ''));
    try {
      await page.goto(item.sourceUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(700);
      imageUrl = await page.locator('meta[property="og:image"]').first().getAttribute('content').catch(() => '') ||
        await page.locator('meta[name="twitter:image"]').first().getAttribute('content').catch(() => '') || '';
      if (imageUrl) {
        try {
          const response = await context.request.get(imageUrl, {
            timeout: 15000,
            headers: { referer: item.sourceUrl, accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8' }
          });
          const contentType = response.headers()['content-type'] || '';
          if (response.ok() && contentType.startsWith('image/')) {
            const body = await response.body();
            await sharp(body).rotate().resize(960, 640, { fit: 'cover', position: 'attention' }).webp({ quality: 80 }).toFile(destination);
            mode = 'og-image';
            realVisuals += 1;
          }
        } catch {}
      }
      if (mode !== 'og-image') {
        const screenshot = await page.screenshot({ fullPage: false });
        await sharp(screenshot).resize(960, 640, { fit: 'cover', position: 'top' }).webp({ quality: 78 }).toFile(destination);
        mode = 'screenshot';
        realVisuals += 1;
      }
    } catch {
      const safeName = item.name.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      const fallback = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640"><rect width="960" height="640" fill="#111214"/><text x="56" y="88" fill="#ff4b35" font-family="Arial" font-size="22">${item.category.toUpperCase()}</text><text x="56" y="300" fill="#f4f0e7" font-family="Arial" font-size="58" font-weight="700">${safeName}</text><text x="56" y="570" fill="#aaa" font-family="Arial" font-size="20">Source image unavailable during build</text></svg>`);
      await sharp(fallback).webp({ quality: 80 }).toFile(destination);
    } finally {
      await page.close();
    }
    const stat = fs.statSync(destination);
    report.push({ id: item.id, mode, bytes: stat.size, imageUrl });
    console.log(`${item.id}: ${mode} (${stat.size} bytes)`);
  }

  const items = trials.items.filter(item => item.kind === 'current');
  for (let i = 0; i < items.length; i += 4) {
    await Promise.all(items.slice(i, i + 4).map(capture));
  }

  await browser.close();
  report.sort((a, b) => items.findIndex(item => item.id === a.id) - items.findIndex(item => item.id === b.id));
  fs.writeFileSync(path.join(root, 'trial-image-report.json'), JSON.stringify(report, null, 2) + '\n');
  if (realVisuals < 8) {
    console.error(`Only ${realVisuals} current items produced real source visuals.`);
    process.exit(1);
  }
})();
