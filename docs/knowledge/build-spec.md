# BuildSpec

`BuildSpec` is the explicit input contract for one build run.

This repo should not silently read site branding or deploy settings from checked-in site folders as its long-term source of truth. Instead, the operator stages raw inputs locally, generates a `BuildSpec`, and the build either accepts it or fails with specific missing-field errors.

## Mental model

- `BuildSpec` is the active build input
- `sites/**` is a local, gitignored operator staging area for raw input files
- `dist/**` is generated output only
- `records/site-definitions/**` is compatibility/reference material only for known examples and migration
- future `records/**` can hold archived snapshots if we want audit history, but builds should never read them implicitly

## Operator flow

1. Create `sites/<site-id>/`
2. Drop in the raw inputs you were given:
   source JSON, logo files, OG image, favicon, notes
   Do not assume the build will fill missing brand assets from repo defaults.
3. Run `pnpm build-spec:init -- --site <site-id>`
4. Review `sites/<site-id>/build-spec.json`
5. Run validation
6. Run the build
7. Review the output artifact
8. Run deploy when ready

## Current commands

```bash
pnpm build-spec:init -- --site serpdownloaders
pnpm validate:site -- --spec sites/serpdownloaders/build-spec.json
pnpm build:site -- --spec sites/serpdownloaders/build-spec.json
pnpm deploy:site -- --spec sites/serpdownloaders/build-spec.json --dry-run
```

## Minimum required sections

- `version`
- `build`
- `site`
- `branding.drBadge`
- `social`
- `content.websiteSource`

`deploy` is required only when the run needs a deploy target.

Brand assets are currently optional at the schema level, but if you reference them in `BuildSpec`, the files must exist in the staged site workspace before validation/build.

## Example

```json
{
  "version": 1,
  "build": {
    "siteId": "serpdownloaders",
    "mode": "static-directory"
  },
  "site": {
    "name": "SERP Downloaders",
    "domain": "serpdownloaders.com",
    "publicUrl": "https://serpdownloaders.com",
    "description": "Directory of download-focused browser tools.",
    "tagline": "Download-focused product directory"
  },
  "branding": {
    "drBadge": {
      "provider": "serp-dr",
      "domain": "serpdownloaders.com",
      "style": "serp-dr-v3"
    }
  },
  "social": {
    "githubUrl": "https://github.com/serpcompany",
    "githubRepoUrl": "https://github.com/serpcompany/json-directory-template",
    "githubIssueOwner": "serpcompany",
    "githubIssueRepo": "json-directory-template",
    "githubIssuesUrl": "https://github.com/serpcompany/json-directory-template/issues/new/choose",
    "githubIssueTemplate": "submit-website.yml",
    "redditUrl": "https://www.reddit.com/r/serp/",
    "twitterUrl": "https://x.com/serpcompany"
  },
  "features": {
    "showCreatorProjects": false,
    "showDeveloperTools": false,
    "showFeaturedGuides": false,
    "showNewsletter": true
  },
  "content": {
    "websiteSource": {
      "kind": "trial-products-json",
      "path": "tmp/serpdownloaders.com/products.json",
      "category": "automation-workflow",
      "featuredCount": 6,
      "publishedAt": "2026-03-23"
    }
  }
}
```

## Inputs and files

- small text values should live inline in the spec
- larger JSON inputs should be referenced by path
- binary assets like logos or OG images should be referenced, not embedded

Supported asset references today:

```json
{
  "source": "local-path",
  "path": "sites/serpdownloaders/logo.png"
}
```

or

```json
{
  "source": "url",
  "url": "https://example.com/logo.png"
}
```

Current staged-asset support:

- `favicon`: `.ico` only, staged to `apps/web/app/favicon.ico`
- `logo`: `.png` only, staged to `apps/web/public/logo.png`
- `opengraphImage`: `.png` only, staged to `apps/web/app/opengraph-image.png`

The build now runs a preflight validation before export starts, so incomplete `BuildSpec` placeholders or missing staged files fail before the expensive app build begins.

## DR badge input

The operator-facing `BuildSpec` now prefers a provider-style badge payload instead of raw image sizing fields.

Preferred shape:

```json
{
  "provider": "serp-dr",
  "domain": "serpdownloaders.com",
  "style": "serp-dr-v3"
}
```

Optional:
- `alt`

Compatibility note:
- raw badge objects are still accepted for migration or unusual providers, but they are not the preferred operator-facing shape

## Current staging convention

Example local operator workspace:

- `sites/serpdownloaders/products.json`
- `sites/serpdownloaders/logo.png`
- `sites/serpdownloaders/opengraph-image.png`
- `sites/serpdownloaders/build-spec.json`

The operator workspace is intentionally gitignored so it can hold client-provided files without turning them into repo source of truth.

## Test-only note

For the current `serpdownloaders` pipeline test, staged `favicon.ico`, `logo.png`, and `opengraph-image.png` were created from existing repo assets only to prove the staged-asset mechanism works.

That is not part of the intended operator flow.

The real operator contract is:

- if a build needs brand assets, the operator stages those explicit files in `sites/<site-id>/`
- the build validates and uses those exact files
- the build does not silently source missing assets from random files elsewhere in the repo
