const ITEM_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VOTES = new Set(['yes', 'no']);

function normalizeCounts(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { yes: 0, no: 0 };
  const yes = Number(raw.yes);
  const no = Number(raw.no);
  if (!Number.isInteger(yes) || yes < 0 || !Number.isInteger(no) || no < 0) return { yes: 0, no: 0 };
  return { yes, no };
}

function applyVote(raw, vote) {
  if (!VOTES.has(vote)) throw new Error(`Invalid slop vote: ${vote}`);
  const counts = normalizeCounts(raw);
  counts[vote] += 1;
  return counts;
}

function aggregate(raw) {
  const counts = normalizeCounts(raw);
  const total = counts.yes + counts.no;
  return {
    yes: counts.yes,
    no: counts.no,
    total,
    percentYes: total ? Math.round((counts.yes / total) * 100) : null
  };
}

module.exports = { ITEM_PATTERN, VOTES, normalizeCounts, applyVote, aggregate };
