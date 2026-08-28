/**
 * Return the substantive page content used to decide sitemap freshness.
 * Global navigation, issue counters, and footers change independently of the
 * page's search-facing content and must not churn <lastmod> dates.
 */
function sitemapFingerprint(html) {
  const source = String(html || '');
  const main = source.match(/<main\b[^>]*>[\s\S]*?<\/main>/i);
  if (main) return main[0];
  const body = source.match(/<body\b[^>]*>[\s\S]*?<\/body>/i);
  return body ? body[0] : source;
}

module.exports = { sitemapFingerprint };
