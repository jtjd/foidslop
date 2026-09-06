/** GET /api/slop-votes?ids=twilight,nana */
import { ITEM_PATTERN, aggregate } from '../../scripts/lib/slop-votes.js';

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extraHeaders }
  });
}

function storage(env) {
  return env && (env.SLOP_VOTES || env.RATINGS);
}

export async function onRequestGet(context) {
  const kv = storage(context.env);
  if (!kv || typeof kv.get !== 'function') return json({ error: 'Slop Trial storage is not configured.' }, 503);
  const raw = new URL(context.request.url).searchParams.get('ids') || '';
  const ids = [...new Set(raw.split(',').map(value => value.trim()).filter(Boolean))].slice(0, 40);
  if (!ids.length || ids.some(id => !ITEM_PATTERN.test(id) || id.length > 80)) return json({ error: 'Supply valid trial ids.' }, 400);

  try {
    const output = {};
    for (const id of ids) output[id] = aggregate(await kv.get(`slop:counts:${id}`, 'json'));
    return json(output, 200, { 'cache-control': 'public, max-age=60' });
  } catch {
    return json({ error: 'Could not read Slop Trial results.' }, 503);
  }
}
