#!/usr/bin/env python3
import json
import re
from pathlib import Path

ROOT = Path.cwd()


def load_json(path):
    return json.loads((ROOT / path).read_text())


def write_json(path, value):
    (ROOT / path).write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")


def write(path, content):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content)


def replace_once(path, old, new):
    target = ROOT / path
    text = target.read_text()
    if old not in text:
        raise SystemExit(f"Expected patch target missing in {path}: {old[:90]!r}")
    target.write_text(text.replace(old, new, 1))


def append_marker(path, marker, content):
    target = ROOT / path
    text = target.read_text()
    pattern = re.compile(rf"\n?/\* {re.escape(marker)}:start \*/[\s\S]*?/\* {re.escape(marker)}:end \*/\n?", re.M)
    text = pattern.sub("\n", text).rstrip() + f"\n\n/* {marker}:start */\n{content.rstrip()}\n/* {marker}:end */\n"
    target.write_text(text)


# ---------------------------------------------------------------------------
# Curated dictionary expansion
# ---------------------------------------------------------------------------
dictionary = load_json('data/dictionary.json')
existing = {entry['slug'] for entry in dictionary['entries']}
new_entries = [
    {
        "slug": "guyslop",
        "term": "guyslop",
        "title": "What Does Guyslop Mean?",
        "seoTitle": "Guyslop Meaning: Male-Coded Food Slang Explained",
        "description": "Guyslop is internet slang for male-coded food: protein bowls, eggs, rice, meat, hot sauce, instant noodles, and meals optimized harder than they are plated.",
        "deck": "Guyslop is what happens when dinner gets optimized for protein, speed, one pan, and absolutely no interest in garnish.",
        "definition": "Guyslop is internet slang for male-coded food, especially meals built around protein, starch, hot sauce, eggs, meat, instant noodles, or whatever fits in one bowl with minimal ceremony.",
        "sections": [
            {
                "heading": "What counts as guyslop?",
                "paragraphs": [
                    "Rice with ground beef and eggs. Instant noodles with three extra eggs. Chicken, frozen vegetables, and hot sauce in the same pan. A protein bowl whose final plating decision was choosing the bowl.",
                    "The category is less about ingredients than priorities. Calories, protein, speed, dishes, and cost usually beat color theory."
                ]
            },
            {
                "heading": "Guyslop vs girl dinner",
                "paragraphs": [
                    "Girl dinner often looks assembled: cheese, fruit, crackers, pickles, toast, dip, leftovers. Guyslop usually looks cooked together and served together.",
                    "Both categories describe low-friction meals. One has tiny forks. The other has a skillet that will remain in the sink until morning."
                ]
            },
            {
                "heading": "Guy chow and moidslop",
                "paragraphs": [
                    "Guy chow is the friendlier version of the same idea. Moidslop uses moid instead of guy and plugs directly into the foid, moid, and slop naming system.",
                    "There is no standards board. If the bowl is brown, protein-heavy, fast, and eaten over a keyboard, the paperwork is probably already approved."
                ]
            }
        ],
        "related": ["girl-dinner", "moid", "slop", "foidslop"],
        "sources": [
            {"label": "Reddit: contemporary guyslop and foidslop food taxonomy", "url": "https://www.reddit.com/r/redscarepod/comments/1k9icsb/know_the_difference/"}
        ]
    },
    {
        "slug": "wifechow",
        "term": "wifechow",
        "title": "What Does Wifechow Mean?",
        "seoTitle": "Wifechow Meaning: Internet Food Slang Explained",
        "description": "Wifechow is internet slang for conventional home-cooked food associated with a wife or girlfriend, with wifeslop used as the messier sibling term.",
        "deck": "Wifechow is the casserole, roast, pasta bake, soup, and proper plated-dinner branch of the fake internet food sciences.",
        "definition": "Wifechow is internet slang for conventional home-cooked food associated with a wife or girlfriend. Wifeslop is a rougher synonym used in the same food-taxonomy jokes.",
        "sections": [
            {
                "heading": "What counts as wifechow?",
                "paragraphs": [
                    "Casseroles, baked pasta, roast chicken, soup with actual prep, potatoes with a second vegetable, and dinners that arrive on separate parts of the plate instead of one bowl.",
                    "The joke is that the meal looks recognizably domestic and complete. It is the opposite of opening three packages and calling the arrangement a tasting menu."
                ]
            },
            {
                "heading": "Wifechow vs wifeslop",
                "paragraphs": [
                    "The words are usually doing the same job. Wifechow sounds warmer. Wifeslop sounds like somebody is trying to make baked ziti part of a taxonomy chart.",
                    "Internet labels are rarely stable enough to deserve separate regulatory agencies, so this dictionary keeps them together."
                ]
            },
            {
                "heading": "Where it fits on the chart",
                "paragraphs": [
                    "Guyslop is optimized bowl food. Girl dinner is assembled snack food. Wifechow is the conventional cooked-meal corner. Foidslop can overlap any of them when the broader female-coded category takes over.",
                    "The categories are jokes, not nutritional science. Their main test is whether the label makes the plate immediately legible."
                ]
            }
        ],
        "related": ["guyslop", "girl-dinner", "foidslop", "slop"],
        "sources": [
            {"label": "Reddit: contemporary guyslop and foidslop food taxonomy", "url": "https://www.reddit.com/r/redscarepod/comments/1k9icsb/know_the_difference/"}
        ]
    },
    {
        "slug": "girl-breakfast",
        "term": "girl breakfast",
        "title": "What Is Girl Breakfast?",
        "seoTitle": "Girl Breakfast Meaning: The Girl Dinner Morning Spin-Off",
        "description": "Girl breakfast is the morning cousin of girl dinner: coffee, yogurt, fruit, toast, pastries, leftovers, or whatever counts as breakfast before the day gets serious.",
        "deck": "Coffee, half a yogurt, fruit, toast, a pastry, yesterday's leftovers. Breakfast has entered the taxonomy.",
        "definition": "Girl breakfast is an internet label for informal, snacky, or improvised breakfasts in the same family as girl dinner. The exact meal matters less than the recognizable morning format.",
        "sections": [
            {
                "heading": "What does girl breakfast look like?",
                "paragraphs": [
                    "Coffee plus something small is the basic form. Yogurt and berries, toast with whatever is around, fruit, a pastry, cottage cheese, leftover noodles, or three bites taken while standing in the kitchen all qualify.",
                    "The category works because breakfast was already loose. The label just gives the loose version a name."
                ]
            },
            {
                "heading": "Girl breakfast vs girl dinner",
                "paragraphs": [
                    "Girl dinner became the famous version because dinner carries more expectations. Breakfast has always tolerated cereal, toast, coffee, or nothing until noon.",
                    "The morning spin-off keeps the same assembled, low-friction logic and adds caffeine as a structural requirement."
                ]
            },
            {
                "heading": "Does it count as foidslop?",
                "paragraphs": [
                    "Easily. Matcha, berries, yogurt, toast, tiny pastries, cottage cheese, and aesthetically arranged leftovers are all already standing near the center of the foidslop food map.",
                    "A giant breakfast burrito can still qualify if the surrounding evidence is strong enough. Taxonomy is flexible when brunch gets involved."
                ]
            }
        ],
        "related": ["girl-dinner", "foidslop", "slop"],
        "sources": [
            {"label": "The Washington Post: Girl Dinner is everything and nothing", "url": "https://www.washingtonpost.com/food/2023/08/04/girl-dinner-trend-meaning/"}
        ]
    },
    {
        "slug": "content-slop",
        "term": "content slop",
        "title": "What Does Content Slop Mean?",
        "seoTitle": "Content Slop Meaning: Why Feeds Feel Full of Slop",
        "description": "Content slop is high-volume, low-effort media made to keep the feed moving: recycled posts, filler articles, reaction clips, listicles, and endless summaries.",
        "deck": "The feed needs another post. Nobody has anything to say. Content slop clocks in anyway.",
        "definition": "Content slop is high-volume, low-effort media produced mainly to keep a feed, channel, site, or content schedule moving. It can be human-made, AI-made, or assembled from both.",
        "sections": [
            {
                "heading": "What counts as content slop?",
                "paragraphs": [
                    "Reposted clips with new captions, filler listicles, reaction videos that add nothing, generic explainers, recycled threads, summaries of summaries, and pages built because a publishing calendar had an empty square.",
                    "The common feature is volume without much reason for the individual item to exist."
                ]
            },
            {
                "heading": "Content slop vs AI slop",
                "paragraphs": [
                    "AI slop describes the production method or obvious machine-made texture. Content slop describes the role the thing plays in the feed.",
                    "A person can make content slop manually. An AI system can make something useful. The circles overlap heavily without being identical."
                ]
            },
            {
                "heading": "Why the word works",
                "paragraphs": [
                    "Slop suggests bulk. One mediocre post is just a mediocre post. Forty versions arriving every day start to look like a delivery system.",
                    "That is why the suffix keeps spreading. It describes not only quality, but quantity, repetition, and the feeling that another serving is already on the conveyor belt."
                ]
            }
        ],
        "related": ["ai-slop", "slop", "foidslop"],
        "sources": [
            {"label": "Merriam-Webster: slop", "url": "https://www.merriam-webster.com/dictionary/slop"}
        ]
    }
]
for entry in new_entries:
    if entry['slug'] not in existing:
        dictionary['entries'].append(entry)
dictionary['revisionDate'] = '2026-09-06'
write_json('data/dictionary.json', dictionary)


# ---------------------------------------------------------------------------
# Curated culture expansion
# ---------------------------------------------------------------------------
culture = load_json('data/culture-articles.json')
existing_articles = {article['slug'] for article in culture['articles']}
new_articles = [
    {
        "slug": "foidslop-media-canon",
        "title": "The Foidslop Media Canon",
        "seoTitle": "The Foidslop Media Canon: Movies, Shows, Games and Books",
        "description": "A starter canon of foidslop media across movies, television, anime, games, books, and platforms, from Twilight and Nana to The Sims and Letterboxd.",
        "eyebrow": "Field notes / canon",
        "deck": "Every category eventually gets a canon. This one has vampires, yearning, customization menus, impossible outfits, and several bad boyfriends.",
        "sections": [
            {
                "heading": "The obvious first ballot",
                "paragraphs": [
                    "Twilight, Nana, The Sims, Gossip Girl, Sex and the City, Gilmore Girls, The Vampire Diaries, Animal Crossing, Stardew Valley, Mamma Mia!, and Pride & Prejudice (2005) all clear the first round without needing a hearing.",
                    "They are not identical. That is the point. Foidslop media is a category wide enough to contain both wet-field yearning and spending forty minutes picking a kitchen counter in Create-a-Sim."
                ]
            },
            {
                "heading": "The main departments",
                "paragraphs": [
                    "Vampire foidslop covers Twilight and The Vampire Diaries. Life-sim foidslop covers The Sims, Stardew Valley, and Animal Crossing. Prestige foidslop covers period drama, literary adaptation, and anything where one hand flex causes a decade of discussion.",
                    "There is also mall foidslop, anime foidslop, BookTok foidslop, reality foidslop, pop-star foidslop, and the entire Letterboxd activity layer sitting on top of the pile."
                ]
            },
            {
                "heading": "Canon does not mean quality ranking",
                "paragraphs": [
                    "Something can be foundational because everybody recognizes the category through it, not because it won an award. Twilight does more taxonomic work than plenty of better-reviewed movies.",
                    "The Media Index keeps Actually Good separate from Foid Density for exactly this reason. A perfect specimen can still be terrible. A perfect specimen can also be Nana."
                ]
            },
            {
                "heading": "The canon stays open",
                "paragraphs": [
                    "A useful canon needs arguments at the edge. Barbie? Fleabag? Chappell Roan? Dress to Impress? A Court of Thorns and Roses? The disputed border is where the category gets interesting.",
                    "That is also what Is It Foidslop? is for. The index starts the argument. The vote lets everybody else make it worse."
                ]
            }
        ],
        "dictionaryLinks": ["foidslop", "slop", "mog"],
        "sources": [
            {"label": "Polyester: Staying Hungry for Foidslop", "url": "https://www.polyesterzine.com/features/staying-hungry-for-foidslop"}
        ]
    },
    {
        "slug": "internet-gendered-food-taxonomy",
        "title": "The Internet's Gendered Food Taxonomy",
        "seoTitle": "Guyslop, Girl Dinner, Wifechow and Foidslop Explained",
        "description": "Girl dinner, guyslop, wifechow, moidslop, and foidslop form an increasingly detailed internet taxonomy for meals that are easier to recognize than define.",
        "eyebrow": "Field notes / food taxonomy",
        "deck": "Girl dinner got famous. Guyslop got a bowl. Wifechow got a casserole dish. The chart now has enough categories to need documentation.",
        "sections": [
            {
                "heading": "Girl dinner: assembled",
                "paragraphs": [
                    "Bread, cheese, fruit, crackers, pickles, dip, leftovers, tinned fish, toast, little desserts. Girl dinner usually looks assembled rather than engineered.",
                    "The term took off because the plate was instantly recognizable. The name arrived after the behavior."
                ]
            },
            {
                "heading": "Guyslop: optimized",
                "paragraphs": [
                    "Protein, starch, eggs, meat, hot sauce, instant noodles, one pan, one bowl. Guyslop looks like somebody opened a spreadsheet before opening the fridge.",
                    "Presentation is optional. Macros, speed, price, and the number of dishes are allowed to become the actual recipe."
                ]
            },
            {
                "heading": "Wifechow: cooked dinner",
                "paragraphs": [
                    "Wifechow is the conventional home-cooked corner: casserole, baked pasta, soup, roast chicken, potatoes, vegetables, dinner that expects a table instead of a desk.",
                    "Wifeslop is the rougher sibling term. The internet rarely settles on one label when two will create more arguments."
                ]
            },
            {
                "heading": "Foidslop escapes the plate",
                "paragraphs": [
                    "Foidslop overlaps girl dinner but no longer stops at food. Media, usernames, games, books, playlists, interfaces, and aesthetics can all qualify.",
                    "That makes it the strange branch of the chart that became larger than the original chart. The dinner taxonomy ended up with a culture desk."
                ]
            }
        ],
        "dictionaryLinks": ["girl-dinner", "guyslop", "wifechow", "foidslop", "moid"],
        "sources": [
            {"label": "The Washington Post: Girl Dinner is everything and nothing", "url": "https://www.washingtonpost.com/food/2023/08/04/girl-dinner-trend-meaning/"},
            {"label": "Reddit: contemporary guyslop and foidslop food taxonomy", "url": "https://www.reddit.com/r/redscarepod/comments/1k9icsb/know_the_difference/"}
        ]
    },
    {
        "slug": "when-did-everyone-start-saying-mog",
        "title": "When Did Everyone Start Saying Mog?",
        "seoTitle": "When Did Everyone Start Saying Mog? Mogging Slang Explained",
        "description": "Mog moved from looks and bodybuilding slang into TikTok, X, gaming, fashion, sports, and normal conversation. Four letters were enough to travel everywhere.",
        "eyebrow": "Field notes / language",
        "deck": "First you mogged somebody's face. Then their outfit, desk setup, lunch, football club, vacation, handwriting, and entire bloodline got involved.",
        "sections": [
            {
                "heading": "The original job",
                "paragraphs": [
                    "Mog means visibly outclass or overshadow somebody, especially in looks. It grew through bodybuilding, looks-focused forums, imageboards, and the same online spaces that produced a lot of maxxing vocabulary.",
                    "The useful part was always the comparison. One person enters the frame and the other person suddenly looks like supporting cast."
                ]
            },
            {
                "heading": "Then the object stopped mattering",
                "paragraphs": [
                    "Outfit mog. Height mog. Aura mog. Desk mog. City mog. Lunch mog. Once the verb became familiar, people started applying it to anything with an obvious winner.",
                    "That is how niche slang usually goes mainstream. The word keeps the useful mechanic and drops the requirement that you know its original forum history."
                ]
            },
            {
                "heading": "Why mog traveled",
                "paragraphs": [
                    "It is short, funny to say, and turns a normal comparison into a total defeat. Those are excellent survival traits on feeds built from captions and replies.",
                    "It also conjugates cleanly. Mog, mogged, mogging, mogger. The English language did most of the distribution work for free."
                ]
            },
            {
                "heading": "Mog inside the foidslop department",
                "paragraphs": [
                    "The foidslop usernames thread literally describes bunni and kitty names as mogging male counterparts like destroyer and sigma. That is the modern version of the word in one sentence.",
                    "The comparison escaped looks, the slang escaped its original spaces, and now a cute username can apparently defeat another username in combat."
                ]
            }
        ],
        "dictionaryLinks": ["mog", "looksmaxxing", "foidslop"],
        "sources": [
            {"label": "Dictionary.com: mog", "url": "https://www.dictionary.com/culture/slang/mog"},
            {"label": "Reddit: I love foidslop usernames", "url": "https://www.reddit.com/r/lovethissmug/comments/1vbnzlp/i_love_foidslop_usernames/"}
        ]
    }
]
for article in new_articles:
    if article['slug'] not in existing_articles:
        culture['articles'].append(article)
culture['revisionDate'] = '2026-09-06'
write_json('data/culture-articles.json', culture)


# ---------------------------------------------------------------------------
# Product source data
# ---------------------------------------------------------------------------
trials = {
    "revisionDate": "2026-09-06",
    "items": [
        {"id": "twilight", "name": "Twilight", "category": "movies", "prompt": "Rain, yearning, vampires, bad decisions. Foundational specimen."},
        {"id": "nana", "name": "Nana", "category": "anime", "prompt": "Outfits, cigarettes, music, friendship, catastrophic romance."},
        {"id": "the-sims", "name": "The Sims", "category": "games", "prompt": "Three hours on a kitchen and five minutes on the actual household."},
        {"id": "stardew-valley", "name": "Stardew Valley", "category": "games", "prompt": "Farming, decorating, tiny gifts, romance, seasonal rituals."},
        {"id": "gossip-girl", "name": "Gossip Girl", "category": "television", "prompt": "Luxury, terrible dating decisions, clothes doing narrative work."},
        {"id": "mamma-mia", "name": "Mamma Mia!", "category": "movies", "prompt": "Greek island. ABBA. Three possible fathers. Case nearly closed."},
        {"id": "pride-and-prejudice-2005", "name": "Pride & Prejudice (2005)", "category": "movies", "prompt": "Hand flex. Rain. Muddy hems. Advanced yearning technology."},
        {"id": "animal-crossing", "name": "Animal Crossing", "category": "games", "prompt": "Debt, fruit economics, furniture placement, tiny animals."},
        {"id": "sex-and-the-city", "name": "Sex and the City", "category": "television", "prompt": "Shoes, friendship, restaurants, men, columns, decades of discourse."},
        {"id": "gilmore-girls", "name": "Gilmore Girls", "category": "television", "prompt": "Coffee, coats, autumn, impossible dialogue speed."},
        {"id": "the-vampire-diaries", "name": "The Vampire Diaries", "category": "television", "prompt": "Cheekbones, supernatural paperwork, love triangles, body count."},
        {"id": "letterboxd", "name": "Letterboxd", "category": "activities", "prompt": "Four lowercase words and a top four treated as constitutional law."},
        {"id": "matcha", "name": "Matcha", "category": "food", "prompt": "Green powder carrying several aesthetics on its back."},
        {"id": "tinned-fish", "name": "Tinned fish", "category": "food", "prompt": "A can, good bread, little plate, unreasonable visual authority."},
        {"id": "tiny-treat", "name": "A tiny treat", "category": "food", "prompt": "Small purchase. Large emotional accounting department."},
        {"id": "bunni", "name": "The username bunni", "category": "usernames", "prompt": "One vowel mutation. Entire profile already visible in your head."},
        {"id": "rottingangel", "name": "The username rottingangel", "category": "usernames", "prompt": "Soft noun plus damage modifier. Textbook construction."},
        {"id": "romance-novels", "name": "Romance novels", "category": "books", "prompt": "Yearning, tropes, annotations, tabs, increasingly specific men."},
        {"id": "sad-girl-playlist", "name": "A sad-girl playlist", "category": "music", "prompt": "Lowercase title. Rain photo. Twelve songs about the same mistake."},
        {"id": "coquette-bedroom", "name": "A coquette bedroom", "category": "aesthetics", "prompt": "Bows, lace, lamps, perfume bottles, zero undecorated surfaces."},
        {"id": "claw-clip", "name": "A claw clip", "category": "aesthetics", "prompt": "Plastic hair hardware promoted to cultural infrastructure."},
        {"id": "booktok", "name": "BookTok", "category": "activities", "prompt": "Tabs, tropes, special editions, annotations, twelve-book weekends."},
        {"id": "dress-to-impress", "name": "Dress to Impress", "category": "games", "prompt": "Runway competition with enough outfit discourse to qualify immediately."},
        {"id": "vampire-boyfriend", "name": "An impractical vampire boyfriend", "category": "activities", "prompt": "Not technically a hobby. Historically significant anyway."}
    ]
}
write_json('data/slop-trials.json', trials)

username_config = {
    "revisionDate": "2026-09-06",
    "categories": {
        "soft": {
            "label": "Soft",
            "bases": ["bunni", "kitty", "angel", "fae", "pixie", "doll", "peach", "cherry", "mochi", "sushi", "honey", "petal", "lamb", "poppy", "mimi", "lulu"],
            "modifiers": ["baby", "little", "soft", "sweet", "pink", "tiny", "milk", "cloud", "dream", "moon"],
            "suffixes": ["girl", "kiss", "milk", "core", "online", "jpg", "mp3", "angel"]
        },
        "terminal": {
            "label": "Terminal",
            "bases": ["bunni", "angel", "doll", "kitty", "faerie", "princess", "cherub", "lamb", "baby", "star"],
            "modifiers": ["rotting", "wired", "internet", "dead", "offline", "broken", "digital", "sick", "lost", "parasocial"],
            "suffixes": ["online", "dotcom", "exe", "jpg", "posting", "archive", "forum", "wifi", "files"]
        },
        "gothic": {
            "label": "Gothic",
            "bases": ["angel", "doll", "bunni", "vampire", "cherub", "princess", "widow", "kitty", "saint", "rose"],
            "modifiers": ["blood", "grave", "dead", "rotting", "vampire", "gore", "bruise", "funeral", "sugar", "velvet"],
            "suffixes": ["gore", "grave", "teeth", "blood", "bruise", "saint", "mourning", "kiss"]
        },
        "food": {
            "label": "Food",
            "bases": ["mochi", "sushi", "matcha", "peach", "cherry", "honey", "milk", "berry", "miso", "plum", "jelly", "sugar"],
            "modifiers": ["baby", "pink", "sweet", "tiny", "soft", "strawberry", "vanilla", "sour", "spicy", "little"],
            "suffixes": ["milk", "cake", "jam", "soda", "snack", "jelly", "kiss", "crumb"]
        },
        "2009": {
            "label": "2009",
            "bases": ["kitty", "angel", "princess", "bunny", "vampire", "scene", "baby", "cupcake", "star", "sparkle"],
            "modifiers": ["xX", "rawr", "emo", "dark", "neon", "xx", "miss", "lil"],
            "suffixes": ["Xx", "666", "13", "69", "xo", "rawr", "girl", "2009"]
        }
    }
}
write_json('data/username-generator.json', username_config)

taxonomy = {
    "revisionDate": "2026-09-06",
    "branches": [
        {
            "name": "Food Slop",
            "description": "Meals classified by who made them, how assembled they look, or how much effort survived plating.",
            "items": [
                {"name": "Foidslop", "href": "/what-is-foidslop", "note": "Female-coded food, then eventually much more than food."},
                {"name": "Guyslop", "href": "/dictionary/guyslop", "note": "Protein, starch, hot sauce, one bowl, optimized."},
                {"name": "Girl dinner", "href": "/dictionary/girl-dinner", "note": "Assembled snack dinner with excellent category recognition."},
                {"name": "Wifechow", "href": "/dictionary/wifechow", "note": "Conventional home-cooked dinner branch."},
                {"name": "Goyslop", "href": "/dictionary/goyslop", "note": "A separate imageboard-born slop compound with its own history."}
            ]
        },
        {
            "name": "Media Slop",
            "description": "Movies, shows, games, books, and franchises sorted by audience, repetition, and cultural residue.",
            "items": [
                {"name": "Foidslop media", "href": "/culture/foidslop-media", "note": "Romance, life sims, vampires, fandom, yearning, customization."},
                {"name": "Prestige foidslop", "href": "/culture/foidslop-media-canon", "note": "Period drama and literary adaptation with awards nearby."},
                {"name": "Franchise slop", "href": "/culture/why-everything-is-slop", "note": "The installment exists because the machine still has power."},
                {"name": "Cozy slop", "href": "/culture/slop-index", "note": "Reliable comfort consumed with zero need to defend the choice."}
            ]
        },
        {
            "name": "Content Slop",
            "description": "Feed material where volume, repetition, and publishing pressure are part of the definition.",
            "items": [
                {"name": "AI slop", "href": "/dictionary/ai-slop", "note": "Low-quality machine-made images, text, video, or audio."},
                {"name": "Content slop", "href": "/dictionary/content-slop", "note": "High-volume filler regardless of who or what made it."},
                {"name": "Engagement slop", "href": "/culture/why-everything-is-slop", "note": "Posts engineered mainly to keep replies and reactions moving."}
            ]
        },
        {
            "name": "Posting Slop",
            "description": "The stuff produced when the account needs to keep posting even though civilization would survive a day off.",
            "items": [
                {"name": "Ragebait", "href": "/culture/why-everything-is-slop", "note": "The take is shaped for anger before it is shaped for truth."},
                {"name": "Discourse slop", "href": "/culture/how-forum-slang-goes-mainstream", "note": "Repeated arguments with new screenshots and the same six positions."},
                {"name": "Word salad", "href": "/dictionary/content-slop", "note": "Many words entered. Meaning did not make the trip."}
            ]
        }
    ]
}
write_json('data/slop-taxonomy.json', taxonomy)

identity = {
    "name": "foidslop",
    "sameAs": ["https://www.pinterest.com/foidslop/"]
}
write_json('data/site-identity.json', identity)


# ---------------------------------------------------------------------------
# Shared slop vote math
# ---------------------------------------------------------------------------
write('scripts/lib/slop-votes.js', r'''const ITEM_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
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
''')


# ---------------------------------------------------------------------------
# Cloudflare Pages Functions for Is It Foidslop?
# ---------------------------------------------------------------------------
write('functions/api/slop-vote.js', r'''/**
 * POST /api/slop-vote
 * Records one YES/NO Slop Trial vote per visitor/item for 90 days.
 * Preferred binding: SLOP_VOTES. RATINGS is a safe fallback because all
 * keys use the isolated slop: prefix and never overlap recipe rating keys.
 */
import { ITEM_PATTERN, VOTES, applyVote, aggregate } from '../../scripts/lib/slop-votes.js';

const MAX_BODY_BYTES = 320;
const VOTER_TTL_SECONDS = 60 * 60 * 24 * 90;
const ALLOWED_HOSTS = new Set(['foidslop.com', 'www.foidslop.com']);
const FALLBACK_SALT = 'foidslop-trials-v1';

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extraHeaders }
  });
}

function storage(env) {
  return env && (env.SLOP_VOTES || env.RATINGS);
}

async function readJson(request) {
  const header = Number(request.headers.get('content-length') || '0');
  if (header > MAX_BODY_BYTES) return null;
  const text = await request.text();
  if (!text || text.length > MAX_BODY_BYTES) return null;
  try { return JSON.parse(text); } catch { return null; }
}

function sameOrigin(request) {
  const hostname = (request.headers.get('host') || '').replace(/:\d+$/, '');
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      const parsed = new URL(origin);
      return parsed.host.replace(/:\d+$/, '') === hostname && (ALLOWED_HOSTS.has(hostname) || hostname.endsWith('.pages.dev'));
    } catch { return false; }
  }
  const referer = request.headers.get('referer');
  if (!referer) return false;
  try { return new URL(referer).host.replace(/:\d+$/, '') === hostname; } catch { return false; }
}

async function hashVoter(value, salt) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${value}`));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const kv = storage(env);
  if (!kv || typeof kv.get !== 'function') return json({ error: 'Slop Trial storage is not configured.' }, 503);
  if (!sameOrigin(request)) return json({ error: 'Cross-origin votes are not accepted.' }, 403);

  const body = await readJson(request);
  if (!body || typeof body !== 'object') return json({ error: 'Invalid request body.' }, 400);
  if (body.website) return json({ ok: true });
  const id = typeof body.id === 'string' ? body.id : '';
  const vote = typeof body.vote === 'string' ? body.vote.toLowerCase() : '';
  if (!ITEM_PATTERN.test(id) || id.length > 80 || !VOTES.has(vote)) return json({ error: 'Invalid trial or vote.' }, 400);

  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const agent = request.headers.get('user-agent') || 'unknown';
  const voter = await hashVoter(`${ip}:${agent}`, env.SLOP_VOTE_SALT || env.VOTE_SALT || FALLBACK_SALT);
  const voterKey = `slop:voter:${voter}:${id}`;
  const countsKey = `slop:counts:${id}`;

  try {
    const previous = await kv.get(voterKey);
    if (previous) {
      const summary = aggregate(await kv.get(countsKey, 'json'));
      return json({ ok: true, duplicate: true, id, vote: previous, summary });
    }
    const counts = applyVote(await kv.get(countsKey, 'json'), vote);
    await kv.put(countsKey, JSON.stringify(counts));
    await kv.put(voterKey, vote, { expirationTtl: VOTER_TTL_SECONDS });
    return json({ ok: true, id, vote, summary: aggregate(counts) });
  } catch {
    return json({ error: 'Could not record the Slop Trial vote.' }, 503);
  }
}

export async function onRequestGet() {
  return json({ error: 'Use POST to vote.' }, 405, { allow: 'POST' });
}
''')

write('functions/api/slop-votes.js', r'''/** GET /api/slop-votes?ids=twilight,nana */
import { ITEM_PATTERN, aggregate } from '../../scripts/lib/slop-votes.js';

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extraHeaders }
  });
}

function storage(env) {
  return env && (env.SLOP_VOTES || env.RATINGS);
}

export async function onRequestGet(context) {
  const kv = storage(context.env);
  if (!kv || typeof kv.get !== 'function') return json({ error: 'Slop Trial storage is not configured.' }, 503);
  const raw = new URL(context.request.url).searchParams.get('ids') || '';
  const ids = [...new Set(raw.split(',').map(value => value.trim()).filter(Boolean))].slice(0, 40);
  if (!ids.length || ids.some(id => !ITEM_PATTERN.test(id) || id.length > 80)) return json({ error: 'Supply valid trial ids.' }, 400);

  try {
    const output = {};
    for (const id of ids) output[id] = aggregate(await kv.get(`slop:counts:${id}`, 'json'));
    return json(output, 200, { 'cache-control': 'public, max-age=60' });
  } catch {
    return json({ error: 'Could not read Slop Trial results.' }, 503);
  }
}
''')


# ---------------------------------------------------------------------------
# Browser logic for interactive culture products
# ---------------------------------------------------------------------------
write('culture/slop-tools.js', r'''(() => {
  const pick = items => items[Math.floor(random() * items.length)];
  const random = () => {
    if (globalThis.crypto?.getRandomValues) {
      const value = new Uint32Array(1);
      crypto.getRandomValues(value);
      return value[0] / 4294967296;
    }
    return Math.random();
  };

  function initTrial() {
    const root = document.querySelector('[data-slop-trial]');
    const dataNode = document.getElementById('slop-trial-data');
    if (!root || !dataNode) return;
    const all = JSON.parse(dataNode.textContent || '[]');
    const name = root.querySelector('[data-trial-name]');
    const category = root.querySelector('[data-trial-category]');
    const prompt = root.querySelector('[data-trial-prompt]');
    const result = root.querySelector('[data-trial-result]');
    const status = root.querySelector('[data-trial-status]');
    const yes = root.querySelector('[data-vote="yes"]');
    const no = root.querySelector('[data-vote="no"]');
    const next = root.querySelector('[data-trial-next]');
    const share = root.querySelector('[data-trial-share]');
    const filter = root.querySelector('[data-trial-filter]');
    let current = null;

    const eligible = () => filter.value === 'all' ? all : all.filter(item => item.category === filter.value);
    const savedVote = id => localStorage.getItem(`foidslop:trial:${id}`);

    async function loadResult(id) {
      result.textContent = 'Checking the jury...';
      try {
        const response = await fetch(`/api/slop-votes?ids=${encodeURIComponent(id)}`, { headers: { accept: 'application/json' } });
        const body = await response.json();
        const summary = body[id];
        if (!response.ok || !summary) throw new Error('unavailable');
        result.textContent = summary.total
          ? `Community verdict: ${summary.percentYes}% foidslop · ${summary.total} vote${summary.total === 1 ? '' : 's'}`
          : 'Community verdict: no votes yet. Be useful.';
      } catch {
        result.textContent = 'Community verdict is unavailable right now.';
      }
    }

    function render(item) {
      current = item;
      name.textContent = item.name;
      category.textContent = item.category;
      prompt.textContent = item.prompt;
      const prior = savedVote(item.id);
      yes.disabled = Boolean(prior);
      no.disabled = Boolean(prior);
      status.textContent = prior ? `You voted ${prior.toUpperCase()}.` : 'Cast judgment.';
      const url = new URL(location.href);
      url.searchParams.set('item', item.id);
      history.replaceState(null, '', url);
      loadResult(item.id);
    }

    async function vote(value) {
      if (!current || savedVote(current.id)) return;
      yes.disabled = true;
      no.disabled = true;
      status.textContent = 'Filing vote...';
      try {
        const response = await fetch('/api/slop-vote', {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({ id: current.id, vote: value, website: '' })
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'vote failed');
        localStorage.setItem(`foidslop:trial:${current.id}`, body.vote || value);
        status.textContent = body.duplicate ? `Already filed as ${(body.vote || value).toUpperCase()}.` : `You voted ${value.toUpperCase()}.`;
        const summary = body.summary;
        if (summary) result.textContent = summary.total
          ? `Community verdict: ${summary.percentYes}% foidslop · ${summary.total} vote${summary.total === 1 ? '' : 's'}`
          : 'Community verdict: no votes yet.';
      } catch {
        yes.disabled = false;
        no.disabled = false;
        status.textContent = 'Vote failed. The jury remains corruptible.';
      }
    }

    yes.addEventListener('click', () => vote('yes'));
    no.addEventListener('click', () => vote('no'));
    next.addEventListener('click', () => {
      const pool = eligible().filter(item => item.id !== current?.id);
      render(pick(pool.length ? pool : eligible()));
    });
    filter.addEventListener('change', () => render(pick(eligible())));
    share.addEventListener('click', async () => {
      const url = location.href;
      try {
        await navigator.clipboard.writeText(url);
        share.textContent = 'Copied';
        setTimeout(() => { share.textContent = 'Copy trial link'; }, 1200);
      } catch { location.hash = 'copy-failed'; }
    });

    const requested = new URLSearchParams(location.search).get('item');
    render(all.find(item => item.id === requested) || all[0]);
  }

  function initUsernameGenerator() {
    const root = document.querySelector('[data-username-generator]');
    const dataNode = document.getElementById('username-generator-data');
    if (!root || !dataNode) return;
    const config = JSON.parse(dataNode.textContent || '{}');
    const select = root.querySelector('[data-username-category]');
    const output = root.querySelector('[data-username-output]');
    const generate = root.querySelector('[data-username-generate]');
    const copy = root.querySelector('[data-username-copy]');

    function make(categoryKey) {
      const category = config.categories[categoryKey] || config.categories.soft;
      const base = pick(category.bases);
      const modifier = pick(category.modifiers);
      const suffix = pick(category.suffixes);
      if (categoryKey === '2009') {
        const forms = [`xX${base}Xx`, `${modifier}${base}${suffix}`, `${base}${suffix}`, `x_${base}_${suffix}`];
        return pick(forms).replace(/\s+/g, '').toLowerCase();
      }
      const forms = [
        `${modifier}${base}`,
        `${base}${suffix}`,
        `${modifier}${base}${random() > .72 ? suffix : ''}`,
        base
      ];
      return pick(forms).replace(/\s+/g, '').toLowerCase();
    }

    function reroll() {
      const key = select.value === 'mixed' ? pick(Object.keys(config.categories)) : select.value;
      output.textContent = make(key);
      output.dataset.value = output.textContent;
      copy.textContent = 'Copy';
    }

    generate.addEventListener('click', reroll);
    select.addEventListener('change', reroll);
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(output.dataset.value || output.textContent);
        copy.textContent = 'Copied';
      } catch { copy.textContent = 'Select it'; }
    });
    reroll();
  }

  initTrial();
  initUsernameGenerator();
})();
''')


# ---------------------------------------------------------------------------
# Product publisher
# ---------------------------------------------------------------------------
write('scripts/publish-culture-products.js', r'''#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BASE_URL = 'https://foidslop.com';
const STYLE_VERSION = '20260906-4';
const checkOnly = process.argv.includes('--check');
const dateArg = process.argv.indexOf('--date');
const today = dateArg >= 0 ? process.argv[dateArg + 1] : process.env.PUBLISH_DATE || new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());

const read = file => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const write = (file, content) => {
  const target = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
};
const esc = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const jsonLd = value => JSON.stringify(value, null, 2).replace(/<\//g, '<\\/');

const trials = read('data/slop-trials.json');
const usernames = read('data/username-generator.json');
const taxonomy = read('data/slop-taxonomy.json');
const dictionary = read('data/dictionary.json');
const culture = read('data/culture-articles.json');
const identity = read('data/site-identity.json');
const dictionaryRoutes = new Map(dictionary.entries.map(entry => [entry.slug, entry.route || `dictionary/${entry.slug}`]));

function validate() {
  const errors = [];
  const banned = [/\u2014/, /\bdelve(?:s|d)?\b/i, /\btapestry\b/i, /\bit is important to (?:note|remember|understand)\b/i];
  const walk = value => {
    if (typeof value === 'string') for (const pattern of banned) if (pattern.test(value)) errors.push(`banned copy pattern ${pattern}: ${value}`);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  [trials, usernames, taxonomy].forEach(walk);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trials.revisionDate || '')) errors.push('slop trials revisionDate is invalid');
  const ids = new Set();
  for (const item of trials.items || []) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id || '') || ids.has(item.id)) errors.push(`invalid or duplicate Slop Trial id: ${item.id}`);
    ids.add(item.id);
    for (const field of ['name', 'category', 'prompt']) if (!String(item[field] || '').trim()) errors.push(`Slop Trial ${item.id}: missing ${field}`);
  }
  if (ids.size < 20) errors.push('Slop Trials needs at least 20 launch items');
  const categoryNames = Object.keys(usernames.categories || {});
  if (categoryNames.length < 5) errors.push('username generator needs at least five categories');
  for (const key of categoryNames) {
    const group = usernames.categories[key];
    for (const field of ['bases', 'modifiers', 'suffixes']) if (!Array.isArray(group[field]) || group[field].length < 8) errors.push(`username ${key}: ${field} is too small`);
  }
  if (!Array.isArray(taxonomy.branches) || taxonomy.branches.length < 4) errors.push('taxonomy needs at least four branches');
  for (const branch of taxonomy.branches || []) {
    if (!branch.name || !branch.description || !Array.isArray(branch.items) || branch.items.length < 3) errors.push(`thin taxonomy branch: ${branch.name}`);
    for (const item of branch.items || []) if (!item.name || !item.note || !/^\//.test(item.href || '')) errors.push(`invalid taxonomy item: ${item.name}`);
  }
  if (!Array.isArray(identity.sameAs) || !identity.sameAs.length || identity.sameAs.some(url => !/^https:\/\//.test(url))) errors.push('site identity needs real https sameAs URLs');
  return errors;
}

function prefix(route) {
  const depth = route.split('/').filter(Boolean).length;
  return depth > 1 ? '../'.repeat(depth - 1) : route ? '' : '';
}
function canonical(route) { return `${BASE_URL}/${route}`; }
function breadcrumb(route, label) {
  const parts = [{ '@type': 'ListItem', position: 1, name: 'foidslop', item: BASE_URL }];
  if (route.startsWith('culture/')) parts.push({ '@type': 'ListItem', position: 2, name: 'Culture', item: `${BASE_URL}/culture` });
  else if (route.startsWith('dictionary/')) parts.push({ '@type': 'ListItem', position: 2, name: 'Dictionary', item: `${BASE_URL}/dictionary` });
  parts.push({ '@type': 'ListItem', position: parts.length + 1, name: label, item: canonical(route) });
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: parts };
}
function head(route, title, description, schema, image = `${BASE_URL}/og-image.png`) {
  const p = prefix(route);
  return `<!DOCTYPE html><html lang="en"><head>\n<script src="${p}cookie-consent.js?v=20260713-4" data-ga-id="G-VT527DETQ2" defer></script>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<link rel="icon" type="image/webp" sizes="512x512" href="/brand-icon.webp">\n<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">\n<link rel="manifest" href="${p}site.webmanifest">\n<title>${esc(title)}</title>\n<meta name="description" content="${esc(description)}">\n<meta name="robots" content="index,follow,max-image-preview:large">\n<link rel="canonical" href="${canonical(route)}">\n<meta property="og:site_name" content="foidslop">\n<meta property="og:title" content="${esc(title)}">\n<meta property="og:description" content="${esc(description)}">\n<meta property="og:url" content="${canonical(route)}">\n<meta property="og:type" content="website">\n<meta property="og:image" content="${image}">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="${esc(title)}">\n<meta name="twitter:description" content="${esc(description)}">\n<meta name="twitter:image" content="${image}">\n<link rel="alternate" type="application/atom+xml" title="foidslop culture" href="${BASE_URL}/culture/feed.xml">\n<link rel="preload" as="font" type="font/woff2" href="/fonts/inter-var.woff2" crossorigin>\n<link rel="preload" as="font" type="font/woff2" href="/fonts/bebas-neue-400.woff2" crossorigin>\n<link rel="stylesheet" href="${p}css/fonts.css?v=20260826-1">\n<link rel="stylesheet" href="${p}css/global.css?v=20260827-1">\n<link rel="stylesheet" href="${p}css/content.css?v=20260827-1">\n<link rel="stylesheet" href="${p}css/culture.css?v=${STYLE_VERSION}">\n<link rel="stylesheet" href="${p}css/theme.css?v=20260827-2">\n<script src="${p}theme.js?v=20260713-5"></script>\n<script type="application/ld+json">${jsonLd(schema)}</script>\n</head>`;
}
function header(route, active = 'culture') {
  const p = prefix(route);
  const link = (href, label, key) => `<a href="${p}${href}" class="nav-link${active === key ? ' active' : ''}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`;
  return `<body><a href="#main" class="sr-only focusable">Skip to content</a><header class="site-header" id="site-header"><a href="${p || '/'}" aria-label="foidslop home"><picture><source type="image/webp" srcset="${p}logo-header.webp"><img src="${p}logo-header.png" alt="FOID SLOP" class="logo" width="126" height="74"></picture></a><div class="site-header-center">Daily slop / culture / etc.</div><div class="header-right"><button class="theme-toggle" type="button" aria-label="Switch color theme" aria-pressed="true"><span class="theme-toggle-mark" aria-hidden="true">*</span><span class="theme-toggle-label">Light mode</span></button>${link('slop/archive', 'Archive', 'archive')}${link('culture', 'Culture', 'culture')}${link('dictionary', 'Dictionary', 'dictionary')}<a href="${p || '/'}#dispatch" class="nav-link header-dispatch">Dispatch</a></div></header>`;
}
function footer(route) {
  const p = prefix(route);
  return `<footer><div class="footer-inner"><span class="footer-copy">&copy; 2026 foidslop</span><nav class="footer-links" aria-label="Footer navigation"><a href="${p}what-is-foidslop">What is foidslop?</a><span class="footer-dot"></span><a href="${p}dictionary">Dictionary</a><span class="footer-dot"></span><a href="${p}culture">Culture</a><span class="footer-dot"></span><a href="https://www.pinterest.com/foidslop/" rel="external">Pinterest</a><span class="footer-dot"></span><a href="${p}feed.xml">RSS</a><span class="footer-dot"></span><a href="${p}about">About</a><span class="footer-dot"></span><a href="${p}privacy">Privacy</a></nav></div></footer></body></html>`;
}
function scriptData(id, value) { return `<script type="application/json" id="${id}">${JSON.stringify(value).replace(/<\//g, '<\\/')}</script>`; }

function renderTrialPage() {
  const route = 'culture/is-it-foidslop';
  const title = 'Is It Foidslop? Community Slop Trials';
  const description = 'Vote yes or no on movies, games, food, usernames, books, aesthetics, and other candidates. See the live community foidslop verdict.';
  const schema = [
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Is It Foidslop?', applicationCategory: 'EntertainmentApplication', operatingSystem: 'Any', url: canonical(route), description },
    breadcrumb(route, 'Is It Foidslop?')
  ];
  const categories = [...new Set(trials.items.map(item => item.category))].sort();
  return `${head(route, title, description, schema)}${header(route)}<main id="main" class="culture-index culture-tool-page"><p class="content-eyebrow">Slop Trial / community court</p><h1>Is It Foidslop?</h1><p class="article-deck">A thing appears. You vote yes or no. The jury gets a percentage. Science advances.</p><section class="slop-trial" data-slop-trial><div class="slop-trial-toolbar"><label>Department <select data-trial-filter><option value="all">Everything</option>${categories.map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join('')}</select></label><button type="button" data-trial-share>Copy trial link</button></div><article class="slop-trial-card"><span data-trial-category></span><h2 data-trial-name></h2><p data-trial-prompt></p><div class="slop-trial-question">FOIDSLOP?</div><div class="slop-vote-buttons"><button type="button" data-vote="yes">YES</button><button type="button" data-vote="no">NO</button></div><p class="slop-trial-status" data-trial-status aria-live="polite"></p><p class="slop-trial-result" data-trial-result aria-live="polite"></p><button class="slop-next" type="button" data-trial-next>Next specimen</button></article></section><section class="culture-tool-links"><a href="slop-index"><strong>Media Index</strong><span>See the staff scores.</span></a><a href="slop-taxonomy"><strong>Slop Taxonomy</strong><span>See where the category sits.</span></a><a href="username-generator"><strong>Username Generator</strong><span>Generate a new problem.</span></a></section></main>${scriptData('slop-trial-data', trials.items)}<script src="slop-tools.js?v=20260906-1" defer></script>${footer(route)}`;
}

function renderUsernamePage() {
  const route = 'culture/username-generator';
  const title = 'Foidslop Username Generator';
  const description = 'Generate foidslop usernames from soft nouns, cursed modifiers, food words, gothic damage, and controlled 2009 spelling choices.';
  const schema = [
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: title, applicationCategory: 'EntertainmentApplication', operatingSystem: 'Any', url: canonical(route), description },
    breadcrumb(route, title)
  ];
  const options = Object.entries(usernames.categories).map(([key, group]) => `<option value="${esc(key)}">${esc(group.label)}</option>`).join('');
  return `${head(route, title, description, schema)}${header(route)}<main id="main" class="culture-index culture-tool-page"><p class="content-eyebrow">Generator / identity damage</p><h1>Foidslop Username Generator</h1><p class="article-deck">Soft noun. Optional damage. Controlled vowel crimes. No startup-name sludge.</p><section class="username-generator" data-username-generator><label>Department <select data-username-category><option value="mixed">Mixed</option>${options}</select></label><div class="username-output" data-username-output aria-live="polite"></div><div class="username-actions"><button type="button" data-username-generate>Generate another</button><button type="button" data-username-copy>Copy</button></div></section><section class="culture-tool-copy"><h2>How the machine works</h2><p>The base vocabulary comes from the same pattern documented in the foidslop usernames article: bunni, kitty, angel, fae, pixie, food words, gothic modifiers, digital damage, and small spelling mutations.</p><p>The generator uses curated word banks instead of gluing random pastel nouns together. It can still produce something embarrassing. That is part of the service.</p><a href="foidslop-usernames">Read the username field guide</a></section></main>${scriptData('username-generator-data', usernames)}<script src="slop-tools.js?v=20260906-1" defer></script>${footer(route)}`;
}

function renderTaxonomyPage() {
  const route = 'culture/slop-taxonomy';
  const title = 'The Slop Taxonomy';
  const description = 'A visual taxonomy of food slop, media slop, content slop, and posting slop, with foidslop, guyslop, wifechow, AI slop, and related branches.';
  const schema = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, url: canonical(route), description, hasPart: taxonomy.branches.flatMap(branch => branch.items).map(item => ({ '@type': 'Thing', name: item.name, url: `${BASE_URL}${item.href}` })) },
    breadcrumb(route, title)
  ];
  const branches = taxonomy.branches.map(branch => `<section class="taxonomy-branch"><div class="taxonomy-branch-head"><span>SLOP / ${esc(branch.name)}</span><h2>${esc(branch.name)}</h2><p>${esc(branch.description)}</p></div><div class="taxonomy-nodes">${branch.items.map(item => `<a href="${esc(item.href)}"><strong>${esc(item.name)}</strong><span>${esc(item.note)}</span></a>`).join('')}</div></section>`).join('');
  return `${head(route, title, description, schema)}${header(route)}<main id="main" class="culture-index taxonomy-page"><p class="content-eyebrow">Reference desk / the chart</p><h1>The Slop Taxonomy</h1><p class="article-deck">One word became a suffix. The suffix became departments. The departments now require a chart.</p><div class="taxonomy-root"><strong>SLOP</strong><span>Bulk, repetition, genre, insult, affection, or all five at once.</span></div><div class="taxonomy-grid">${branches}</div><section class="culture-tool-links"><a href="why-everything-is-slop"><strong>Why everything is slop</strong><span>Read the language history.</span></a><a href="../dictionary"><strong>Slop Dictionary</strong><span>Open the vocabulary department.</span></a><a href="is-it-foidslop"><strong>Slop Trial</strong><span>Put the taxonomy to a vote.</span></a></section></main>${footer(route)}`;
}

function renderAboutPage() {
  const route = 'about';
  const title = 'About foidslop';
  const description = 'foidslop publishes one recipe for one person every day, plus a culture desk for foidslop, internet slang, media, usernames, and slop taxonomy.';
  const schema = [
    { '@context': 'https://schema.org', '@type': 'AboutPage', name: title, url: canonical(route), description },
    breadcrumb(route, title)
  ];
  return `${head(route, title, description, schema)}${header(route, '')}<main id="main" class="article-page culture-article"><p class="content-eyebrow">About / publication notes</p><h1>foidslop</h1><p class="article-deck">One recipe for one person every day. Internet taxonomy when dinner is handled.</p><section><h2>What is this?</h2><p>foidslop started as a daily recipe publication for one person. Food is still the daily product.</p><p>The culture desk handles the rest: foidslop media, slang, usernames, games, aesthetics, the Slop Dictionary, community trials, and whatever category gets invented next.</p></section><section><h2>How it is made</h2><p>Recipes, dictionary entries, culture pieces, rankings, and source notes are curated in this repository and published as a static site. Reader recipe ratings and Slop Trial votes use first-party Cloudflare Pages Functions.</p><p>Corrections, sourcing rules, recipe standards, and the boring paperwork live on the Editorial Standards page so they do not have to live in the footer.</p></section><p class="article-cta"><a href="editorial-standards">Editorial standards</a><a href="privacy#contact">Contact</a><a href="culture">Culture desk</a></p></main>${footer(route)}`;
}

function weeklyIndex(length) {
  const stamp = Date.parse(`${today}T12:00:00Z`);
  return Math.abs(Math.floor(stamp / 604800000)) % length;
}
function patchHome() {
  const file = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<!-- culture-products:start -->[\s\S]*?<!-- culture-products:end -->/g, '');
  const article = culture.articles[weeklyIndex(culture.articles.length)];
  const trial = trials.items[weeklyIndex(trials.items.length)];
  const block = `<!-- culture-products:start --><div class="zine-culture-week"><a href="culture/${article.slug}"><span>FIELD NOTE</span><strong>${esc(article.title)}</strong><small>${esc(article.deck)}</small></a><a href="culture/is-it-foidslop?item=${trial.id}"><span>SLOP TRIAL</span><strong>Is ${esc(trial.name)} foidslop?</strong><small>Vote yes or no and see the community verdict.</small></a><a href="culture/username-generator"><span>GENERATOR</span><strong>Need a worse username?</strong><small>Soft nouns, gothic damage, controlled vowel crimes.</small></a></div><!-- culture-products:end -->`;
  if (!html.includes('<!-- culture-expansion:end -->')) throw new Error('Homepage culture module is missing');
  html = html.replace('<!-- culture-expansion:end -->', `${block}<!-- culture-expansion:end -->`);
  html = html.replace(/css\/culture\.css\?v=[0-9-]+/g, `css/culture.css?v=${STYLE_VERSION}`);
  const sameAs = JSON.stringify(identity.sameAs, null, 6).replace(/^/gm, '    ').trimStart();
  html = html.replace(/"sameAs": \[[\s\S]*?\n    \]/, `"sameAs": ${sameAs}`);
  write('index.html', html);
}

function patchExistingCultureMeta() {
  const targets = [
    ...dictionary.entries.map(entry => ({ route: entry.route || `dictionary/${entry.slug}`, label: entry.title, evidence: entry.evidence })),
    ...culture.articles.map(article => ({ route: `culture/${article.slug}`, label: article.title, evidence: article.evidence })),
    { route: 'culture', label: 'Culture' },
    { route: 'dictionary', label: 'The Slop Dictionary' },
    { route: 'culture/slop-index', label: 'The Foidslop Media Index' }
  ];
  for (const target of targets) {
    const file = path.join(ROOT, `${target.route}.html`);
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, 'utf8');
    html = html.replace(/css\/culture\.css\?v=[0-9-]+/g, `css/culture.css?v=${STYLE_VERSION}`)
      .replace(/\.\.\/css\/culture\.css\?v=[0-9-]+/g, `../css/culture.css?v=${STYLE_VERSION}`);
    html = html.replace(/<script type="application\/ld\+json" data-culture-breadcrumb>[\s\S]*?<\/script>/g, '');
    html = html.replace('</head>', `<script type="application/ld+json" data-culture-breadcrumb>${jsonLd(breadcrumb(target.route, target.label))}</script>\n</head>`);
    const first = target.evidence?.[0];
    if (first) {
      const image = `${BASE_URL}/${first.image}`;
      html = html.replace(/<meta property="og:image" content="[^"]+">/, `<meta property="og:image" content="${image}">`)
        .replace(/<meta name="twitter:image" content="[^"]+">/, `<meta name="twitter:image" content="${image}">`);
    }
    write(`${target.route}.html`, html);
  }
}

function patchSitemap() {
  const file = path.join(ROOT, 'sitemap.xml');
  let xml = fs.readFileSync(file, 'utf8');
  const routes = ['culture/is-it-foidslop', 'culture/username-generator', 'culture/slop-taxonomy', 'about'];
  for (const route of routes) xml = xml.replace(new RegExp(`<url><loc>${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/loc>[\\s\\S]*?<\\/url>\\n?`, 'g'), '');
  const additions = routes.map(route => `<url><loc>${BASE_URL}/${route}</loc><lastmod>${today}</lastmod></url>`).join('\n');
  xml = xml.replace('</urlset>', `${additions}\n</urlset>`);
  write('sitemap.xml', xml);
}

function patchRedirects() {
  const file = path.join(ROOT, '_redirects');
  let text = fs.readFileSync(file, 'utf8').replace(/\n?# culture-products:start[\s\S]*?# culture-products:end\n?/g, '\n');
  const routes = ['culture/is-it-foidslop', 'culture/username-generator', 'culture/slop-taxonomy', 'about'];
  const block = `# culture-products:start\n${routes.map(route => `/${route}.html /${route} 301`).join('\n')}\n# culture-products:end`;
  write('_redirects', `${text.trim()}\n\n${block}\n`);
}

function patchCultureFeed() {
  const file = path.join(ROOT, 'culture', 'feed.xml');
  if (!fs.existsSync(file)) return;
  let xml = fs.readFileSync(file, 'utf8').replace(/<!-- culture-products:start -->[\s\S]*?<!-- culture-products:end -->/g, '');
  const entries = [
    ['Is It Foidslop?', 'culture/is-it-foidslop', 'Community yes-or-no Slop Trials with live verdicts.'],
    ['Foidslop Username Generator', 'culture/username-generator', 'A curated foidslop username generator.'],
    ['The Slop Taxonomy', 'culture/slop-taxonomy', 'A visual map of food, media, content, and posting slop.']
  ].map(([title, route, summary]) => `<entry><title>${title}</title><id>${BASE_URL}/${route}</id><link href="${BASE_URL}/${route}"/><updated>${today}T12:00:00Z</updated><summary>${summary}</summary></entry>`).join('');
  xml = xml.replace('</feed>', `<!-- culture-products:start -->${entries}<!-- culture-products:end --></feed>`);
  write('culture/feed.xml', xml);
}

function checkGenerated() {
  const required = ['culture/is-it-foidslop.html', 'culture/username-generator.html', 'culture/slop-taxonomy.html', 'culture/slop-tools.js', 'about.html'];
  for (const file of required) if (!fs.existsSync(path.join(ROOT, file))) throw new Error(`Missing generated culture product: ${file}`);
  const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  if (!home.includes('zine-culture-week') || !home.includes('culture/is-it-foidslop')) throw new Error('Homepage weekly culture product strip is missing');
}

const errors = validate();
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
if (checkOnly) {
  console.log(`Culture products source is valid: ${trials.items.length} trials, ${Object.keys(usernames.categories).length} username departments, ${taxonomy.branches.length} taxonomy branches.`);
  process.exit(0);
}

write('culture/is-it-foidslop.html', renderTrialPage());
write('culture/username-generator.html', renderUsernamePage());
write('culture/slop-taxonomy.html', renderTaxonomyPage());
write('about.html', renderAboutPage());
patchHome();
patchExistingCultureMeta();
patchSitemap();
patchRedirects();
patchCultureFeed();
checkGenerated();
console.log('Published Is It Foidslop?, username generator, Slop Taxonomy, weekly culture strip, and About page.');
''')


# ---------------------------------------------------------------------------
# CSS for products
# ---------------------------------------------------------------------------
product_css = r'''.zine-culture-week {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid var(--border);
}
.zine-culture-week > a {
  min-height: 170px;
  padding: 24px;
  border-right: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  text-decoration: none;
}
.zine-culture-week > a:last-child { border-right: 0; }
.zine-culture-week > a:hover, .zine-culture-week > a:focus-visible { background: color-mix(in srgb, var(--accent) 10%, var(--bg)); }
.zine-culture-week span, .slop-trial-card > span, .taxonomy-branch-head > span {
  display: block;
  margin-bottom: 14px;
  color: var(--accent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.zine-culture-week strong { display:block; font: 900 1.1rem/1.05 Arial Black,Arial,sans-serif; text-transform:uppercase; }
.zine-culture-week small { display:block; margin-top:12px; color:var(--muted); font:14px/1.5 Georgia,serif; }
.culture-tool-page { max-width: 1440px; }
.slop-trial, .username-generator { max-width: 900px; margin: 44px 0 70px; }
.slop-trial-toolbar { display:flex; justify-content:space-between; gap:18px; align-items:end; margin-bottom:14px; }
.slop-trial-toolbar label, .username-generator label { color:var(--muted); font-size:10px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; }
.slop-trial select, .username-generator select { display:block; min-width:220px; margin-top:8px; padding:11px 12px; border:1px solid var(--border); background:var(--surface); color:var(--text); font:inherit; }
.slop-trial-toolbar button, .slop-next, .username-actions button { border:1px solid var(--border); background:transparent; color:var(--text); padding:12px 15px; font:700 10px/1 Inter,sans-serif; letter-spacing:.1em; text-transform:uppercase; cursor:pointer; }
.slop-trial-card { padding:clamp(28px,5vw,64px); border:1px solid var(--border); background:var(--surface); }
.slop-trial-card h2 { max-width:760px; margin:0; color:var(--text); font:900 clamp(3.2rem,8vw,7.5rem)/.83 Arial Black,Arial,sans-serif; letter-spacing:-.075em; text-transform:uppercase; }
.slop-trial-card > p { max-width:650px; color:var(--muted); font:18px/1.55 Georgia,serif; }
.slop-trial-question { margin:38px 0 14px; color:var(--text); font:900 clamp(2.1rem,5vw,4.5rem)/.9 Arial Black,Arial,sans-serif; letter-spacing:-.06em; }
.slop-vote-buttons { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.slop-vote-buttons button { min-height:82px; border:2px solid var(--text); background:var(--text); color:var(--bg); font:900 1.5rem/1 Arial Black,Arial,sans-serif; cursor:pointer; }
.slop-vote-buttons button:last-child { background:transparent; color:var(--text); }
.slop-vote-buttons button:hover:not(:disabled), .slop-vote-buttons button:focus-visible:not(:disabled) { border-color:var(--accent); background:var(--accent); color:#fff; }
.slop-vote-buttons button:disabled { opacity:.45; cursor:not-allowed; }
.slop-trial-status, .slop-trial-result { margin:15px 0 0 !important; font-family:Inter,sans-serif !important; font-size:12px !important; letter-spacing:.04em; }
.slop-trial-result { color:var(--text) !important; font-weight:700 !important; }
.slop-next { margin-top:18px; }
.culture-tool-links { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); max-width:1100px; margin:60px 0 0; border:1px solid var(--border); }
.culture-tool-links a { padding:24px; border-right:1px solid var(--border); color:var(--text); text-decoration:none; }
.culture-tool-links a:last-child { border-right:0; }
.culture-tool-links strong, .culture-tool-links span { display:block; }
.culture-tool-links strong { font:900 1rem/1 Arial Black,Arial,sans-serif; text-transform:uppercase; }
.culture-tool-links span { margin-top:9px; color:var(--muted); font-size:13px; line-height:1.45; }
.username-generator { padding:clamp(28px,5vw,56px); border:1px solid var(--border); background:var(--surface); }
.username-output { min-height:1em; margin:34px 0; overflow-wrap:anywhere; color:var(--text); font:900 clamp(3.2rem,9vw,7.2rem)/.85 Arial Black,Arial,sans-serif; letter-spacing:-.075em; }
.username-actions { display:flex; flex-wrap:wrap; gap:10px; }
.username-actions button:first-child { background:var(--text); color:var(--bg); border-color:var(--text); }
.culture-tool-copy { max-width:880px; }
.taxonomy-root { max-width:1100px; margin:44px 0 20px; padding:28px; border:2px solid var(--text); background:var(--text); color:var(--bg); }
.taxonomy-root strong { display:block; font:900 clamp(2.6rem,6vw,5rem)/.9 Arial Black,Arial,sans-serif; letter-spacing:-.06em; }
.taxonomy-root span { display:block; margin-top:10px; font:15px/1.5 Georgia,serif; }
.taxonomy-grid { display:grid; grid-template-columns:1fr 1fr; max-width:1100px; border-top:1px solid var(--border); border-left:1px solid var(--border); }
.taxonomy-branch { margin:0 !important; padding:0 !important; border-top:0 !important; border-right:1px solid var(--border); border-bottom:1px solid var(--border); }
.taxonomy-branch-head { padding:26px; }
.taxonomy-branch h2 { margin:0; padding:0; border:0; font:900 clamp(2rem,4vw,3.5rem)/.9 Arial Black,Arial,sans-serif; letter-spacing:-.055em; text-transform:uppercase; }
.taxonomy-branch-head p { margin-bottom:0; }
.taxonomy-nodes a { display:block; padding:18px 26px; border-top:1px solid var(--border); color:var(--text); text-decoration:none; }
.taxonomy-nodes a:hover, .taxonomy-nodes a:focus-visible { background:color-mix(in srgb,var(--accent) 10%,var(--surface)); }
.taxonomy-nodes strong, .taxonomy-nodes span { display:block; }
.taxonomy-nodes strong { font:900 .95rem/1.1 Arial Black,Arial,sans-serif; text-transform:uppercase; }
.taxonomy-nodes span { margin-top:7px; color:var(--muted); font-size:13px; line-height:1.45; }
@media (max-width:760px) {
  .zine-culture-week, .culture-tool-links, .taxonomy-grid { grid-template-columns:1fr; }
  .zine-culture-week > a, .culture-tool-links a { border-right:0; border-bottom:1px solid var(--border); }
  .zine-culture-week > a:last-child, .culture-tool-links a:last-child { border-bottom:0; }
  .slop-trial-toolbar { align-items:stretch; flex-direction:column; }
  .slop-trial select { width:100%; }
  .slop-vote-buttons { grid-template-columns:1fr; }
  .username-output { font-size:clamp(2.5rem,16vw,5rem); }
}
'''
append_marker('css/culture.css', 'culture-products', product_css)


# ---------------------------------------------------------------------------
# Package scripts
# ---------------------------------------------------------------------------
package = load_json('package.json')
scripts = package['scripts']
scripts['build'] = 'node scripts/publish-culture.js --check && node scripts/publish-culture-products.js --check && node scripts/seo-check.js && node scripts/build-deploy.js'
scripts['check'] = 'node scripts/daily-publish.js --check && node scripts/publish-culture.js --check && node scripts/publish-culture-products.js --check && node scripts/seo-check.js'
scripts['publish'] = 'node scripts/daily-publish.js && node scripts/publish-culture.js && node scripts/publish-culture-products.js'
scripts['culture:publish'] = 'node scripts/publish-culture.js && node scripts/publish-culture-products.js'
scripts['culture:check'] = 'node scripts/publish-culture.js --check && node scripts/publish-culture-products.js --check'
scripts['products:publish'] = 'node scripts/publish-culture-products.js'
scripts['products:check'] = 'node scripts/publish-culture-products.js --check'
write_json('package.json', package)


# ---------------------------------------------------------------------------
# Build deploy: copy About and assert product routes
# ---------------------------------------------------------------------------
replace_once('scripts/build-deploy.js',
             "'index.html', '404.html', 'privacy.html', 'check-inbox.html', 'subscribed.html', 'what-is-foidslop.html', 'what-does-foid-mean.html',",
             "'index.html', '404.html', 'privacy.html', 'about.html', 'check-inbox.html', 'subscribed.html', 'what-is-foidslop.html', 'what-does-foid-mean.html',")
replace_once('scripts/build-deploy.js',
             "if (!fs.existsSync(path.join(OUTPUT, 'dictionary', 'index.html'))) throw new Error('Dictionary index is missing from deployment');",
             "if (!fs.existsSync(path.join(OUTPUT, 'dictionary', 'index.html'))) throw new Error('Dictionary index is missing from deployment');\nfor (const file of ['culture/is-it-foidslop.html', 'culture/username-generator.html', 'culture/slop-taxonomy.html', 'culture/slop-tools.js', 'about.html']) {\n  if (!fs.existsSync(path.join(OUTPUT, file))) throw new Error(`Culture product is missing from deployment: ${file}`);\n}")


# ---------------------------------------------------------------------------
# Daily publisher: data-driven entity URLs and quieter footer
# ---------------------------------------------------------------------------
replace_once('scripts/daily-publish.js',
             "const PINTEREST_URL = 'https://www.pinterest.com/foidslop/';\nconst SAME_AS = [PINTEREST_URL];",
             "const SITE_IDENTITY_FILE = path.join(ROOT, 'data', 'site-identity.json');\nconst siteIdentity = fs.existsSync(SITE_IDENTITY_FILE) ? JSON.parse(fs.readFileSync(SITE_IDENTITY_FILE, 'utf8')) : { sameAs: ['https://www.pinterest.com/foidslop/'] };\nconst SAME_AS = Array.isArray(siteIdentity.sameAs) ? siteIdentity.sameAs.filter(isHttpsUrl) : [];\nconst PINTEREST_URL = SAME_AS.find(url => /pinterest\\.com/i.test(url)) || 'https://www.pinterest.com/foidslop/';")
old_footer = '''    <a href="${root}what-is-foidslop">What is foidslop?</a><span class="footer-dot"></span>\n    <a href="${root}what-does-foid-mean">Foid meaning</a><span class="footer-dot"></span>\n    <a href="${root}editorial-standards">Editorial standards</a><span class="footer-dot"></span>\n    <a href="${PINTEREST_URL}" rel="external">Pinterest</a><span class="footer-dot"></span>\n    <a href="${root}feed.xml" type="application/atom+xml">RSS</a><span class="footer-dot"></span>\n    <a href="${root}privacy">Privacy</a><span class="footer-dot"></span>\n    <a href="${root}privacy#contact">Contact</a>'''
new_footer = '''    <a href="${root}what-is-foidslop">What is foidslop?</a><span class="footer-dot"></span>\n    <a href="${root}dictionary">Dictionary</a><span class="footer-dot"></span>\n    <a href="${root}culture">Culture</a><span class="footer-dot"></span>\n    <a href="${PINTEREST_URL}" rel="external">Pinterest</a><span class="footer-dot"></span>\n    <a href="${root}feed.xml" type="application/atom+xml">RSS</a><span class="footer-dot"></span>\n    <a href="${root}about">About</a><span class="footer-dot"></span>\n    <a href="${root}privacy">Privacy</a>'''
replace_once('scripts/daily-publish.js', old_footer, new_footer)


# ---------------------------------------------------------------------------
# Culture publisher cache version
# ---------------------------------------------------------------------------
replace_once('scripts/publish-culture.js', "const STYLE_VERSION = '20260906-3';", "const STYLE_VERSION = '20260906-4';")


# ---------------------------------------------------------------------------
# Weekly Slop email: field note + Slop Trial
# ---------------------------------------------------------------------------
replace_once('scripts/weekly-community.js',
             "const MEALS_FILE = path.join(ROOT, 'data', 'foidslop-meals.json');",
             "const MEALS_FILE = path.join(ROOT, 'data', 'foidslop-meals.json');\nconst CULTURE_FILE = path.join(ROOT, 'data', 'culture-articles.json');\nconst SLOP_TRIALS_FILE = path.join(ROOT, 'data', 'slop-trials.json');")
weekly_insert = r'''  const cultureDesk = fs.existsSync(CULTURE_FILE) ? readJson(CULTURE_FILE) : { articles: [] };
  const slopTrials = fs.existsSync(SLOP_TRIALS_FILE) ? readJson(SLOP_TRIALS_FILE) : { items: [] };
  const weekSeed = Math.abs(Math.floor(new Date(`${window.opensDate}T12:00:00Z`).getTime() / 604800000));
  const fieldNote = cultureDesk.articles.length ? cultureDesk.articles[weekSeed % cultureDesk.articles.length] : null;
  const slopTrial = slopTrials.items.length ? slopTrials.items[weekSeed % slopTrials.items.length] : null;
  const cultureSection = fieldNote || slopTrial
    ? `<div style="margin:30px 0 0;padding:24px;border:1px solid #d5d0c5;background:#f4f1e8;color:#171815;">
      <p style="margin:0 0 12px;color:#ef4a35;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.4px;">ELSEWHERE IN THE SLOP</p>
      ${fieldNote ? `<h2 style="margin:0 0 8px;color:#171815;font-family:Arial Black,Arial,Helvetica,sans-serif;font-size:24px;line-height:1.05;text-transform:uppercase;">Field note: ${escapeHtml(fieldNote.title)}</h2><p style="margin:0 0 14px;color:#66645f;font-family:Georgia,serif;font-size:15px;line-height:1.5;">${escapeHtml(fieldNote.deck)}</p><p style="margin:0 0 18px;"><a href="https://foidslop.com/culture/${escapeHtml(fieldNote.slug)}" style="color:#171815;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;text-transform:uppercase;">Read the field note</a></p>` : ''}
      ${slopTrial ? `<p style="margin:0 0 6px;color:#ef4a35;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.4px;">SLOP TRIAL</p><p style="margin:0 0 14px;color:#171815;font-family:Arial Black,Arial,Helvetica,sans-serif;font-size:21px;line-height:1.1;text-transform:uppercase;">Is ${escapeHtml(slopTrial.name)} foidslop?</p><a href="https://foidslop.com/culture/is-it-foidslop?item=${encodeURIComponent(slopTrial.id)}" style="display:inline-block;padding:11px 15px;background:#171815;color:#f4f1e8;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;text-decoration:none;text-transform:uppercase;">Vote yes or no</a>` : ''}
    </div>`
    : '';
'''
weekly_file = ROOT / 'scripts/weekly-community.js'
weekly_text = weekly_file.read_text()
needle = "  const choices = (poll?.choices || []).map(choice =>"
if needle not in weekly_text:
    raise SystemExit('Could not patch weekly culture section')
weekly_text = weekly_text.replace(needle, weekly_insert + needle, 1)
weekly_text = weekly_text.replace("    ${tableSection}\n    <p style=", "    ${tableSection}\n    ${cultureSection}\n    <p style=", 1)
weekly_text = weekly_text.replace("preview_text: 'Seven dinners for one and one vote for Friday.'", "preview_text: 'Seven dinners, one field note, and one Slop Trial.'", 1)
weekly_file.write_text(weekly_text)


# ---------------------------------------------------------------------------
# Workflows
# ---------------------------------------------------------------------------
daily = (ROOT / '.github/workflows/daily-publish.yml').read_text()
old = '''      - name: Validate culture source\n        run: node scripts/publish-culture.js --check\n'''
new = '''      - name: Publish culture products\n        env:\n          PUBLISH_DATE: ${{ inputs.publish_date }}\n        run: |\n          if [ -n "$PUBLISH_DATE" ]; then\n            node scripts/publish-culture-products.js --date "$PUBLISH_DATE"\n          else\n            node scripts/publish-culture-products.js\n          fi\n\n      - name: Validate culture source\n        run: |\n          node scripts/publish-culture.js --check\n          node scripts/publish-culture-products.js --check\n'''
if old not in daily:
    raise SystemExit('daily workflow patch target missing')
daily = daily.replace(old, new, 1)
daily = daily.replace("what-is-foidslop.html what-does-foid-mean.html girl-dinner-ideas.html editorial-standards.html \\", "what-is-foidslop.html what-does-foid-mean.html girl-dinner-ideas.html editorial-standards.html about.html \\", 1)
(ROOT / '.github/workflows/daily-publish.yml').write_text(daily)

pr = (ROOT / '.github/workflows/pr-validation.yml').read_text()
pr = pr.replace("      - name: Validate culture source\n        run: node scripts/publish-culture.js --check", "      - name: Validate culture source\n        run: |\n          node scripts/publish-culture.js --check\n          node scripts/publish-culture-products.js --check", 1)
pr = pr.replace("          node scripts/daily-publish.js\n          node scripts/publish-culture.js", "          node scripts/daily-publish.js\n          node scripts/publish-culture.js\n          node scripts/publish-culture-products.js", 1)
(ROOT / '.github/workflows/pr-validation.yml').write_text(pr)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------
write('test/culture-products.test.js', r'''const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { normalizeCounts, applyVote, aggregate } = require('../scripts/lib/slop-votes');

const root = path.join(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const dictionary = read('data/dictionary.json');
const culture = read('data/culture-articles.json');
const trials = read('data/slop-trials.json');
const usernames = read('data/username-generator.json');
const taxonomy = read('data/slop-taxonomy.json');

function file(name) { return fs.readFileSync(path.join(root, name), 'utf8'); }

test('remaining launch dictionary cluster is present', () => {
  const slugs = new Set(dictionary.entries.map(entry => entry.slug));
  assert.ok(dictionary.entries.length >= 15);
  for (const slug of ['guyslop', 'wifechow', 'girl-breakfast', 'content-slop']) assert.ok(slugs.has(slug), `missing ${slug}`);
});

test('remaining culture cluster is present', () => {
  const slugs = new Set(culture.articles.map(article => article.slug));
  for (const slug of ['foidslop-media-canon', 'internet-gendered-food-taxonomy', 'when-did-everyone-start-saying-mog']) assert.ok(slugs.has(slug), `missing ${slug}`);
});

test('Slop Trial vote math is stable', () => {
  assert.deepEqual(normalizeCounts(null), { yes: 0, no: 0 });
  const counts = applyVote(applyVote(null, 'yes'), 'no');
  assert.deepEqual(counts, { yes: 1, no: 1 });
  assert.deepEqual(aggregate({ yes: 3, no: 1 }), { yes: 3, no: 1, total: 4, percentYes: 75 });
});

test('Slop Trial source has enough varied candidates', () => {
  assert.ok(trials.items.length >= 20);
  assert.ok(new Set(trials.items.map(item => item.id)).size === trials.items.length);
  assert.ok(new Set(trials.items.map(item => item.category)).size >= 7);
});

test('username generator uses curated departments and real word banks', () => {
  assert.ok(Object.keys(usernames.categories).length >= 5);
  for (const group of Object.values(usernames.categories)) {
    assert.ok(group.bases.length >= 8);
    assert.ok(group.modifiers.length >= 8);
    assert.ok(group.suffixes.length >= 8);
  }
});

test('Slop Taxonomy links into the actual publication', () => {
  assert.ok(taxonomy.branches.length >= 4);
  const hrefs = taxonomy.branches.flatMap(branch => branch.items.map(item => item.href));
  assert.ok(hrefs.includes('/what-is-foidslop'));
  assert.ok(hrefs.includes('/dictionary/guyslop'));
  assert.ok(hrefs.includes('/dictionary/content-slop'));
  assert.ok(hrefs.includes('/culture/foidslop-media'));
});

test('interactive product pages are generated and wired', () => {
  for (const page of ['culture/is-it-foidslop.html', 'culture/username-generator.html', 'culture/slop-taxonomy.html', 'about.html']) assert.ok(fs.existsSync(path.join(root, page)), `missing ${page}`);
  assert.match(file('culture/is-it-foidslop.html'), /data-slop-trial/);
  assert.match(file('culture/is-it-foidslop.html'), /Community Slop Trials/);
  assert.match(file('culture/username-generator.html'), /data-username-generator/);
  assert.match(file('culture/slop-taxonomy.html'), /taxonomy-root/);
  assert.match(file('culture/slop-tools.js'), /\/api\/slop-vote/);
});

test('Slop Trial storage is isolated from recipe rating keys', () => {
  const vote = file('functions/api/slop-vote.js');
  const results = file('functions/api/slop-votes.js');
  assert.match(vote, /SLOP_VOTES \|\| env\.RATINGS/);
  assert.match(vote, /slop:voter:/);
  assert.match(vote, /slop:counts:/);
  assert.match(results, /slop:counts:/);
  assert.doesNotMatch(vote, /`counts:\$\{id\}`/);
});

test('homepage promotes a weekly field note, Slop Trial, and generator', () => {
  const home = file('index.html');
  assert.match(home, /zine-culture-week/);
  assert.match(home, /SLOP TRIAL/);
  assert.match(home, /culture\/username-generator/);
  assert.ok(home.indexOf('zine-culture-week') < home.indexOf('zine-newsletter zine-newsletter-repeat'));
});

test('primary footer no longer advertises editorial standards', () => {
  const home = file('index.html');
  const footer = home.slice(home.lastIndexOf('<footer'));
  assert.doesNotMatch(footer, />Editorial standards</);
  assert.match(footer, />Dictionary</);
  assert.match(footer, />Culture</);
  assert.match(footer, />About</);
});

test('weekly dispatch includes culture and a Slop Trial', () => {
  const weekly = file('scripts/weekly-community.js');
  assert.match(weekly, /ELSEWHERE IN THE SLOP/);
  assert.match(weekly, /SLOP TRIAL/);
  assert.match(weekly, /culture\/is-it-foidslop/);
});
''')

# Existing CSS-version regression test
replace_once('test/culture-content.test.js', 'css\\/culture\\.css\\?v=20260906-3', 'css\\/culture\\.css\\?v=20260906-4')


# ---------------------------------------------------------------------------
# README + operational docs
# ---------------------------------------------------------------------------
readme = (ROOT / 'README.md').read_text()
readme = readme.replace('`functions/api/` contains Cloudflare Pages Functions that collect recipe votes.', '`functions/api/` contains Cloudflare Pages Functions that collect recipe votes and community Slop Trial votes.')
readme = readme.replace('`data/culture-articles.json`, `data/dictionary.json`, and `data/slop-index.json` are the curated source of truth for the non-recipe publication.', '`data/culture-articles.json`, `data/dictionary.json`, `data/slop-index.json`, `data/slop-trials.json`, `data/username-generator.json`, and `data/slop-taxonomy.json` are the curated source of truth for the non-recipe publication.')
readme = readme.replace('The culture publisher runs after `daily-publish.js`, so the recipe publisher remains independent and continues to own recipe pages, collections, roundups, and the core homepage. The culture pass adds a small homepage module and Culture navigation after the recipe build has finished.', 'The culture publisher runs after `daily-publish.js`, so the recipe publisher remains independent and continues to own recipe pages, collections, roundups, and the core homepage. `publish-culture-products.js` runs last and adds Is It Foidslop?, the username generator, the Slop Taxonomy, weekly culture promotion, About, and product metadata.')
reader_anchor = '## Reader ratings\n'
slop_docs = '''## Slop Trial voting\n\n`/culture/is-it-foidslop` uses first-party Pages Functions at `/api/slop-vote` and `/api/slop-votes`. The preferred Workers KV binding is `SLOP_VOTES`. If it is absent, the functions safely fall back to the existing `RATINGS` namespace using `slop:`-prefixed keys, which do not overlap recipe `counts:` or `voter:` keys. `SLOP_VOTE_SALT` is optional; `VOTE_SALT` is used as a fallback.\n\nThe public trial list lives in `data/slop-trials.json`. One vote per visitor/item is kept for 90 days. The browser also remembers its vote locally so the normal UI does not invite repeat voting.\n\n`data/site-identity.json` is the source of truth for Organization `sameAs`. Add only profiles that have actually been claimed. Do not create placeholder social URLs for schema.\n\n'''
if '## Slop Trial voting' not in readme:
    readme = readme.replace(reader_anchor, slop_docs + reader_anchor)
readme = readme.replace('npm run culture:publish\nnpm run optimize', 'npm run culture:publish\nnpm run products:publish\nnpm run products:check\nnpm run optimize')
(ROOT / 'README.md').write_text(readme)

write('docs/culture-products.md', '''# Culture products\n\nThe culture expansion has three product surfaces in addition to articles and dictionary entries.\n\n- `/culture/is-it-foidslop` is a community YES/NO classifier backed by Workers KV.\n- `/culture/username-generator` is a client-side generator using curated word banks from `data/username-generator.json`.\n- `/culture/slop-taxonomy` is a linked visual map sourced from `data/slop-taxonomy.json`.\n\n`data/slop-trials.json` also supplies the rotating Slop Trial shown on the homepage and in The Weekly Slop email. The current field note and trial are selected deterministically by week so rebuilding on the same date produces the same site.\n\n## Adding a trial\n\nAdd a unique lowercase hyphenated `id`, a display `name`, a `category`, and one short `prompt`. Do not add actual people as vote targets. Classify media, foods, usernames, aesthetics, activities, and similar things.\n\n## Adding a username department\n\nEach department needs at least eight `bases`, `modifiers`, and `suffixes`. Keep the lists authored. The generator is intentionally not a generic random-word combiner.\n\n## Social identity\n\nOnly add a URL to `data/site-identity.json` after the foidslop account has actually been claimed on that service. The publisher passes those real URLs into Organization `sameAs`.\n''')

print('Expansion product source changes staged.')
