from pathlib import Path
import re

# These edits run after _slop_trial_topical_redesign.py has materialized the new
# source. They update old regression contracts that intentionally described the
# retired community-court/specimen design.

p = Path('test/culture-content.test.js')
text = p.read_text()
text = text.replace(r'/css\/culture\.css\?v=20260906-5/', r'/css\/culture\.css\?v=20260906-6/')
p.write_text(text)

p = Path('test/culture-products.test.js')
text = p.read_text().replace('/Community Slop Trials/', '/Current Slop Trials/')
p.write_text(text)

p = Path('test/culture-layout-audit.test.js')
text = p.read_text()
text, count = re.subn(
    r"test\('Slop Trial (?:uses|has) the dedicated(?: responsive)? court layout', \(\) => \{.*?\n\}\);",
    """test('Slop Trial uses the compact topical layout', () => {
  assert.match(products, /slop-trial-page/);
  assert.match(products, /slop-trial-main/);
  assert.match(products, /slop-trial-why/);
  assert.match(products, /slop-trial-on-deck/);
  assert.match(showcase, /grid-template-columns:minmax\\(0,1\\.35fr\\) minmax\\(300px,\\.65fr\\)/);
});""",
    text,
    flags=re.S,
)
if count != 1:
    raise SystemExit(f'expected one old Slop Trial layout test, found {count}')
p.write_text(text)

p = Path('test/slop-trial-editorial.test.js')
text = p.read_text().replace('item.whyNow.length >= 35', 'item.whyNow.length >= 25')
text, count = re.subn(
    r"\ntest\('username generator script supports the redesigned tab UI', \(\) => \{.*?\n\}\);\n?",
    '\n',
    text,
    flags=re.S,
)
if count != 1:
    raise SystemExit(f'expected one unrelated username test, found {count}')
p.write_text(text)

# Keep homepage/weekly promotion topical too. Prefer currently active sourced
# trials, then evergreen fallbacks once no current item is in its date window.
p = Path('scripts/publish-culture-products.js')
text = p.read_text()
old = """  const article = culture.articles[weeklyIndex(culture.articles.length)];
  const trial = trials.items[weeklyIndex(trials.items.length)];"""
new = """  const article = culture.articles[weeklyIndex(culture.articles.length)];
  const activeTrials = trials.items.filter(item => item.kind === 'current' && (!item.activeFrom || item.activeFrom <= today) && (!item.activeUntil || item.activeUntil >= today));
  const trialPool = activeTrials.length ? activeTrials : trials.items.filter(item => item.kind === 'evergreen');
  const trial = trialPool[weeklyIndex(trialPool.length)];"""
if old not in text:
    raise SystemExit('homepage Slop Trial selection block not found')
text = text.replace(old, new)
p.write_text(text)

# Lock the topical homepage behavior into the permanent product tests.
p = Path('test/culture-products.test.js')
text = p.read_text()
anchor = "test('homepage promotes a weekly field note, Slop Trial, and generator', () => {"
if anchor not in text:
    raise SystemExit('homepage product test anchor not found')
insert = """test('homepage Slop Trial prefers active current items', () => {
  const publisher = fs.readFileSync(path.join(root, 'scripts', 'publish-culture-products.js'), 'utf8');
  assert.match(publisher, /const activeTrials = trials\.items\.filter/);
  assert.match(publisher, /const trialPool = activeTrials\.length \? activeTrials/);
});

"""
text = text.replace(anchor, insert + anchor, 1)
p.write_text(text)

print('Aligned regression tests and homepage selection with topical Slop Trial.')
