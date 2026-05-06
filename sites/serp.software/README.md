# serp.software

## Source of truth

For `serp.software`, product data starts in:

- `sites/serp.software/products.json`

This site uses the `trial-products-json` source adapter, so the app does not read `products.json` directly at runtime.
Public product detail pages render under `/products/[slug]`.

The catalog starts as a full copy of the 105 live downloader records from `serpdownloaders.com`.

## Regenerate the runtime dataset

After editing `products.json`, run:

```bash
pnpm prepare:site -- --site serp.software
```

That regenerates:

- `data/listings.json`

## Local development

Safest site-specific local loop:

```bash
pnpm dev:site -- --site serp.software
```
