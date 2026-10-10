# Listing Data Contract

Use this as the operator-facing source-of-truth note for listing data.

## What belongs where

- `sites/<id>/site-config.ts`
  Site identity, routes, feature flags, copy labels, social links, and brand assets.
- `sites/<id>/site-content.ts`
  Optional site-owned extras like external resources or network links.
- `data/listings.json`
  The normalized main listing dataset the app actually reads at runtime.
- `sites/<id>/products.json`
  A site-specific source input for adapter-driven builds.
- `records/build-inputs/**`
  Internal generated snapshot space. Do not edit by hand.

Start with:

- `sites/README.md`
- `sites/<id>/README.md`

## Operator rule

Only edit the file that is the declared source for your site:

- `content.listingSource.kind = "listing-json"`
  Edit `data/listings.json` directly.
- `content.listingSource.kind = "trial-products-json"`
  Edit `sites/<id>/products.json`, then rebuild so the adapter regenerates `data/listings.json`.
  Treat this as the current adapter-driven path, not as the default maintainer story for every site.

Recommended command:

```bash
pnpm prepare:site -- --site your-site-id
```

For a local operator-only form view of the same contract:

```bash
pnpm dev:operator -- --site your-site-id
```

Then open:

```txt
http://localhost:3005/operator/onboard-site
```

Use that UI when you want required/optional fields, inline validation, and JSON export. Use the checked-in source files directly for quick one-off edits.

## Unique content rule

Every listing's copy must be unique to its site. The same products are published across the network (apps.serp.co, serp.ai, serpdownloaders.com, browserextensions.io), so copied text competes with those pages as duplicate content.

When adding or refreshing a listing from another source (apps.serp.co / `serpcompany/store-new`, another site's `products.json`, a README, or a sheet):

- Rewrite `product.tagline`, every section of `content.body`, and every `content.faq` question and answer before adding it. Never paste source copy verbatim, and never copy a listing from one site's `products.json` into another's.
- Rewrite with new wording and new sentence structure, not just synonym swaps or reordered bullets. Vary the phrasing between listings on the same site too, so pages don't share one template with only the platform name swapped.
- Keep facts exactly as in the source: platform name, supported browsers and OS, formats, quality options, trial terms, permissions, save location, limitations, and pricing. Don't add claims that aren't in the source.
- Don't change product names, slugs, URLs, or category values. Keep the standard legal-disclaimer FAQ ("Is this legal?") as it appears on the site.
- Check uniqueness before merging. Compare each rewritten `content.body` against the source text, the same slug in every other site's `products.json`, and the site's other listings. Regenerate anything above roughly 0.5 similarity (`difflib.SequenceMatcher` ratio or 5-word shingle Jaccard), and put the scores in the PR.
- Run rewrites in a Claude Code session in the Claude desktop app using rewriter subagents, not through the Anthropic API from a script. For bulk work, follow the prepare → subagent rewrite → check → apply flow described in #156.

## Public submit intake rule

The public `/submit` flow currently collects one category only.

Treat that field as the listing's primary category during intake.
If review determines the listing belongs in more than one category, maintainers add the extra categories later in:

- `data/listings.json` for direct JSON sites
- `sites/<id>/products.json` for adapter-driven sites that support category arrays

## Canonical adapter source shape

For adapter-driven sites that use `products.json`, the canonical source file is intentionally small and grouped around the fields this starter actually uses:

```json
{
  "example-downloader": {
    "product": {
      "title": "Example Downloader",
      "slug": "example-downloader",
      "categories": ["video-downloaders", "developer-tools"],
      "tagline": "One-line directory summary.",
      "productPage": "https://example.com/example-downloader"
    },
    "media": {
      "logo": "https://cdn.example.com/example-downloader/logo.png",
      "images": ["https://cdn.example.com/example-downloader/screenshot-1.png"],
      "video": "https://cdn.example.com/example-downloader/demo.mp4"
    },
    "content": {
      "body": "## Overview\n\nLonger markdown body.",
      "faq": [
        {
          "question": "Does it work on mirrors?",
          "answer": "Yes."
        }
      ]
    },
    "relatedLinks": [
      {
        "label": "Help Center",
        "url": "https://help.example.com"
      }
    ]
  }
}
```

Fields we do not care about for this starter should stay out of the canonical source contract. That includes extension UI and implementation details such as popup layout, context-menu config, player-button styling, download-manager UI config, and similar design-only fields.

Explicitly out of scope for the canonical adapter source:

- `footerCta`
- `brandColorHex`
- `brandBackgroundHex`
- `extension`
- `geckoId`
- `targetSites`
- `versionAndStatus`
- `hostPermissions`
- `contentScripts`
- `technicalDetails`
- `formatObjectStructure`
- `architecture`
- `downloadManagerPanel`
- `playerButtonConfig`
- `popupUI`
- `buildAndRelease`
- `testingAndHealth`
- `businessAndMonetization`
- `loggingAndTelemetry`
- `brandColors`

Use this as the rule of thumb:

- `product`
  Fields the page uses directly for title, tagline, primary link, and route identity.
  Use `product.categories` as the full category list. The first entry becomes the canonical route category when the app needs one.
- `media`
  Optional structured assets such as a logo, screenshots, or one demo video URL.
  For the current listing UI, `media.logo` should prefer a checked-in or remote `.png`. Non-`.png`, missing, or broken logos fall back to the neutral placeholder asset at `/placeholder.svg`.
- `product.categories`
  Optional ordered list of all categories the listing should belong to. The first category is treated as the canonical route category.
- `product.legacySlugs`
  Optional list of old slugs that must keep resolving after a listing is renamed or merged into this record. See "Legacy slug redirects" below.
- `content`
  The long-form catch-all area. `content.body` is the main markdown/text field.
- `relatedLinks`
  The lower link section below the main content.

## Legacy slug redirects

Use `product.legacySlugs` on the surviving record when a listing is renamed or a duplicate record is merged into it:

```json
{
  "hotmovs-downloader": {
    "product": {
      "slug": "hotmovs-downloader",
      "legacySlugs": ["hotmovsvideodownloader.pages.dev"],
      "title": "HotMovs Downloader",
      "tagline": "One-line directory summary.",
      "productPage": "https://serp.ly/hotmovs-downloader"
    }
  }
}
```

For each legacy slug, `pnpm build:site` writes a static redirect page at both `/<listingBasePath>/<legacy>/` and the root alias `/<legacy>/` (plus `/<listingBasePath>/<legacy>/<listingDetailSuffix>/` when the site uses a detail suffix). Each page meta-refreshes to the surviving listing's canonical detail route and declares an absolute canonical built from `site.publicUrl`. The pages are not `noindex`: like other alias pages they rely on the canonical, which also keeps them out of the generated sitemaps. In `pnpm dev:site`, the wrapper `next.config.ts` serves the same paths as permanent redirects.

Validation (`pnpm validate:site`, which `pnpm build:site` also runs) fails when a legacy slug:

- is malformed: it must use lowercase letters and digits separated by single `.` or `-` characters, and must not end in a public file extension such as `.png` or `.xml`. Dotted slugs such as `hotmovsvideodownloader.pages.dev` are valid
- equals any live listing slug, including the record's own slug. Every live slug already has a root alias page
- appears twice, on one record or across records
- collides with a reserved top-level route: configured route base paths, sitemap paths, starter-owned routes such as `categories`, `brands`, `legal`, `search`, and `posts`, the wrapper app's top-level route and `public/` entries, and category slugs

The build also fails rather than overwrite a generated route, and fails if the surviving listing page was not generated.

Only the `trial-products-json` source supports `legacySlugs`. Delete the old record when you add its slug here; leaving both fails validation.

## Required listing fields

Every normalized listing record must provide:

- `name`
- `description`
- `categories`
- `publishedAt`
- `website` or legacy `domain`

## Optional listing fields

- `slug`
- `featured`
- `priority`
- `favicon`
- `isUnofficial`
- `resourceLinks`
- `content`

## Validate before build

For direct normalized listing files:

```bash
pnpm validate:listings data/listings.json
```

For a full site contract check:

```bash
pnpm validate:site -- --site your-site-id
```

To validate the active non-default checked-in sites together:

```bash
pnpm validate:sites
```

To validate the default starter explicitly:

```bash
pnpm validate:site -- --site default
```

For local development against one checked-in site:

```bash
pnpm dev:site -- --site your-site-id
```

## Example templates

- JSON example: [listing-template.json](../examples/listing-template.json)
- CSV planning template: [listing-template.csv](../examples/listing-template.csv)
- Adapter source example: [trial-products-template.json](../examples/trial-products-template.json)

The CSV file is a human collection template only. The runtime still expects normalized JSON before build.

## Single-submission mirror

The public `/submit` form intentionally mirrors the core fields for one listing:

- `name`
- `website`
- `category`
- `description`
- optional `content`
- optional `resourceLinks`

That gives maintainers a quick way to test the minimum one-record contract even before a bulk import flow exists.
