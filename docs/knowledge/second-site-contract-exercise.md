# Second Site Contract Exercise

Historical note: this document records an earlier proof-site exercise. It no longer describes the current active registry.

This note records the first real second-site pressure test against the checked-in site contract before the active-site cleanup parked inactive sites under `_archive/incubating-sites/**`.

## Site used

- site id: `serp.software` at the time of the exercise
- domain: `serp.software` at the time of the exercise
- repo: deploy target not created yet

## What this exercised

The second site intentionally stayed sparse so it would prove the real contract instead of hiding gaps behind copied defaults.

Proven override points:

- site identity:
  `site.name`, `site.domain`, `site.publicUrl`, `site.description`, `site.tagline`
- listing terminology:
  `copy.listingName.*`, `copy.submitLabel`
- listing route base:
  `routes.listingBasePath = software`
- GitHub links:
  `social.githubRepoUrl`, `social.githubIssueRepo`, `social.githubIssuesUrl`
- sparse site-owned content via `sites/<id>/site-content.ts`

## Result

At the time of the exercise, the repo validated and built the second site successfully without needing a new contract shape.

That means the current checked-in config model already supports:

- different public listing vocabulary
- different public listing path prefixes
- sparse repo/issue ownership overrides when needed
- site-owned content modules
- no deploy target until a real repo exists

## Important verification nuance

The raw `next build` route report still shows the pre-finalize export paths such as `/websites/...`.

That does **not** mean the shipped site artifact is wrong.

The final public route remap happens later in `scripts/build-site.ts`, when the build copies `apps/web/out` into `dist/sites/<site-id>` and applies the configured public route base paths.

For route-contract verification, check the final artifact instead:

- `dist/sites/<site-id>/software/...`
- `dist/sites/<site-id>/categories/...`
- `dist/sites/<site-id>/search/search-index.json`
- `dist/sites/<site-id>/sitemap-index.xml`

Do not treat the raw Next route log alone as the final public route contract for multi-site builds.

## Current status

`serp.software` is no longer an active checked-in site in this repo. The current active registry only includes `serpdownloaders.com`, and parked site material now lives under `_archive/incubating-sites/**`.
