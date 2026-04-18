# Sites

This directory is the checked-in source of truth for per-site configuration and site-owned source inputs.

Only active sites should live directly under `sites/<site-id>/`.

Inactive or incubating sites belong under
[_archive/incubating-sites](/Users/devin/dev/repos/json-directory-template/_archive/incubating-sites)
until they are explicitly promoted into the active registry.

## What belongs here

- `site-config.default.ts`
  Starter defaults shared by every site unless overridden.
- `site-content.default.ts`
  Empty/safe default site-owned optional content.
- `<site-id>/site-config.ts`
  Sparse per-site override config.
- `<site-id>/site-content.ts`
  Site-owned optional extras such as network links or external resources.
- `<site-id>/products.json`
  Site-specific source input for adapter-driven sites that emit normalized listing data during build.

For adapter-driven sites, keep `products.json` grouped around the fields this starter actually uses:

- `product`
  Page-facing fields such as `title`, `tagline`, `productPage`, and `slug`.
- `media`
  Optional structured assets such as `logo`, `images`, or `video`.
- `category`
  Optional per-record override if the site-level default is not enough.
- `content`
  The catch-all long-form area, primarily `body` plus optional `faq`.
- `relatedLinks`
  The lower links section below the main content.

Do not treat `products.json` as a dump for extension implementation or design settings. UI-only fields like popup config, player-button config, context-menu behavior, and download-manager panel settings are not part of the starter contract.

## Operator rule

The source-of-truth file for listing data is defined by each site's `content.listingSource`.

- If `kind = "listing-json"`, edit `data/listings.json`.
- If the site uses the adapter-driven source kind currently named `trial-products-json`, edit `sites/<site-id>/products.json`, then run:

```bash
pnpm prepare:site -- --site <site-id>
```

## Do not infer from folder names alone

Always check the site's `content.listingSource` in `site-config.ts` if you are unsure which file is the editable source.
