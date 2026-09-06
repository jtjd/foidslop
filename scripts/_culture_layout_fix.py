from pathlib import Path
import json
import re

ROOT = Path('.')

# 1. Remove the irrelevant portrait image from the usernames article. The Reddit
# thread remains cited as a source, but the attached bunny photo is not evidence
# for the username taxonomy.
culture_file = ROOT / 'data' / 'culture-articles.json'
culture = json.loads(culture_file.read_text())
for article in culture['articles']:
    if article.get('slug') == 'foidslop-usernames':
        article.pop('evidence', None)
        break
else:
    raise SystemExit('foidslop-usernames article not found')
culture_file.write_text(json.dumps(culture, indent=2, ensure_ascii=False) + '\n')

# 2. Shared culture layout corrections.
culture_css = ROOT / 'css' / 'culture.css'
css = culture_css.read_text()
css = re.sub(r'\n?/\* culture-layout-audit:start \*/[\s\S]*?/\* culture-layout-audit:end \*/\n?', '\n', css)
css += r'''

/* culture-layout-audit:start */
/* Normal editorial surfaces should be substantial, not oversized poster text. */
.culture-index > h1 {
  max-width: 1040px;
  margin: 10px 0 20px;
  font: 900 clamp(3.2rem, 6.2vw, 6.2rem)/.86 Arial Black,Arial,sans-serif;
  letter-spacing: -.065em;
  text-wrap: balance;
  text-transform: uppercase;
}
.culture-index > .article-deck { max-width: 760px; }

/* Receipts are evidence, not hero images. Preserve native aspect ratio and cap
   their reading footprint, especially for portrait social-media attachments. */
.culture-receipt-image {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: fit-content;
  max-width: 100%;
}
.culture-receipt img {
  width: auto;
  max-width: 100%;
  max-height: 620px;
  object-fit: contain;
}

/* Keep grids within their own columns even when copy contains long tokens. */
.culture-card,.culture-feature,.slop-index-card,.dictionary-row,
.taxonomy-branch,.taxonomy-nodes a,.culture-tool-links a { min-width: 0; }
.culture-card strong,.culture-feature strong,.slop-index-card strong,
.dictionary-row strong,.taxonomy-nodes strong { overflow-wrap: anywhere; }

@media (max-width: 760px) {
  .culture-index > h1 { font-size: clamp(2.8rem, 13vw, 4.6rem); }
  .culture-receipt img { max-height: 520px; }
}
/* culture-layout-audit:end */
'''
culture_css.write_text(css)

# 3. Theme-level rules load after culture.css, so article title and publication
# header corrections live here.
theme_file = ROOT / 'css' / 'theme.css'
theme = theme_file.read_text()
theme = re.sub(r'\n?/\* culture-layout-audit:start \*/[\s\S]*?/\* culture-layout-audit:end \*/\n?', '\n', theme)
theme += r'''

/* culture-layout-audit:start */
.culture-article:not(.foidslop-primer) > h1 {
  max-width: 1040px;
  font-size: clamp(3.4rem, 6.3vw, 6.15rem);
  line-height: .87;
  letter-spacing: -.07em;
  text-wrap: balance;
}
.culture-article:not(.foidslop-primer) > .article-deck { max-width: 760px; }

/* The three-column publication header gets cramped well before the old 800px
   breakpoint. Remove the decorative center line first, then collapse secondary
   nav on phone widths instead of letting it clip off-screen. */
@media (min-width: 801px) and (max-width: 1180px) {
  .site-header { grid-template-columns: 180px 1fr; }
  .site-header-center { display: none; }
  .site-header .header-right { justify-self: end; min-width: 0; gap: 12px; }
}
@media (max-width: 800px) {
  .site-header .header-right { min-width: 0; gap: 10px; }
  .site-header .header-right .nav-link { display: none !important; }
  .site-header .header-right .nav-link.active,
  .site-header .header-right .header-dispatch { display: inline-flex !important; }
}
@media (max-width: 560px) {
  .site-header .header-right .header-dispatch { display: none !important; }
  .culture-article:not(.foidslop-primer) > h1 {
    font-size: clamp(2.85rem, 12.5vw, 4.35rem);
    overflow-wrap: anywhere;
  }
}
/* culture-layout-audit:end */
'''
theme_file.write_text(theme)

# 4. Upgrade the Slop Trial from the generic tool card to a dedicated editorial
# two-column court layout. Keep the same data hooks so the existing JS/API stay
# untouched.
products_file = ROOT / 'scripts' / 'publish-culture-products.js'
products = products_file.read_text()
products = products.replace("const STYLE_VERSION = '20260906-4';", "const STYLE_VERSION = '20260906-5';")
products = products.replace('culture-showcase.css?v=20260906-1', 'culture-showcase.css?v=20260906-2')
new_trial = r'''function renderTrialPage() {
  const route = 'culture/is-it-foidslop';
  const title = 'Is It Foidslop? Community Slop Trials';
  const description = 'Vote yes or no on movies, games, food, usernames, books, aesthetics, and other candidates. See the live community foidslop verdict.';
  const schema = [
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Is It Foidslop?', applicationCategory: 'EntertainmentApplication', operatingSystem: 'Any', url: canonical(route), description },
    breadcrumb(route, 'Is It Foidslop?')
  ];
  const categories = [...new Set(trials.items.map(item => item.category))].sort();
  const pageHead = head(route, title, description, schema).replace('</head>', '<link rel="stylesheet" href="../css/culture-showcase.css?v=20260906-2">\\n</head>');
  return `${pageHead}${header(route)}<main id="main" class="slop-trial-page"><header class="slop-trial-hero"><div><p class="content-eyebrow">Slop Trial / community court</p><h1>Is It Foidslop?</h1><p class="article-deck">A thing appears. You vote yes or no. The jury gets a percentage. Science advances.</p></div><aside class="slop-trial-docket"><span>Community court</span><strong>24</strong><span>launch specimens on file</span></aside></header><section class="slop-trial-shell" data-slop-trial><div class="slop-trial-toolbar"><label>Department <select data-trial-filter><option value="all">Everything</option>${categories.map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join('')}</select></label><button type="button" data-trial-share>Copy trial link</button></div><article class="slop-trial-card"><div class="slop-trial-specimen"><span data-trial-category></span><h2 data-trial-name></h2><p data-trial-prompt></p></div><div class="slop-trial-verdict"><div class="slop-trial-question">FOIDSLOP?</div><div class="slop-vote-buttons"><button type="button" data-vote="yes">YES</button><button type="button" data-vote="no">NO</button></div><p class="slop-trial-status" data-trial-status aria-live="polite"></p><p class="slop-trial-result" data-trial-result aria-live="polite"></p><button class="slop-next" type="button" data-trial-next>Next specimen</button></div></article></section><section class="slop-trial-links culture-tool-links"><a href="slop-index"><strong>Media Index</strong><span>See the staff scores.</span></a><a href="slop-taxonomy"><strong>Slop Taxonomy</strong><span>See where the category sits.</span></a><a href="username-generator"><strong>Username Generator</strong><span>Generate a new problem.</span></a></section></main>${scriptData('slop-trial-data', trials.items)}<script src="slop-tools.js?v=20260906-1" defer></script>${footer(route)}`;
}'''
products, count = re.subn(r'function renderTrialPage\(\) \{[\s\S]*?\n\}\n\nfunction renderUsernamePage\(\)', new_trial + '\n\nfunction renderUsernamePage()', products, count=1)
if count != 1:
    raise SystemExit('Could not replace renderTrialPage')
products_file.write_text(products)

# 5. Bump the shared culture publisher stylesheet version and showcase version.
publisher_file = ROOT / 'scripts' / 'publish-culture.js'
publisher = publisher_file.read_text()
publisher = publisher.replace("const STYLE_VERSION = '20260906-4';", "const STYLE_VERSION = '20260906-5';")
publisher = publisher.replace('culture-showcase.css?v=20260906-1', 'culture-showcase.css?v=20260906-2')
publisher_file.write_text(publisher)

# 6. Dedicated showcase styles for the Slop Trial. This file loads after theme.css.
showcase_file = ROOT / 'css' / 'culture-showcase.css'
showcase = showcase_file.read_text()
showcase = re.sub(r'\n?/\* slop-trial-redesign:start \*/[\s\S]*?/\* slop-trial-redesign:end \*/\n?', '\n', showcase)
showcase += r'''

/* slop-trial-redesign:start */
.slop-trial-page {
  max-width: 1440px;
  margin: 0 auto;
  padding-bottom: 96px;
  border-inline: 1px solid var(--border);
  background: var(--bg);
}
.slop-trial-hero {
  display: grid;
  grid-template-columns: minmax(0,1.45fr) minmax(220px,.55fr);
  gap: 46px;
  align-items: end;
  padding: 64px 42px 38px;
  border-bottom: 1px solid var(--border);
}
.slop-trial-hero h1 {
  max-width: 920px;
  margin: 8px 0 12px;
  font: 900 clamp(3.6rem,7vw,7rem)/.84 Arial Black,Arial,sans-serif;
  letter-spacing: -.075em;
  text-transform: uppercase;
  text-wrap: balance;
}
.slop-trial-hero .article-deck { max-width: 720px; margin: 0; line-height: 1.5; }
.slop-trial-docket {
  justify-self: end;
  width: 100%;
  max-width: 230px;
  padding: 18px;
  border: 1px solid var(--border);
  color: var(--muted);
  font: 700 9px/1.5 Inter,sans-serif;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.slop-trial-docket strong {
  display: block;
  margin: 8px 0 3px;
  color: var(--text);
  font: 900 3.2rem/.9 Arial Black,Arial,sans-serif;
  letter-spacing: -.06em;
}
.slop-trial-shell { padding: 34px 42px 0; }
.slop-trial-page .slop-trial-toolbar {
  max-width: 1180px;
  margin: 0 auto 12px;
}
.slop-trial-page .slop-trial-toolbar label { min-width: 0; }
.slop-trial-page .slop-trial-toolbar select { min-width: 210px; max-width: 100%; }
.slop-trial-page .slop-trial-card {
  display: grid;
  grid-template-columns: minmax(0,1.18fr) minmax(330px,.82fr);
  max-width: 1180px;
  min-height: 460px;
  margin: 0 auto;
  padding: 0;
  overflow: hidden;
}
.slop-trial-specimen {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(34px,4.5vw,58px);
}
.slop-trial-specimen > span {
  display: block;
  margin-bottom: 20px;
  color: var(--accent);
  font: 700 10px/1 Inter,sans-serif;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.slop-trial-page .slop-trial-card h2 {
  max-width: 100%;
  margin: 0 0 22px;
  font-size: clamp(3rem,5.7vw,5.8rem);
  line-height: .88;
  overflow-wrap: anywhere;
  text-wrap: balance;
}
.slop-trial-page .slop-trial-card .slop-trial-specimen > p {
  max-width: 620px;
  margin: 0;
  color: var(--muted);
  font: 17px/1.55 Georgia,serif;
}
.slop-trial-verdict {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(30px,4vw,48px);
  border-left: 1px solid var(--border);
  background: color-mix(in srgb,var(--surface) 78%,var(--bg));
}
.slop-trial-page .slop-trial-question {
  margin: 0 0 18px;
  font-size: clamp(2.2rem,4vw,3.8rem);
  line-height: .9;
}
.slop-trial-page .slop-vote-buttons button { min-height: 72px; font-size: 1.25rem; }
.slop-trial-page .slop-trial-status,
.slop-trial-page .slop-trial-result { max-width: 100%; }
.slop-trial-page .slop-next { align-self: flex-start; }
.slop-trial-links { max-width: 1180px; margin: 42px auto 0; }

@media (max-width: 900px) {
  .slop-trial-hero { grid-template-columns: 1fr; gap: 24px; }
  .slop-trial-docket { justify-self: start; max-width: none; }
  .slop-trial-page .slop-trial-card { grid-template-columns: 1fr; }
  .slop-trial-verdict { border-left: 0; border-top: 1px solid var(--border); }
}
@media (max-width: 600px) {
  .slop-trial-page { padding-bottom: 64px; }
  .slop-trial-hero { padding: 42px 20px 28px; }
  .slop-trial-hero h1 { font-size: clamp(3rem,14.5vw,4.6rem); }
  .slop-trial-shell { padding: 20px 20px 0; }
  .slop-trial-page .slop-trial-toolbar { align-items: stretch; flex-direction: column; }
  .slop-trial-page .slop-trial-toolbar select,
  .slop-trial-page .slop-trial-toolbar button { width: 100%; }
  .slop-trial-specimen,.slop-trial-verdict { padding: 28px 22px; }
  .slop-trial-page .slop-trial-card h2 { font-size: clamp(2.7rem,13vw,4.25rem); }
  .slop-trial-page .slop-vote-buttons { grid-template-columns: 1fr 1fr; }
  .slop-trial-links { margin: 28px 20px 0; }
}
/* slop-trial-redesign:end */
'''
showcase_file.write_text(showcase)

# 7. Regression tests for the specific layout failures.
test_file = ROOT / 'test' / 'culture-layout-audit.test.js'
test_file.write_text(r'''const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const culture = JSON.parse(fs.readFileSync('data/culture-articles.json', 'utf8'));
const products = fs.readFileSync('scripts/publish-culture-products.js', 'utf8');
const theme = fs.readFileSync('css/theme.css', 'utf8');
const css = fs.readFileSync('css/culture.css', 'utf8');
const showcase = fs.readFileSync('css/culture-showcase.css', 'utf8');

test('foidslop usernames does not use the unrelated Reddit bunny image as evidence', () => {
  const article = culture.articles.find(item => item.slug === 'foidslop-usernames');
  assert.ok(article);
  assert.equal((article.evidence || []).length, 0);
  assert.ok(article.sources.some(source => source.url.includes('reddit.com')));
});

test('Slop Trial uses the dedicated responsive court layout', () => {
  assert.match(products, /class=\\"slop-trial-page\\"/);
  assert.match(products, /class=\\"slop-trial-specimen\\"/);
  assert.match(products, /class=\\"slop-trial-verdict\\"/);
  assert.match(showcase, /grid-template-columns: minmax\(0,1\.18fr\) minmax\(330px,\.82fr\)/);
});

test('culture article titles and receipts have explicit size limits', () => {
  assert.match(theme, /culture-article:not\(\.foidslop-primer\) > h1/);
  assert.match(theme, /max-width: 1180px/);
  assert.match(css, /max-height: 620px/);
  assert.match(css, /width: auto/);
});

test('intermediate publication header drops decorative center copy before clipping', () => {
  assert.match(theme, /min-width: 801px\) and \(max-width: 1180px/);
  assert.match(theme, /site-header-center \{ display: none; \}/);
});
''')

print('Culture layout remediation source changes applied.')
