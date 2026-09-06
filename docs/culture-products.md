# Culture products

The culture expansion has three product surfaces in addition to articles and dictionary entries.

- `/culture/is-it-foidslop` is a community YES/NO classifier backed by Workers KV.
- `/culture/username-generator` is a client-side generator using curated word banks from `data/username-generator.json`.
- `/culture/slop-taxonomy` is a linked visual map sourced from `data/slop-taxonomy.json`.

`data/slop-trials.json` also supplies the rotating Slop Trial shown on the homepage and in The Weekly Slop email. The current field note and trial are selected deterministically by week so rebuilding on the same date produces the same site.

## Adding a trial

Add a unique lowercase hyphenated `id`, a display `name`, a `category`, and one short `prompt`. Do not add actual people as vote targets. Classify media, foods, usernames, aesthetics, activities, and similar things.

## Adding a username department

Each department needs at least eight `bases`, `modifiers`, and `suffixes`. Keep the lists authored. The generator is intentionally not a generic random-word combiner.

## Social identity

Only add a URL to `data/site-identity.json` after the foidslop account has actually been claimed on that service. The publisher passes those real URLs into Organization `sameAs`.
