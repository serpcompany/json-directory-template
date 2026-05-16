# serp.co

## Source of truth

For `serp.co`, product data starts in:

- `sites/serp.co/products.json`

This site uses the `trial-products-json` source adapter, so the app does not read `products.json` directly at runtime.
Canonical public product detail pages render under `/products/[slug]/reviews/`.
The unsuffixed `/products/[slug]/` export is pruned from the static artifact.

## Regenerate the runtime dataset

After editing `products.json`, run:

```bash
pnpm prepare:site -- --site serp.co
```

That regenerates:

- `data/listings.json`

## Rebuild source products from a legacy export

The one-off merge helper requires an explicit base export path. It does not
default to a developer-local checkout.

```bash
pnpm tsx scripts/build-serp-co-products.ts --base-products path/to/products.json
```

## Local development

Safest site-specific local loop:

```bash
pnpm dev:site -- --site serp.co
```
