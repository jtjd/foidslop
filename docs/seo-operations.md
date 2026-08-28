# SEO operations

The repository validates generated metadata locally and the `SEO Production
Monitor` workflow crawls the deployed site every day. Search engines still
need to be connected to the property once in their webmaster tools.

## Google Search Console

1. Add and verify the `foidslop.com` domain property.
2. Submit `https://foidslop.com/sitemap.xml` under **Sitemaps**.
3. Use **URL inspection** for the homepage, a collection page, a current
   recipe, and `/slop/archive/page-2` after the first deployment.
4. Check **Pages** for excluded URLs and **Enhancements** for Recipe results.
5. Review queries and impressions monthly before changing titles or creating
   new collection pages.

## Bing Webmaster Tools

1. Verify the same domain property with the deployed XML file at
   `https://foidslop.com/BingSiteAuth.xml`. The repository includes the file
   in the public build, so keep its verification token unchanged.
2. Submit `https://foidslop.com/sitemap.xml`.
3. Confirm that IndexNow submissions are accepted after a daily publish. The
   repository publishes the key proof file and submits URLs whose sitemap
   `lastmod` changed on the build date.

## Local and production checks

```sh
npm run check
npm run build
npm run seo:crawl
```

For a preview deployment, pass its origin explicitly:

```sh
node scripts/seo-crawl.js --base-url https://preview.example.com
```

The crawl fails on a non-200 sitemap page, a mismatched canonical, a
`noindex` sitemap page, a broken internal link, a redirecting `.html` link, or
a broken same-origin resource.
