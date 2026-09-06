#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const dictionaryPath = path.join(ROOT, 'data', 'dictionary.json');
const culturePath = path.join(ROOT, 'data', 'culture-articles.json');
const slopIndexPath = path.join(ROOT, 'data', 'slop-index.json');
const publisherPath = path.join(ROOT, 'scripts', 'publish-culture.js');
const testPath = path.join(ROOT, 'test', 'culture-content.test.js');

const dictionary = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));
const culture = JSON.parse(fs.readFileSync(culturePath, 'utf8'));
const slopIndex = JSON.parse(fs.readFileSync(slopIndexPath, 'utf8'));

const dictionaryUpdates = {
  foidslop: {
    description: 'Foidslop is internet slang for food, media, usernames, aesthetics, and other things with a distinctly feminine online vibe. Here is the working definition and taxonomy.',
    deck: 'Foidslop is a loose category for things that feel unmistakably feminine, online, specific, and a little excessive in exactly the right way.',
    definition: 'Foidslop is internet slang for food, media, usernames, aesthetics, or other things with a strongly female-coded or feminine online vibe. Depending on context, it can be an insult, a joke, a self-label, or simply a useful way to name the category.',
    sections: [
      {
        heading: 'Where did the word come from?',
        paragraphs: [
          'Foidslop combines foid and slop. Foid is clipped from femoid, a term that came out of incel forums. Slop is broad internet slang for disposable, low-effort, mass-produced, or unserious stuff.',
          'The compound moved beyond that original context and became a wider label for things that read as intensely feminine online. The newer usage is much looser than the literal pieces of the word suggest.'
        ]
      },
      {
        heading: 'What counts as foidslop?',
        paragraphs: [
          'Food is the easiest version to spot: girl dinner, snack plates, cottage cheese bowls, toast, tinned fish, matcha, fruit, tiny treats, and meals assembled with more vibe than ceremony.',
          'The category also covers media, usernames, aesthetics, playlists, books, games, anime, clothes, profile pictures, and almost anything else with a very specific feminine internet energy.'
        ]
      },
      {
        heading: 'How do people use it now?',
        paragraphs: [
          'Usage depends on the speaker. Sometimes foidslop is an insult. Sometimes it is affectionate. Sometimes it is just a fast way to describe a category that everyone in the conversation already recognizes.',
          'It also works surprisingly well as a modifier. Prestige foidslop, industrial foidslop, cozy foidslop, mall foidslop, vampire foidslop, breakfast foidslop. Once the category exists, the subgenres appear immediately.'
        ]
      },
      {
        heading: 'What does this website mean by it?',
        paragraphs: [
          'foidslop.com started with one useful recipe for one person every day. Food is still the daily product and the center of the homepage.',
          'The culture desk uses foidslop as a taxonomy, not a quality score. Something can be great foidslop, terrible foidslop, prestige foidslop, cheap foidslop, or so concentrated that it requires its own index entry.'
        ]
      }
    ]
  },
  foid: {
    description: 'Foid is internet slang for a woman, shortened from femoid. It originated in incel communities and now also appears in ironic slang and compounds such as foidslop.',
    deck: 'Foid is the four-letter root behind foidslop.',
    definition: 'Foid meaning in slang: foid is a term for a woman, shortened from femoid. It originated in incel communities and is usually derogatory there, while newer ironic and derivative uses also exist.',
    sections: [
      {
        heading: 'Where does foid come from?',
        paragraphs: [
          'Foid is clipped from femoid. Femoid combines female with the robotic sound of humanoid or android and became part of incel forum vocabulary.',
          'The shorter form spread farther because it is easier to type, easier to turn into compounds, and better suited to the compression machine that is internet slang.'
        ]
      },
      {
        heading: 'How is foid used now?',
        paragraphs: [
          'Foid still appears as a derogatory label in some online spaces. It also shows up in ironic speech, memes, screenshots, and newer compound words whose tone can be completely different from the original usage.',
          'Context does most of the work. A forum post using foid as a serious category and a joke about a foidslop username are using the same root in very different ways.'
        ]
      },
      {
        heading: 'Foid vs femoid',
        paragraphs: [
          'Same root, different length. Femoid is the longer form. Foid is the clipped version that became more common in memes and compound slang.'
        ]
      },
      {
        heading: 'Why is it part of foidslop?',
        paragraphs: [
          'Because foidslop is built from foid plus slop. Knowing the root explains the word, but the compound has developed a broader life of its own around food, media, usernames, and aesthetics.'
        ]
      }
    ]
  },
  femoid: {
    description: 'Femoid is internet slang for a woman and the longer form behind foid. The word came from incel forums and combines female with a robotic-sounding ending.',
    deck: 'Femoid is the longer form that foid clipped down to.',
    definition: 'Femoid is internet slang for a woman. It combines female with the sound of words such as humanoid or android, and it is the longer form from which foid was clipped.',
    sections: [
      {
        heading: 'Where did femoid come from?',
        paragraphs: [
          'Femoid developed in incel communities as a deliberately clinical-sounding label for women. The construction makes female sound like the name of a species or machine category.',
          'That strange sci-fi texture is also why the word is so recognizable. It sounds invented because it is.'
        ]
      },
      {
        heading: 'Femoid vs foid',
        paragraphs: [
          'Foid is simply the shorter form. In current internet slang, the four-letter version travels more easily through memes, usernames, replies, and compounds.'
        ]
      },
      {
        heading: 'Why does it matter for foidslop?',
        paragraphs: [
          'Foidslop only makes literal sense once you know what foid was clipped from. After that, the compound is easy to read even when it is being used far outside its original forum context.'
        ]
      }
    ]
  },
  moid: {
    description: 'Moid is internet slang for a man, formed as a gender-flipped counterpart to foid. It appears in jokes, gender-war posting, memes, and compounds such as moidslop.',
    deck: 'The internet made a matching male version and immediately started building compounds with it.',
    definition: 'Moid is internet slang for a man. It was formed as a parallel to foid, with the same robotic-sounding construction pointed in the other direction, and is often used jokingly or insultingly.',
    sections: [
      {
        heading: 'Where did moid come from?',
        paragraphs: [
          'Moid appeared after foid and femoid as an intentionally parallel label for men. It is common in femcel-adjacent jokes, gender-war posting, and ironic internet speech.',
          'Unlike foid, it is basically a response term created by the symmetry of the existing slang.'
        ]
      },
      {
        heading: 'How is it used?',
        paragraphs: [
          'Moid can be a straight insult, a joking category, or just part of the vocabulary of a very online conversation. Tone ranges from dead serious to completely unserious.',
          'The useful clue is usually what surrounds it. If the sentence also contains mog, maxxing, slop, or aura, you are already inside the correct linguistic ecosystem.'
        ]
      },
      {
        heading: 'Related forms',
        paragraphs: [
          'Moidslop is the obvious compound. Once a short label becomes productive internet slang, somebody will attach slop to it before the day is over.'
        ]
      }
    ]
  },
  femcel: {
    description: 'Femcel means female involuntary celibate, but current internet usage also covers memes, aesthetics, character archetypes, playlists, and self-deprecating jokes.',
    deck: 'Femcel has one literal definition and a much larger collection of internet meanings.',
    definition: 'Femcel originally means a woman who identifies with involuntary celibacy. Online, the term also functions as a meme label, aesthetic, character archetype, or joke about loneliness and social failure.',
    sections: [
      {
        heading: 'The literal meaning',
        paragraphs: [
          'Femcel is short for female involuntary celibate. The term developed alongside wider incel vocabulary, although different communities disagree about who counts and whether the categories map cleanly across gender.',
          'That literal definition still exists, especially in discussions about incel subculture itself.'
        ]
      },
      {
        heading: 'The internet meaning got much wider',
        paragraphs: [
          'Femcel is now often used for a vibe rather than a membership category. It can describe a playlist, a fictional character, a posting style, an aesthetic, or a period of eating cereal in bed and refusing to answer texts.',
          'That broader use is why the word can appear in fandom or fashion conversations that have almost nothing to do with the literal definition.'
        ]
      },
      {
        heading: 'Why it sits near foidslop',
        paragraphs: [
          'Both terms belong to the same family of hyper-online gender slang, and both now appear far outside the communities where their roots first developed.',
          'They also combine easily with aesthetic and media categories, which is how internet vocabulary tends to become a whole taxonomy instead of a single word.'
        ]
      }
    ]
  },
  mog: {
    description: 'To mog someone is to visibly outclass them, especially in looks. The term spread from manosphere slang into general internet use for almost any obvious comparison.',
    deck: 'To mog is to win the comparison so clearly that the comparison becomes the content.',
    definition: 'To mog someone means to outclass or overshadow them, originally in appearance and now in almost any obvious comparison. Mogging is the act; mogged is what happened to the loser.',
    sections: [
      {
        heading: 'Where did mog come from?',
        paragraphs: [
          'Dictionary.com traces mog to AMOG, short for Alpha Male of the Group, and to later manosphere and incel usage focused on looks and status.',
          'The word then widened into general-purpose comparison slang. Cats mog their owners, outfits mog other outfits, and a particularly confident pigeon can mog an entire park.'
        ]
      },
      {
        heading: 'Why did it spread?',
        paragraphs: [
          'Mog is short, flexible, and easy to understand from context. It turns any comparison into a tiny competitive event without requiring a paragraph of setup.',
          'That flexibility is why the word works just as well for jawlines, clothes, apartments, food plating, profile pictures, and fictional characters.'
        ]
      },
      {
        heading: 'Common forms',
        paragraphs: [
          'People attach mog to whatever is being compared: heightmog, jawmog, hairmog, framemog, fitmog. The grammar is extremely productive and only loosely supervised.'
        ]
      }
    ]
  },
  looksmaxxing: {
    description: 'Looksmaxxing is internet slang for trying to maximize your appearance, from grooming and style changes to more extreme cosmetic interventions.',
    deck: 'Self-improvement, but written like a character build.',
    definition: 'Looksmaxxing means trying to maximize physical appearance. Online communities often split it into softmaxxing, ordinary grooming and style changes, and hardmaxxing, more extreme interventions.',
    sections: [
      {
        heading: 'Where it came from',
        paragraphs: [
          'The term developed in incel and manosphere communities where appearance was treated like a stat that could be optimized. It later spread through TikTok, X, YouTube, and mainstream slang.',
          'Once maxxing became a reusable suffix, the original topic stopped being a limit. Sleepmaxxing, studymaxxing, stylemaxxing, and every other imaginable version followed.'
        ]
      },
      {
        heading: 'Softmaxxing vs hardmaxxing',
        paragraphs: [
          'Softmaxxing usually means ordinary changes such as haircuts, skincare, fitness, clothes, sleep, and dental care. Hardmaxxing refers to more extreme interventions, including surgery.',
          'Some online looksmaxxing trends also promote unsafe practices. The slang covers a much wider range of behavior than any single piece of advice inside the subculture.'
        ]
      },
      {
        heading: 'Why it matters as slang',
        paragraphs: [
          'Looksmaxxing helped turn maxxing into a general internet construction. Once people understood the format, almost any activity could become a stat to optimize for the joke.'
        ]
      }
    ]
  },
  'girl-dinner': {
    description: 'Girl dinner is internet slang for an informal meal assembled from snacks, leftovers, bread, cheese, fruit, dips, or whatever else is easiest at the moment.',
    deck: 'A plate of unrelated things became dinner, then a meme, then a durable food category.',
    definition: 'Girl dinner is a social-media term for an informal, usually low-effort meal assembled from snacky, leftover, or miscellaneous foods instead of a conventional plated dinner.',
    sections: [
      {
        heading: 'What counts as girl dinner?',
        paragraphs: [
          'Bread and cheese. Fruit and pickles. Crackers with dip. Leftover noodles. Tinned fish. A yogurt bowl. Three things from the fridge that make sense only because they are all currently available.',
          'The category is about assembly and mood more than a fixed ingredient list.'
        ]
      },
      {
        heading: 'Where did the phrase come from?',
        paragraphs: [
          'Girl dinner went viral on TikTok in 2023 as a name for this kind of improvised solo meal. The phrase spread because the behavior was already familiar long before it had a label.',
          'Once named, it became easy to parody, aestheticize, photograph, and spin into countercategories.'
        ]
      },
      {
        heading: 'How it connects to foidslop',
        paragraphs: [
          'Girl dinner is one of the clearest food branches of foidslop. Snack plates, cottage cheese bowls, toast, matcha, little treats, and small assembled meals all live comfortably in the overlap.',
          'Foidslop is broader, though. It can describe the show playing while you eat the girl dinner and the username posting about both.'
        ]
      }
    ]
  },
  slop: {
    description: 'Online, slop means low-quality, disposable, repetitive, mass-produced, or lazily assembled content and products. It can also be affectionate when the slop is enjoyable.',
    deck: 'The internet found one word that works for AI images, franchise movies, frozen dinners, bad posts, and beloved garbage.',
    definition: 'Online, slop is a flexible label for low-quality, disposable, repetitive, mass-produced, or lazily assembled content and products. It can also be affectionate when the speaker enjoys the slop in question.',
    sections: [
      {
        heading: 'Why slop became such a useful word',
        paragraphs: [
          'Slop suggests volume as much as quality. It sounds like something produced in bulk, poured into a feed, and consumed because there is always another serving behind it.',
          'That makes it useful for everything from AI content to franchise entertainment, fast food, trend cycles, product spam, and repetitive social posts.'
        ]
      },
      {
        heading: 'Slop can be affectionate',
        paragraphs: [
          'People constantly call things slop while actively enjoying them. Reality slop, seasonal coffee slop, vampire slop, dating-show slop. The word can function as a complaint, a genre tag, or both at once.',
          'That flexible tone is what makes compounds such as foidslop useful. The suffix does not automatically tell you whether the speaker approves.'
        ]
      },
      {
        heading: 'Common compounds',
        paragraphs: [
          'AI slop is the biggest current example. Foidslop, goyslop, guyslop, franchise slop, content slop, and countless one-off inventions all use the same basic construction.'
        ]
      }
    ]
  },
  'ai-slop': {
    description: 'AI slop is internet slang for low-quality or mass-produced AI-generated images, videos, articles, audio, and other digital content.',
    deck: 'AI made content cheap enough that the internet needed a word for the overflow.',
    definition: 'AI slop is internet slang for low-quality, repetitive, disposable, or mass-produced content created with generative AI, especially when it is produced at scale for feeds, search, or engagement.',
    sections: [
      {
        heading: 'What counts as AI slop?',
        paragraphs: [
          'Common examples include generic AI images, synthetic voice videos, repetitive list articles, copied summaries, fake trailers, low-effort short-form videos, and pages generated mainly to occupy search or social feeds.',
          'The label usually says as much about scale and sameness as it does about the underlying technology.'
        ]
      },
      {
        heading: 'Why did slop fit so well?',
        paragraphs: [
          'Generative tools can produce another image, paragraph, voiceover, or clip at very low marginal cost. Slop already carried the idea of bulk output, so the compound was almost inevitable.',
          'Merriam-Webster now includes low-quality AI-produced digital content in its definition of slop.'
        ]
      },
      {
        heading: 'AI slop vs foidslop',
        paragraphs: [
          'AI slop is mostly about production and quality. Foidslop is mostly about audience, style, and cultural vibe. Something could technically be both, but the labels are measuring different things.'
        ]
      }
    ]
  },
  goyslop: {
    description: 'Goyslop is internet political slang for mass-market media, food, or consumer products framed as cheap or culturally flattening. The term is common in far-right online spaces.',
    deck: 'Goyslop is a political cousin of the wider slop vocabulary, with a much more specific ideological history.',
    definition: 'Goyslop is internet political slang for mass-market food, entertainment, or consumer culture portrayed as cheap, homogenized, or designed for passive consumption. It is most common in far-right and conspiratorial online spaces.',
    sections: [
      {
        heading: 'What does the word mean?',
        paragraphs: [
          'Goyslop combines goy, a Yiddish and Hebrew term for a non-Jewish person, with slop. Online, it is used for mass-market products or media that the speaker sees as low-quality, homogenized, or culturally empty.',
          'The term often appears in far-right spaces and can be tied to antisemitic theories about who controls media, food, or consumer culture.'
        ]
      },
      {
        heading: 'How does it fit the slop family?',
        paragraphs: [
          'Like foidslop and AI slop, the prefix narrows the category while slop supplies the idea of cheap or bulk consumption. The important difference is the political context attached to goyslop.',
          'That makes it less interchangeable with the mostly joking lifestyle and media compounds elsewhere in the Slop Dictionary.'
        ]
      },
      {
        heading: 'Why include it here?',
        paragraphs: [
          'Because it is part of the same productive slop vocabulary and appears often enough in current internet language to need a definition. The dictionary tracks how the words are used, even when the subcultures behind them are very different.'
        ]
      }
    ]
  }
};

for (const entry of dictionary.entries) {
  const update = dictionaryUpdates[entry.slug];
  if (update) Object.assign(entry, update);
}

const articleUpdates = {
  'foidslop-media': {
    description: 'Foidslop media is an internet label for movies, shows, books, games, and other culture with a distinctly feminine audience, aesthetic, or fandom energy.',
    deck: 'Romance, yearning, hyper-specific fandom, gorgeous interfaces, and a suspicious amount of character attachment. The classification process has begun.',
    sections: [
      {
        heading: 'The category is bigger than food',
        paragraphs: [
          'Foidslop first made obvious sense around food because girl dinner already supplied the visual vocabulary: snack plates, cottage cheese, toast, tinned fish, tiny treats, matcha, and small meals assembled with strong opinions about the bowl.',
          'The same label now gets applied to movies, television, books, games, anime, music, and fandom. A 2026 Polyester essay explicitly used foidslop as a media category, which is useful because the pattern is easy to recognize once somebody names it.'
        ]
      },
      {
        heading: 'Common foidslop signals',
        paragraphs: [
          'There is no checklist, but recurring ingredients include romance, yearning, beauty, melodrama, character attachment, customization, friendship, fashion, elaborate fandom behavior, and a very obvious audience of women or queer people.',
          'None of those ingredients is mandatory. The category works more like a vibe cluster than a genre. Twilight and The Sims can both register as foidslop without having much else in common.'
        ]
      },
      {
        heading: 'Quality is a separate axis',
        paragraphs: [
          'Excellent foidslop exists. Terrible foidslop exists. So do prestige foidslop, comfort foidslop, bargain-bin foidslop, mall foidslop, vampire foidslop, anime foidslop, and productions so concentrated they should probably ship with a scorecard.',
          'That is why the label is more useful as taxonomy than criticism. It tells you what kind of cultural object you are looking at, not whether it earned five stars.'
        ]
      },
      {
        heading: 'How this site uses the label',
        paragraphs: [
          'foidslop uses the term like a genre tag with more room for jokes. The Media Index scores objects on foid density, yearning, Tumblr residue, male understandability, and other measurements developed under extremely questionable laboratory conditions.',
          'If the category is obvious enough that people can argue about whether Pride & Prejudice (2005) has a higher yearning score than Twilight, the taxonomy is already doing its job.'
        ]
      }
    ]
  },
  'foidslop-usernames': {
    description: 'Foidslop usernames are soft, cute, food-coded, fairy-coded, doll-coded, or aggressively online names like bunni, kitty, angel, fae, pixie, mochi, and sushi.',
    deck: 'bunni. faerie. rottingangel. mochi. One small username and suddenly the account has lore.',
    sections: [
      {
        heading: 'Yes, people are actually saying this',
        paragraphs: [
          'A July 2026 Reddit thread praised foidslop usernames and listed examples such as bunni, kitty, kitten, fairy, fae, pixie, angel, and sushi. The replies immediately started adding their own candidates.',
          'That is enough to establish the core species: short, soft, cute, food-coded, doll-coded, fairy-coded, or one adjective away from becoming a perfume name.'
        ]
      },
      {
        heading: 'The main archetypes',
        paragraphs: [
          'The pure form is tiny and soft: bunni, angel, kitty, fae, pixie. Food names score well too because sushi, peach, cherry, mochi, and matcha already sound like fully formed profile identities.',
          'Then there is lore-heavy foidslop: rottingangel, internetfairy, dollparts, vampiregirl, wiredprincess. Add one dramatic noun and the username suddenly has a backstory.'
        ]
      },
      {
        heading: 'Why the names work',
        paragraphs: [
          'A strong foidslop username is memorable before it is descriptive. It is usually short enough to look good in a profile header and specific enough that someone else wishes they claimed it first.',
          'Misspellings and vowel damage help. Bunny becomes bunni. Fairy becomes faerie. Angel gains an extra l for reasons that are spiritually obvious.'
        ]
      },
      {
        heading: 'Obviously this needs a generator',
        paragraphs: [
          'The formula is sitting right there: soft noun, optional dramatic modifier, maybe a food word, maybe a corrupted vowel. The only difficult part is making the output feel observed rather than assembled from a pastel random-word list.',
          'That means collecting real patterns first. The generator should produce usernames that could plausibly already belong to someone with an immaculate profile picture and three niche fandoms.'
        ]
      }
    ]
  },
  'why-everything-is-slop': {
    description: 'AI slop, content slop, foidslop, goyslop, guyslop, and more. The internet turned slop into one of its most productive labels and suffixes.',
    deck: 'Slop became a construction kit. Add a noun and the timeline usually understands the category before you finish explaining it.',
    sections: [
      {
        heading: 'Slop describes output as much as quality',
        paragraphs: [
          'Calling something bad content tells you almost nothing. Calling it slop suggests volume, sameness, speed, and the sense that another serving is already on the way.',
          'That is why the word mapped so easily onto generative AI. Merriam-Webster now includes low-quality AI-produced digital content in its definition of slop.'
        ]
      },
      {
        heading: 'Then slop became a suffix',
        paragraphs: [
          'Once the pattern was established, compounds multiplied. AI slop and content slop focus on production. Foidslop points toward audience and aesthetic. Guyslop and moidslop turn food into gendered internet taxonomy. Goyslop carries its own political context.',
          'The structure is simple enough to improvise with. Prefix tells you the flavor. Slop tells you there is a category to be argued about.'
        ]
      },
      {
        heading: 'People also use slop affectionately',
        paragraphs: [
          'Franchise slop, reality slop, seasonal coffee slop, dating-show slop. People frequently call something slop while actively planning to consume more of it.',
          'That mixed tone is normal now. Slop can mean low quality, guilty pleasure, reliable genre product, beloved garbage, or simply too much of a thing.'
        ]
      },
      {
        heading: 'Why the word stuck',
        paragraphs: [
          'The modern internet produces endless quantities of posts, images, shows, clips, products, summaries, reactions, and remixes. Slop is compact vocabulary for that abundance.',
          'It is also funny to say. Linguistics departments can only do so much against a word with that kind of mouthfeel.'
        ]
      }
    ]
  },
  'how-forum-slang-escapes': {
    slug: 'how-forum-slang-goes-mainstream',
    title: 'How Forum Slang Goes Mainstream',
    seoTitle: 'How Forum Slang Goes Mainstream: Mog, Maxxing, Foid and Slop',
    description: 'Mog, looksmaxxing, foid, slop, and other niche forum words keep crossing into TikTok and ordinary speech. The path from subculture to mainstream is now very short.',
    deck: 'Yesterday it was forum jargon. Today it is in a TikTok caption. Tomorrow your coworker says mogged without explanation.',
    sections: [
      {
        heading: 'The distribution pipeline is short',
        paragraphs: [
          'Niche communities have always invented vocabulary. The difference now is how quickly screenshots, clips, explainers, reaction posts, and repost accounts move a word between platforms.',
          'A term no longer needs the original community to survive. Once enough people understand the joke from context, the word becomes portable.'
        ]
      },
      {
        heading: 'Some words are built to spread',
        paragraphs: [
          'Mog is tiny and flexible. Maxxing is a reusable suffix. Slop is both a noun and a construction kit. Those forms are easy to remix, which gives them more chances to appear in unrelated communities.',
          'Once you understand looksmaxxing, sleepmaxxing makes sense immediately. Once you understand AI slop, franchise slop and foidslop barely need definitions.'
        ]
      },
      {
        heading: 'Irony is a transport layer',
        paragraphs: [
          'A lot of slang travels through jokes first. People repeat a word because it sounds funny, because the structure is useful, or because everyone else on the timeline already seems to know it.',
          'That is how a term can keep its original history while picking up completely different tones and uses as it moves.'
        ]
      },
      {
        heading: 'Mainstream internet language is mostly migration',
        paragraphs: [
          'Current feeds are full of words that started in forums, fandoms, gaming communities, group chats, imageboards, and tiny subcultures with their own dictionaries.',
          'The internet rarely invents one universal vocabulary at once. It imports a hundred local ones and lets the funniest pieces compete.'
        ]
      }
    ]
  },
  'girl-dinner-was-only-the-beginning': {
    description: 'Girl dinner gave the internet a name for improvised solo meals. Then came foidslop, guyslop, wifechow, moidslop, and an entire fake science of dinner taxonomy.',
    deck: 'We named the snack plate and accidentally opened a research institute.',
    sections: [
      {
        heading: 'Girl dinner named something real',
        paragraphs: [
          'The original girl dinner joke worked because it described a familiar way of eating alone: bread, cheese, fruit, pickles, leftovers, noodles, cereal, snacks, or whatever else becomes dinner when nobody needs a composed plate.',
          'The Washington Post documented how quickly the trend expanded from pretty little boards into deliberately chaotic meals. The category survived because the behavior was already common before the name arrived.'
        ]
      },
      {
        heading: 'Then the countercategories appeared',
        paragraphs: [
          'Once one food archetype gets a name, the timeline starts inventing neighbors. Guyslop appears for protein-heavy bowls, instant noodles, leftovers, hot sauce, and meals with the structural confidence of a hardware project. Wifechow and wifeslop appear for more conventional cooked dinners. Moidslop exists because the naming scheme is too easy not to use.',
          'None of these categories has a governing body. That is the point. They are vibe labels that become funnier the more seriously the chart is formatted.'
        ]
      },
      {
        heading: 'Foidslop has the widest range',
        paragraphs: [
          'Foidslop overlaps with girl dinner but is not limited to meals. It can cover the bowl, the playlist playing while the bowl is assembled, the username posting the bowl, and the television show visible behind it.',
          'That makes food a useful branch of the taxonomy rather than the whole tree.'
        ]
      },
      {
        heading: 'The fake science is the fun part',
        paragraphs: [
          'People recognize these archetypes quickly even though the borders are fuzzy. That is ideal conditions for charts, arguments, rankings, and invented terminology.',
          'A useful internet taxonomy does not need biological truth. It needs enough pattern recognition that the reader immediately wants to add a category the chart forgot.'
        ]
      }
    ]
  },
  'reclaiming-cringe': {
    slug: 'cringe-labels-become-fandom-labels',
    title: 'How Cringe Labels Become Fandom Labels',
    seoTitle: 'How Internet Cringe Labels Become Fandom Labels',
    description: 'Internet labels often start as teasing and end up becoming the fastest way to find the exact people who like the same thing. Foidslop fits that pattern perfectly.',
    deck: 'Call a category cringe long enough and somebody will eventually put it in a bio, a playlist title, and a Letterboxd list.',
    sections: [
      {
        heading: 'Labels are efficient',
        paragraphs: [
          'Chick flick, horse girl, Tumblr girl, fangirl, basic, girly pop. Internet culture produces endless labels because one phrase can compress a whole bundle of taste, behavior, aesthetics, and references.',
          'Once the bundle is recognizable, people can use the label without agreeing on every detail.'
        ]
      },
      {
        heading: 'Then the labeled group starts using the label',
        paragraphs: [
          'This happens constantly because labels are useful for finding things. A category that began as teasing can become a search term, playlist tag, outfit description, fandom joke, or shorthand for a very specific kind of recommendation.',
          'At that point the practical value of the label can outgrow whatever tone it started with.'
        ]
      },
      {
        heading: 'Foidslop is especially good at this',
        paragraphs: [
          'The word is memorable, visually strange, and broad enough to classify a snack plate, Gossip Girl, a fairy-coded username, and a pink game interface without needing four separate vocabularies.',
          'That makes it useful for people who want more of the category. If somebody asks for industrial-grade foidslop media, the request is weirdly specific and immediately understandable.'
        ]
      },
      {
        heading: 'A label becomes culture when people build with it',
        paragraphs: [
          'Lists appear. Rankings appear. Moodboards appear. Somebody makes a taxonomy. Somebody else argues with the taxonomy. Then there is a playlist and a generator and a spreadsheet.',
          'That is the stage foidslop is entering now. The word is useful enough to support its own little ecosystem, which is more interesting than deciding whether the label is flattering.'
        ]
      }
    ]
  }
};

for (const article of culture.articles) {
  const update = articleUpdates[article.slug];
  if (update) Object.assign(article, update);
}

slopIndex.description = 'An unserious but carefully maintained classification of movies, shows, books, games, and other media with measurable foidslop energy.';

fs.writeFileSync(dictionaryPath, `${JSON.stringify(dictionary, null, 2)}\n`);
fs.writeFileSync(culturePath, `${JSON.stringify(culture, null, 2)}\n`);
fs.writeFileSync(slopIndexPath, `${JSON.stringify(slopIndex, null, 2)}\n`);

let publisher = fs.readFileSync(publisherPath, 'utf8');
const replacements = [
  ['Daily food / poisoned internet / etc.', 'Daily food / internet culture / etc.'],
  ['Related cursed vocabulary', 'Related vocabulary'],
  ['Internet vocabulary nobody should reasonably need explained.', 'Internet vocabulary for foidslop, girl dinner, mogging, slop, and everything around them.'],
  ['Reference desk / unfortunate vocabulary', 'Reference desk / internet vocabulary'],
  ['Keep poisoning your browser history', 'More from the culture desk'],
  ['Field notes from the poisoned internet.', 'Field notes from internet culture.'],
  ['Culture: Field Notes From the Poisoned Internet', 'Culture: Foidslop, Slang and Internet Taxonomy'],
  ['Field notes from the poisoned internet: foidslop media, usernames, slop vocabulary, girl dinner, internet taxonomy, and other terminally online subjects.', 'Foidslop media, usernames, slop vocabulary, girl dinner, internet taxonomy, and other extremely online subjects.'],
  ['Vocabulary from places your browser should probably clear automatically.', 'Vocabulary from forums, feeds, fandoms, and the wider timeline.'],
  ['Classification desk / peer review denied', 'Classification desk / extremely serious metrics'],
  ['These scores are editorial jokes about media, not scientific claims about the people who enjoy it. Please do not submit this table to a journal.', 'Methodology: vibes, screenshots, rewatch frequency, fandom residue, and one extremely biased spreadsheet.'],
  ['Yearning has now been quantified. Regrettably.', 'Yearning has now been quantified. The spreadsheet is thriving.']
];
for (const [from, to] of replacements) publisher = publisher.split(from).join(to);
publisher = publisher.replace('<a href="${prefix}" aria-label="foidslop home">', '<a href="${prefix || \'/\'}" aria-label="foidslop home">');
publisher = publisher.replace('<a href="${prefix}#dispatch" class="nav-link header-dispatch">Dispatch</a>', '<a href="${prefix || \'/\'}#dispatch" class="nav-link header-dispatch">Dispatch</a>');
fs.writeFileSync(publisherPath, publisher);

let tests = fs.readFileSync(testPath, 'utf8');
if (!tests.includes('poisoned internet')) {
  tests = tests.replace(
    '/\\bnavigate the complexities\\b/i\n];',
    '/\\bnavigate the complexities\\b/i,\n  /\\bpoisoned internet\\b/i,\n  /\\bunfortunate vocabulary\\b/i,\n  /\\bcursed vocabulary\\b/i,\n  /\\bcivilizational decline\\b/i,\n  /\\bdehumanizing piece\\b/i,\n  /\\bhostile vocabulary\\b/i,\n  /\\breclaim(?:ed|ing)\\b/i\n];'
  );
}
fs.writeFileSync(testPath, tests);

for (const stale of [
  path.join(ROOT, 'culture', 'how-forum-slang-escapes.html'),
  path.join(ROOT, 'culture', 'reclaiming-cringe.html')
]) {
  if (fs.existsSync(stale)) fs.rmSync(stale);
}

console.log('Rewrote culture voice around taxonomy, examples, and usage instead of defensive framing.');
