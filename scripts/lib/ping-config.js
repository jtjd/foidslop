/**
 * Shared IndexNow configuration. The key file must be reachable at
 * https://foidslop.com/<key>.txt; scripts/build-deploy.js writes it into the
 * deployment from the constant here.
 */
const KEY = 'd7438504d36d103a9785be4a5e2d2397';
const HOST = 'https://foidslop.com';
const HOSTNAME = 'foidslop.com';

if (!/^[a-f0-9]{32}$/.test(KEY)) throw new Error('IndexNow key must be 32 hex characters');

module.exports = { KEY, HOST, HOSTNAME };

/** URLs whose sitemap lastmod is on or after the given date, plus homepage. */
function selectUpdatedUrls(sitemapXml, isoDate) {
  const locations = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  const updated = new Set([`${HOST}/`]);
  for (const block of sitemapXml.split('<url>').slice(1)) {
    const loc = (block.match(/<loc>([^<]+)<\/loc>/) || [])[1];
    const lastmod = (block.match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1];
    if (!loc || !lastmod) continue;
    if (lastmod.slice(0, 10) >= isoDate) updated.add(loc);
  }
  return [...updated].filter(url => locations.includes(url));
}

function pingPayload(urls) {
  return {
    host: HOSTNAME,
    key: KEY,
    keyLocation: `${HOST}/${KEY}.txt`,
    urlList: urls
  };
}

module.exports.selectUpdatedUrls = selectUpdatedUrls;
module.exports.pingPayload = pingPayload;
