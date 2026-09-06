const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dictionary = JSON.parse(fs.readFileSync(path.join(root, 'data', 'dictionary.json'), 'utf8'));
const culture = JSON.parse(fs.readFileSync(path.join(root, 'data', 'culture-articles.json'), 'utf8'));
const index = JSON.parse(fs.readFileSync(path.join(root, 'data', 'slop-index.json'), 'utf8'));

function strings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach(item => strings(item, out));
  else if (value && typeof value === 'object') Object.values(value).forEach(item => strings(item, out));
  return out;
}

const abstractCultureVoice = [
  /\bvibe cluster\b/i,
  /\bfeminine (?:online )?(?:vibe|energy)\b/i,
  /\bcultural object\b/i,
  /\blinguistic ecosystem\b/i,
  /\bproductive (?:internet )?(?:slang|label|suffix)\b/i,
  /\btransport layer\b/i,
  /\bworking definition and taxonomy\b/i
];

const staleAiVoice = [
  /\u2014/,
  /\bdelve(?:s|d)?\b/i,
  /\btapestry\b/i,
  /\bin today(?:'s|’s) (?:digital )?(?:world|landscape)\b/i,
  /\bit is important to (?:note|remember|understand)\b/i,
  /\bserves as a testament\b/i,
  /\bnavigate the complexities\b/i,
  /\bpoisoned internet\b/i,
  /\bunfortunate vocabulary\b/i,
  /\bcursed vocabulary\b/i,
  /\bcivilizational decline\b/i,
  /\bdehumanizing piece\b/i,
  /\bhostile vocabulary\b/i,
  /\breclaim(?:ed|ing)\b/i
];

test('culture expansion has a substantive launch set', () => {
  assert.ok(dictionary.entries.length >= 10, 'expected at least 10 dictionary entries');
  assert.ok(culture.articles.length >= 6, 'expected at least 6 culture articles');
  assert.ok(index.items.length >= 10, 'expected at least 10 Slop Index entries');
});

test('existing branded search routes stay canonical', () => {
  const bySlug = new Map(dictionary.entries.map(entry => [entry.slug, entry]));
  assert.equal(bySlug.get('foidslop').route, 'what-is-foidslop');
  assert.equal(bySlug.get('foid').route, 'what-does-foid-mean');
});

test('foidslop baseline stays concrete and origin-forward', () => {
  const foidslop = dictionary.entries.find(entry => entry.slug === 'foidslop');
  assert.match(foidslop.deck, /^Foidslop is a catch-all for female-coded slop:/);
  assert.match(foidslop.deck, /girl dinner/);
  assert.match(foidslop.deck, /4chan\/incel slang/);
  assert.match(foidslop.definition, /foid, 4chan\/incel slang for a woman/);
  assert.doesNotMatch(foidslop.deck, /\b(?:vibe|energy|reclaim|problematic)\b/i);
});

test('published culture copy avoids em dashes and stock AI voice', () => {
  for (const [name, source] of [['dictionary', dictionary], ['culture', culture], ['slop-index', index]]) {
    for (const value of strings(source)) {
      for (const pattern of [...staleAiVoice, ...abstractCultureVoice]) assert.doesNotMatch(value, pattern, `${name} copy matched ${pattern}: ${value}`);
    }
  }
});

test('dictionary pages are sourced and internally connected', () => {
  const slugs = new Set(dictionary.entries.map(entry => entry.slug));
  for (const entry of dictionary.entries) {
    assert.ok(entry.definition.length >= 80, `thin definition: ${entry.slug}`);
    assert.ok(entry.sections.length >= 3, `thin dictionary entry: ${entry.slug}`);
    for (const related of entry.related || []) assert.ok(slugs.has(related), `unknown related term ${related} on ${entry.slug}`);
    for (const source of entry.sources || []) assert.match(source.url, /^https:\/\//);
  }
});

test('culture articles contain real editorial sections and source links', () => {
  for (const article of culture.articles) {
    assert.ok(article.sections.length >= 4, `thin article: ${article.slug}`);
    assert.ok(article.deck.length >= 60, `thin deck: ${article.slug}`);
    assert.ok(article.sections.every(section => section.paragraphs.length >= 2), `section missing depth: ${article.slug}`);
    for (const source of article.sources || []) assert.match(source.url, /^https:\/\//);
  }
});

test('Slop Index classifies media rather than people', () => {
  for (const item of index.items) {
    assert.ok(item.verdict.length >= 70, `thin verdict: ${item.id}`);
    assert.ok(Number(item.foidDensity) >= 0 && Number(item.foidDensity) <= 100);
    assert.ok(Number(item.maleUnderstandability) >= 0 && Number(item.maleUnderstandability) <= 100);
    assert.ok(item.type, `missing media type: ${item.id}`);
  }
});
