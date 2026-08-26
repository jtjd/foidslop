const test = require('node:test');
const assert = require('node:assert');
const {
  MIN_RATINGS_FOR_SCHEMA,
  applyVote,
  aggregate,
  aggregateRatingSchema,
  isValidSummary,
  isValidRating,
  normalizeCounts,
  normalizeSummaries
} = require('../scripts/lib/ratings');

test('vote validation accepts only integers between 1 and 5', () => {
  assert.equal(isValidRating(1), true);
  assert.equal(isValidRating(5), true);
  assert.equal(isValidRating(0), false);
  assert.equal(isValidRating(6), false);
  assert.equal(isValidRating(4.5), false);
  assert.equal(isValidRating('4'), false);
});

test('applyVote increments the right bucket and never mutates its input', () => {
  const before = { 1: 0, 2: 1, 3: 0, 4: 0, 5: 2 };
  const after = applyVote(before, 5);
  assert.equal(after[5], 3);
  assert.equal(before[5], 2);
  assert.throws(() => applyVote(before, 9));
});

test('normalizeCounts rejects malformed payloads and empty tallies', () => {
  assert.equal(normalizeCounts(null), null);
  assert.equal(normalizeCounts({ 6: 1 }), null);
  assert.equal(normalizeCounts({ 5: -1 }), null);
  assert.equal(normalizeCounts({ 4: 0 }), null);
  assert.deepEqual(normalizeCounts({ 4: 2 }), { 1: 0, 2: 0, 3: 0, 4: 2, 5: 0 });
});

test('aggregate computes a rounded average and total', () => {
  assert.deepEqual(aggregate({ 1: 0, 2: 0, 3: 1, 4: 1, 5: 2 }), { count: 4, average: 4.3 });
  assert.equal(aggregate({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }), null);
});

test('schema only appears at or above the vote threshold', () => {
  const thin = { count: MIN_RATINGS_FOR_SCHEMA - 1, average: 5 };
  assert.equal(aggregateRatingSchema('https://foidslop.com/slop/x', thin), null);
  const ready = { count: 7, average: 4.3 };
  assert.deepEqual(aggregateRatingSchema('https://foidslop.com/slop/x', ready), {
    '@type': 'AggregateRating',
    ratingValue: 4.3,
    ratingCount: 7,
    bestRating: 5,
    worstRating: 1
  });
});

test('isValidSummary rejects fabricated or out-of-range aggregates', () => {
  assert.equal(isValidSummary({ count: 3, average: 4.5 }), true);
  assert.equal(isValidSummary({ count: 0, average: 4.5 }), false);
  assert.equal(isValidSummary({ count: 3, average: 9 }), false);
  assert.equal(isValidSummary({ count: 2.5, average: 4 }), false);
  assert.equal(isValidSummary('4.5'), false);
});

test('normalizeSummaries keeps only well-formed slug entries from the API payload', () => {
  const cleaned = normalizeSummaries({
    'baked-feta-pasta': { count: 12, average: 4.5 },
    'Bad Slug': { count: 12, average: 4.5 },
    'no-votes': { count: 0, average: 0 }
  });
  assert.deepEqual(cleaned, { 'baked-feta-pasta': { count: 12, average: 4.5 } });
  assert.deepEqual(normalizeSummaries([]), {});
});
