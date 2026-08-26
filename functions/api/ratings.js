/**
 * GET /api/ratings
 *
 * Public aggregate of every recorded recipe rating:
 *   { "baked-feta-pasta": { "count": 12, "average": 4.5 }, ... }
 *
 * scripts/sync-ratings.js consumes this into data/ratings.json so builds can
 * emit matching aggregateRating schema. Safe to cache publicly.
 */
import { aggregate, normalizeCounts } from '../../scripts/lib/ratings.js';

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extraHeaders }
  });
}

export async function onRequestGet(context) {
  const kv = context.env && context.env.RATINGS;
  if (!kv || typeof kv.list !== 'function') return json({ error: 'Ratings storage is not configured.' }, 503);

  const output = {};
  try {
    let cursor;
    do {
      const page = await kv.list({ prefix: 'counts:', cursor });
      for (const key of page.keys) {
        const slug = key.name.slice('counts:'.length);
        const stored = normalizeCounts(await context.env.RATINGS.get(key.name, 'json'));
        const summary = aggregate(stored);
        if (summary) output[slug] = { count: summary.count, average: summary.average };
      }
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
  } catch {
    return json({ error: 'Could not read ratings.' }, 503);
  }

  // Sort keys so the payload is stable for caching and diffing.
  const sorted = Object.fromEntries(Object.keys(output).sort().map(slug => [slug, output[slug]]));
  return json(sorted, 200, { 'cache-control': 'public, max-age=900' });
}
