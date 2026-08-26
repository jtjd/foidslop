const FIRST_RELEASE = new Date('2026-05-01T12:00:00Z');
const ARCHIVE_CHUNK = 48;

function releaseDate(meal) {
  if (meal.publishDate) return new Date(`${meal.publishDate}T12:00:00Z`);
  const date = new Date(FIRST_RELEASE);
  date.setUTCDate(date.getUTCDate() + Number(meal.id) - 1);
  return date;
}

function chronological(left, right) {
  return releaseDate(left) - releaseDate(right) || Number(left.id) - Number(right.id);
}

module.exports = { chronological, releaseDate, ARCHIVE_CHUNK };
