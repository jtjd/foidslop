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
    .map(name => name
      .replace(/\boil[- ]packed\b/gi, '')
      .replace(/\b(?:in|with|packed in)\s+(?:(?:olive|vegetable|canola|avocado|sesame|neutral)\s+)?oil\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim())
    .filter(name => name && !/[0-9]/.test(name))
    .filter(name => !/\b(oil|water|ice|flour|spray)\b/i.test(name))
    .filter(name => !name.split(/\s+/).every(word => PANTRY_WORDS.has(word.toLowerCase().replace(/[^a-z]/g, ''))))
    .filter(name => !(baseRule && baseRule.test(name)));
  return [names[0] || 'the main ingredient', names[1] || names[0] || 'the topping'];
}

const SWAPS = {
  'Snack Plate': [
    'No {a}? Any cheese, hummus, or tinned fish can anchor the plate. Keep one creamy thing, one crisp thing, and one briny thing and the board still works.',
    'Swap {a} for whatever is already open in the fridge, and let {b} keep its original contrast. The formula matters more than the parts: substance, crunch, and something sharp to cut through.'
  ],
  Snack: [
    'Missing {a}? Any sturdy cracker-worthy substitute works. The point is contrast between bites, not exact replication.',
    '{a} can become whatever you have on hand. Keep portions honest for one and season louder than you think for such a small plate.'
  ],
  Toast: [
    'No {a}? Soft cheeses, mashed avocado, or ricotta play the same role, while {b} can keep the topping interesting. Whatever the spread, season it directly instead of salting only the top.',
    'Out of {a}? Try {b} instead, or use any combination of something creamy over something briny. Thick bread forgives almost any topping swap.'
  ],
  Pasta: [
    'Different short pasta shapes swap freely here. No {a}? Pecorino, asiago, or extra-black-pepper parmesan covers the same role in the sauce.',
    'Sauce components swap freely: if {a} is out, any bold condiment thinned with pasta water (pesto, tapenade, chilli crisp) leads the bowl instead.'
  ],
  Noodles: [
    'Instant ramen, soba, rice noodles, or wheat noodles all work interchangeably. No {a}? Chilli oil alone with scallions still makes the bowl interesting.',
    'Sauce bases swap freely if you are out of {a}: peanut butter thinned with hot water, tahini plus soy, or simply more chilli oil each carry a bowl.',
    'No {b}? Cabbage, cucumber, or frozen edamame bring the same crunch to the bowl, while {a} can stay as the main flavor anchor.'
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
  'Snack Plate': [
    'Keep {a} and {b} in separate containers and assemble the plate just before eating. Refrigerate cut ingredients for up to two days, but keep crackers and crisps dry.',
    'Store the pieces of this plate separately for up to two days. Cover {a}, protect {b} from moisture, and bring everything together only when you are ready to eat.',
    'The assembled plate loses its contrast in the fridge. Chill {a} in a covered container, keep {b} sealed on its own, and rebuild the portions at serving time.'
  ],
  Snack: [
    'This is best straight away. If {a} or {b} needs to wait, cover it separately for one day and reassemble so the crisp parts do not soften.',
    'Keep {a} and {b} in separate containers if saving a portion. Refrigerate overnight at most, then restore the crunch or warmth before serving.',
    'For leftovers, cool any cooked parts promptly and store them away from the crisp finish. Reheat {a} gently and add {b} only at the table.'
  ],
  Toast: [
    'Toast cannot be stored assembled. Keep {a} and {b} covered away from the bread, then toast a fresh slice and rebuild it when you are ready.',
    'Store the topping separately for up to two days and keep the bread dry. Re-toast until crisp before adding {a} so the last bite still has structure.',
    'Make the components ahead, not the finished toast. Cover {a}, protect {b} from moisture, and assemble after the bread is hot and crisp.'
  ],
  Pasta: [
    'Refrigerate leftovers in a sealed container for up to two days. Reheat gently with a splash of water so {a} loosens instead of turning thick or dry.',
    'The sauce keeps covered for two days, while the pasta is best revived in a pan over low heat. Add {b} after warming so its flavor stays clear.',
    'Cool leftovers promptly and refrigerate for up to two days. Warm them slowly with a little water, then finish with {a} just before serving.'
  ],
  Noodles: [
    'Keep leftovers covered for one day, with wet sauce separate when possible. Loosen the noodles with hot water and add {a} after warming.',
    'Refrigerate the noodles for up to one day and protect {a} and {b} from moisture. They can be eaten cold or revived briefly in hot water before serving.',
    'Save the components separately if you expect leftovers. Warm the noodles gently, thin the sauce, and restore {a} at the last minute.'
  ],
  Soup: [
    'Refrigerate in a sealed container for up to three days. Reheat gently until hot throughout, then add {a} after the pot comes off the heat.',
    'Cool this soup promptly and keep it covered for up to three days. Warm one portion slowly and finish with {b} so the fresh flavor survives.',
    'The broth holds for three days in the fridge. Reheat only what you need, taste again for salt, and add {a} just before the bowl reaches the table.'
  ],
  Eggs: [
    'Eggs are best straight from the pan. Cover leftovers for one day and warm them gently over low heat, adding {a} only after the center is hot.',
    'If saving a portion, refrigerate it covered for one day. Reheat slowly so the eggs stay tender, then add {b} at the end for contrast.',
    'Cool leftovers promptly and use them within one day. A low pan and a small splash of water bring the eggs back more gently than aggressive heat.'
  ],
  Salad: [
    'Store the dressed and crisp parts separately for up to two days. Keep {a} covered, protect {b} from the dressing, and combine at the table.',
    'The vegetables keep for two days when dry and covered. Hold the dressing apart, then add {a} and taste again just before eating.',
    'Make the components ahead, but do not finish the salad until serving. Refrigerate {b} separately so the bowl keeps its snap.'
  ],
  Bowl: [
    'Refrigerate leftovers for up to three days with wet elements separate when possible. Reheat the base gently, then add {a} and {b} after warming.',
    'Store the bowl covered for up to three days, keeping {b} away from the soft parts. Warm one portion and restore the fresh topping at the end.',
    'Cool cooked components promptly and refrigerate for three days. Bring the base back with gentle heat, then add {a} and any crunch at the table.'
  ],
  Rice: [
    'Refrigerate rice within one hour and use it within three days. Reheat {a} in a hot pan with a teaspoon of water, then add the crisp finish.',
    'Cool leftovers quickly, cover them, and keep them for up to three days. A hot pan restores the rice; add {b} only once the grains are warmed.',
    'Store the rice and toppings covered for up to three days. Reheat in a wide pan so {a} can regain some of its edges instead of steaming soft.'
  ],
  Main: [
    'Refrigerate leftovers covered for up to three days. Reheat gently until hot throughout, adding a splash of water if {a} or the sauce looks dry.',
    'Cool the cooked portion promptly and keep it covered for three days. Warm it at moderate heat, then add {b} after reheating so it keeps its texture.',
    'Save leftovers in a sealed container for up to three days. Reheat slowly and finish with {a} at the table rather than cooking the fresh element twice.'
  ],
  Dip: [
    'Refrigerate in a sealed container for up to four days. Stir before serving and refresh the surface with {a} or a little olive oil if it tightens.',
    'This dip keeps covered for four days. Let one portion lose its chill, stir in a teaspoon of water if needed, and add {b} only when serving.',
    'Store the dip away from its crisp scoops for up to four days. Stir it smooth again and finish with {a} after it comes out of the fridge.'
  ],
  Drink: [
    'Build this drink fresh. Keep the juice or syrup base covered for up to two days, then add {a}, ice, and any bubbles only at serving time.',
    'The base can stay refrigerated for two days, but the finished drink cannot. Chill {b} separately and combine everything just before drinking.',
    'Store the prepared base in a sealed jar for up to two days. Shake it before pouring, then add {a} and fresh ice so the drink stays bright.'
  ],
  Sandwich: [
    'Wrap leftovers and refrigerate for up to two days, keeping wet fillings away from the bread when possible. Re-toast gently and add {a} at the end.',
    'Store the filling covered for two days and assemble a fresh sandwich when you can. Warm {b} gently before adding anything crisp.',
    'Cool cooked fillings promptly and keep them sealed for up to two days. Reheat them separately, then rebuild the sandwich so the bread stays firm.'
  ],
  Default: [
    'Refrigerate leftovers in a sealed container for up to two days. Reheat gently and add {a} after warming so the final texture stays distinct.',
    'Cover the prepared components and use them within two days. Warm {b} slowly, then finish the dish at the table rather than cooking it twice.',
    'Cool cooked ingredients promptly and refrigerate for two days. Bring the portion back gently and restore {a} just before serving.'
  ]
};

const HEADNOTES = {
  'Snack Plate': [
    ({ name, a, b }) => `${name} works because the bite keeps changing: ${a} gives it an anchor and ${b} brings contrast. Keep the pieces distinct and build each forkful as you go.`,
    ({ name, a, b }) => `Treat ${name} like a small composed meal. Put ${a} at the center, use ${b} to keep the plate lively, and add the sharp or salty finish just before eating.`,
    ({ name, a, b }) => `The arrangement is part of ${name}. Leave ${a} and ${b} in their own spaces, then let the creamy, crisp, and briny parts meet in different combinations.`,
    ({ name, a, b }) => `There is no hidden cooking trick in ${name}; the useful detail is balance. Make ${a} the substantial part, keep ${b} fresh, and serve it on a plate that gives everything room.`
  ],
  Toast: [
    ({ name, a, b }) => `${name} depends on a properly crisp base. Toast the bread until it can support ${a}, add ${b} at the last minute, and eat it before the topping softens the edges.`,
    ({ name, a, b }) => `The small details make ${name} feel like dinner: deep browning underneath, enough seasoning in ${a}, and ${b} added while the toast is still hot.`,
    ({ name, a, b }) => `Build ${name} in the order the textures need. Get the bread crisp, season ${a} directly, and save ${b} for the final pass so every bite has some snap.`,
    ({ name, a, b }) => `A thick slice turns ${a} and ${b} into a proper one-person meal. Watch the color of the bread rather than the clock, then assemble while the surface still crackles.`
  ],
  Pasta: [
    ({ name, a, b }) => `${name} comes together when the noodles finish in the sauce. Keep ${a} close, save some cooking water, and stop as soon as the bowl turns glossy.`,
    ({ name, a, b }) => `Use one pot and one generous appetite for ${name}. Pull the pasta while it still has a little bite, then let ${b} and the starchy water finish the texture in the pan.`,
    ({ name, a, b }) => `The ingredient list for ${name} is short enough to pay attention to technique. Salt the water, brown or bloom ${a}, and serve before the sauce loses its lift.`,
    ({ name, a, b }) => `Finish ${name} with the heat off if the sauce is already glossy. ${a} should stay recognizable, while ${b} helps the single bowl taste complete rather than heavy.`
  ],
  Noodles: [
    ({ name, a, b }) => `Have the sauce ready before the noodles for ${name} are drained. Toss while everything is hot, then finish with ${a} so the strands stay loose and seasoned.`,
    ({ name, a, b }) => `${name} moves quickly once the water boils. Mix the seasonings first, taste a noodle before draining, and use ${b} to give the finished bowl a little contrast.`,
    ({ name, a, b }) => `The trick in ${name} is coating every strand instead of leaving the sauce underneath. Keep a little cooking water nearby and add ${a} only after the noodles are tender.`,
    ({ name, a, b }) => `Taste the noodles in ${name} before trusting the package time. A pleasantly chewy center gives ${a} and the sauce something to cling to without turning the bowl soft.`
  ],
  Eggs: [
    ({ name, a, b }) => `Gentle heat does the important work in ${name}. Pull the pan when the eggs are barely set, then let ${a} and the residual warmth finish the dish.`,
    ({ name, a, b }) => `Have ${a} and ${b} ready before the eggs for ${name} hit the pan. The cooking is brief, so the best texture comes from staying close and serving immediately.`,
    ({ name, a, b }) => `The final minute decides whether ${name} is tender or dry. Watch the surface, season in layers, and fold in ${b} without cooking the eggs past their soft center.`,
    ({ name, a, b }) => `${name} is simple food with no room to hide overcooking. Keep the heat controlled, let ${a} warm through, and stop when the center still looks a little loose.`
  ],
  Salad: [
    ({ name, a, b }) => `Let the dressing for ${name} reach every ingredient, then taste before adding more salt. Keep ${a} crisp and save ${b} for the last toss.`,
    ({ name, a, b }) => `${name} works because the ingredients keep their own texture. Cut ${a} into fork-friendly pieces, dress lightly, and let the sharper flavors settle for a minute.`,
    ({ name, a, b }) => `A short rest balances ${name} without making it limp. Keep ${b} out of the bowl until serving, then adjust acid and salt once everything is together.`,
    ({ name, a, b }) => `The method for ${name} is mostly tasting. Start with the dressing, add ${a}, and keep enough ${b} in reserve to restore crunch and brightness at the end.`
  ],
  Bowl: [
    ({ name, a, b }) => `Build ${name} in layers instead of stirring it into one texture. Let ${a} bring substance and ${b} bring brightness, then add the crunchy finish at the last moment.`,
    ({ name, a, b }) => `Use a wide bowl for ${name} so ${a} and ${b} have room to stay distinct. Season the base first and taste again after the toppings are in place.`,
    ({ name, a, b }) => `The finish matters in ${name}. Keep the creamy, crisp, and savory parts separate long enough to notice them, then bring them together one bite at a time.`,
    ({ name, a, b }) => `${name} is easy without being flat: season ${a}, add something bright around it, and hold ${b} back until the bowl is ready to eat.`
  ],
  Dip: [
    ({ name, a, b }) => `Use a shallow bowl for ${name} so ${a} and the finishing oil or herbs have room to show up in every scoop. Taste before adding more salt.`,
    ({ name, a, b }) => `The texture of ${name} should be soft enough to scoop but sturdy enough to hold a swirl. Let ${b} provide the crunch and serve it before the edges dry out.`,
    ({ name, a, b }) => `Treat the dip and its scoops as one recipe. Smooth ${name}, season ${a} carefully, and keep ${b} close so each bite has both creaminess and crunch.`,
    ({ name, a, b }) => `A wide dish makes ${name} feel generous. Spread it out, add ${a} as the sharp or savory finish, and bring the crisp things to the table separately.`
  ],
  Soup: [
    ({ name, a, b }) => `Keep the simmer for ${name} steady rather than aggressive. Let ${a} soften into the broth, then finish with ${b} after tasting the pot.`,
    ({ name, a, b }) => `${name} is a small pot, so every minute changes the texture. Build the broth in stages, stop before ${a} loses its shape, and serve it hot.`,
    ({ name, a, b }) => `A modest amount of broth can still carry ${name}. Give ${a} time to release its flavor, then use ${b} to lift the bowl just before serving.`,
    ({ name, a, b }) => `The useful cue for ${name} is the texture in the spoon. Keep the heat gentle, taste once the salty ingredients are in, and finish with something fresh.`
  ],
  Rice: [
    ({ name, a, b }) => `Cold rice gives ${name} its best chance at crisp edges. Leave the grains against the hot pan, then add ${a} once the base has browned.`,
    ({ name, a, b }) => `Have ${a} and ${b} ready before the rice for ${name} hits the pan. Quick movement keeps the ingredients distinct while high heat builds flavor.`,
    ({ name, a, b }) => `The rice in ${name} should toast before it takes on the sauce. Spread it wide, wait for the edges to color, and finish with ${b} off the heat.`,
    ({ name, a, b }) => `Use the pan as a tool for contrast in ${name}: hot crisp grains, tender ${a}, and a fresh finish from ${b} added at the end.`
  ],
  Sandwich: [
    ({ name, a, b }) => `Spread ${a} all the way to the edges of ${name} so the first and last bites match. Keep ${b} crisp and moderate the heat if the center needs time.`,
    ({ name, a, b }) => `${name} needs contrast as much as filling. Warm ${a} gently, add ${b} after the bread is ready, and eat it before the structure gives way.`,
    ({ name, a, b }) => `Toast the bread for ${name} until golden but not brittle. Let ${a} carry the center and use ${b} for the sharp, fresh, or crunchy counterpoint.`,
    ({ name, a, b }) => `The best version of ${name} is assembled in stages. Cook the filling until hot, keep ${b} out of the heat, and cut only after the sandwich has settled.`
  ],
  Drink: [
    ({ name, a, b }) => `Chill the ingredients for ${name} first so the ice does not have to do all the work. Stir ${a} smooth, then add the bubbles or final garnish gently.`,
    ({ name, a, b }) => `${name} should taste bright before it tastes strong. Build the base, add ${b}, and adjust sweetness or tartness after the first sip.`,
    ({ name, a, b }) => `The balance in ${name} comes from tasting before the glass is full. Keep ${a} cold, add the sparkling part last, and do not flatten it with over-stirring.`
  ],
  Snack: [
    ({ name, a, b }) => `${name} sits between snack and dinner, so texture matters. Keep ${a} crisp or warm as intended, add ${b} evenly, and serve it on a real plate.`,
    ({ name, a, b }) => `The method for ${name} is short because the ingredients already know what they are doing. Give ${a} enough heat or seasoning, then finish with ${b}.`,
    ({ name, a, b }) => `A small snack still deserves attention. Let ${a} carry the bite, use ${b} for contrast, and add the salt, heat, or acid while the food is at its best.`,
    ({ name, a, b }) => `${name} has a clear payoff for very little work. Keep the components recognizable, taste before serving, and let ${b} provide the final lift.`
  ],
  Main: [
    ({ name, a, b }) => `This version of ${name} is scaled around one pan and one appetite. Give ${a} enough time to brown or soften, then use ${b} for contrast at the finish.`,
    ({ name, a, b }) => `The portion in ${name} is practical without feeling slight. Read the method once, watch for the doneness cue, and keep ${b} ready for the hot plate.`,
    ({ name, a, b }) => `A short ingredient list lets ${name} depend on texture. Season ${a} in stages, cook until the center is ready, and finish with something fresh or sharp.`,
    ({ name, a, b }) => `Let the main ingredient in ${name} do the heavy lifting. Keep ${a} recognizable, add ${b} after the heat, and serve before the best texture fades.`
  ]
};

function pick(variants, meal) {
  return variants[(Number(meal.id) || 0) % variants.length];
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
  const template = pick(STORAGE[meal.category] || STORAGE.Default, meal);
  return sentence(fill(template, keyIngredients(meal)));
}

/** Ingredient-aware editorial note for search and the top of the recipe. */
function buildHeadnote(meal) {
  const templates = HEADNOTES[meal.category] || HEADNOTES.Main;
  const [a, b] = keyIngredients(meal);
  const name = String(meal.name || 'This recipe').replace(/\s+/g, ' ').trim();
  return templates[(Number(meal.id) || 0) % templates.length]({ name, a, b });
}

function totalMinutes(meal) {
  return (Number.parseInt(meal.prep, 10) || 0) + (Number.parseInt(meal.cook, 10) || 0);
}

function shorten(text, limit) {
  if (text.length <= limit) return text;
  const shortened = text.slice(0, limit - 1).replace(/\s+\S*$/, '').trim();
  return `${shortened}.`;
}

/** Search description that keeps the dish-specific detail visible. */
function buildSeoDescription(meal) {
  const description = String(meal.description || '').replace(/\s+/g, ' ').trim();
  const [a, b] = keyIngredients(meal);
  const total = totalMinutes(meal);
  const category = String(meal.category || 'recipe').toLowerCase();
  const variants = [
    ` Made for one in ${total} minutes, with ${a} and ${b}.`,
    ` A ${category} recipe for one, ready in ${total} minutes with ${a}.`,
    ` ${a} and ${b} make this ${category} recipe for one in ${total} minutes.`
  ];
  for (let offset = 0; offset < variants.length; offset += 1) {
    const variant = variants[(meal.id + offset) % variants.length];
    if ((description + variant).length <= 158) return `${description}${variant}`;
  }
  return shorten(description, 158);
}

module.exports = { keyIngredients, buildSubstitutions, buildStorage, buildHeadnote, buildSeoDescription };
