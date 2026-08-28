const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_COUNT = 7;

/**
 * Pick an older published recipe deterministically for the homepage cabinet.
 * The date makes the pick change on the chosen cadence without introducing
 * cache churn or making the server-rendered homepage non-deterministic.
 */
function chooseArchivePick(published, date, rotation = 'daily') {
  const recent = new Set(published.slice(-RECENT_COUNT).map(meal => meal.slug));
  const eligible = published.filter(meal => !recent.has(meal.slug));
  if (!eligible.length) return null;

  const cadenceDays = rotation === 'weekly' ? 7 : 1;
  const day = Math.floor(Date.parse(`${date}T12:00:00Z`) / DAY_MS);
  const rotationIndex = Math.floor(day / cadenceDays) % eligible.length;
  return eligible[rotationIndex];
}

module.exports = { chooseArchivePick, RECENT_COUNT };
