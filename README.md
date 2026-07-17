# foidslop site

This repository contains the static foidslop website, its recipe data, and the scripts that publish and validate it.

## Project structure

- `assets/brand/` contains logos, favicons, and sharing artwork.
- `assets/js/` contains browser JavaScript used by the published site.
- `assets/shop/` contains retired store artwork kept out of public builds.
- `data/` contains the private recipe source files and editable homepage publication settings.
- `scripts/` contains publishing, image, SEO, and deployment tools.
- `css/`, `recipes/`, and `slop/` contain public site pages and styles.
- `.deploy/` is generated locally and is the directory Cloudflare Pages publishes.

Public files in `assets/brand/` and `assets/js/` are copied to their established root URLs during the build. Retired store source artwork remains in the repository but is not deployed.

## Homepage services

`data/homepage.json` controls the Kit signup, current Tally question, optional reader feature, and archive pick. Kit receives newsletter subscriptions through a plain HTML form, and Tally hosts the vote and optional reader-submission fields. Neither integration loads a third-party script on the homepage.

The newsletter form also supports provider-required values through `newsletter.hiddenFields`. Those values render as ordinary hidden HTML inputs, so the integration does not need an iframe or third-party script.

`data/weekly-polls.json` contains the twelve-week editorial poll queue. `scripts/weekly-community.js` opens and closes those polls, counts aggregate results, swaps a unique winner onto Friday, prepares its images, and creates an idempotent Kit broadcast. See [Weekly community operations](docs/weekly-community.md) for setup, safe rollout, and recovery commands.

## Common commands

```sh
npm run check
npm run build
npm run preview
npm run publish
npm run optimize
npm test
npm run weekly:check
npm run weekly:dry-run
```

`npm run build` validates the site and creates a public-only `.deploy/` directory. Recipe source data, scripts, references, and future unpublished assets are not included in that directory.

`npm run preview` rebuilds the public site and serves `.deploy/` at `http://127.0.0.1:4173`. Use this command for local review instead of opening `index.html` directly or serving the repository root: brand files and browser scripts intentionally receive their public root URLs during the deployment build.
