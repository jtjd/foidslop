/**
 * POST /api/slop-vote
 * Records one YES/NO Slop Trial vote per visitor/item for 90 days.
 * Preferred binding: SLOP_VOTES. RATINGS is a safe fallback because all
 * keys use the isolated slop: prefix and never overlap recipe rating keys.
 */
import { ITEM_PATTERN, VOTES, applyVote, aggregate } from '../../scripts/lib/slop-votes.js';

const MAX_BODY_BYTES = 320;
const VOTER_TTL_SECONDS = 60 * 60 * 24 * 90;
const ALLOWED_HOSTS = new Set(['foidslop.com', 'www.foidslop.com']);
const FALLBACK_SALT = 'foidslop-trials-v1';

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extraHeaders }
  });
}

function storage(env) {
  return env && (env.SLOP_VOTES || env.RATINGS);
}

async function readJson(request) {
  const header = Number(request.headers.get('content-length') || '0');
  if (header > MAX_BODY_BYTES) return null;
  const text = await request.text();
  if (!text || text.length > MAX_BODY_BYTES) return null;
  try { return JSON.parse(text); } catch { return null; }
}

function sameOrigin(request) {
  const hostname = (request.headers.get('host') || '').replace(/:\d+$/, '');
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      const parsed = new URL(origin);
      return parsed.host.replace(/:\d+$/, '') === hostname && (ALLOWED_HOSTS.has(hostname) || hostname.endsWith('.pages.dev'));
    } catch { return false; }
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
  const kv = storage(env);
  if (!kv || typeof kv.get !== 'function') return json({ error: 'Slop Trial storage is not configured.' }, 503);
  if (!sameOrigin(request)) return json({ error: 'Cross-origin votes are not accepted.' }, 403);

  const body = await readJson(request);
  if (!body || typeof body !== 'object') return json({ error: 'Invalid request body.' }, 400);
  if (body.website) return json({ ok: true });
  const id = typeof body.id === 'string' ? body.id : '';
  const vote = typeof body.vote === 'string' ? body.vote.toLowerCase() : '';
  if (!ITEM_PATTERN.test(id) || id.length > 80 || !VOTES.has(vote)) return json({ error: 'Invalid trial or vote.' }, 400);

  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const agent = request.headers.get('user-agent') || 'unknown';
  const voter = await hashVoter(`${ip}:${agent}`, env.SLOP_VOTE_SALT || env.VOTE_SALT || FALLBACK_SALT);
  const voterKey = `slop:voter:${voter}:${id}`;
  const countsKey = `slop:counts:${id}`;

  try {
    const previous = await kv.get(voterKey);
    if (previous) {
      const summary = aggregate(await kv.get(countsKey, 'json'));
      return json({ ok: true, duplicate: true, id, vote: previous, summary });
    }
    const counts = applyVote(await kv.get(countsKey, 'json'), vote);
    await kv.put(countsKey, JSON.stringify(counts));
    await kv.put(voterKey, vote, { expirationTtl: VOTER_TTL_SECONDS });
    return json({ ok: true, id, vote, summary: aggregate(counts) });
  } catch {
    return json({ error: 'Could not record the Slop Trial vote.' }, 503);
  }
}

export async function onRequestGet() {
  return json({ error: 'Use POST to vote.' }, 405, { allow: 'POST' });
}
