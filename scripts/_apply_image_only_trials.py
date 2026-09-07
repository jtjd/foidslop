from pathlib import Path
import re

_real_re_sub = re.sub
def _literal_sub(pattern, repl, string, count=0, flags=0):
    if isinstance(repl, str):
        return _real_re_sub(pattern, lambda _match: repl, string, count=count, flags=flags)
    return _real_re_sub(pattern, repl, string, count=count, flags=flags)
re.sub = _literal_sub

ROOT = Path('.')

# --- publisher -------------------------------------------------------------
p = ROOT / 'scripts/publish-culture-products.js'
s = p.read_text()

anchor = "const trials = read('data/slop-trials.json');\n"
if 'const publishedTrials =' not in s:
    s = s.replace(anchor, anchor + "const publishedTrials = (trials.items || []).filter(item => item.image && item.imageAlt && fs.existsSync(path.join(ROOT, item.image.replace(/^\\/+/, ''))));\n")

s = s.replace(
    "const activeCurrent = trials.items.filter(candidate => candidate.kind === 'current' && (!candidate.activeFrom || candidate.activeFrom <= today) && (!candidate.activeUntil || candidate.activeUntil >= today));",
    "const activeCurrent = publishedTrials.filter(candidate => candidate.kind === 'current' && (!candidate.activeFrom || candidate.activeFrom <= today) && (!candidate.activeUntil || candidate.activeUntil >= today));"
)
s = s.replace(
    "const currentCount = activeCurrent.length || trials.items.filter(candidate => candidate.kind === 'current').length;",
    "const currentCount = activeCurrent.length || publishedTrials.filter(candidate => candidate.kind === 'current').length;"
)
s = s.replace("  const classicCount = trials.items.filter(candidate => candidate.kind === 'evergreen').length;\n", "")
s = s.replace(
    '<div class="slop-trial-nav"><div class="slop-trial-modes" role="group" aria-label="Trial set"><button type="button" data-trial-mode="current" aria-pressed="true">Current</button><button type="button" data-trial-mode="classics" aria-pressed="false">Classics</button></div><nav class="slop-trial-categories"',
    '<div class="slop-trial-nav"><nav class="slop-trial-categories"'
)
s = s.replace(
    '<img data-trial-image src="" alt="" width="960" height="640" decoding="async"><div class="slop-trial-media-fallback" data-trial-image-fallback hidden><span data-trial-image-category></span><strong data-trial-image-name></strong></div>',
    '<img data-trial-image src="" alt="" width="960" height="640" decoding="async">'
)
s = s.replace("${scriptData('slop-trial-data', trials.items)}", "${scriptData('slop-trial-data', publishedTrials)}")
s = s.replace(
    "const activeTrials = trials.items.filter(item => item.kind === 'current' && (!item.activeFrom || item.activeFrom <= today) && (!item.activeUntil || item.activeUntil >= today));",
    "const activeTrials = publishedTrials.filter(item => item.kind === 'current' && (!item.activeFrom || item.activeFrom <= today) && (!item.activeUntil || item.activeUntil >= today));"
)
s = s.replace(
    "const trialPool = activeTrials.length ? activeTrials : trials.items.filter(item => item.kind === 'evergreen');",
    "const trialPool = activeTrials.length ? activeTrials : publishedTrials.filter(item => item.kind === 'current');"
)
s = s.replace("...trials.items.map(item => `culture/is-it-foidslop/${item.id}`)", "...publishedTrials.map(item => `culture/is-it-foidslop/${item.id}`)")
s = s.replace(
    "for (const item of trials.items) if (!fs.existsSync(path.join(ROOT, `culture/is-it-foidslop/${item.id}.html`))) throw new Error(`Missing generated Slop Trial share page: ${item.id}`);",
    "for (const item of publishedTrials) if (!fs.existsSync(path.join(ROOT, `culture/is-it-foidslop/${item.id}.html`))) throw new Error(`Missing generated Slop Trial share page: ${item.id}`);"
)
s = s.replace(
    "write('culture/is-it-foidslop.html', renderTrialPage());\nfor (const item of trials.items) write(`culture/is-it-foidslop/${item.id}.html`, renderTrialPage(item));",
    "fs.rmSync(path.join(ROOT, 'culture', 'is-it-foidslop'), { recursive: true, force: true });\nwrite('culture/is-it-foidslop.html', renderTrialPage());\nfor (const item of publishedTrials) write(`culture/is-it-foidslop/${item.id}.html`, renderTrialPage(item));"
)
s = s.replace(
    "console.log(`Culture products source is valid: ${trials.items.length} trials, ${Object.keys(usernames.categories).length} username departments, ${taxonomy.branches.length} taxonomy branches.`);",
    "console.log(`Culture products source is valid: ${publishedTrials.length} image-backed published trials (${trials.items.length} source entries), ${Object.keys(usernames.categories).length} username departments, ${taxonomy.branches.length} taxonomy branches.`);"
)

needle = "  if ((trials.items || []).filter(item => item.kind === 'current').length < 8) errors.push('Slop Trials needs a substantive current-events pool');\n"
if 'approved image-backed published items' not in s:
    s = s.replace(needle, needle + "  if (publishedTrials.length < 6) errors.push('Slop Trials needs at least six approved image-backed published items');\n  for (const item of publishedTrials) {\n    if (!item.image || !item.imageAlt) errors.push(`Published Slop Trial ${item.id}: display image is required`);\n    else if (!fs.existsSync(path.join(ROOT, item.image.replace(/^\\//, '')))) errors.push(`Published Slop Trial ${item.id}: missing display image ${item.image}`);\n  }\n")

p.write_text(s)

# --- browser runtime -------------------------------------------------------
p = ROOT / 'culture/slop-tools.js'
s = p.read_text()
for line in [
    "    const imageFallback = root.querySelector('[data-trial-image-fallback]');\n",
    "    const imageCategory = root.querySelector('[data-trial-image-category]');\n",
    "    const imageName = root.querySelector('[data-trial-image-name]');\n",
]:
    s = s.replace(line, '')

s = re.sub(r"\n    function fallbackMarkup\(item\) \{[\s\S]*?\n    \}\n\n    function cardMarkup", "\n    function cardMarkup", s, count=1)
s = re.sub(
    r"      const visual = item\.image[\s\S]*?      return `\$\{visual\}",
    "      const visual = `<span class=\"slop-feed-visual\"><img src=\"${item.image}\" alt=\"\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\"></span>`;\n      return `${visual}",
    s,
    count=1,
)
s = re.sub(r"\n    function wireQueueImageFallbacks\(\) \{[\s\S]*?\n    \}\n", "\n", s, count=1)
s = s.replace("      wireQueueImageFallbacks();\n", "")
s = re.sub(r"\n    function showFallback\(item\) \{[\s\S]*?\n    \}\n", "\n", s, count=1)
old = "      if (item.image) {\n        image.hidden = false;\n        imageFallback.hidden = true;\n        image.alt = item.imageAlt || '';\n        image.onerror = () => showFallback(item);\n        image.src = item.image;\n      } else {\n        showFallback(item);\n      }"
new = "      image.hidden = false;\n      image.alt = item.imageAlt;\n      image.src = item.image;"
s = s.replace(old, new)
p.write_text(s)

# --- Weekly Slop -----------------------------------------------------------
p = ROOT / 'scripts/weekly-community.js'
s = p.read_text()
old = "const slopTrial = slopTrials.items.length ? slopTrials.items[weekSeed % slopTrials.items.length] : null;"
new = "const slopTrialPool = slopTrials.items.filter(item => item.kind === 'current' && item.image && fs.existsSync(path.join(ROOT, item.image.replace(/^\\//, ''))) && (!item.activeFrom || item.activeFrom <= window.opensDate) && (!item.activeUntil || item.activeUntil >= window.opensDate));\n  const slopTrial = slopTrialPool.length ? slopTrialPool[weekSeed % slopTrialPool.length] : null;"
s = s.replace(old, new)
s = s.replace('https://foidslop.com/culture/is-it-foidslop?item=${encodeURIComponent(slopTrial.id)}', 'https://foidslop.com/culture/is-it-foidslop/${encodeURIComponent(slopTrial.id)}')
p.write_text(s)

# --- tests -----------------------------------------------------------------
p = ROOT / 'test/slop-trial-editorial.test.js'
s = p.read_text()
s = re.sub(
    r"test\('Slop Trial defaults to a sourced visual current-events pool',[\s\S]*?\n\}\);",
    r'''test('Slop Trial publishes only real image-backed current items', () => {
  const published = trials.items.filter(item => item.kind === 'current' && item.image);
  assert.ok(published.length >= 6);
  for (const item of published) {
    assert.match(item.sourceUrl, /^https:\/\//);
    assert.ok(item.whyNow.length >= 25);
    assert.match(item.activeFrom, /^2026-/);
    assert.match(item.activeUntil, /^2026-/);
    assert.match(item.image, /^\/culture\/trials\/[a-z0-9-]+\.webp$/);
    assert.ok(item.imageAlt.length >= 20);
    assert.ok(fs.existsSync(item.image.replace(/^\//, '')), `missing ${item.image}`);
  }
  const payloadMatch = page.match(/<script type="application\/json" id="slop-trial-data">([\s\S]*?)<\/script>/);
  assert.ok(payloadMatch);
  const payload = JSON.parse(payloadMatch[1]);
  assert.ok(payload.length >= 6);
  assert.ok(payload.every(item => item.image && item.imageAlt));
  assert.doesNotMatch(page, /data-trial-mode="classics"/);
  assert.doesNotMatch(page, /data-trial-image-fallback/);
});''',
    s,
    count=1,
)
s = s.replace("assert.match(page, /Current fashion, media, food, games and internet stuff/);", "assert.match(page, /things from this week's feed/i);")
s = s.replace("  assert.match(page, /data-trial-image-fallback/);\n", "  assert.doesNotMatch(page, /data-trial-image-fallback/);\n")
p.write_text(s)

p = ROOT / 'test/culture-products.test.js'
s = p.read_text()
s = s.replace(
    "  assert.match(publisher, /const activeTrials = trials\\.items\\.filter/);",
    "  assert.match(publisher, /const activeTrials = publishedTrials\\.filter/);"
)
s = s.replace(
    "  for (const item of trials.items) {\n    const sharePath = `culture/is-it-foidslop/${item.id}.html`;",
    "  for (const item of trials.items.filter(item => item.image)) {\n    const sharePath = `culture/is-it-foidslop/${item.id}.html`;"
)
s = re.sub(
    r"\ntest\('current Slop Trial visuals fail closed instead of shipping bad screenshots',[\s\S]*?\n\}\);",
    r'''
test('Slop Trial public surface has no image-less cards or fallbacks', () => {
  const page = file('culture/is-it-foidslop.html');
  const payload = JSON.parse(page.match(/<script type="application\/json" id="slop-trial-data">([\s\S]*?)<\/script>/)[1]);
  assert.ok(payload.length >= 6);
  assert.ok(payload.every(item => item.image && item.imageAlt));
  assert.doesNotMatch(page, /data-trial-image-fallback/);
  assert.doesNotMatch(page, /data-trial-mode="classics"/);
  const runtime = file('culture/slop-tools.js');
  assert.doesNotMatch(runtime, /fallbackMarkup|showFallback|slop-feed-fallback/);
});''',
    s,
    count=1,
)
p.write_text(s)

print('Applied image-only Slop Trial publishing contract.')
