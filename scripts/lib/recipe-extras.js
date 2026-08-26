/**
 * Category-aware "Easy swaps" and "Storage" copy for recipe pages.
 *
 * Deterministic: variant selection keys off meal.id so re-running never
 * churns content. Placeholders {a} and {b} interpolate the two most
 * substantive ingredients on the recipe.
 */

const PANTRY_WORDS = new Set(['salt', 'pepper', 'oil', 'water', 'ice', 'flour']);

/** The staple each category builds on; never a valid swap anchor. */
const BASE_WORDS = [
  ['Toast', /bread|toast|sourdough|baguette|ciabatta/i],
  ['Pasta', /pasta|spaghetti|rigatoni|penne|fettuccine|linguine|bucatini|noodle/i],
  ['Noodles', /noodle|ramen|soba|udon|pho/i],
  ['Rice', /\brice\b|quinoa|farro|grain/i],
  ['Bowl', /\brice\b|quinoa|farro|grain|noodle/i],
  ['Salad', /lettuce|greens|spinach|arugula|kale|romaine|cabbage/i],
  ['Main', /tortilla|wrap|flatbread|dough/i],
  ['Snack', /tortilla|cracker|chip/i]
];

/** The first two ingredients worth naming in swap or storage copy. */
function keyIngredients(meal) {
  const baseRule = (BASE_WORDS.find(([category]) => category === meal.category) || [])[1];
  const names = (meal.ingredients || [])
    .map(item => String(item.name || '').replace(/\([^)]*\)/g, '').split(',')[0].trim())
    .filter(name => name && !/[0-9]/.test(name))
    .filter(name => !/\b(oil|water|ice|flour|spray)\b/i.test(name))
    .filter(name => !name.split(/\s+/).every(word => PANTRY_WORDS.has(word.toLowerCase().replace(/[^a-z]/g, ''))))
    .filter(name => !(baseRule && baseRule.test(name)));
  return [names[0] || 'the main ingredient', names[1] || names[0] || 'the topping'];
}

const SWAPS = {
  'Snack Plate': [
    'No {a}? Any cheese, hummus, or tinned fish can anchor the plate. Keep one creamy thing, one crisp thing, and one briny thing and the board still works.',
    'Swap {a} for whatever is already open in the fridge. The formula matters more than the parts: substance, crunch, and something sharp to cut through.'
  ],
  Snack: [
    'Missing {a}? Any sturdy cracker-worthy substitute works. The point is contrast between bites, not exact replication.',
    '{a} can become whatever you have on hand. Keep portions honest for one and season louder than you think for such a small plate.'
  ],
  Toast: [
    'No {a}? Soft cheeses, mashed avocado, or ricotta play the same role. Whatever the spread, season it directly instead of salting only the top.',
    'Out of {a}? Try {b} instead, or any combination of something creamy over something briny. Thick bread forgives almost any topping swap.'
  ],
  Pasta: [
    'Different short pasta shapes swap freely here. No {a}? Pecorino, asiago, or extra-black-pepper parmesan covers the same role in the sauce.',
    'Sauce components swap freely: if {a} is out, any bold condiment thinned with pasta water (pesto, tapenade, chilli crisp) leads the bowl instead.'
  ],
  Noodles: [
    'Instant ramen, soba, rice noodles, or wheat noodles all work interchangeably. No {a}? Chilli oil alone with scallions still makes the bowl interesting.',
    'Sauce bases swap freely if you are out of {a}: peanut butter thinned with hot water, tahini plus soy, or simply more chilli oil each carry a bowl.',
    'No {b}? Cabbage, cucumber, or frozen edamame bring the same crunch to the bowl without a separate shopping trip.'
  ],
  Soup: [
    'No {a}? Any soft vegetable roasts or simmers into the base the same way. Canned tomatoes can replace fresh in equal volume.',
    'Stock substitutes freely: vegetable for chicken, miso stirred in at the end for depth. If {a} is out, frozen versions cook directly into small pots.'
  ],
  Eggs: [
    'Mix-ins trade freely here: if {a} is not on hand, any leftover vegetable, cheese, or fresh herb folds in at the same stage. Eggs forgive improvisation.',
    'Out of {b}? Whatever needs using up works instead. Keep the method identical and season in layers so the eggs stay the main event.'
  ],
  Salad: [
    'No {a}? Chickpeas, white beans, or lentils hold the same role. Dress at the table so nothing wilts before you eat.',
    'Greens swap freely by season. Without {a}, toasted nuts or seeds restore the crunch the salad is counting on.'
  ],
  Bowl: [
    'Rice, farro, couscous, or frozen grains all make the base. No {a}? Any roasted vegetable or canned bean drops straight in.',
    'This bowl survives substitutions well. Trade {a} for tofu, a fried egg, or last night\'s vegetables and keep the sauce constant.'
  ],
  Rice: [
    'Leftover rice is ideal here; fresh rice just needs a wider pan and patience. No {a}? Frozen peas, corn, or edamame finish the bowl the same way.',
    'Brown rice, quinoa, or cauliflower rice all work. Brown the base properly before adding {a}; that toastiness is the whole trick.'
  ],
  Main: [
    'No {a}? Whatever protein or hearty filling you have takes the same seasoning and roughly the same cook time at this portion size.',
    'Protein here is a suggestion, not a rule. Swap {a} freely and let the sauce and timing lead; check doneness a few minutes early either way.'
  ],
  Dip: [
    'No {a}? White beans, roasted eggplant, or extra yogurt blend into an equally dippable base. Taste and re-salt after blending.',
    'Out of {b}? Anything crunchy works for scooping. The dip itself keeps for days, which makes it a good make-ahead plate.'
  ],
  Drink: [
    'The base swaps freely: if {a} is unavailable, any juice or syrup in the same flavor family keeps the balance. Build strong, pour over ice, adjust after one sip.',
    'Sweetness and tartness are the adjustable dials. Trade {a} for whatever is already open, keep the bubbles for the top, and taste before committing.'
  ],
  Default: [
    'No {a}? Substitute anything with a similar texture and season boldly; small batches reward tasting as you go.',
    'This scales honestly for one, which makes swaps low-risk. Replace {a} with what you have and adjust salt and acid at the end.'
  ]
};

const STORAGE = {
  'Snack Plate': 'Snack plates do not keep assembled. Store components separately in the fridge: cheese wrapped, crackers sealed, anything cut held airtight for up to two days.',
  Snack: 'Best eaten immediately. If you must wait, keep components in separate containers overnight and reassemble; nothing here improves sitting together.',
  Toast: 'Toast cannot be stored assembled. Keep toppings in one container and bread separately; rebuild under the broiler for a few minutes when round two calls.',
  Pasta: 'Refrigerate up to two days. Reheat gently in a covered pan with a splash of water to bring the sauce back to glossy; microwaving works at half power.',
  Noodles: 'Keeps one day refrigerated, sauce separate if possible. Cold noodles are legitimate here; loosen with hot water or serve straight from the fridge.',
  Soup: 'Refrigerate up to three days in a sealed container. Reheat gently on the stove; add fresh herbs or lemon after warming, never before storing.',
  Eggs: 'Eggs are best straight from the pan. Leftovers keep one day covered and reheat softly in a buttered pan over low heat; avoid the microwave if texture matters.',
  Salad: 'Undressed components keep two days refrigerated. Store dressing separately and combine at the table so greens stay crisp.',
  Bowl: 'Refrigerate up to three days, ideally with wet elements separated. Reheat the base covered and add fresh toppings after warming.',
  Rice: 'Refrigerate within the hour, up to three days. Revive in a hot pan with a teaspoon of water; the rice crisps back up better than it ever went in.',
  Main: 'Refrigerate up to three days covered. Reheat covered at moderate heat until warmed through, adding a splash of water to loosen any pan sauce.',
  Dip: 'Refrigerate up to four days in a sealed container. Flavor often improves overnight; stir before serving and refresh with olive oil or lemon.',
  Drink: 'Build fresh. Juice bases keep about two days refrigerated but always add bubbles and ice at serving time.',
  Default: 'Refrigerate in a sealed container for up to two days. Reheat gently rather than aggressively; small portions come back fast.'
};

function pick(variants, meal) {
  return variants[meal.id % variants.length];
}

function fill(template, ingredients) {
  return template.replace(/\{a\}/g, ingredients[0]).replace(/\{b\}/g, ingredients[1]);
}

function sentence(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Easy-swaps paragraph for a meal. */
function buildSubstitutions(meal) {
  const template = SWAPS[meal.category] || SWAPS.Default;
  return sentence(fill(pick(template, meal), keyIngredients(meal)));
}

/** Storage paragraph for a meal. */
function buildStorage(meal) {
  const template = STORAGE[meal.category] || STORAGE.Default;
  return sentence(fill(template, keyIngredients(meal)));
}

module.exports = { keyIngredients, buildSubstitutions, buildStorage };
