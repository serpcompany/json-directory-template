# serpdownloaders.com

## Source of truth

For `serpdownloaders.com`, product data starts in:

- `sites/serpdownloaders.com/products.json`

This site uses the `trial-products-json` source adapter, so the app does not read `products.json` directly at runtime.
Public product detail pages render under `/products/[slug]`.

Keep each record in `products.json` focused on five groups:

- `product`
  Page-facing fields such as `title`, `tagline`, `productPage`, `slug`, and optional `categories`.
- `media`
  Optional structured assets such as a `logo`, screenshots in `images`, or one `video` URL.
- `content`
  The catch-all long-form area, mainly `body` plus optional `faq`.
- `relatedLinks`
  The lower links section, such as Help Center.

If you need a product to appear in more than one category:

- set `product.categories` to every category that listing should belong to
- put the canonical route category first in that array

If you omit both, this site still falls back to the default category from `site-config.ts`.

Do not add extension implementation or design config here. Fields like popup UI config, context menu config, download manager panel config, and player button styling are outside the starter contract.

## Regenerate the runtime dataset

After editing `products.json`, run:

```bash
pnpm prepare:site -- --site serpdownloaders.com
```

That regenerates:

- `data/listings.json`

## Local development

Safest site-specific local loop:

```bash
pnpm dev:site -- --site serpdownloaders.com
```

If you already have `pnpm dev` running, you can just rerun the prepare step and refresh the browser.

## Operator-only form view

If you want a local form-driven view of the same contract instead of editing JSON directly:

```bash
pnpm dev:operator -- --site serpdownloaders.com
```

Then open:

```txt
http://localhost:3005/operator/onboard-site
```
