# Taxonomy Discovery Contract

This is the active closeout contract for starter taxonomy and submit intake.

## Current decision

- keep one shared starter taxonomy
- do not broaden categories during closeout without real onboarding pressure
- keep public `/submit` single-category for now
- treat the submitted category as the primary category
- let maintainers add secondary categories later during review

## Canonical starter categories

The active shared category set is:

- `developer-tools`
- `ai-ml`
- `data-analytics`
- `infrastructure-cloud`
- `security-identity`
- `video-downloaders`
- `finance-fintech`
- `marketing-sales`
- `ecommerce-retail`
- `content-media`
- `business-operations`
- `personal`
- `agency-services`
- `international`
- `other`

Source of truth:

- `apps/starter/lib/categories.ts`

## Alias behavior

The current alias lane is intentionally narrow:

- `integration-automation` -> `video-downloaders`
- `automation-workflow` -> `video-downloaders`

Do not add new aliases casually during closeout.
If a site needs a broader mapping policy, split that work explicitly.

## Where taxonomy affects the platform

- `data/listings.json` and adapter-generated listing records
- direct validation through `pnpm validate:listings`
- site validation through `pnpm validate:site -- --site <id>`
- category navigation and category page generation
- search-index generation and search filtering
- public submit category options

## Public submit rule

The public `/submit` form currently collects one category only.

That field is the listing's primary category for intake and review.
If a listing should belong to more than one category, maintainers add the extra categories after review in the checked-in source of truth:

- `data/listings.json` for `listing-json` sites
- `sites/<id>/products.json` for adapter-driven sites that emit category arrays

## Closeout rule

During closeout:

- keep the taxonomy shared
- keep intake simple
- strengthen validation so direct JSON edits cannot drift outside the shared category set
- document any later category-expansion work as follow-up issues instead of broadening the contract implicitly
