#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'foidslop-meals.json');
const db = JSON.parse(fs.readFileSync(file, 'utf8'));
const revisionDate = '2026-07-15';

const headnotes = {
  'Snack Plate': [
    'This plate is built around contrast: creamy, crisp, salty, and fresh in every few bites. Give each ingredient its own space and assemble combinations as you eat.',
    'There is no cooking trick hiding here. The pleasure comes from choosing good ingredients, arranging enough for a real meal, and changing the bite as you go.',
    'Think of this as dinner with the assembly left visible. Something rich, something briny, and something crisp keep the plate interesting without creating extra work.',
    'The arrangement is part of the recipe because it keeps every texture distinct. Put it on a proper plate, bring the sharp and creamy things together, and take your time.'
  ],
  Toast: [
    'The bread needs to be deeply crisp before the topping goes on. That sturdy base keeps the last bite as good as the first and gives the softer ingredients some contrast.',
    'This is quick, but it still benefits from attention at the edges. Toast the bread until properly golden, season the topping, and assemble only when you are ready to eat.',
    'Good toast is a small exercise in timing. Get the bread crisp, keep the topping generous, and add anything wet at the last minute so the structure holds.',
    'A thick slice of bread turns a few strong ingredients into dinner. The useful details are browning, enough seasoning, and eating it while the toast still crackles.'
  ],
  Pasta: [
    'A single portion of pasta comes together best when the noodles finish in the sauce. Save some cooking water, toss with energy, and stop when everything looks glossy.',
    'This is sized for one generous bowl and one small pot. Keep the pasta a little firm when you drain it so the final minute in the sauce does not push it too far.',
    'The sauce is simple enough to make while the water heats. Reserve a splash of starchy cooking water before draining because it is what helps the whole bowl come together.',
    'Small-batch pasta rewards the same care as a larger pot. Salt the water, finish the noodles with the sauce, and serve as soon as the texture is right.'
  ],
  Noodles: [
    'The sauce should be ready before the noodles are drained. That way they can go straight into the bowl or pan while hot, loose, and ready to take on flavor.',
    'Noodles move quickly once they hit the water. Mix the seasonings first, keep a little cooking water nearby, and eat the finished bowl while it is at its springiest.',
    'This is a fast bowl with enough salt, heat, and richness to taste considered. The key is coating every strand rather than leaving the sauce pooled underneath.',
    'Treat the package timing as a guide and taste a noodle before draining. A pleasantly chewy texture gives the sauce something to cling to.'
  ],
  Eggs: [
    'Eggs do most of the work here, so gentle heat matters. Pull the pan when they are just set and let the remaining warmth carry them the rest of the way.',
    'This is a compact dinner with a short ingredient list. Have everything ready before the eggs hit the heat because the cooking moves quickly from there.',
    'The difference between tender eggs and dry ones is usually the final minute. Watch the texture rather than the clock and serve as soon as they are set.',
    'Keep the heat controlled and season before serving. The result should feel soft and generous, with the other ingredients folded through rather than cooked into submission.'
  ],
  Salad: [
    'Give the dressing a moment to reach every ingredient, then taste before adding more salt. The vegetables should stay crisp while the sharper flavors settle in.',
    'This works because the ingredients keep their own textures. Cut them into fork-friendly pieces, dress lightly at first, and add more acid or salt only after tasting.',
    'A short rest lets the dressing soften the raw edges without turning the salad limp. Keep any cheese, herbs, or crunchy finish for the last pass through the bowl.',
    'The method is mostly about balance. Taste for acid, salt, and richness, then adjust until the bowl feels lively enough to eat on its own.'
  ],
  Bowl: [
    'Build the bowl in layers instead of stirring everything into one texture. A seasoned base, a substantial topping, and something bright or crunchy make each bite a little different.',
    'This is designed for a wide, shallow bowl where the toppings have room. Season the base first, then add the contrasting pieces just before eating.',
    'The ingredients are simple, so the finish matters. Use enough salt, add something bright, and keep the crunchy pieces out of the bowl until the last minute.',
    'A bowl like this should be easy but not flat. Keep the creamy, crisp, and savory parts distinct, then bring them together one spoonful at a time.'
  ],
  Dip: [
    'Use a shallow bowl so there is room for olive oil, herbs, or anything crunchy on top. Serve it with enough bread, chips, or vegetables to turn the dip into dinner.',
    'The texture should be soft enough to scoop but sturdy enough to hold a swirl. Taste before garnishing because cheese, canned ingredients, and crackers can bring plenty of salt.',
    'This is more satisfying when the dip and its scoops are treated as one recipe. Keep the center creamy, the edges well seasoned, and the bread or chips close by.',
    'A wide dish gives every scoop some topping. Smooth the surface, add the sharp and crunchy finishes, and serve before anything crisp has time to soften.'
  ],
  Soup: [
    'Use a small saucepan and keep the simmer steady rather than aggressive. Taste at the end, when the broth has reduced and all the salty ingredients are in the pot.',
    'This is a one-bowl soup with no need for a stockpot. Build the broth in stages, keep an eye on the texture, and adjust the seasoning just before serving.',
    'The pot is small enough that a few minutes make a real difference. Simmer until the flavors come together, then stop before the vegetables or noodles lose their shape.',
    'A modest amount of broth can still have plenty of character. Let the aromatics bloom, use a gentle simmer, and finish with something fresh or sharp.'
  ],
  Main: [
    'This is scaled around one pan and one appetite. Read the method once before starting, then keep the final toppings ready so the hot parts can go straight to the plate.',
    'The recipe keeps the portion practical without making dinner feel slight. Give the main ingredient enough time to brown or soften, then finish with contrast.',
    'A short ingredient list leaves room to pay attention to texture. Cook until the center is ready and the edges have color, then assemble while everything is hot.',
    'This is straightforward food with a few details doing the heavy lifting. Season in stages, look for the doneness cue, and add the fresh finish at the end.'
  ],
  Snack: [
    'This lands somewhere between snack and dinner, which is exactly the point. Make enough for one person, season it properly, and serve it while the textures are at their best.',
    'The method is short because the ingredients already know what they are doing. The useful work is in getting the texture right and adding the finish evenly.',
    'A small snack can still deserve a real plate and a little attention. Keep the crisp things crisp, the warm things warm, and do not be shy with seasoning.',
    'This is low effort with a clear payoff. A little heat, salt, or acidity turns the familiar ingredients into something worth sitting down for.'
  ],
  Drink: [
    'Chill the ingredients first so the ice does not have to do all the work. Stir until the mixture is even, then add the sparkling part gently to keep its fizz.',
    'This is a quick, tart drink for any time you want something more interesting than water. Taste before topping with bubbles and adjust the strength to suit your glass.'
  ],
  Rice: [
    'Cold rice separates and browns more readily than fresh rice. Let it sit against the hot pan long enough to develop crisp edges before tossing.',
    'Have the vegetables and sauce ready before the rice hits the pan. High heat and quick movement build flavor without steaming everything soft.'
  ],
  Sandwich: [
    'Spread the filling all the way to the edges so every bite is balanced. If the sandwich is toasted, keep the heat moderate enough to warm the center before the bread gets too dark.',
    'A compact sandwich still needs contrast. Pair the creamy or melted center with something crisp, sharp, or pickled and eat it before the bread softens.'
  ]
};

const descriptionReplacements = new Map([
  [5, 'Creamy cottage cheese, juicy tomatoes, and everything bagel seasoning make a savory plate with plenty of crunch.'],
  [36, 'Tart cherry juice and sparkling water make a bright, fizzy mocktail with an optional magnesium addition.'],
  [40, 'Smoked salmon, cream cheese, capers, and cucumber deliver all the familiar lox flavors without a bagel.'],
  [44, 'Steamed edamame tossed with garlic butter and chilli makes a salty, hands-on snack dinner.'],
  [60, 'Cottage cheese topped with cucumber, tomatoes, everything seasoning, and chilli crisp makes a savory bowl in five minutes.'],
  [105, 'Creamy cottage cheese, ripe peaches, and hot honey make a sweet, spicy bowl with plenty of contrast.'],
  [108, 'Whipped cream cheese and dark fruit preserves turn crisp toast into a sweet, salty five-minute dinner.'],
  [115, 'Eggs baked inside avocado halves make a rich breakfast-for-dinner with crisp edges and a soft center.'],
  [116, 'Sweet figs and sharp gorgonzola melt together on a crisp flatbread finished with honey and black pepper.'],
  [117, 'Cool cucumber, briny feta, fresh dill, and red wine vinegar make a crisp salad that improves as it rests.'],
  [122, 'Sushi-grade tuna tossed with spicy mayo, soy sauce, and sesame oil makes a bold topping for warm brown rice.'],
  [123, 'Cottage cheese replaces the usual mayonnaise in this creamy tuna salad for crackers or cucumber slices.'],
  [125, 'An avocado half filled with mozzarella, tomato, basil, and balsamic makes a fresh single-serving salad.'],
  [128, 'Tender zucchini noodles tossed with basil pesto and parmesan make a light, quick dinner for one.'],
  [136, 'Coconut chia pudding topped with ripe mango makes a cool, creamy bowl with a little tropical sweetness.'],
  [137, 'Tangy kimchi and melted cheese fill a crisp flour tortilla for a quick dinner with heat and plenty of crunch.'],
  [139, 'Juicy watermelon, salty feta, fresh mint, and lime make a bright salad with a clean sweet-savory contrast.'],
  [144, 'Crisp-edged tofu, warm rice, vegetables, and a spicy peanut sauce make a substantial bowl for one.'],
  [149, 'Roasted sweet potato slices topped with almond butter and banana make a crisp-edged alternative to bread.'],
  [150, 'Roasted spaghetti squash strands tossed with marinara and parmesan make a cozy vegetable-forward dinner.'],
  [151, 'Tuna, white beans, red onion, and parsley make a bright Mediterranean-style salad with a lemony dressing.'],
  [152, 'Creamy cottage cheese topped with ripe peach, honey, cinnamon, and almonds makes a quick sweet-savory bowl.'],
  [153, 'Creamy avocado and salty smoked salmon sit on crisp sourdough with lemon, capers, and everything seasoning.'],
  [155, 'Basil pesto coats a single bowl of pasta with burst cherry tomatoes, parmesan, and plenty of black pepper.'],
  [157, 'Black beans, sweet corn, jalapeño, cilantro, and lime make a fresh, sturdy salsa to scoop up with chips.'],
  [158, 'A warm baked apple with cinnamon, brown sugar, and walnuts delivers crisp-like flavor in a single portion.'],
  [159, 'Tuna, olives, capers, and garlic make a salty, briny pasta sauce that comes together while the spaghetti cooks.'],
  [160, 'Creamy cottage cheese topped with mixed berries, honey, and optional granola makes a quick bowl for one.'],
  [161, 'Creamy brie and tart cranberry sauce melt into crisp toast, with black pepper to keep the sweetness in check.'],
  [166, 'A crisp-skinned baked potato loaded with warm chili, sharp cheddar, sour cream, and black pepper makes a full dinner.'],
  [172, 'Tuna dressed with lemon and olive oil sits over crisp bread spread with salty olive tapenade and parsley.'],
  [174, 'Cool cottage cheese, juicy tomato slices, olive oil, and oregano make a simple plate that depends on good produce.'],
  [175, 'Crisp toast with peanut butter, banana, honey, and cinnamon is simple, warm, and ready in five minutes.'],
  [176, 'Soft scrambled eggs with wilted spinach and salty feta make a quick skillet dinner with a creamy finish.'],
  [179, 'Mashed avocado, lemon, and chilli flakes top crisp sourdough beneath fried eggs with set whites and soft yolks.'],
  [180, 'Fresh mozzarella, cherry tomatoes, and basil turn caprese salad into skewers finished with olive oil and balsamic.'],
  [183, 'Cottage cheese with pineapple, honey, and coconut makes a cool, creamy bowl with a little retro charm.'],
  [184, 'Tuna, sweet corn, red onion, and parsley make a creamy, crunchy salad that is ready in five minutes.'],
  [187, 'Sushi-grade tuna in spicy mayo tops warm rice with sliced avocado, sesame seeds, and spring onions.'],
  [188, 'A soft folded omelette filled with browned mushrooms, fresh thyme, and butter makes a savory dinner for one.'],
  [192, 'Ripe tomatoes, fresh mozzarella, basil, olive oil, and balsamic glaze make the classic Italian salad for one.'],
  [193, 'Sharp cheddar and crisp bacon melt inside a golden flour tortilla with salsa and sour cream on the side.'],
  [194, 'Tuna salad, chopped hard-boiled eggs, capers, and crackers make a sturdy no-cook plate for one.'],
  [196, 'Instant ramen with crisp-edged tofu, bok choy, spring onions, and chilli crisp makes a fuller bowl in twenty minutes.'],
  [197, 'A soft baked sweet potato loaded with cumin-spiced black beans, salsa, and avocado makes an easy dinner for one.'],
  [200, 'A warm baked apple filled with oats, brown sugar, cinnamon, and butter makes a single-serving crisp without the pan.']
]);

const noteReplacements = new Map([
  [9, 'A fried or poached egg makes the toast more substantial. Pomegranate seeds add a tart pop and extra crunch.'],
  [24, 'Stovetop popcorn stays crisp and lets you control the butter and salt. Savory nutritional yeast is especially good with chilli powder.'],
  [36, 'Magnesium is optional. If you use it, follow the serving directions on the package and stir until the powder is fully dissolved.'],
  [51, 'The avocado supplies all the creaminess the filling needs. Keep the lettuce leaves cold and dry so they stay crisp.'],
  [56, 'This sounds almost too simple to be a meal, but the contrast works. Use thick bread and let it get properly crisp before adding the butter.'],
  [125, 'Choose an avocado that gives slightly under gentle pressure so it holds the filling without feeling hard.'],
  [128, 'Do not overcook the zucchini. Stop when the strands are just tender so they do not release too much water.'],
  [149, 'Cut the sweet potato into even slices so the centers soften before the edges get too dark.'],
  [150, 'Do not overcook the squash or the strands will become soft and lose their shape.'],
  [158, 'The apple should be tender enough for a knife to slide in easily while still holding its shape.'],
  [175, 'Use a ripe but firm banana so the slices hold their shape on the warm toast. Flaky salt is also good here.'],
  [193, 'Cook the bacon until crisp before you begin, then drain it well so the tortilla browns instead of becoming greasy.'],
  [199, 'Keep the tomatoes and mozzarella close in size so the skewers are easy to eat and every bite feels balanced.']
]);

const stepReplacements = new Map([
  ['spinach-artichoke-dip-pita-chips:2', 'Let the dip stand for 2 minutes, then set the hot dish on a heatproof board. Serve with pita chips or sturdy crackers while the center is still creamy and the top is browned.'],
  ['sheet-pan-nachos:1', 'Bake at 400°F (200°C) for 8 to 12 minutes, until the cheese is fully melted and bubbling and the exposed edges of the chips have deepened in color.'],
  ['creamed-spinach-toast:1', 'Taste the creamed spinach and adjust the salt and pepper. Pile it over the hot buttered sourdough, then finish with a little more parmesan while the topping is still steaming.'],
  ['mango-tajin-lime:0', 'Stand the mango upright and cut the flesh away from both sides of the pit. Score or peel the pieces, then cut them into slices or bite-size cubes.'],
  ['solo-charcuterie-board-wine:1', 'Let the cheese lose its refrigerator chill, then graze slowly and change the combinations as you go. Keep the crackers dry and pour the wine only when the board is ready.'],
  ['tteokbokki:2', 'Spoon the rice cakes and plenty of sauce into a shallow bowl. Finish with sliced spring onions and sesame seeds, then eat while the sauce is glossy and the rice cakes are soft and chewy.'],
  ['tahini-honey-toast:0', 'Toast the bread until deeply golden, crisp at the edges, and still a little tender in the center. Move it to a plate while it is hot.'],
  ['store-bought-pork-belly-bao:0', 'Steam the frozen bao according to the package directions until puffed, soft, and hot through. Keep them covered off the heat so the surfaces do not dry out.'],
  ['garlic-confit-bread:0', 'Toast the sourdough until deeply golden and crisp at the edges. Move it to a plate while it is hot so the garlic oil can soak into the rough surface.'],
  ['cottage-cheese-tuna-salad:1', 'Spoon the tuna salad into a shallow bowl and add black pepper. Serve with crisp crackers or thick cucumber slices for scooping.'],
  ['gnocchi-pesto-cherry-tomatoes:0', 'Boil the gnocchi in well-salted water until they rise to the surface and stay there, about 2 to 3 minutes. Scoop them out, drain well, and keep them warm.'],
  ['spicy-ramen-egg-spinach:0', 'Lower the egg into gently boiling water and cook for 6½ minutes. Transfer it to cold water, then peel once it is cool enough to handle.'],
  ['cottage-cheese-pancakes:2', 'Serve the pancakes hot, with sour cream and jam spooned alongside rather than over the crisp surfaces. Add a small pinch of salt if using a very sweet jam.'],
  ['hummus-roasted-red-pepper-wrap:1', 'Fold in the sides of the tortilla, then roll it up tightly from the bottom so the filling stays contained. Rest it seam-side down for a minute before slicing.'],
  ['baked-potato-chili:1', 'Warm the chili in a small saucepan over medium-low heat, stirring occasionally, until it is bubbling gently and hot throughout. Add a splash of water if it becomes too thick.'],
  ['smoked-salmon-cream-cheese-bagel:0', 'Split the bagel and toast the cut sides until golden at the edges but still chewy in the middle. Let it cool for a minute so the cream cheese does not melt away.'],
  ['burrata-tomato-pasta:0', 'Boil the pasta in well-salted water until just shy of al dente. Reserve ½ cup of the starchy cooking water, then drain.'],
  ['spinach-feta-scramble:0', 'Crack the eggs into a bowl, add a small pinch of salt, and whisk until the whites and yolks are completely blended and a little foamy.'],
  ['cheddar-broccoli-baked-potato:1', 'Steam the broccoli for 4 to 5 minutes, until bright green and easily pierced with a fork but not falling apart. Drain it well so the potato does not become watery.'],
  ['caprese-stuffed-portobello:2', 'Let the mushroom stand for 2 minutes so the juices settle. Top with fresh basil and a restrained drizzle of balsamic glaze just before serving.'],
  ['spicy-peanut-butter-noodles:0', 'Boil the noodles according to the package directions until pleasantly chewy. Reserve ¼ cup of cooking water, then drain without rinsing.'],
  ['tuna-egg-salad-plate:1', 'Spoon the salad onto a plate and add the crackers in a separate pile so they stay crisp. Finish with black pepper and a few extra capers if you like.'],
  ['baked-sweet-potato-black-beans-salsa:1', 'Warm the black beans with the cumin in a small pan over medium heat for 3 to 4 minutes. Stir occasionally and add a spoonful of water if the pan looks dry.']
]);

const splitOneStep = new Set([
  'greek-salad-chickpeas', 'stracciatella-olive-oil-grilled-bread', 'prosciutto-fig-toast',
  'cream-cheese-jelly-toast', 'cucumber-feta-salad-dill', 'white-bean-tuna-salad',
  'watermelon-feta-salad', 'peanut-butter-banana-toast', 'cottage-cheese-tomato-toast'
]);

function cleanEmDashes(value) {
  if (typeof value === 'string') return value.replace(/\s*—\s*/g, ', ').replace(/\s+-\s+/g, ', ');
  if (Array.isArray(value)) return value.map(cleanEmDashes);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cleanEmDashes(item)]));
  return value;
}

function usMetric(amount) {
  return amount.replace(/^(\d+(?:\.\d+)?)g\b/, (_, gramsText) => {
    const grams = Number(gramsText);
    const ounces = grams / 28.3495;
    const rounded = ounces < 3 ? Math.round(ounces * 2) / 2 : Math.round(ounces * 10) / 10;
    return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} oz (${gramsText}g)`;
  });
}

function splitStep(meal) {
  const sentences = meal.steps[0].text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [meal.steps[0].text];
  const cut = Math.max(1, Math.floor(sentences.length / 2));
  const first = sentences.slice(0, cut).join(' ').trim();
  const second = sentences.slice(cut).join(' ').trim();
  if (!second) return;
  const toast = meal.category === 'Toast';
  const salad = meal.category === 'Salad';
  meal.steps = [
    { name: toast ? 'Toast' : salad ? 'Prepare' : 'Set up', text: first },
    { name: toast ? 'Top' : salad ? 'Dress and finish' : 'Finish', text: second }
  ];
}

function extendShortStep(meal, step) {
  if (step.text.length >= 55) return step.text;
  if (/serve|plate|top/i.test(step.name)) return `${step.text.replace(/\.$/, '')}, then finish with the listed garnishes. Serve right away while the hot ingredients are hot and the crisp ingredients still have their texture.`;
  if (/toast/i.test(step.name)) return `${step.text.replace(/\.$/, '')} until the surface is golden and the edges are crisp. Move it to a plate while it is still hot.`;
  if (/cook|warm|steam|bake/i.test(step.name)) return `${step.text.replace(/\.$/, '')}, stirring or turning as needed, until it is hot throughout and has reached the texture described in the recipe.`;
  return `${step.text.replace(/\.$/, '')}. Take a moment to check the texture and seasoning before moving to the next step.`;
}

for (const original of db.meals) {
  const meal = cleanEmDashes(original);
  Object.assign(original, meal);

  if (descriptionReplacements.has(meal.id)) meal.description = descriptionReplacements.get(meal.id);
  if (noteReplacements.has(meal.id)) meal.notes = noteReplacements.get(meal.id);

  meal.tags = meal.tags.map(tag => ({ Healthy: 'Fresh', 'High Protein': 'Filling', Protein: 'Filling', 'Low Carb': 'Fresh' }[tag] || tag))
    .filter((tag, index, tags) => tags.indexOf(tag) === index);

  meal.description = meal.description
    .replace(/high[- ]protein/gi, 'substantial')
    .replace(/protein[- ]packed/gi, 'substantial')
    .replace(/protein rich/gi, 'creamy and satisfying')
    .replace(/healthy dessert-for-dinner/gi, 'cool dessert-for-dinner')
    .replace(/low carb/gi, 'bread-free')
    .replace(/energy boosting/gi, 'warm and satisfying');
  meal.notes = meal.notes
    .replace(/much healthier/gi, 'simpler to portion')
    .replace(/pre or post workout meal/gi, 'quick option when you want something warm and familiar')
    .replace(/low carb alternative/gi, 'bread-free alternative');

  if (meal.id === 76) {
    const ingredient = pattern => meal.ingredients.find(item => pattern.test(item.name));
    meal.ingredients = [
      ingredient(/mixed mushrooms/),
      ingredient(/^garlic/),
      { amount: '1 tbsp', name: 'unsalted butter' },
      { amount: '1 tbsp', name: 'olive oil' },
      ingredient(/^fresh thyme/),
      ingredient(/^heavy cream/),
      ingredient(/^thick sourdough/),
      ingredient(/^salt, black pepper/)
    ];
    meal.steps = [
      { name: 'Brown the mushrooms', text: 'Heat the butter and olive oil in a wide skillet over medium-high heat. Add the mushrooms in an even layer and leave them undisturbed for 3 to 4 minutes, until deeply browned underneath. Toss and cook for 2 minutes more.' },
      { name: 'Add the aromatics', text: 'Lower the heat to medium. Add the garlic and thyme and cook for 30 seconds, just until fragrant. Pour in the cream and simmer for 1 to 2 minutes, until it lightly coats the mushrooms.' },
      { name: 'Season and serve', text: 'Season with salt, black pepper, and a small squeeze of lemon. Spoon the creamy mushrooms over the hot buttered sourdough and serve before the toast loses its crunch.' }
    ];
  }
  if (meal.id === 85) meal.ingredients[4] = { amount: '1 tsp', name: 'cornstarch mixed with 1 tbsp water' };
  if (meal.id === 93) meal.steps[1].text = 'Add the shrimp and cook for 2 to 3 minutes per side, until opaque, curled, and 145°F (63°C) in the center. Pour in the honey sauce and toss for 1 minute, until it glazes the shrimp.';

  meal.ingredients = meal.ingredients.map(item => ({ ...item, amount: usMetric(item.amount) }));
  if (splitOneStep.has(meal.slug) && meal.steps.length === 1) splitStep(meal);
  meal.steps = meal.steps.map((step, stepIndex) => ({
    ...step,
    text: stepReplacements.get(`${meal.slug}:${stepIndex}`) || extendShortStep(meal, step)
  }));

  const pool = headnotes[meal.category] || headnotes.Main;
  meal.headnote = pool[(meal.id - 1) % pool.length];
  meal.seoTitle = `${meal.name} Recipe for One | foidslop`;
  if (meal.seoTitle.length > 64) meal.seoTitle = `${meal.name} | foidslop`;
  const total = (Number.parseInt(meal.prep, 10) || 0) + (Number.parseInt(meal.cook, 10) || 0);
  const suffix = ` A clear single-serving recipe ready in ${total} minutes.`;
  meal.seoDescription = meal.description.length + suffix.length <= 158
    ? `${meal.description}${suffix}`
    : `${meal.name} made for one, with a complete ingredient list, clear method, and a total time of ${total} minutes.`;
  if (meal.publishDate <= revisionDate) meal.dateModified = revisionDate;
  else delete meal.dateModified;
  Object.assign(original, meal);
}

db.generated = `${revisionDate}T00:00:00.000Z`;
fs.writeFileSync(file, `${JSON.stringify(db, null, 2)}\n`);
console.log(`Upgraded ${db.meals.length} recipes without changing recipe image files.`);
