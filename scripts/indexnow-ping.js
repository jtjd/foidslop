#!/usr/bin/env node

/**
 * Pings api.indexnow.org with every URL whose sitemap lastmod changed today,
 * plus the homepage. Run AFTER the Cloudflare Pages deploy has gone live:
 *   npm run publish && npm run ping:indexnow
 *
 * Exit codes: 0 accepted or 202 pending, 1 on failure. --soft never fails.
 */
const fs = require('fs');
const path = require('path');
const { KEY, HOST, selectUpdatedUrls, pingPayload } = require('./lib/ping-config');

const soft = process.argv.includes('--soft');
const endpoint = 'https://api.indexnow.org/IndexNow';
const sitemapPath = path.join(process.cwd(), 'sitemap.xml');

function newYorkDate() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date()).reduce((out, part) => (out[part.type] = part.value, out), {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

async function main() {
  if (typeof fetch !== 'function') throw new Error('Node 18+ is required for fetch');
  const sitemapXml = fs.readFileSync(sitemapPath, 'utf8');
  const urls = selectUpdatedUrls(sitemapXml, newYorkDate());
  if (!urls.length) {
    console.log('IndexNow: nothing changed in the sitemap today; skipping.');
    return;
  }
  // The key file must be live before engines accept a submission.
  const keyResponse = await fetch(`${HOST}/${KEY}.txt`);
  if (!keyResponse.ok) throw new Error(`Key file not reachable at /${KEY}.txt (HTTP ${keyResponse.status}). Deploy first.`);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(pingPayload(urls))
  });
  if (response.ok || response.status === 202) {
    console.log(`IndexNow: submitted ${urls.length} URL(s); HTTP ${response.status}.`);
    return;
  }
  throw new Error(`IndexNow rejected the submission: HTTP ${response.status} ${await response.text()}`);
}

main().catch(error => {
  console.error(`IndexNow ping failed: ${error.message}`);
  process.exit(soft ? 0 : 1);
});
