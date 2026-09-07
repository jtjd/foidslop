const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { normalizeCounts, applyVote, aggregate } = require('../scripts/lib/slop-votes');

const root = path.join(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const dictionary = read('data/dictionary.json');
const culture = read('data/culture-articles.json');
const trials = read('data/slop-trials.json');
const usernames = read('data/username-generator.json');
const taxonomy = read('data/slop-taxonomy.json');

function file(name) { return fs.readFileSync(path.join(root, name), 'utf8'); }

test('remaining launch dictionary cluster is present', () => {
  const slugs = new Set(dictionary.entries.map(entry => entry.slug));
  assert.ok(dictionary.entries.length >= 15);
  for (const slug of ['guyslop', 'wifechow', 'girl-breakfast', 'content-slop']) assert.ok(slugs.has(slug), `missing ${slug}`);
});

test('remaining culture cluster is present', () => {
  const slugs = new Set(culture.articles.map(article => article.slug));
  for (const slug of ['foidslop-media-canon', 'internet-gendered-food-taxonomy', 'when-did-everyone-start-saying-mog']) assert.ok(slugs.has(slug), `missing ${slug}`);
});

test('Slop Trial vote math is stable', () => {
  assert.deepEqual(normalizeCounts(null), { yes: 0, no: 0 });
  const counts = applyVote(applyVote(null, 'yes'), 'no');
  assert.deepEqual(counts, { yes: 1, no: 1 });
  assert.deepEqual(aggregate({ yes: 3, no: 1 }), { yes: 3, no: 1, total: 4, percentYes: 75 });
});

test('Slop Trial source has enough varied candidates', () => {
  assert.ok(trials.items.length >= 20);
  assert.ok(new Set(trials.items.map(item => item.id)).size === trials.items.length);
  assert.ok(new Set(trials.items.map(item => item.category)).size >= 7);
});

test('username generator uses curated departments and real word banks', () => {
  assert.ok(Object.keys(usernames.categories).length >= 5);
  for (const group of Object.values(usernames.categories)) {
    assert.ok(group.bases.length >= 8);
    assert.ok(group.modifiers.length >= 8);
    assert.ok(group.suffixes.length >= 8);
  }
});

test('Slop Taxonomy links into the actual publication', () => {
  assert.ok(taxonomy.branches.length >= 4);
  const hrefs = taxonomy.branches.flatMap(branch => branch.items.map(item => item.href));
  assert.ok(hrefs.includes('/what-is-foidslop'));
  assert.ok(hrefs.includes('/dictionary/guyslop'));
  assert.ok(hrefs.includes('/dictionary/content-slop'));
  assert.ok(hrefs.includes('/culture/foidslop-media'));
});

test('interactive product pages are generated and wired', () => {
  for (const page of ['culture/is-it-foidslop.html', 'culture/username-generator.html', 'culture/slop-taxonomy.html', 'about.html']) assert.ok(fs.existsSync(path.join(root, page)), `missing ${page}`);
  assert.match(file('culture/is-it-foidslop.html'), /data-slop-trial/);
  assert.match(file('culture/is-it-foidslop.html'), /Vote on the current feed/);
  assert.match(file('culture/username-generator.html'), /data-username-generator/);
  assert.match(file('culture/slop-taxonomy.html'), /taxonomy-root/);
  assert.match(file('culture/slop-tools.js'), /\/api\/slop-vote/);
});

test('Slop Trial storage is isolated from recipe rating keys', () => {
  const vote = file('functions/api/slop-vote.js');
  const results = file('functions/api/slop-votes.js');
  assert.match(vote, /SLOP_VOTES \|\| env\.RATINGS/);
  assert.match(vote, /slop:voter:/);
  assert.match(vote, /slop:counts:/);
  assert.match(results, /slop:counts:/);
  assert.doesNotMatch(vote, /`counts:\$\{id\}`/);
});

test('homepage Slop Trial prefers active current items', () => {
  const publisher = fs.readFileSync(path.join(root, 'scripts', 'publish-culture-products.js'), 'utf8');
  assert.match(publisher, /const activeTrials = trials\.items\.filter/);
  assert.match(publisher, /const trialPool = activeTrials\.length \? activeTrials/);
});

test('homepage promotes a weekly field note, Slop Trial, and generator', () => {
  const home = file('index.html');
  assert.match(home, /zine-culture-week/);
  assert.match(home, /SLOP TRIAL/);
  assert.match(home, /culture\/username-generator/);
  assert.ok(home.indexOf('zine-culture-week') < home.indexOf('zine-newsletter zine-newsletter-repeat'));
});

test('primary footer no longer advertises editorial standards', () => {
  const home = file('index.html');
  const footer = home.slice(home.lastIndexOf('<footer'));
  assert.doesNotMatch(footer, />Editorial standards</);
  assert.match(footer, />Dictionary</);
  assert.match(footer, />Culture</);
  assert.match(footer, />About</);
});

test('weekly dispatch includes culture and a Slop Trial', () => {
  const weekly = file('scripts/weekly-community.js');
  assert.match(weekly, /ELSEWHERE IN THE SLOP/);
  assert.match(weekly, /SLOP TRIAL/);
  assert.match(weekly, /culture\/is-it-foidslop/);
});
