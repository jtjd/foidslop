# foidslop site

This repository contains the static foidslop website, its recipe data, and the scripts that publish and validate it.

## Project structure

- `assets/brand/` contains logos, favicons, and sharing artwork.
- `assets/js/` contains browser JavaScript used by the published site.
- `assets/shop/` contains retired store artwork kept out of public builds.
- `data/` contains the private recipe source files, editable homepage publication settings, editorial roundup configuration, and the synced reader-ratings cache.
- `functions/api/` contains Cloudflare Pages Functions that collect recipe votes.
- `scripts/` contains publishing, image, SEO, and deployment tools.
- `css/`, `recipes/`, and `slop/` contain public site pages and styles.
- `.deploy/` is generated locally and is the directory Cloudflare Pages publishes.

Public files in `assets/brand/` and `assets/js/` are copied to their established root URLs during the build. Retired store source artwork remains in the repository but is not deployed.

## Homepage services

`data/homepage.json` controls the Kit signup, current Tally question, optional reader feature, and archive pick. Kit receives newsletter subscriptions through a plain HTML form, and Tally hosts the vote and optional reader-submission fields. Neither integration loads a third-party script on the homepage.

The newsletter form also supports provider-required values through `newsletter.hiddenFields`. Those values render as ordinary hidden HTML inputs, so the integration does not need an iframe or third-party script.

`data/weekly-polls.json` contains the twelve-week editorial poll queue. `scripts/weekly-community.js` opens and closes those polls, counts aggregate results, swaps a unique winner onto Friday, prepares its images, and creates an idempotent Kit broadcast. See [Weekly community operations](docs/weekly-community.md) for setup, safe rollout, and recovery commands.

## Reader ratings

Recipe pages collect star ratings through two first-party Pages Functions backed by a Workers KV namespace; no third-party script or service is involved.

1. In the Cloudflare dashboard, create a KV namespace (for example `foidslop-ratings`) and bind it to the Pages project under **Settings → Functions → KV namespace bindings** with the variable name `RATINGS`. Optionally set a `VOTE_SALT` secret to strengthen voter hashing.
2. Deploy. `/api/rate` records same-origin votes (honeypot plus a salted, hashed visitor key per recipe for dedupe) and `/api/ratings` returns public aggregates.

Votes only become visible schema once real data exists. The daily workflow runs `node scripts/sync-ratings.js --soft` before publishing, which refreshes `data/ratings.json` from the live endpoint; `daily-publish.js` then emits matching Recipe `aggregateRating` markup for any recipe with three or more votes. Never hand-edit aggregate values into pages: `seo-check.js` fails builds where schema disagrees with the cache.

## Editorial roundups

`data/editorial-pages.json` defines root-level roundup pages (for example `soup-for-one`) generated from the published recipe pool on every publish. Each entry needs curated title, intro, guide, and at least three FAQ entries; the generator refuses to build a page whose filter matches fewer than `minRecipes` published recipes, so no thin pages ship. New entries must also be added to the `git add` list in `.github/workflows/daily-publish.yml`.

Roundups carry ItemList plus FAQPage schema and are cross-linked from every collection page, listed in the sitemap, redirected from their `.html` variants, and pinged through IndexNow like every other page. A `seasonMonths` entry (1-12) gates when a roundup appears in recommendations and the homepage tile without unpublishing the page itself.

## Traffic plumbing

Several publisher features exist to move visitors deeper and earn clicks:

- **Keep browsing strip:** every recipe page auto-links its two best-fit collection hubs (matched by category/tags) plus up to two in-season roundups, with a "for-one" fallback so the strip is never empty. Breadcrumbs mirror the primary hub.
- **Inline dispatch form:** recipe pages end with a compact newsletter signup reusing `data/homepage.json` settings; it renders only while `newsletter.enabled`.
- **Homepage seasonal tile:** the first in-season roundup gets a tile between the intent links and The Table.
- **Automatic filing cabinet:** the homepage rotates a deterministic older recipe daily (or weekly if configured), excluding the seven newest issues so the cabinet stays meaningfully archival.
- **Share row:** Pinterest, X, and copy-link actions on every recipe plus a save-to-Pinterest overlay on the hero image.
- **Measurement:** `recipe-tools.js` binds every recipe-page `data-track` action (share, pin, report, today's-slop) and rating submissions to GA events; `archive.js` sends settled archive searches as `archive_search` with result counts. All tracking is gated behind the cookie-consent flag exactly like the homepage.
- **Reader report prompt:** recipes end with a "Made this slop?" call to the Tally submission form, feeding The Table's featured-reader slot.
- **Self-hosted fonts:** latin subsets of Bebas Neue and Inter (variable 300-600) ship from `/fonts/` via `css/fonts.css`, preloaded in every head; Google Fonts must never reappear (`seo-check.js` fails remote font links).
- **Scheduled roundups:** an optional `notBefore: "YYYY-MM-DD"` keeps an editorial page dormant (no file, no sitemap entry, no inventory requirement) until its date; the publisher deletes any file left by a future-dated run. Thanksgiving, Christmas, Hanukkah, and New Year pages are pre-configured and activate automatically as volume-2 holiday recipes publish.
- **Pinterest entity:** `PINTEREST_URL`/`SAME_AS` feed every Organization schema `sameAs` and the footer link.
- **Per-collection og:image:** hubs, roundups, and the girl-dinner pillar use their newest matching recipe's wide social canvas instead of the brand default.
- **Honest lastmod:** static sitemap URLs keep their previous `lastmod` until the page's substantive `<main>` content changes; shared navigation and footer churn is ignored. Hashes live in `data/lastmod-state.json`. Delete that file to force a full refresh.
- **Stable discovery URLs:** site navigation links directly to the current recipe. `/slop/today` remains a temporary `302` convenience redirect so crawlers do not treat a rotating destination as a permanent canonical.
- **Bounded archive weight:** `slop/archive.html` server-renders the newest 48 cards; older recipes ship as a JSON manifest that `archive.js` hydrates into identical markup, so search still covers everything as the catalog grows.
- **Production SEO monitor:** `.github/workflows/seo-monitor.yml` crawls the deployed sitemap pages, internal links, canonicals, indexability signals, and same-origin assets each morning. Search Console and Bing setup steps live in [SEO operations](docs/seo-operations.md).

## IndexNow

`scripts/lib/ping-config.js` holds the 32-hex key; `build-deploy.js` writes it to `<key>.txt` in the deployment so search engines can verify submissions. After a deploy goes live, run:

```sh
npm run ping:indexnow
```

The daily workflow does this automatically about four minutes after pushing, giving Cloudflare Pages time to finish deploying. It submits the homepage plus every URL whose sitemap `lastmod` changed that day.

## Common commands

```sh
npm run check
npm run build
npm run preview
npm run publish
npm run optimize
npm run refresh:copy
npm run seo:crawl
npm test
npm run sync:ratings
npm run ping:indexnow
npm run weekly:check
npm run weekly:dry-run
```

`npm run build` validates the site and creates a public-only `.deploy/` directory. Recipe source data, scripts, references, and future unpublished assets are not included in that directory.

`npm run preview` rebuilds the public site and serves `.deploy/` at `http://127.0.0.1:4173`. Use this command for local review instead of opening `index.html` directly or serving the repository root: brand files and browser scripts intentionally receive their public root URLs during the deployment build.
