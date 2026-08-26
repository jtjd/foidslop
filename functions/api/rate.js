/**
 * POST /api/rate
 *
 * Records a reader recipe rating in Workers KV and returns the fresh
 * aggregate. Same-origin only; honeypot + per-visitor dedupe keep casual
 * spam out without third-party services.
 *
 * Required binding: KV namespace bound as RATINGS (see README).
 * Optional secret: VOTE_SALT strengthens voter hashing.
 */
import { applyVote, aggregate, isValidRating, SLUG_PATTERN } from '../../scripts/lib/ratings.js';

const MAX_BODY_BYTES = 400;
const VOTER_TTL_SECONDS = 60 * 60 * 24 * 30;
const ALLOWED_HOSTS = new Set(['foidslop.com', 'www.foidslop.com']);
const FALLBACK_SALT = 'foidslop-v1';

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extraHeaders }
  });
}

async function readJson(request) {
  const header = Number(request.headers.get('content-length') || '0');
  if (header > MAX_BODY_BYTES) return null;
  const text = await request.text();
  if (!text || text.length > MAX_BODY_BYTES) return null;
  try { return JSON.parse(text); } catch { return null; }
}

function sameOrigin(request) {
  const host = request.headers.get('host') || '';
  const hostname = host.replace(/:\d+$/, '');
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      const parsed = new URL(origin);
      if (parsed.host.replace(/:\d+$/, '') === hostname && (ALLOWED_HOSTS.has(hostname) || hostname.endsWith('.pages.dev'))) return true;
    } catch { return false; }
    return false;
  }
  const referer = request.headers.get('referer');
  if (!referer) return false;
  try { return new URL(referer).host.replace(/:\d+$/, '') === hostname; } catch { return false; }
}

async function hashVoter(value, salt) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${value}`));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const kv = env && env.RATINGS;
  if (!kv || typeof kv.get !== 'function') return json({ error: 'Ratings storage is not configured.' }, 503);
  if (!sameOrigin(request)) return json({ error: 'Cross-origin votes are not accepted.' }, 403);

  const body = await readJson(request);
  if (!body || typeof body !== 'object') return json({ error: 'Invalid request body.' }, 400);
  if (body.website) return json({ ok: true });
  const slug = typeof body.slug === 'string' ? body.slug : '';
  const rating = Number(body.rating);
  if (!SLUG_PATTERN.test(slug) || slug.length > 90 || !isValidRating(rating)) {
    return json({ error: 'Invalid slug or rating.' }, 400);
  }

  const countsKey = `counts:${slug}`;
  let counts;
  try {
    const stored = await kv.get(countsKey, 'json');
    counts = applyVote(stored, rating);
    await kv.put(countsKey, JSON.stringify(counts));
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    await kv.put(`voter:${await hashVoter(ip, env.VOTE_SALT || FALLBACK_SALT)}:${slug}`, '1', { expirationTtl: VOTER_TTL_SECONDS });
  } catch {
    return json({ error: 'Could not record the vote.' }, 503);
  }
  return json({ ok: true, slug, rating, summary: aggregate(counts) });
}

export async function onRequestGet() {
  return json({ error: 'Use POST to rate a recipe.' }, 405, { allow: 'POST' });
}
