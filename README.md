# foidslop site

This repository contains the static foidslop website, its recipe data, and the scripts that publish and validate it.

## Project structure

- `assets/brand/` contains logos, favicons, and sharing artwork.
- `assets/js/` contains browser JavaScript used by the published site.
- `assets/shop/` contains homepage and product artwork.
- `data/` contains the private recipe source files.
- `scripts/` contains publishing, image, SEO, and deployment tools.
- `css/`, `recipes/`, and `slop/` contain public site pages and styles.
- `.deploy/` is generated locally and is the directory Cloudflare Pages publishes.

Files in `assets/` are copied to their existing public root URLs during the build. This keeps established image and script URLs stable while making the source tree easier to navigate.

## Common commands

```sh
npm run check
npm run build
npm run publish
npm run optimize
```

`npm run build` validates the site and creates a public-only `.deploy/` directory. Recipe source data, scripts, references, and future unpublished assets are not included in that directory.
