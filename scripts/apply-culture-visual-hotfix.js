#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const dictionaryFile = path.join(ROOT, 'data', 'dictionary.json');
const publisherFile = path.join(ROOT, 'scripts', 'publish-culture.js');
const cssFile = path.join(ROOT, 'css', 'culture.css');
const testFile = path.join(ROOT, 'test', 'culture-content.test.js');
const buildFile = path.join(ROOT, 'scripts', 'build-deploy.js');

const dictionary = JSON.parse(fs.readFileSync(dictionaryFile, 'utf8'));
const foidslop = dictionary.entries.find(entry => entry.slug === 'foidslop');
if (!foidslop) throw new Error('Missing foidslop dictionary entry');

foidslop.evidence = [
  {
    afterSection: 0,
    image: 'culture/receipts/foid-r9k-2018.webp',
    alt: 'Screenshot of an April 10, 2018 4chan /r9k/ post using the word foid',
    caption: 'An April 10, 2018 /r9k/ post, one of the earliest documented uses of “foid.”',
    sourceLabel: 'Know Your Meme image archive',
    sourceUrl: 'https://knowyourmeme.com/sensitive/photos/2951989-foid-slang',
    transcript: 'Around a foid, be paranoid.',
    width: 716,
    height: 396
  },
  {
    afterSection: 1,
    image: 'culture/receipts/girl-dinner-2023.webp',
    alt: 'Girl dinner image showing snack foods and a bread and cheese board',
    caption: 'Girl dinner went viral in 2023 after Olivia Maher posted bread, cheese, grapes, and pickles as her ideal low-effort dinner.',
    sourceLabel: 'Know Your Meme: Girl Dinner',
    sourceUrl: 'https://knowyourmeme.com/memes/girl-dinner',
    width: 1357,
    height: 758
  }
];
fs.writeFileSync(dictionaryFile, JSON.stringify(dictionary, null, 2) + '\n');

let publisher = fs.readFileSync(publisherFile, 'utf8');
publisher = publisher.replace(/const STYLE_VERSION = '[^']+';/, "const STYLE_VERSION = '20260906-3';");
fs.writeFileSync(publisherFile, publisher);

let css = fs.readFileSync(cssFile, 'utf8');
css = css
  .replace('.culture-index,.culture-article{max-width:1120px;margin:0 auto;padding:72px 28px 96px}', '.culture-index,.culture-article{max-width:1440px;margin:0 auto;padding:72px 40px 96px}.culture-index{border-inline:1px solid var(--border)}')
  .replaceAll('var(--border-color,#d5d5d5)', 'var(--border)')
  .replaceAll('var(--surface,#f7f7f4)', 'var(--surface)')
  .replaceAll('var(--page-bg,#fff)', 'var(--surface)')
  .replaceAll('var(--muted-text,#5c5c5c)', 'var(--muted)')
  .replace('.culture-card-grid{grid-template-columns:repeat(3,minmax(0,1fr))}', '.culture-card-grid{grid-template-columns:repeat(2,minmax(0,1fr))}')
  .replace('.zine-culture{margin:64px auto 0;max-width:1280px;padding:40px 28px;border-top:2px solid currentColor}', '.zine-culture{margin:0;max-width:none;padding:42px;border-top:1px solid var(--border);background:var(--bg)}')
  .replace('background:#111;overflow:hidden', 'background:var(--image-bg);overflow:hidden')
  .replace('@media(max-width:760px){.culture-index,.culture-article{padding:48px 18px 72px}', '@media(max-width:760px){.culture-index,.culture-article{padding:48px 20px 72px}');

const integrationOverride = '.culture-card,.culture-feature,.zine-culture-grid>a,.zine-culture-bottom>a,.slop-index-card{background:var(--surface);color:var(--text);border-color:var(--border)}.culture-card p,.culture-feature p,.zine-culture-grid p,.dictionary-row span,.slop-index-note{color:var(--muted)}.culture-receipt-image{background:var(--image-bg);border-color:var(--border)}.culture-receipt-transcript p{background:var(--surface)}';
if (!css.includes(integrationOverride)) css += integrationOverride;
fs.writeFileSync(cssFile, css);

let tests = fs.readFileSync(testFile, 'utf8');
if (!tests.includes("test('culture stylesheet uses the publication theme tokens'")) {
  tests += `\ntest('culture stylesheet uses the publication theme tokens', () => {\n  const css = fs.readFileSync(path.join(root, 'css', 'culture.css'), 'utf8');\n  for (const stale of ['--page-bg', '--border-color', '--muted-text']) assert.doesNotMatch(css, new RegExp(stale));\n  assert.match(css, /var\\(--bg\\)/);\n  assert.match(css, /var\\(--surface\\)/);\n  assert.match(css, /var\\(--border\\)/);\n  assert.match(css, /var\\(--muted\\)/);\n});\n\ntest('foidslop pillar carries visual receipts', () => {\n  const entry = dictionary.entries.find(item => item.slug === 'foidslop');\n  assert.ok(entry.evidence && entry.evidence.length >= 2, 'foidslop pillar needs launch receipts');\n  assert.equal(entry.evidence[0].image, 'culture/receipts/foid-r9k-2018.webp');\n  assert.equal(entry.evidence[1].image, 'culture/receipts/girl-dinner-2023.webp');\n  const generated = fs.readFileSync(path.join(root, 'what-is-foidslop.html'), 'utf8');\n  assert.match(generated, /culture-receipt/);\n  assert.match(generated, /foid-r9k-2018\\.webp/);\n  assert.match(generated, /girl-dinner-2023\\.webp/);\n});\n`;
  fs.writeFileSync(testFile, tests);
}

let build = fs.readFileSync(buildFile, 'utf8');
if (!build.includes("const requiredCultureReceipts = [")) {
  build = build.replace(
    "if (!fs.existsSync(path.join(OUTPUT, 'dictionary', 'index.html'))) throw new Error('Dictionary index is missing from deployment');",
    "if (!fs.existsSync(path.join(OUTPUT, 'dictionary', 'index.html'))) throw new Error('Dictionary index is missing from deployment');\nconst requiredCultureReceipts = ['foid-r9k-2018.webp', 'foidslop-usernames-reddit.webp', 'girl-dinner-2023.webp'];\nfor (const receipt of requiredCultureReceipts) {\n  if (!fs.existsSync(path.join(OUTPUT, 'culture', 'receipts', receipt))) throw new Error(`Culture receipt is missing from deployment: ${receipt}`);\n}"
  );
  fs.writeFileSync(buildFile, build);
}

console.log('Applied culture visual integration hotfix.');
