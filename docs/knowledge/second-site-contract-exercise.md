# Second Site Contract Exercise

This note records the first real second-site pressure test against the checked-in site contract.

## Site used

- site id: `extensions.serp.co`
- domain: `extensions.serp.co`
- repo: `serpcompany/extensions.serp.co`

## What this exercised

The second site intentionally stayed sparse so it would prove the real contract instead of hiding gaps behind copied defaults.

Proven override points:

- site identity:
  `site.name`, `site.domain`, `site.publicUrl`, `site.description`, `site.tagline`
- listing terminology:
  `copy.listingName.*`, `copy.submitLabel`
- listing route base:
  `routes.listingBasePath = extension`
- GitHub links:
  `social.githubRepoUrl`, `social.githubIssueRepo`, `social.githubIssuesUrl`
- feature toggle:
  `features.showNewsletter = false`
- site-owned network links via `sites/<id>/site-content.ts`

## Result

The repo validated and built the second site successfully without needing a new contract shape.

That means the current checked-in config model already supports:

- different public listing vocabulary
- different public listing path prefixes
- different repo/issue ownership links
- different site-owned network links
- per-site feature toggles

## Important verification nuance

The raw `next build` route report still shows the pre-finalize export paths such as `/websites/...`.

That does **not** mean the shipped site artifact is wrong.

The final public route remap happens later in `scripts/build-site.ts`, when the build copies `apps/web/out` into `dist/sites/<site-id>` and applies the configured public route base paths.

For route-contract verification, check the final artifact instead:

- `dist/sites/<site-id>/extension/...`
- `dist/sites/<site-id>/categories/...`
- `dist/sites/<site-id>/search/search-index.json`
- `dist/sites/<site-id>/sitemap-index.xml`

Do not treat the raw Next route log alone as the final public route contract for multi-site builds.
