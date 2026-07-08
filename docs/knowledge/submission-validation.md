# Submission Validation

The current starter keeps submissions static-friendly.

That means the active path is:

1. a visitor submits through `/submit`
2. the client builds a prefilled GitHub issue URL from checked-in site config
3. the browser opens the configured public GitHub issue composer
4. the public issue repo runs its thin `verify-badge.yml` caller, which invokes the central
   `.github/workflows/reusable-verify-badge.yml` workflow to check for a dofollow Featured on badge
5. verified submissions create a source PR that edits the active checked-in listing source
6. maintainers review the generated PR
7. the source edit goes through PR validation, build checks, merge, and deploy

## Active validation strategy

The repo now uses two layers:

- `PR Review`
  - runs the normal repo validation stack on pull requests
  - validates the active checked-in sites with `pnpm validate:sites`
- `Validate Listing Data`
  - runs when the active checked-in listing sources change on a PR or on `main`
  - executes `pnpm tsx scripts/validate-data.ts data/listings.json`
  - executes `pnpm validate:sites`

This keeps the current strategy explicit:

- GitHub issue intake is the primary public submission handoff for static sites
- public issue repos keep only the event wrapper for badge verification; badge logic lives centrally
- PRs are still the reviewable write path for listing-data changes
- the default starter still uses `data/listings.json`
- active checked-in sites can use their own `sites/<site-id>/products.json` sources
- `browserextensions.io` keeps accepted listings in `sites/browserextensions.io/products.json`
- this is the current static-starter bridge flow, not the long-term hosted auth/submission architecture

The public issue repo is never canonical listing data. Verified-submission automation may open a
source PR from public issue data, but it must not write directly to `main` or bypass maintainer PR
review. Do not reintroduce badge-token runtime verification for the static flow.
Offsite product URLs in public issue bodies are submission data only; they must not be used to infer
which site should deploy. The deploy resolver only trusts checked-in site domains, public URLs, and
configured issue repo links as site signals.

## What fails early

`scripts/validate-data.ts` rejects malformed listing entries such as:

- invalid JSON
- missing required fields
- invalid URLs
- bad `publishedAt` format
- malformed `resourceLinks`

## Recovery path

If validation fails on a PR:

1. read the failing path and message from the workflow log
2. fix the active checked-in listing source for that site
3. push the correction to the same PR
4. wait for `Validate Listing Data` to pass

If the problem came from a GitHub issue submission, fix the generated source PR rather than trying
to make the issue itself the source of truth.

## Related files

- `.github/workflows/pr-review.yml`
- `.github/workflows/reusable-verify-badge.yml`
- `.github/workflows/update-listings-json.yml`
- `docs/SUBMISSION_FLOW.md`
- `scripts/validate-data.ts`
- `packages/content/data/docs/submit-workflow.mdx`
- [hosted-submission-extension-path.md](./hosted-submission-extension-path.md)
