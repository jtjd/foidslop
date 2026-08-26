#!/usr/bin/env node

/**
 * Refreshes data/ratings.json from the live /api/ratings endpoint so the next
 * publish emits aggregateRating schema that matches reality.
 *
 * Usage: npm run sync:ratings [-- --site https://foidslop.com]
 * The script never fabricates data; a failed fetch leaves the cache untouched
 * and exits 1 (use --soft to warn and continue, e.g. before the API is live).
 */
const fs = require('fs');
const path = require('path');
const { normalizeSummaries } = require('./lib/ratings');

const soft = process.argv.includes('--soft');
const siteFlag = process.argv.indexOf('--site');
const SITE = siteFlag > -1 ? process.argv[siteFlag + 1] : 'https://foidslop.com';
const CACHE_FILE = path.join(process.cwd(), 'data', 'ratings.json');

async function main() {
  if (typeof fetch !== 'function') throw new Error('Node 18+ is required for fetch');
  const response = await fetch(`${SITE}/api/ratings`, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${SITE}/api/ratings`);
  const payload = await response.json();
  const summaries = normalizeSummaries(payload);
  const next = `${JSON.stringify(Object.fromEntries(Object.keys(summaries).sort().map(key => [key, summaries[key]])), null, 1)}\n`;
  const previousFile = fs.existsSync(CACHE_FILE) ? fs.readFileSync(CACHE_FILE, 'utf8').trim() : '';
  if (previousFile === next) {
    console.log(`Ratings cache already current (${Object.keys(summaries).length} recipe(s) with votes).`);
    return;
  }
  fs.writeFileSync(CACHE_FILE, `${next}\n`);
  console.log(`Ratings cache updated: ${Object.keys(summaries).length} recipe(s) with votes.`);
}

main().catch(error => {
  console.error(`Ratings sync failed: ${error.message}`);
  process.exit(soft ? 0 : 1);
});
