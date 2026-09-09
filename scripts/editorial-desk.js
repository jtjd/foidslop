#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DESK_DIR = path.join(ROOT, 'data', 'editorial-desk');
const CULTURE_FILE = path.join(ROOT, 'data', 'culture-articles.json');

const STATUSES = new Set(['candidate', 'researching', 'draft', 'approved', 'rejected', 'published']);
const KINDS = new Set(['case', 'news', 'culture', 'explainer', 'internet']);
const SOURCE_TYPES = new Set([
  'court', 'government', 'official', 'academic', 'wire', 'local-news',
  'national-news', 'specialist', 'social', 'forum', 'video', 'blog', 'other'
]);
const CLAIM_TYPES = new Set(['fact', 'allegation', 'argument', 'testimony', 'analysis', 'reaction']);
const SENSITIVE_TYPES = new Set(['none', 'criminal', 'legal', 'medical']);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?Z)?$/;

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function storyFiles() {
  if (!fs.existsSync(DESK_DIR)) return [];
  return fs.readdirSync(DESK_DIR)
    .filter(name => name.endsWith('.json') && !name.startsWith('_'))
    .sort()
    .map(name => path.join(DESK_DIR, name));
}

function loadStories() {
  return storyFiles().map(file => ({ file, story: readJson(file) }));
}

function sourceLabel(source) {
  return `${source.publisher}: ${source.title}`;
}

function validateStory(story, file) {
  const errors = [];
  const where = path.relative(ROOT, file);
  const push = message => errors.push(`${where}: ${message}`);

  if (!SLUG.test(story.id || '')) push(`invalid id ${JSON.stringify(story.id)}`);
  if (!STATUSES.has(story.status)) push(`invalid status ${JSON.stringify(story.status)}`);
  if (!KINDS.has(story.kind)) push(`invalid kind ${JSON.stringify(story.kind)}`);
  if (!String(story.workingTitle || '').trim()) push('missing workingTitle');
  if (!ISO_DATE.test(story.discoveredAt || '')) push('invalid discoveredAt');
  if (!ISO_DATE.test(story.updatedAt || '')) push('invalid updatedAt');

  const score = Number(story.audience?.relevanceScore);
  if (!Number.isFinite(score) || score < 0 || score > 10) push('audience.relevanceScore must be 0-10');
  if (!Array.isArray(story.audience?.reasons) || story.audience.reasons.length < 1) push('audience.reasons needs at least one reason');

  const sources = Array.isArray(story.sources) ? story.sources : [];
  const sourceMap = new Map();
  for (const [index, source] of sources.entries()) {
    const label = `source ${index + 1}`;
    if (!SLUG.test(source.id || '')) push(`${label}: invalid id ${JSON.stringify(source.id)}`);
    if (sourceMap.has(source.id)) push(`${label}: duplicate id ${source.id}`);
    sourceMap.set(source.id, source);
    if (!Number.isInteger(source.tier) || source.tier < 1 || source.tier > 4) push(`${label}: tier must be 1-4`);
    if (!SOURCE_TYPES.has(source.type)) push(`${label}: invalid type ${JSON.stringify(source.type)}`);
    for (const field of ['publisher', 'title', 'url']) if (!String(source[field] || '').trim()) push(`${label}: missing ${field}`);
    if (!/^https:\/\//.test(source.url || '')) push(`${label}: url must use https`);
    if (source.publishedAt && !ISO_DATE.test(source.publishedAt)) push(`${label}: invalid publishedAt`);
    if (source.accessedAt && !ISO_DATE.test(source.accessedAt)) push(`${label}: invalid accessedAt`);
  }

  const claims = Array.isArray(story.claims) ? story.claims : [];
  const claimIds = new Set();
  for (const [index, claim] of claims.entries()) {
    const label = `claim ${index + 1}`;
    if (!SLUG.test(claim.id || '')) push(`${label}: invalid id ${JSON.stringify(claim.id)}`);
    if (claimIds.has(claim.id)) push(`${label}: duplicate id ${claim.id}`);
    claimIds.add(claim.id);
    if (!String(claim.text || '').trim()) push(`${label}: missing text`);
    if (!CLAIM_TYPES.has(claim.classification)) push(`${label}: invalid classification ${JSON.stringify(claim.classification)}`);
    const sensitive = claim.sensitivity || 'none';
    if (!SENSITIVE_TYPES.has(sensitive)) push(`${label}: invalid sensitivity ${JSON.stringify(sensitive)}`);

    const ids = Array.isArray(claim.sourceIds) ? claim.sourceIds : [];
    for (const id of ids) if (!sourceMap.has(id)) push(`${label}: unknown source ${id}`);
    const supporting = ids.map(id => sourceMap.get(id)).filter(Boolean);

    if (claim.classification !== 'analysis' && ids.length === 0) push(`${label}: ${claim.classification} claims require a source`);
    if (claim.classification === 'fact' && supporting.length && !supporting.some(source => source.tier <= 3)) {
      push(`${label}: factual claims need at least one tier 1-3 source`);
    }
    if (claim.classification === 'fact' && ['criminal', 'legal', 'medical'].includes(sensitive) && supporting.length && !supporting.some(source => source.tier <= 2)) {
      push(`${label}: sensitive factual claims need at least one tier 1-2 source`);
    }
    if (claim.classification === 'fact' && supporting.some(source => ['social', 'forum'].includes(source.type)) && !supporting.some(source => source.tier <= 3)) {
      push(`${label}: social/forum evidence cannot be the sole support for a factual claim`);
    }
  }

  if (['draft', 'approved', 'published'].includes(story.status)) {
    if (!String(story.angle || '').trim()) push('draft stories need angle');
    if (claims.length < 3) push('draft stories need at least three explicit claims');
    const draft = story.draft;
    if (!draft || typeof draft !== 'object') {
      push('draft stories need draft object');
    } else {
      const slug = draft.slug || story.id;
      if (!SLUG.test(slug)) push(`draft: invalid slug ${JSON.stringify(slug)}`);
      for (const field of ['title', 'seoTitle', 'description', 'eyebrow', 'deck']) {
        if (!String(draft[field] || '').trim()) push(`draft: missing ${field}`);
      }
      if ((draft.seoTitle || '').length > 68) push('draft: seoTitle exceeds 68 characters');
      if ((draft.description || '').length < 90 || (draft.description || '').length > 180) push('draft: description must be 90-180 characters');
      if (!Array.isArray(draft.sections) || draft.sections.length < 4) push('draft: needs at least four sections');
      for (const [sectionIndex, section] of (draft.sections || []).entries()) {
        if (!String(section.heading || '').trim()) push(`draft section ${sectionIndex + 1}: missing heading`);
        if (!Array.isArray(section.paragraphs) || section.paragraphs.length < 1) push(`draft section ${sectionIndex + 1}: needs paragraphs`);
      }
      const draftSourceIds = Array.isArray(draft.sourceIds) ? draft.sourceIds : [];
      if (draftSourceIds.length < 2) push('draft: needs at least two sourceIds');
      for (const id of draftSourceIds) if (!sourceMap.has(id)) push(`draft: unknown source ${id}`);
      if (!Array.isArray(draft.dictionaryLinks)) push('draft: dictionaryLinks must be an array');
    }
  }

  if (['approved', 'published'].includes(story.status)) {
    if (story.review?.humanApproved !== true) push('approved stories require review.humanApproved=true');
    if (story.review?.factCheckComplete !== true) push('approved stories require review.factCheckComplete=true');
    if (!ISO_DATE.test(story.review?.approvedAt || '')) push('approved stories require valid review.approvedAt');
  }

  return errors;
}

function validateAll(stories) {
  const errors = [];
  const ids = new Set();
  for (const { file, story } of stories) {
    if (ids.has(story.id)) errors.push(`${path.relative(ROOT, file)}: duplicate story id ${story.id}`);
    ids.add(story.id);
    errors.push(...validateStory(story, file));
  }
  return errors;
}

function materialize(story) {
  if (!['approved', 'published'].includes(story.status)) {
    throw new Error(`${story.id} must be approved before materialization`);
  }
  const draft = story.draft;
  const sourceMap = new Map((story.sources || []).map(source => [source.id, source]));
  const sourceIds = [...new Set(draft.sourceIds || [])];
  return {
    slug: draft.slug || story.id,
    title: draft.title,
    seoTitle: draft.seoTitle,
    description: draft.description,
    eyebrow: draft.eyebrow,
    deck: draft.deck,
    sections: draft.sections,
    dictionaryLinks: draft.dictionaryLinks || [],
    sources: sourceIds.map(id => sourceMap.get(id)).filter(Boolean).map(source => ({
      label: sourceLabel(source),
      url: source.url
    }))
  };
}

function findStory(stories, id) {
  return stories.find(item => item.story.id === id)?.story;
}

function list(stories) {
  for (const { story } of stories) {
    const score = Number(story.audience?.relevanceScore).toFixed(1);
    console.log(`${story.status.padEnd(11)} ${score.padStart(4)}  ${story.id}  ${story.workingTitle}`);
  }
}

function promote(story, write) {
  const article = materialize(story);
  if (!write) {
    console.log(JSON.stringify(article, null, 2));
    return;
  }

  const culture = readJson(CULTURE_FILE);
  const index = culture.articles.findIndex(item => item.slug === article.slug);
  if (index >= 0) culture.articles[index] = article;
  else culture.articles.push(article);
  culture.revisionDate = String(story.updatedAt).slice(0, 10);
  writeJson(CULTURE_FILE, culture);
  console.log(`Promoted ${story.id} -> data/culture-articles.json`);
}

const command = process.argv[2] || 'check';
const stories = loadStories();
const errors = validateAll(stories);

if (errors.length) {
  errors.forEach(error => console.error(`ERROR ${error}`));
  fail(`Editorial desk validation failed with ${errors.length} error(s).`);
  return;
}

if (command === 'check') {
  console.log(`Editorial desk OK: ${stories.length} story packet(s).`);
} else if (command === 'list') {
  list(stories);
} else if (command === 'materialize' || command === 'promote') {
  const id = process.argv[3];
  if (!id) {
    fail(`Usage: node scripts/editorial-desk.js ${command} <story-id>${command === 'promote' ? ' [--write]' : ''}`);
    return;
  }
  const story = findStory(stories, id);
  if (!story) {
    fail(`Unknown editorial story: ${id}`);
    return;
  }
  if (command === 'materialize') console.log(JSON.stringify(materialize(story), null, 2));
  else promote(story, process.argv.includes('--write'));
} else {
  fail('Usage: node scripts/editorial-desk.js [check|list|materialize <id>|promote <id> [--write]]');
}
