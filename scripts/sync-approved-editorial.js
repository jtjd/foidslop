#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DESK_DIR = path.join(ROOT, 'data', 'editorial-desk');
const CULTURE_FILE = path.join(ROOT, 'data', 'culture-articles.json');
const write = process.argv.includes('--write');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function materialize(story) {
  const sourceMap = new Map((story.sources || []).map(source => [source.id, source]));
  const draft = story.draft;
  return {
    slug: draft.slug || story.id,
    title: draft.title,
    seoTitle: draft.seoTitle,
    description: draft.description,
    eyebrow: draft.eyebrow,
    deck: draft.deck,
    sections: draft.sections,
    dictionaryLinks: draft.dictionaryLinks || [],
    sources: [...new Set(draft.sourceIds || [])]
      .map(id => sourceMap.get(id))
      .filter(Boolean)
      .map(source => ({
        label: `${source.publisher}: ${source.title}`,
        url: source.url
      }))
  };
}

const culture = readJson(CULTURE_FILE);
const stories = fs.existsSync(DESK_DIR)
  ? fs.readdirSync(DESK_DIR)
      .filter(name => name.endsWith('.json') && !name.startsWith('_'))
      .map(name => readJson(path.join(DESK_DIR, name)))
  : [];

const approved = stories
  .filter(story => ['approved', 'published'].includes(story.status))
  .filter(story => story.review?.humanApproved === true && story.review?.factCheckComplete === true)
  .filter(story => story.draft && typeof story.draft === 'object')
  .sort((a, b) => String(b.review?.approvedAt || b.updatedAt).localeCompare(String(a.review?.approvedAt || a.updatedAt)));

let changed = false;
for (const story of approved) {
  const article = materialize(story);
  const existingIndex = culture.articles.findIndex(item => item.slug === article.slug);
  if (existingIndex >= 0) culture.articles.splice(existingIndex, 1);
  culture.articles.unshift(article);
  const revision = String(story.review?.approvedAt || story.updatedAt).slice(0, 10);
  if (revision > culture.revisionDate) culture.revisionDate = revision;
  changed = true;
}

if (!changed) {
  console.log('No approved editorial stories to sync.');
  process.exit(0);
}

if (write) {
  fs.writeFileSync(CULTURE_FILE, `${JSON.stringify(culture, null, 2)}\n`);
  console.log(`Synced ${approved.length} approved editorial story/stories into data/culture-articles.json.`);
} else {
  console.log(`Approved editorial sync ready: ${approved.length} story/stories.`);
}
