# AI editorial desk

The editorial desk is a staging layer between AI research and the checked-in public culture source.

AI may discover, research, structure, and draft a story. It must not write directly to `data/culture-articles.json`.

## Story packets

Draft packets live in `data/editorial-desk/*.json`.

Each packet tracks:

- story status and type;
- audience-relevance reasoning;
- source inventory with evidence tiers;
- explicit claims and what supports each one;
- sensitive legal, criminal, or medical claims;
- the proposed editorial angle;
- a complete draft matching the existing culture publisher schema;
- human approval and fact-check state.

The intended lifecycle is:

`candidate -> researching -> draft -> approved -> published`

`rejected` is terminal unless the packet is deliberately revived.

## Evidence rules

Source tiers are deliberately simple:

1. court records, government, official records, academic or similarly direct primary material;
2. wire services, major local reporting, and strong national reporting;
3. specialist and other credible secondary reporting;
4. social posts, forums, videos, blogs, and other discourse evidence.

Tier 4 is useful for showing that a reaction, meme, or argument exists. It may not be the sole support for a factual claim. Sensitive criminal, legal, and medical factual claims require at least one tier 1-2 source.

Claims must be labelled as `fact`, `allegation`, `argument`, `testimony`, `analysis`, or `reaction`. This is meant to stop an AI draft from flattening a prosecutor's allegation, a defense argument, expert testimony, and an established fact into the same voice.

## Commands

```sh
npm run editorial:check
npm run editorial:list
npm run editorial:materialize -- <story-id>
npm run editorial:promote -- <story-id>
node scripts/editorial-desk.js promote <story-id> --write
```

`materialize` prints the culture-article object that an approved packet would produce.

`promote` is dry-run by default. Pass `--write` only after review. It inserts or replaces the matching article in `data/culture-articles.json`; the existing culture publisher remains responsible for public HTML, metadata, feeds, sitemap behavior, navigation, and normal validation.

## AI research contract

For a candidate such as the Lindsay Clancy case, the research agent should return a packet rather than prose first.

1. Gather primary and high-quality secondary sources.
2. Build the chronology and current status.
3. Separate undisputed facts from allegations, arguments, testimony, analysis, and online reaction.
4. For medical context, cite authoritative general medical sources and do not diagnose a person from social posts or reporting shorthand.
5. Sample social media only to characterize discourse. Do not present a hand-picked sample as statistically representative.
6. Choose the foidslop angle only after the evidence packet exists.
7. Draft from supported claims.
8. Run a separate fact-check pass against every factual sentence and URL.
9. Set `review.humanApproved` and `review.factCheckComplete` only after a human has actually reviewed the result.

The system is intentionally review-gated. The goal is to automate research and writing without turning the site into an unsourced rewrite farm.
