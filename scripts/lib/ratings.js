/**
 * Shared rating math for reader recipe votes.
 *
 * Used by three consumers that must agree exactly:
 * - functions/api/rate.js writes validated vote counts to Workers KV.
 * - scripts/daily-publish.js reads data/ratings.json and emits Recipe
 *   aggregateRating schema from the same aggregation rules.
 * - scripts/seo-check.js rejects schema that disagrees with this module.
 */

const MIN_RATINGS_FOR_SCHEMA = 3;
const WORST_RATING = 1;
const BEST_RATING = 5;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isValidRating(value) {
  return Number.isInteger(value) && value >= WORST_RATING && value <= BEST_RATING;
}

function emptyCounts() {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}

/** Coerce unknown KV/cache payloads into strict counts; null when unusable. */
function normalizeCounts(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const counts = emptyCounts();
  let total = 0;
  for (const [star, value] of Object.entries(raw)) {
    const bucket = Number(star);
    if (!isValidRating(bucket) || !Number.isInteger(value) || value < 0) return null;
    counts[bucket] = value;
    total += value;
  }
  return total > 0 ? counts : null;
}

/** Return next counts with one vote applied. Inputs stay untouched. */
function applyVote(counts, rating) {
  if (!isValidRating(rating)) throw new Error(`Invalid rating value: ${rating}`);
  const base = normalizeCounts(counts) || emptyCounts();
  base[rating] += 1;
  return base;
}

/** Aggregate counts into schema-ready numbers; null when nothing recorded. */
function aggregate(counts) {
  const normalized = normalizeCounts(counts);
  if (!normalized) return null;
  let total = 0;
  let weighted = 0;
  for (let star = WORST_RATING; star <= BEST_RATING; star += 1) {
    total += normalized[star];
    weighted += normalized[star] * star;
  }
  if (!total) return null;
  return { count: total, average: Math.round((weighted / total) * 10) / 10 };
}

/** Validate an aggregate summary produced by /api/ratings or a cached file. */
function isValidSummary(summary) {
  return Boolean(summary)
    && typeof summary === 'object'
    && !Array.isArray(summary)
    && Number.isInteger(summary.count)
    && summary.count > 0
    && typeof summary.average === 'number'
    && summary.average >= WORST_RATING
    && summary.average <= BEST_RATING
    && Math.round(summary.average * 10) === Math.round(summary.average * 10);
}

/** schema.org AggregateRating, or null below the publication threshold. */
function aggregateRatingSchema(slugUrl, summary) {
  if (!isValidSummary(summary) || summary.count < MIN_RATINGS_FOR_SCHEMA) return null;
  return {
    '@type': 'AggregateRating',
    ratingValue: summary.average,
    ratingCount: summary.count,
    bestRating: BEST_RATING,
    worstRating: WORST_RATING
  };
}

/** Normalize a fetched /api/ratings payload into {slug: summary} for caching. */
function normalizeSummaries(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
  const cache = {};
  for (const [slug, summary] of Object.entries(payload)) {
    if (!SLUG_PATTERN.test(slug)) continue;
    const candidate = summary && typeof summary === 'object' && !Array.isArray(summary)
      ? summary
      : null;
    if (isValidSummary(candidate)) cache[slug] = { count: candidate.count, average: candidate.average };
  }
  return cache;
}

module.exports = {
  MIN_RATINGS_FOR_SCHEMA,
  WORST_RATING,
  BEST_RATING,
  SLUG_PATTERN,
  isValidRating,
  emptyCounts,
  normalizeCounts,
  applyVote,
  aggregate,
  isValidSummary,
  aggregateRatingSchema,
  normalizeSummaries
};
