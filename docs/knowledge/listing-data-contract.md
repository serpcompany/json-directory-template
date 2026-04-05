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
  A site-specific source input for adapter-based builds such as `trial-products-json`.
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

## Canonical adapter source shape

For `trial-products-json` sites, the canonical source file is now intentionally small and grouped around the fields this starter actually uses:

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
- `content`
  The long-form catch-all area. `content.body` is the main markdown/text field.
- `relatedLinks`
  The lower link section below the main content.

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

For local development against one checked-in site:

```bash
pnpm dev:site -- --site your-site-id
```

## Example templates

- JSON example: [listing-template.json](/Users/devin/dev/repos/json-directory-template/docs/examples/listing-template.json)
- CSV planning template: [listing-template.csv](/Users/devin/dev/repos/json-directory-template/docs/examples/listing-template.csv)
- Adapter source example: [trial-products-template.json](/Users/devin/dev/repos/json-directory-template/docs/examples/trial-products-template.json)

The CSV file is a human collection template only. The runtime still expects normalized JSON before build.

## Single-submission mirror

The public `/submit` form intentionally mirrors the core fields for one listing:

- `name`
- `website`
- `category`
- `description`
- optional reviewer notes

That gives maintainers a quick way to test the minimum one-record contract even before a bulk import flow exists.
