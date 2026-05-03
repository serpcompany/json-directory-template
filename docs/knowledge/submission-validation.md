# Submission Validation

The current starter keeps submissions static-friendly.

That means the active path is:

1. a visitor submits through `/submit`
2. the app stores a pending submission and returns a verification token
3. the visitor lands on `/submit/verify?token=...` and publishes the badge snippet on their site
4. `/api/verify-badge` checks for the backlink and verification token
5. if accepted, the app appends the listing to the active checked-in listing source and revalidates the affected pages
6. maintainers can still fall back to the GitHub issue path when needed

## Active validation strategy

The repo now uses two layers:

- `PR Review`
  - runs the normal repo validation stack on pull requests
  - validates the active checked-in sites with `pnpm validate:site -- --site <id>`
- `Validate Listing Data`
  - runs when the active checked-in listing sources change on a PR or on `main`
  - executes `pnpm tsx scripts/validate-data.ts data/listings.json`
  - executes `pnpm validate:sites`

This keeps the current strategy explicit:

- self-serve badge verification is the primary public submission handoff
- GitHub issue intake remains as a fallback/operator path
- PRs are still the reviewable write path for broader listing-data changes
- the default starter still uses `data/listings.json`
- the current active checked-in sites use their own `sites/<site-id>/products.json` sources
- this is the current static-starter bridge flow, not the long-term hosted auth/submission architecture

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

If the problem came from a GitHub fallback submission, fix the checked-in JSON in the maintainer PR rather than trying to make the issue itself the source of truth.

## Related files

- `.github/workflows/pr-review.yml`
- `.github/workflows/update-listings-json.yml`
- `docs/SUBMISSION_FLOW.md`
- `scripts/validate-data.ts`
- `packages/content/data/docs/submit-workflow.mdx`
- [hosted-submission-extension-path.md](/Users/devin/dev/repos/json-directory-template/docs/knowledge/hosted-submission-extension-path.md)
