const { releaseDate } = require('./publication-order');

function minutes(value) {
  const match = String(value || '').match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function recipesThroughDate(meals, date) {
  return meals.filter(meal => meal.status !== 'retired' && releaseDate(meal).toISOString().slice(0, 10) <= date);
}

function selectEditorialRecipes(page, meals) {
  const match = page.match || {};
  const includeSlugs = Array.isArray(match.slugs) ? match.slugs : [];
  const includeTags = Array.isArray(match.tags) ? match.tags : [];
  const includeCategories = Array.isArray(match.categories) ? match.categories : [];
  const excludeTags = Array.isArray(match.excludeTags) ? match.excludeTags : [];
  if (!includeSlugs.length && !includeTags.length && !includeCategories.length) return [];
  return meals.filter(meal => {
    const tags = Array.isArray(meal.tags) ? meal.tags : [];
    if (includeSlugs.length && !includeSlugs.includes(meal.slug)) return false;
    if (excludeTags.some(tag => tags.includes(tag))) return false;
    if (includeTags.length && !includeTags.some(tag => tags.includes(tag))) return false;
    if (includeCategories.length && !includeCategories.includes(meal.category)) return false;
    if (match.maxTotalMinutes != null && minutes(meal.prep) + minutes(meal.cook) > match.maxTotalMinutes) return false;
    return true;
  }).slice().reverse();
}

function minimumEditorialRecipes(page) {
  return Number.isInteger(page.minRecipes) ? page.minRecipes : 8;
}

function isEditorialPageActive(page, today, meals) {
  if (!page.slug || (page.notBefore && today < page.notBefore)) return false;
  return selectEditorialRecipes(page, meals).length >= minimumEditorialRecipes(page);
}

module.exports = {
  isEditorialPageActive,
  minimumEditorialRecipes,
  recipesThroughDate,
  selectEditorialRecipes
};
