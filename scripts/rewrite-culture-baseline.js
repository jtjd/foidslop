#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const dictionaryPath = path.join(ROOT, 'data', 'dictionary.json');
const culturePath = path.join(ROOT, 'data', 'culture-articles.json');
const indexPath = path.join(ROOT, 'data', 'slop-index.json');
const publisherPath = path.join(ROOT, 'scripts', 'publish-culture.js');
const testPath = path.join(ROOT, 'test', 'culture-content.test.js');

const dictionary = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));
const culture = JSON.parse(fs.readFileSync(culturePath, 'utf8'));
const slopIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

function entry(slug) {
  const found = dictionary.entries.find(item => item.slug === slug);
  if (!found) throw new Error(`Missing dictionary entry: ${slug}`);
  return found;
}
function article(slug) {
  const found = culture.articles.find(item => item.slug === slug);
  if (!found) throw new Error(`Missing culture article: ${slug}`);
  return found;
}
function replaceEntry(slug, patch) { Object.assign(entry(slug), patch); }
function replaceArticle(slug, patch) { Object.assign(article(slug), patch); }

replaceEntry('foidslop', {
  description: 'Foidslop is a catch-all for female-coded slop: food, media, usernames, games, aesthetics, and whatever else obviously belongs in the category.',
  deck: 'Foidslop is a catch-all for female-coded slop: girl dinner, romance media, cute usernames, life sims, matcha, tiny treats, and whatever else obviously belongs in the category. The term comes from 4chan/incel slang, where “foid” means woman.',
  definition: 'Foidslop means female-coded slop. Food, media, games, usernames, aesthetics, music, books, and other things can all count. The word combines foid, 4chan/incel slang for a woman, with slop.',
  sections: [
    { heading: 'Where did foidslop come from?', paragraphs: [
      'Foid is short for femoid. Femoid appeared in incel communities, and foid was in use on 4chan by 2018. Slop is the internet word for cheap, disposable, repetitive, mass-produced, or simply unserious stuff.',
      'Put the two together and you get foidslop. The food meaning is obvious, but the term now gets used for media, games, usernames, aesthetics, and anything else that reads as strongly female-coded.'
    ]},
    { heading: 'What counts as foidslop food?', paragraphs: [
      'Girl dinner, snack plates, cottage cheese bowls, tinned fish, toast, fruit, pickles, matcha, little desserts, tiny forks, and meals assembled from six unrelated things in the fridge all qualify.',
      'The point is not a strict ingredient list. If the meal looks like something that would be photographed next to a candle, a claw clip, or a laptop playing Gossip Girl, the classification is probably safe.'
    ]},
    { heading: 'What counts outside food?', paragraphs: [
      'Twilight, Nana, The Sims, Stardew Valley, romance novels, cute profile layouts, bunni-style usernames, sad-girl playlists, pink interfaces, fan edits, and elaborate character ranking spreadsheets all live somewhere on the map.',
      'The category is broad because the word is useful. You can have prestige foidslop, industrial foidslop, cozy foidslop, vampire foidslop, mall foidslop, anime foidslop, and whatever new branch gets invented next.'
    ]},
    { heading: 'What does foidslop.com do with it?', paragraphs: [
      'The site started with one recipe for one person every day. Food is still the daily product.',
      'The culture side catalogs the rest: slang, media, usernames, games, aesthetics, and other foid-coded material. Some of it gets articles. Some of it gets scores. Some of it probably needs a generator.'
    ]}
  ],
  sources: [
    { label: 'Know Your Meme: Foid', url: 'https://knowyourmeme.com/sensitive/memes/foid-slang' },
    { label: 'Polyester: Staying Hungry for Foidslop', url: 'https://www.polyesterzine.com/features/staying-hungry-for-foidslop' },
    { label: 'Reddit: foidslop usernames usage', url: 'https://www.reddit.com/r/lovethissmug/comments/1vbnzlp/i_love_foidslop_usernames/' }
  ]
});

replaceEntry('foid', {
  description: 'Foid is 4chan/incel slang for a woman. It is short for femoid and is the root word in foidslop.',
  deck: 'Foid means woman in 4chan/incel slang. It is short for femoid and is the first half of foidslop.',
  definition: 'Foid means woman in 4chan/incel slang. It is a shortened form of femoid. The term was in use on 4chan by 2018 and later spread through memes, screenshots, and compound slang such as foidslop.',
  sections: [
    { heading: 'Where did foid come from?', paragraphs: [
      'Foid is clipped from femoid. Know Your Meme documents an April 2018 use on 4chan’s /r9k/ board and lists 4chan as the origin of the shortened form.',
      'The word stayed common in incel vocabulary, then spread much farther through screenshots, memes, ironic posting, and newer compounds.'
    ]},
    { heading: 'Foid vs femoid', paragraphs: [
      'Femoid is the longer form. Foid is the four-letter version. Same root, less typing.',
      'That shorter form is also easier to glue onto other words, which is how you end up with foidslop.'
    ]},
    { heading: 'How is foid used now?', paragraphs: [
      'You still see it used seriously in incel and gender-war posting. You also see it quoted, memed, used ironically, or treated as a building block for newer slang.',
      'The surrounding sentence usually makes the tone obvious. “Foids are ruining society” and “industrial-grade foidslop username” are not doing the same job.'
    ]}
  ],
  sources: [
    { label: 'Know Your Meme: Foid', url: 'https://knowyourmeme.com/sensitive/memes/foid-slang' },
    { label: 'ADL: Incels glossary', url: 'https://www.adl.org/resources/backgrounder/incels-involuntary-celibates' }
  ]
});

replaceEntry('femoid', {
  description: 'Femoid is incel slang for a woman and the longer form behind foid. It combines female with the robotic sound of humanoid or android.',
  deck: 'Femoid is the long version. Foid is what happened after the internet removed three letters.',
  definition: 'Femoid is incel slang for a woman. The word combines female with the sound of humanoid or android. Foid is the shortened form that later became common on 4chan and elsewhere.',
  sections: [
    { heading: 'Where did femoid come from?', paragraphs: [
      'Know Your Meme traces femoid to incel Reddit in 2017. The word was built to sound like a category of robot or humanoid instead of simply saying woman.',
      'It spread through incel forums, subreddits, and 4chan boards before the shorter foid form became more common.'
    ]},
    { heading: 'Femoid vs foid', paragraphs: [
      'Femoid is the full word. Foid is the clipped version. If you understand one, you understand the other.',
      'Foid won the compound-word contest because four letters fit better in memes, replies, usernames, and things like foidslop.'
    ]},
    { heading: 'Why does it matter here?', paragraphs: [
      'Because foidslop is literally foid plus slop. This is the piece of lore you need before the rest of the dictionary starts making sense.',
      'After that, you can return to more important questions, such as whether The Sims is 95 or 97 percent foid-dense.'
    ]}
  ],
  sources: [
    { label: 'Know Your Meme: Femoid', url: 'https://knowyourmeme.com/memes/femoid' },
    { label: 'ADL: Incels glossary', url: 'https://www.adl.org/resources/backgrounder/incels-involuntary-celibates' }
  ]
});

replaceEntry('moid', {
  description: 'Moid is internet slang for a man, built as the male counterpart to foid. It shows up in femcel jokes, gender-war posting, and compounds such as moidslop.',
  deck: 'Foid got a male counterpart. Moid was inevitable.',
  definition: 'Moid means man in internet slang. It was created as a male counterpart to foid and is especially associated with femcel spaces, gender-war jokes, and ironic posting.',
  sections: [
    { heading: 'Where did moid come from?', paragraphs: [
      'Moid followed foid. Know Your Meme documents use on the former r/TrueFemcels subreddit in 2018, where it was used as the matching term for men.',
      'The construction is intentionally symmetrical: foid for women, moid for men, then an unlimited number of compounds once everyone understands the pattern.'
    ]},
    { heading: 'How is moid used?', paragraphs: [
      'Sometimes as an insult, sometimes as a joke, sometimes because the sentence already contains femcel, mog, maxxing, aura, and three other words that make normal vocabulary impossible.',
      'Moidslop is the obvious food or media compound. The dictionary regrets to report that the suffix system works perfectly.'
    ]},
    { heading: 'Moid vs foid', paragraphs: [
      'Foid came first. Moid was built in response to it. They sound related because they are.',
      'The biggest difference is origin: foid came from male incel slang, while moid became associated with femcel spaces and jokes about men.'
    ]}
  ],
  sources: [{ label: 'Know Your Meme: Moid', url: 'https://knowyourmeme.com/editorials/guides/what-does-moid-mean-the-femcel-slang-term-purportedly-used-by-the-wisconsin-school-shooter-explained' }]
});

replaceEntry('femcel', {
  description: 'Femcel means female involuntary celibate. Online it also gets used for a whole meme and aesthetic package involving loneliness, bad decisions, playlists, fictional women, and posting.',
  deck: 'Femcel has a literal definition and a much larger meme department.',
  definition: 'Femcel originally means female involuntary celibate. Online, it also gets used as a meme label for lonely-girl aesthetics, fictional characters, playlists, posting styles, and self-deprecating jokes.',
  sections: [
    { heading: 'The literal meaning', paragraphs: [
      'Femcel is short for female involuntary celibate. It developed alongside incel communities and vocabulary, with plenty of argument over whether women can even count as incels.',
      'That literal meaning is still used when people are actually talking about incel subculture.'
    ]},
    { heading: 'The meme meaning', paragraphs: [
      'The internet stretched femcel into an aesthetic and character type. Cereal in bed, unanswered messages, terrible fictional boyfriends, Fiona Apple, messy eyeliner, a Notes app paragraph that should not be sent.',
      'A “femcel character” does not need to be literally celibate. She usually just needs enough loneliness, dysfunction, obsession, or posting potential.'
    ]},
    { heading: 'Why it overlaps with foidslop', paragraphs: [
      'Femcel media, playlists, memes, and aesthetics are heavily female-coded, so they naturally overlap with foidslop.',
      'The categories are not identical. They just share enough material that the same account can post both without changing tabs.'
    ]}
  ]
});

replaceEntry('mog', {
  description: 'To mog someone is to outclass them so obviously that the comparison becomes the point, especially in looks. The word now gets used for almost anything.',
  deck: 'Mogging is winning the comparison before anybody asked for one.',
  definition: 'To mog someone means to visibly outclass or overshadow them. It started in looks and status slang, then spread to clothes, height, hair, apartments, pets, food, profile pictures, and basically anything that can be compared.',
  sections: [
    { heading: 'Where did mog come from?', paragraphs: [
      'Dictionary.com traces mog through AMOG, “Alpha Male of the Group,” and later manosphere and incel usage focused on looks and status.',
      'The word escaped that narrow use because it is short and immediately understandable. A cat can mog another cat. A $12 diner plate can mog a tasting menu. A good jacket can mog the entire room.'
    ]},
    { heading: 'Common mogging vocabulary', paragraphs: [
      'Heightmog, jawmog, hairmog, framemog, fitmog. Put the thing being compared in front of mog and the grammar usually works.',
      'Mogged is the past tense. Mogger is the person doing it. The system is simple enough to survive contact with TikTok.'
    ]},
    { heading: 'Why is it everywhere?', paragraphs: [
      'Because it turns a normal comparison into a scoreboard. “Her outfit is better” is boring. “She fitmogged the entire wedding” has structure.',
      'The word also works perfectly with images, which is why it spreads well in before-and-after posts, celebrity comparisons, edits, and memes.'
    ]}
  ]
});

replaceEntry('looksmaxxing', {
  description: 'Looksmaxxing means trying to maximize your appearance. It started in incel/manosphere spaces and now covers everything from haircuts and skincare to surgery.',
  deck: 'Looksmaxxing is treating your face and body like a build that still has skill points available.',
  definition: 'Looksmaxxing means trying to maximize physical appearance. Softmaxxing usually means grooming, fitness, hair, skin, clothes, and similar changes. Hardmaxxing usually means surgery or other major interventions.',
  sections: [
    { heading: 'Where did looksmaxxing come from?', paragraphs: [
      'The term developed in incel and manosphere communities where looks were discussed like stats that could be optimized. It later spread through TikTok, X, YouTube, and mainstream meme vocabulary.',
      'Once people understood the suffix, maxxing became reusable. Sleepmaxxing, studymaxxing, aura-maxxing, jawmaxxing. The format does most of the work.'
    ]},
    { heading: 'Softmaxxing vs hardmaxxing', paragraphs: [
      'Softmaxxing is haircuts, skincare, fitness, clothes, sleep, teeth, posture, and other normal appearance work under a much more dramatic name.',
      'Hardmaxxing means larger interventions such as cosmetic surgery. Some communities also push genuinely stupid or unsafe stunts, which are not required to understand the slang.'
    ]},
    { heading: 'Why the word spread', paragraphs: [
      'Because turning ordinary self-improvement into a build system is funny and useful. Once something can be maxxed, somebody will try to optimize it.',
      'The word now works far outside its original communities, even when the speaker has no interest in the ideology that produced it.'
    ]}
  ]
});

replaceEntry('girl-dinner', {
  description: 'Girl dinner is a loose meal made from snacks, leftovers, bread, cheese, fruit, dips, noodles, pickles, or whatever else can become dinner without much ceremony.',
  deck: 'Bread, cheese, fruit, pickles, crackers, leftovers. Dinner has been assembled.',
  definition: 'Girl dinner is an informal meal made from snacky, leftover, or miscellaneous foods instead of a conventional plated dinner. The term went viral on TikTok in 2023.',
  sections: [
    { heading: 'What counts as girl dinner?', paragraphs: [
      'Bread and cheese. Crackers and dip. Fruit and pickles. Tinned fish. Leftover pasta. Cereal. A yogurt bowl. Three items from the fridge that would never appear together on a restaurant menu.',
      'The key feature is assembly. You are making dinner happen, not auditioning for Top Chef.'
    ]},
    { heading: 'Where did the phrase come from?', paragraphs: [
      'Girl dinner went viral on TikTok in 2023 as a name for this kind of improvised solo meal. The meal existed long before the term did.',
      'Once the phrase had a name, the internet immediately started photographing it, parodying it, ranking it, and inventing male countercategories.'
    ]},
    { heading: 'Girl dinner vs foidslop', paragraphs: [
      'Girl dinner is one branch of foidslop food. Matcha, tiny treats, snack plates, cottage cheese bowls, toast, tinned fish, and little desserts sit comfortably nearby.',
      'Foidslop is much broader. It can also describe the game running on the laptop, the username posting the plate, and the romance show playing in the background.'
    ]}
  ]
});

replaceEntry('slop', {
  description: 'Online, slop means cheap, repetitive, mass-produced, disposable, or low-effort stuff. It can describe AI content, media, food, posts, products, and things people enjoy anyway.',
  deck: 'AI slop. Franchise slop. Foidslop. Reality slop. One ugly little word does a lot of work.',
  definition: 'Slop is internet slang for cheap, repetitive, disposable, mass-produced, or low-effort content and products. It is also used affectionately for things the speaker fully intends to keep consuming.',
  sections: [
    { heading: 'Why is slop useful?', paragraphs: [
      'Slop says more than “bad.” It suggests bulk. Another image, another sequel, another post, another bowl, another episode is already coming down the pipe.',
      'That makes it useful for AI content, franchise movies, reality television, frozen food, trend products, spammy posts, and anything else that feels produced by the bucket.'
    ]},
    { heading: 'Slop can be good', paragraphs: [
      'People call things slop while actively enjoying them. Dating-show slop. Vampire slop. Seasonal coffee slop. Fast-food slop. This is normal usage now.',
      'The word can mean trash, comfort food, genre product, guilty pleasure, or simply “there is a lot of this and I am still consuming it.”'
    ]},
    { heading: 'Common slop compounds', paragraphs: [
      'AI slop, content slop, franchise slop, foidslop, goyslop, guyslop, moidslop. The prefix tells you what kind. Slop does the rest.',
      'It is one of those internet words that doubles as a word-building kit.'
    ]}
  ]
});

replaceEntry('ai-slop', {
  description: 'AI slop is low-quality, repetitive, or mass-produced AI-generated content: images, videos, articles, voiceovers, fake trailers, spam pages, and endless feed filler.',
  deck: 'AI made another image, article, voiceover, and fake trailer before you finished this sentence.',
  definition: 'AI slop means low-quality, repetitive, disposable, or mass-produced content made with generative AI, especially when it is produced at scale for search, feeds, or engagement.',
  sections: [
    { heading: 'What counts as AI slop?', paragraphs: [
      'Generic AI images, fake movie trailers, synthetic voice clips, copied summaries, repetitive list articles, fake celebrity photos, low-effort short videos, and search pages generated by the thousand are the obvious examples.',
      'The complaint is usually about volume and sameness as much as the use of AI itself.'
    ]},
    { heading: 'Why “slop”?', paragraphs: [
      'Because the tools make another piece of content extremely cheap to produce. Slop already meant bulk, disposable output, so the compound fit immediately.',
      'Merriam-Webster now includes low-quality AI-produced digital content in its definition of slop.'
    ]},
    { heading: 'AI slop vs foidslop', paragraphs: [
      'AI slop describes how something was produced and usually implies low quality. Foidslop describes what category the thing belongs to.',
      'A pink AI-generated romance ad can absolutely achieve dual citizenship.'
    ]}
  ]
});

replaceEntry('goyslop', {
  description: 'Goyslop is far-right internet slang for cheap or homogenized mass-market food, media, and consumer products. It often appears in antisemitic conspiracy posting.',
  deck: 'Goyslop is the political branch of the slop family: fast food, mass media, consumer junk, and a lot of ideology attached to the label.',
  definition: 'Goyslop is far-right internet slang for mass-market food, media, or consumer products portrayed as cheap, homogenized, or made for passive consumption. The term often appears in antisemitic conspiracy posting.',
  sections: [
    { heading: 'What does goyslop mean?', paragraphs: [
      'Goyslop combines goy, a Yiddish and Hebrew word for a non-Jewish person, with slop. In current online use it gets applied to fast food, processed food, mainstream entertainment, consumer products, and other mass-market stuff.',
      'A typical post might call a chain meal, superhero movie, sugary cereal, or algorithmic entertainment goyslop.'
    ]},
    { heading: 'Where is it used?', paragraphs: [
      'The term is especially common in far-right and conspiratorial spaces. In those contexts it can come bundled with antisemitic claims about who supposedly controls food, media, or consumer culture.',
      'That political baggage is part of the meaning, not a footnote. It is what separates goyslop from mostly joking compounds such as guyslop or foidslop.'
    ]},
    { heading: 'Why is it in the Slop Dictionary?', paragraphs: [
      'Because it is one of the more established slop compounds and shows how far the suffix can travel. Same construction, very different subculture.',
      'The dictionary tracks the word as it is actually used. Nobody has to pretend all branches of the slop family came from the same place.'
    ]}
  ]
});

replaceArticle('foidslop-media', {
  description: 'Foidslop media is female-coded media: romance, life sims, teen drama, anime, books, games, pop culture, and anything else with obvious foid density.',
  deck: 'Twilight. Nana. The Sims. Gossip Girl. Stardew Valley. The aisle is clearly labeled.',
  sections: [
    { heading: 'What counts as foidslop media?', paragraphs: [
      'Romance is an easy signal. So are yearning, customization, fashion, friendship drama, attractive vampires, elaborate character attachment, life simulation, fan edits, ships, playlists, and a fandom that maintains spreadsheets.',
      'Twilight is foidslop. Nana is foidslop. The Sims is foidslop. Gossip Girl is foidslop. Pride & Prejudice (2005) is prestige foidslop. This is not difficult once you stop pretending categories need licensing boards.'
    ]},
    { heading: 'The main subgenres', paragraphs: [
      'Vampire foidslop has Twilight and The Vampire Diaries. Life-sim foidslop has The Sims, Stardew Valley, and Animal Crossing. Prestige foidslop has period dramas and literary adaptations with hand flexes, wet fields, and catastrophic eye contact.',
      'There is also mall foidslop, anime foidslop, booktok foidslop, cozy foidslop, reality foidslop, pop-star foidslop, and enough other branches to justify a filing cabinet.'
    ]},
    { heading: 'Foid density is not a review score', paragraphs: [
      'A thing can be 99 percent foid-dense and terrible. It can also be 99 percent foid-dense and excellent. Nana manages both maximum foid density and an “actually good” score of yes.',
      'That is why the Media Index keeps separate columns. Foid Density tells you how concentrated the category is. “Actually Good” handles the argument everyone was going to have anyway.'
    ]},
    { heading: 'The current canon', paragraphs: [
      'The first index includes Twilight, Nana, The Sims, Stardew Valley, Gilmore Girls, Gossip Girl, Mamma Mia!, Sex and the City, Animal Crossing, The Vampire Diaries, Pride & Prejudice (2005), and Letterboxd itself.',
      'This is obviously incomplete. The backlog is already dangerous.'
    ]}
  ]
});

replaceArticle('foidslop-usernames', {
  description: 'Foidslop usernames are names like bunni, kitty, angel, fae, pixie, mochi, sushi, rottingangel, dollparts, and wiredprincess. There are rules.',
  deck: 'bunni. kitty. fae. mochi. rottingangel. wiredprincess. You know the account before you click it.',
  sections: [
    { heading: 'The base forms', paragraphs: [
      'The cleanest foidslop usernames are short and soft: bunni, kitty, angel, fae, pixie, doll, peach, cherry, mochi, sushi, matcha.',
      'A July 2026 Reddit thread used exactly this kind of list when people started calling them foidslop usernames. The category was already obvious enough for everyone to start adding examples.'
    ]},
    { heading: 'Add lore', paragraphs: [
      'One modifier changes everything. rottingangel. internetfairy. dollparts. vampiregirl. wiredprincess. deadbunni. sugargore. suddenly the account has a backstory and probably a very specific icon crop.',
      'Good modifiers tend to be dramatic, cute, digital, gothic, medical, religious, or mildly disgusting. The contrast does most of the work.'
    ]},
    { heading: 'Spelling matters', paragraphs: [
      'Bunny becomes bunni. Fairy becomes faerie. Angel gets an extra l. Princess loses a vowel. A normal word gets one small mutation and becomes claimable again.',
      'Numbers are acceptable only under emergency conditions. xX_KittyGirl_2009_Xx belongs to a different archaeological layer.'
    ]},
    { heading: 'The generator problem', paragraphs: [
      'The formula is easy to describe and hard to fake: soft noun, optional cursed modifier, controlled vowel damage, no corporate startup energy.',
      'A good generator should output something that looks stolen from an inactive Tumblr account, not two random pastel nouns glued together by JavaScript.'
    ]}
  ]
});

replaceArticle('why-everything-is-slop', {
  description: 'AI slop, franchise slop, foidslop, goyslop, guyslop, content slop. The internet discovered one suffix that works on almost everything.',
  deck: 'Add a noun to slop and there is a good chance everyone already understands what you mean.',
  sections: [
    { heading: 'Slop means bulk', paragraphs: [
      'Bad is too broad. Slop suggests a conveyor belt. Another AI image, sequel, reaction video, meal box, post, article, or franchise installment is already behind the one you are looking at.',
      'That is why AI slop fit immediately. Merriam-Webster now includes low-quality AI-produced digital content in its definition of slop.'
    ]},
    { heading: 'Then slop became a suffix', paragraphs: [
      'AI slop. Content slop. Franchise slop. Foidslop. Goyslop. Guyslop. Moidslop. The prefix picks the department and slop tells you there is a pile of it.',
      'The best internet suffixes are reusable without permission. Slop is now one of them.'
    ]},
    { heading: 'You can like the slop', paragraphs: [
      'Reality slop, vampire slop, seasonal coffee slop, dating-show slop. People say all of these while actively reaching for another serving.',
      'Sometimes slop means bad. Sometimes it means reliable junk. Sometimes it is basically a genre label with grease on it.'
    ]},
    { heading: 'The pile keeps growing', paragraphs: [
      'The modern feed has too many posts, too many images, too many clips, too many products, too many sequels, and too many summaries of all of the above.',
      'Slop is the correct word for a culture that keeps arriving by the bucket.'
    ]}
  ]
});

replaceArticle('how-forum-slang-goes-mainstream', {
  description: 'Foid, mog, looksmaxxing, slop, based, cope, aura. Forum and subculture slang keeps ending up in normal feeds because the path from 4chan to TikTok is short.',
  deck: '4chan post. Screenshot. X repost. TikTok explainer. Group chat. Coworker says mogged. Done.',
  sections: [
    { heading: 'The pipeline', paragraphs: [
      'A word starts on 4chan, Reddit, a forum, a gaming community, or some tiny Discord. Someone screenshots it. Someone reposts the screenshot. Someone on TikTok explains the repost. Two weeks later nobody remembers the source.',
      'Foid is a clean example. The shortened form was in use on 4chan’s /r9k/ by 2018. Now it shows up in memes and compounds far outside the original incel context.'
    ]},
    { heading: 'Short words travel best', paragraphs: [
      'Mog is four letters. Slop is four letters. Foid is four letters. They fit captions, image macros, replies, and speech without slowing anything down.',
      'Reusable pieces travel even better. Maxxing can attach to looks, sleep, studying, style, aura, books, or whatever somebody wants to pretend is a stat.'
    ]},
    { heading: 'Irony speeds it up', paragraphs: [
      'People repeat weird slang because it sounds funny before they care where it came from. That is how niche words get used by people who would never join the original community.',
      'The original meaning does not disappear. It just stops being the only meaning in circulation.'
    ]},
    { heading: 'This is normal internet language now', paragraphs: [
      'Based, cope, mog, maxxing, aura, slop, foid. Current internet speech is full of imports from imageboards, gaming, fandom, incel forums, stan communities, and whatever else produced a useful word first.',
      'The timeline is less a dictionary than a junk drawer with excellent distribution.'
    ]}
  ]
});

replaceArticle('girl-dinner-was-only-the-beginning', {
  description: 'Girl dinner named the snack plate. Then came guyslop, wifechow, moidslop, foidslop, and an increasingly detailed fake science of who eats what.',
  deck: 'Girl dinner got a name. The internet immediately started drawing the rest of the chart.',
  sections: [
    { heading: 'Girl dinner', paragraphs: [
      'Bread, cheese, fruit, pickles, crackers, dip, leftovers, noodles, cereal, tinned fish. Girl dinner gave a name to meals that were already happening every night.',
      'The phrase went viral in 2023 because everybody recognized the plate before they recognized the term.'
    ]},
    { heading: 'Guyslop', paragraphs: [
      'Protein-heavy bowls, instant noodles, leftover meat, hot sauce, eggs, rice, one pan, no garnish. Guyslop is the male-coded countercategory.',
      'A guyslop meal often looks like the cook optimized calories, protein, dishes, and time, then forgot presentation was a variable.'
    ]},
    { heading: 'Wifechow, moidslop, and the rest', paragraphs: [
      'Wifechow and wifeslop usually mean more conventional cooked meals. Moidslop is what happens when moid enters the same naming system. New categories appear whenever somebody thinks the chart is missing a quadrant.',
      'None of this needs to be scientifically true. The point is that you can usually recognize the plate from the label.'
    ]},
    { heading: 'Foidslop ate the whole chart', paragraphs: [
      'Foidslop started as a food label and then spread to usernames, games, books, media, aesthetics, and everything else female-coded enough to qualify.',
      'That is why this site now has both recipes and a culture desk. The snack plate was only the opening move.'
    ]}
  ]
});

replaceArticle('cringe-labels-become-fandom-labels', {
  title: 'How Internet Labels Turn Into Genres',
  seoTitle: 'How Internet Labels Turn Into Genres: Foidslop, Girl Dinner and More',
  description: 'Girl dinner, foidslop, femcel music, Tumblr girl, BookTok romance. Give the internet a label and people will start sorting things into it immediately.',
  deck: 'Name the category and somebody will make a playlist, ranking, starter pack, generator, and argument thread by Friday.',
  sections: [
    { heading: 'First somebody names the thing', paragraphs: [
      'Girl dinner worked because the plate already existed. Tumblr girl worked because the clothes, music, makeup, photos, and posting style already existed. Foidslop works because the pile of female-coded food, media, games, usernames, and aesthetics is already sitting there.',
      'A good internet label does not create the pattern. It makes the pattern easier to point at.'
    ]},
    { heading: 'Then the list appears', paragraphs: [
      'Once the label is usable, people start sorting. Which movies count? Which usernames count? Is Stardew Valley foidslop? Is Letterboxd itself foidslop? Does a cottage cheese bowl need hot honey before classification?',
      'This is where the label becomes useful. It gives people a shared filing cabinet for things that were previously connected only by instinct.'
    ]},
    { heading: 'Then come the subgenres', paragraphs: [
      'Prestige foidslop. Industrial foidslop. Vampire foidslop. Mall foidslop. Cozy foidslop. The suffixes and modifiers show up as soon as the main category gets crowded.',
      'The same thing happens with music microgenres, aesthetics, fandom labels, fashion cores, and every other internet category with enough examples to subdivide.'
    ]},
    { heading: 'Then somebody builds infrastructure', paragraphs: [
      'A playlist appears. Then a starter pack. Then a tier list. Then a database. Then a generator. Then a website with a Foidslop Media Index and a field called Tumblr Residue.',
      'At that point the category has escaped casual slang and become a hobby.'
    ]}
  ]
});

slopIndex.description = 'A running classification of movies, shows, books, games, and other media by Foid Density, Yearning, Tumblr Residue, Slop Factor, and other necessary measurements.';
const stardew = slopIndex.items.find(item => item.id === 'stardew-valley');
if (stardew) stardew.verdict = 'Cross-demographic foidslop. Farming, decorating, romance, seasonal rituals, tiny gifts, and spreadsheets disguised as a peaceful evening.';

let publisher = fs.readFileSync(publisherPath, 'utf8');
publisher = publisher
  .replace('Daily food / internet culture / etc.', 'Daily slop / culture / etc.')
  .replace('Internet language moves faster than dignity. This is the field guide.', 'Foid. Mog. Girl dinner. AI slop. The words keep multiplying.')
  .replace('Field notes from internet culture.', 'Foidslop, slang, and other internet categories.')
  .replace('Food remains the daily product. This is where the lore goes.', 'Food is still daily. The rest gets filed here.')
  .replace('Vocabulary from forums, feeds, fandoms, and the wider timeline.', 'Words from 4chan, Reddit, TikTok, fandoms, forums, and everywhere else they escape to.')
  .replace(/<p class=\"slop-index-note\">These scores are editorial jokes about media, not scientific claims about the people who enjoy it\. Please do not submit this table to a journal\.<\/p>/, '');
fs.writeFileSync(publisherPath, publisher);

let test = fs.readFileSync(testPath, 'utf8');
if (!test.includes('abstractCultureVoice')) {
  test = test.replace("const staleAiVoice = [", "const abstractCultureVoice = [\\n  /\\bvibe cluster\\b/i,\\n  /\\bfeminine (?:online )?(?:vibe|energy)\\b/i,\\n  /\\bcultural object\\b/i,\\n  /\\blinguistic ecosystem\\b/i,\\n  /\\bproductive (?:internet )?(?:slang|label|suffix)\\b/i,\\n  /\\btransport layer\\b/i,\\n  /\\bworking definition and taxonomy\\b/i\\n];\\n\\nconst staleAiVoice = [");
  test = test.replace("for (const pattern of staleAiVoice) assert.doesNotMatch(value, pattern, `${name} copy matched ${pattern}: ${value}`);", "for (const pattern of [...staleAiVoice, ...abstractCultureVoice]) assert.doesNotMatch(value, pattern, `${name} copy matched ${pattern}: ${value}`);");
}
fs.writeFileSync(testPath, test);

fs.writeFileSync(dictionaryPath, `${JSON.stringify(dictionary, null, 2)}\n`);
fs.writeFileSync(culturePath, `${JSON.stringify(culture, null, 2)}\n`);
fs.writeFileSync(indexPath, `${JSON.stringify(slopIndex, null, 2)}\n`);
console.log('Rewrote culture source to the concrete foidslop baseline.');
