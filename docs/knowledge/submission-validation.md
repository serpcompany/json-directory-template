# Submission Validation

The current starter keeps submissions static-friendly.

That means the active path is:

1. a visitor submits through `/submit`
2. the app sends them to a prefilled GitHub issue
3. a maintainer reviews the issue
4. if accepted, the maintainer opens or updates a PR that edits `data/websites.json`
5. CI validates that checked-in listing data before merge

## Active validation strategy

The repo now uses two layers:

- `PR Review`
  - runs the normal repo validation stack on pull requests
- `Validate Listing Data`
  - runs specifically when `data/websites.json` changes on a PR or on `main`
  - executes `pnpm tsx scripts/validate-data.ts data/websites.json`

This keeps the current strategy explicit:

- GitHub issue intake is the public submission handoff
- PRs are the reviewable write path
- `data/websites.json` is the checked-in listing source that must validate before merge
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
2. fix `data/websites.json`
3. push the correction to the same PR
4. wait for `Validate Listing Data` to pass

If the problem came from a GitHub issue submission, fix the checked-in JSON in the maintainer PR rather than trying to make the issue itself the source of truth.

## Related files

- `.github/workflows/pr-review.yml`
- `.github/workflows/update-websites-json.yml`
- `scripts/validate-data.ts`
- `packages/content/data/docs/submit-workflow.mdx`
- [hosted-submission-extension-path.md](/Users/devin/dev/repos/json-directory-template/docs/knowledge/hosted-submission-extension-path.md)
