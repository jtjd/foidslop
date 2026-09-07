const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = process.cwd();
const dataPath = path.join(root, 'data', 'slop-trials.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const outDir = path.join(root, 'culture', 'trials', 'social');
fs.mkdirSync(outDir, { recursive: true });

const escapeXml = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

function wrapWords(value, maxChars = 24, maxLines = 3) {
  const words = String(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    } else {
      line = next;
    }
  }
  if (line && lines.length < maxLines) {
    const consumed = lines.join(' ').split(/\s+/).filter(Boolean).length;
    const remaining = words.slice(consumed).join(' ');
    lines.push(remaining || line);
  }
  if (lines.length > maxLines) lines.length = maxLines;
  return lines.map((text, index) => index === maxLines - 1 && words.join(' ').length > lines.join(' ').length ? `${text.replace(/[\s.,;:!?-]+$/,'')}…` : text);
}

function titleOverlay(item, hasPhoto) {
  const lines = wrapWords(item.name, 22, 3);
  const titleStart = lines.length === 1 ? 350 : lines.length === 2 ? 315 : 275;
  const titleSpans = lines.map((line, index) => `<tspan x="72" dy="${index === 0 ? 0 : 82}">${escapeXml(line)}</tspan>`).join('');
  return Buffer.from(`
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    ${hasPhoto ? '<rect width="1200" height="630" fill="url(#shade)"/>' : '<rect width="1200" height="630" fill="#0a0b0d"/><rect x="0" y="0" width="16" height="630" fill="#ff4a3d"/><circle cx="1010" cy="92" r="210" fill="#ff4a3d" opacity=".07"/><circle cx="1110" cy="555" r="315" fill="#ffffff" opacity=".025"/>'}
    <defs>
      <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#050607" stop-opacity=".9"/><stop offset=".62" stop-color="#050607" stop-opacity=".58"/><stop offset="1" stop-color="#050607" stop-opacity=".2"/></linearGradient>
    </defs>
    <text x="72" y="74" fill="#ff4a3d" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" letter-spacing="3">IS IT FOIDSLOP?</text>
    <text x="72" y="118" fill="#f5f2eb" opacity=".72" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="700" letter-spacing="2">${escapeXml(item.category.toUpperCase())}</text>
    <text x="72" y="${titleStart}" fill="#f5f2eb" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="70" font-weight="900" letter-spacing="-3">${titleSpans}</text>
    <text x="72" y="582" fill="#f5f2eb" opacity=".72" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="700">Vote yes or no · foidslop.com</text>
  </svg>`);
}

(async () => {
  for (const item of data.items) {
    const output = path.join(root, item.socialImage.replace(/^\//, ''));
    fs.mkdirSync(path.dirname(output), { recursive: true });
    const imagePath = item.image ? path.join(root, item.image.replace(/^\//, '')) : null;
    const hasPhoto = Boolean(imagePath && fs.existsSync(imagePath));
    let pipeline;
    if (hasPhoto) {
      pipeline = sharp(imagePath).resize(1200, 630, { fit: 'cover', position: 'attention' });
    } else {
      pipeline = sharp({ create: { width: 1200, height: 630, channels: 3, background: '#0a0b0d' } });
    }
    await pipeline
      .composite([{ input: titleOverlay(item, hasPhoto), top: 0, left: 0 }])
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(output);
    const meta = await sharp(output).metadata();
    if (meta.width !== 1200 || meta.height !== 630) throw new Error(`bad social card dimensions for ${item.id}`);
    if (fs.statSync(output).size > 900000) throw new Error(`social card too large for ${item.id}`);
    console.log(`${item.id}: ${fs.statSync(output).size} bytes`);
  }
})();
