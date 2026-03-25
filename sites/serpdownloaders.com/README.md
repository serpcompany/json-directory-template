# serpdownloaders.com

## Source of truth

For `serpdownloaders.com`, listing data starts in:

- `sites/serpdownloaders.com/products.json`

This site uses the `trial-products-json` source adapter, so the app does not read `products.json` directly at runtime.

Keep each record in `products.json` focused on five groups:

- `product`
  Page-facing fields such as `title`, `tagline`, `productPage`, and `slug`.
- `media`
  Optional structured assets such as a `logo`, screenshots in `images`, or one `video` URL.
- `category`
  Optional override. If omitted, this site uses the default category from `site-config.ts`.
- `content`
  The catch-all long-form area, mainly `body` plus optional `faq`.
- `relatedLinks`
  The lower links section, such as Help Center.

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
