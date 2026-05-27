# Deploy Strategy Exit Plan

This proposal defines the exit from the current `github-pages-repo-sync`
publish path when large static artifacts make GitHub Pages repo history the
operational bottleneck.

No deploy script changes are included here. The build authority remains this
source repository and the artifact remains a static export unless a later phase
explicitly approves a runtime move.

## Current Baseline

Measured `serp.co` after the build optimization work:

- final artifact: about `892M` in `dist/sites/serp.co`
- product artifact: about `850M` in `dist/sites/serp.co/products`
- final file count: `3,636`
- product detail pages: `3,206`
- current deploy model: build static artifact, then commit/sync it into the
  checked-in target GitHub Pages repo

The artifact is close to GitHub Pages' documented `1 GB` site guidance. The
repo-sync model also keeps generated artifacts in target repo history, so every
changed deploy can grow the target repo even when the latest snapshot remains
under the limit.

## Options

### Current GitHub Pages Repo Sync

How it works:

- source CI builds `dist/sites/<site-id>`
- deploy script syncs files into the checked-in target repo and branch
- target repo Pages workflow publishes the committed files

Strengths:

- already implemented and verified
- simple rollback by reverting the target repo to an older artifact commit
- DNS and CNAME behavior are already known
- no new cloud account or CDN configuration

Weaknesses:

- generated artifact history bloats the target Git repo
- the latest site remains constrained by GitHub Pages size and deploy limits
- cache headers are limited by GitHub Pages defaults
- rollback still depends on Git operations against a large generated repo

Use only while the artifact remains comfortably below the Pages ceiling and
target repo operations stay reliable.

### GitHub Pages Artifact Deploy

How it would work:

- source CI builds the same static artifact
- CI uploads a Pages artifact with `actions/upload-pages-artifact`
- CI publishes with `actions/deploy-pages`
- no generated artifact commit is pushed into the target repo

Strengths:

- removes target repo history bloat
- keeps GitHub Pages and static hosting
- rollback can use retained Pages deployment artifacts while retention lasts
- DNS/CNAME remain similar to the current Pages setup

Weaknesses:

- still constrained by GitHub Pages site-size and publish limits
- artifact retention is time-bound, so rollback history is not permanent unless
  source artifacts are stored elsewhere
- cache headers remain limited compared with CDN-controlled hosting
- cross-repo Pages ownership and custom-domain handoff need a dedicated
  migration rehearsal

This is the lowest-complexity interim move if repo history becomes painful
before the latest artifact exceeds Pages limits.

### Object Storage Plus CDN

How it would work:

- source CI builds the same static artifact
- CI uploads versioned artifacts to object storage, for example
  `sites/serp.co/releases/<source-sha>/...`
- CI updates a small release pointer or invalidates CDN paths after upload
- DNS points the domain at the CDN distribution

Strengths:

- removes Git target repo history from the publish path
- supports explicit cache headers:
  - immutable long TTL for `_next/static/**`
  - short TTL or revalidation for HTML, XML, feeds, and JSON search data
  - normal static TTL for images, fonts, badges, and favicons
- rollback is a pointer flip to a previous retained release
- artifact retention can be controlled by lifecycle policy
- scales past the GitHub Pages `1 GB` ceiling while preserving static-first
  generation

Weaknesses:

- requires cloud account ownership, secrets, bucket policy, CDN config, and
  observability
- invalidation and rollback logic must be tested before production cutover
- CNAME/custom-domain validation moves from Pages to the CDN provider
- costs are no longer bundled into GitHub; storage, requests, transfer, and CDN
  invalidations need owner visibility

This is the recommended long-term path because it solves both target repo
growth and Pages size limits without forcing a hosted Next runtime.

### Hosted Next Runtime

How it would work:

- deploy the Next app to a platform that runs a server or serverless runtime
- use dynamic rendering, ISR, or runtime data access where appropriate

Strengths:

- can reduce up-front static generation pressure
- unlocks runtime search, dynamic submissions, auth, moderation, and partial
  regeneration
- deploy artifact shape can be much smaller than full static HTML

Weaknesses:

- changes the product boundary from static-first to runtime-operated
- introduces uptime, runtime cost, caching, and data-source responsibilities
- rollback and incident response become platform-specific
- risks reintroducing database/auth concerns into the build pipeline before
  they are needed

Do not choose this just to avoid GitHub Pages repo-sync churn. Consider it only
when runtime product features or static generation limits become the real
constraint.

## Recommendation

Adopt object storage plus CDN as the target architecture when the current path
crosses a measured trigger. Use GitHub Pages artifact deploy only as a short
interim step if target repo history becomes the immediate pain and the latest
artifact is still safely below Pages limits.

Recommended trigger:

- latest artifact reaches `850M` or more for two consecutive accepted builds,
  or
- target repo clone/fetch/deploy operations become unreliable, or
- target repo packed size exceeds `2 GB`, or
- GitHub Pages publish approaches the `10 minute` timeout, or
- a single deploy would push the published site over GitHub Pages' `1 GB`
  guidance

`serp.co` already meets the artifact-size planning trigger, so the next
implementation phase should prepare object-storage/CDN deployment behind an
explicit, reviewed deploy strategy flag. It should not change the default
deploy path until a dry-run and rollback rehearsal pass.

## Migration Sequence

1. Pick the provider and checked-in deploy strategy name, for example
   `object-storage-cdn`.
2. Create storage bucket, CDN distribution, TLS certificate, access policy, and
   logging.
3. Add repository secrets for upload credentials and CDN invalidation. Do not
   add deploy target override environment variables.
4. Add a dry-run deploy command that prints bucket, prefix, CDN distribution,
   CNAME, cache policy, and release id without uploading.
5. Upload a non-production release under a versioned prefix and verify file
   count, logical bytes, sitemap audit, and representative page fetches.
6. Rehearse rollback by switching the release pointer or CDN origin path back
   to the previous version.
7. Lower DNS TTL before cutover.
8. Cut the domain from GitHub Pages to the CDN CNAME.
9. Monitor 200/404 rates, cache hit ratio, index/sitemap fetches, and CDN
   invalidation status.
10. Keep the old Pages target repo read-only until at least one successful
    rollback rehearsal after cutover.

## Required Secrets And Config

- storage upload identity with write access only to the site bucket/prefix
- CDN invalidation or release-pointer update permission
- optional read-only storage inventory/reporting credential for audits
- checked-in site deploy config for provider, bucket, prefix, CDN distribution,
  CNAME, and cache policy
- no `DEPLOY_REPO_URL` or `DEPLOY_BRANCH` override pattern

## Rollback And Incidents

Rollback must not require rebuilding from source during an incident. Keep
versioned releases and switch the CDN pointer back to the last known-good
release. If pointer-style hosting is not available, keep a manifest of the
previous release and implement a tested reverse sync.

Incident checks:

- CDN returns current `sitemap-index.xml`
- representative HTML references existing `_next/static/**` assets
- 404 page is present
- `CNAME`/DNS points at the intended CDN host
- rollback release remains retained and fetchable

## Artifact Retention And Cost

Retain at least the latest `10` successful releases and at least `30` days of
release artifacts, whichever keeps more rollback coverage. Apply lifecycle
expiration after that. Track storage, transfer, request, logging, and
invalidation cost by site id.

The first implementation should report artifact bytes, object count, uploaded
bytes, changed object count, invalidation count, and estimated monthly storage
for the retained release window.
