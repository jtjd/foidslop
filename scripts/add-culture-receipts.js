#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const dictionaryFile = path.join(ROOT, 'data', 'dictionary.json');
const cultureFile = path.join(ROOT, 'data', 'culture-articles.json');
const publisherFile = path.join(ROOT, 'scripts', 'publish-culture.js');
const cssFile = path.join(ROOT, 'css', 'culture.css');
const testFile = path.join(ROOT, 'test', 'culture-content.test.js');

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
function replaceOrThrow(text, from, to, label) {
  if (!text.includes(from)) throw new Error(`Could not patch ${label}`);
  return text.replace(from, to);
}

const dictionary = readJson(dictionaryFile);
const culture = readJson(cultureFile);

function setEvidence(collection, slug, evidence) {
  const item = collection.find(entry => entry.slug === slug);
  if (!item) throw new Error(`Missing content item ${slug}`);
  item.evidence = evidence;
}

setEvidence(dictionary.entries, 'foid', [
  {
    afterSection: 0,
    image: 'culture/receipts/foid-r9k-2018.webp',
    alt: 'Screenshot of an April 10, 2018 4chan /r9k/ post using the word foid',
    caption: 'An April 10, 2018 /r9k/ post, one of the earliest documented uses of “foid.”',
    sourceLabel: 'Know Your Meme image archive',
    sourceUrl: 'https://knowyourmeme.com/sensitive/photos/2951989-foid-slang',
    transcript: 'Around a foid, be paranoid.'
  }
]);

setEvidence(culture.articles, 'foidslop-usernames', [
  {
    afterSection: 0,
    image: 'culture/receipts/foidslop-usernames-reddit.webp',
    alt: 'Screenshot of the July 31, 2026 Reddit post titled I love foidslop usernames',
    caption: 'A July 31, 2026 Reddit post using “foidslop usernames” for names like bunni, kitty, fairy, fae, pixie, angel, and sushi.',
    sourceLabel: 'Reddit thread',
    sourceUrl: 'https://www.reddit.com/r/lovethissmug/comments/1vbnzlp/i_love_foidslop_usernames/',
    transcript: 'Usernames like bunni, kitty, kitten, fairy, fae, pixie, angel, sushi, etc all go crazy, lowkey mog their male counterparts like destroyer, sigma, etc.'
  }
]);

setEvidence(dictionary.entries, 'girl-dinner', [
  {
    afterSection: 1,
    image: 'culture/receipts/girl-dinner-2023.webp',
    alt: 'Girl dinner image showing snack foods and a bread and cheese board',
    caption: 'Girl dinner went viral in 2023 after Olivia Maher posted bread, cheese, grapes, and pickles as her ideal low-effort dinner.',
    sourceLabel: 'Know Your Meme: Girl Dinner',
    sourceUrl: 'https://knowyourmeme.com/memes/girl-dinner'
  }
]);

writeJson(dictionaryFile, dictionary);
writeJson(cultureFile, culture);

let publisher = fs.readFileSync(publisherFile, 'utf8');
publisher = publisher.replace("const STYLE_VERSION = '20260906-1';", "const STYLE_VERSION = '20260906-2';");

if (!publisher.includes('function validateEvidence(')) {
  publisher = replaceOrThrow(
    publisher,
    'function validateSource() {\n',
    `function validateEvidence(owner, evidence, sectionCount, errors) {\n  for (const [index, receipt] of (evidence || []).entries()) {\n    const label = \`${'${owner}'} evidence ${'${index + 1}'}\`;\n    for (const field of ['image', 'alt', 'caption', 'sourceLabel', 'sourceUrl']) {\n      if (!String(receipt[field] || '').trim()) errors.push(\`${'${label}'}: missing ${'${field}'}\`);\n    }\n    if (!Number.isInteger(receipt.afterSection) || receipt.afterSection < 0 || receipt.afterSection >= sectionCount) errors.push(\`${'${label}'}: invalid afterSection\`);\n    if (!/^culture\\/receipts\\/[a-z0-9-]+\\.webp$/.test(receipt.image || '')) errors.push(\`${'${label}'}: image must be a local WebP receipt\`);\n    if (!/^https:\\/\\//.test(receipt.sourceUrl || '')) errors.push(\`${'${label}'}: invalid sourceUrl\`);\n    const imageFile = path.join(ROOT, receipt.image || '');\n    if (!fs.existsSync(imageFile)) errors.push(\`${'${label}'}: missing local image ${'${receipt.image}'}\`);\n    else if (fs.statSync(imageFile).size > 750000) errors.push(\`${'${label}'}: image exceeds 750 KB\`);\n    if (!Number.isInteger(receipt.width) || receipt.width < 1 || !Number.isInteger(receipt.height) || receipt.height < 1) errors.push(\`${'${label}'}: missing image dimensions\`);\n  }\n}\n\nfunction validateSource() {\n`,
    'evidence validation'
  );
}

publisher = replaceOrThrow(
  publisher,
  "    for (const source of entry.sources || []) if (!/^https:\\/\\//.test(source.url || '')) errors.push(`dictionary ${entry.slug}: invalid source URL`);\n",
  "    for (const source of entry.sources || []) if (!/^https:\\/\\//.test(source.url || '')) errors.push(`dictionary ${entry.slug}: invalid source URL`);\n    validateEvidence(`dictionary ${entry.slug}`, entry.evidence, entry.sections.length, errors);\n",
  'dictionary evidence validation call'
);
publisher = replaceOrThrow(
  publisher,
  "    for (const source of article.sources || []) if (!/^https:\\/\\//.test(source.url || '')) errors.push(`culture ${article.slug}: invalid source URL`);\n",
  "    for (const source of article.sources || []) if (!/^https:\\/\\//.test(source.url || '')) errors.push(`culture ${article.slug}: invalid source URL`);\n    validateEvidence(`culture ${article.slug}`, article.evidence, article.sections.length, errors);\n",
  'culture evidence validation call'
);

if (!publisher.includes('function receiptHtml(')) {
  publisher = replaceOrThrow(
    publisher,
    "function sectionHtml(sections) {\n  return sections.map(section => `<section><h2>${esc(section.heading)}</h2>${section.paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}</section>`).join('');\n}\n",
    `function receiptHtml(receipt, route) {\n  const prefix = prefixFor(route);\n  const transcript = receipt.transcript ? \`<details class="culture-receipt-transcript"><summary>Transcript</summary><p>${'${esc(receipt.transcript)}'}</p></details>\` : '';\n  return \`<figure class="culture-receipt"><a class="culture-receipt-image" href="${'${prefix}${esc(receipt.image)}'}"><img src="${'${prefix}${esc(receipt.image)}'}" alt="${'${esc(receipt.alt)}'}" width="${'${receipt.width}'}" height="${'${receipt.height}'}" loading="lazy" decoding="async"></a><figcaption><span class="content-eyebrow">Receipt</span><p>${'${esc(receipt.caption)}'}</p><a href="${'${esc(receipt.sourceUrl)}'}" rel="external">Source: ${'${esc(receipt.sourceLabel)}'}</a>${'${transcript}'}</figcaption></figure>\`;\n}\nfunction sectionHtml(sections, evidence = [], route = '') {\n  return sections.map((section, index) => {\n    const receipts = evidence.filter(receipt => receipt.afterSection === index).map(receipt => receiptHtml(receipt, route)).join('');\n    return \`<section><h2>${'${esc(section.heading)}'}</h2>${'${section.paragraphs.map(p => `<p>${esc(p)}</p>`).join(\'\')}'}</section>${'${receipts}'}\`;\n  }).join('');\n}\n`,
    'receipt renderer'
  );
}

publisher = publisher.replace('${sectionHtml(entry.sections)}', '${sectionHtml(entry.sections, entry.evidence, route)}');
publisher = publisher.replace('${sectionHtml(article.sections)}', '${sectionHtml(article.sections, article.evidence, route)}');
fs.writeFileSync(publisherFile, publisher);

let css = fs.readFileSync(cssFile, 'utf8');
if (!css.includes('.culture-receipt{')) {
  css += '\n.culture-receipt{max-width:860px;margin:34px 0 46px}.culture-receipt-image{display:block;border:1px solid var(--border-color,#d5d5d5);background:#111;overflow:hidden}.culture-receipt img{display:block;width:100%;height:auto}.culture-receipt figcaption{padding:13px 2px 0;font-size:.86rem;line-height:1.5}.culture-receipt figcaption>p{margin:4px 0 5px;max-width:760px}.culture-receipt figcaption>a{font-size:.8rem}.culture-receipt-transcript{margin-top:10px;max-width:760px}.culture-receipt-transcript summary{cursor:pointer;font-weight:700}.culture-receipt-transcript p{margin:7px 0 0;padding:10px 12px;border-left:2px solid currentColor;background:var(--surface,#f7f7f4)}@media(max-width:760px){.culture-receipt{margin:28px 0 38px}}\n';
  fs.writeFileSync(cssFile, css);
}

let tests = fs.readFileSync(testFile, 'utf8');
if (!tests.includes("test('culture receipts are local, sourced, and dimensioned'")) {
  tests += `\ntest('culture receipts are local, sourced, and dimensioned', () => {\n  const receipts = [...dictionary.entries.flatMap(entry => entry.evidence || []), ...culture.articles.flatMap(article => article.evidence || [])];\n  assert.ok(receipts.length >= 3, 'expected launch receipts');\n  for (const receipt of receipts) {\n    assert.match(receipt.image, /^culture\\/receipts\\/[a-z0-9-]+\\.webp$/);\n    assert.match(receipt.sourceUrl, /^https:\\/\\//);\n    assert.ok(receipt.alt.length >= 30, 'receipt needs useful alt text');\n    assert.ok(receipt.caption.length >= 50, 'receipt needs a useful caption');\n    assert.ok(Number.isInteger(receipt.width) && receipt.width > 0);\n    assert.ok(Number.isInteger(receipt.height) && receipt.height > 0);\n    const file = path.join(root, receipt.image);\n    assert.ok(fs.existsSync(file), \`missing receipt image ${'${receipt.image}'}\`);\n    assert.ok(fs.statSync(file).size <= 750000, \`receipt image too large ${'${receipt.image}'}\`);\n  }\n});\n`;
  fs.writeFileSync(testFile, tests);
}

console.log('Staged evidence/receipt system and three launch receipts.');
