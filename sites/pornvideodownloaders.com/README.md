# pornvideodownloaders.com

## Source of truth

For `pornvideodownloaders.com`, product data starts in:

- `sites/pornvideodownloaders.com/products.json`

This site uses the `trial-products-json` source adapter, so the app does not read `products.json` directly at runtime.
Public product detail pages render under `/products/[slug]`.

The catalog is an explicit adult-only subset of `sites/serpdownloaders.com/products.json`.
Do not add general social, education, stock-media, or non-adult downloader records to this site.

## Regenerate the runtime dataset

After editing `products.json`, run:

```bash
pnpm prepare:site -- --site pornvideodownloaders.com
```

That regenerates:

- `data/listings.json`

## Local development

Safest site-specific local loop:

```bash
pnpm dev:site -- --site pornvideodownloaders.com
```
