# Large-Site Scale Strategy

This doc defines when the current static starter still fits and when it should move off the GitHub Pages plus repo-sync path.

## Current measured baseline

Measured from the current default build on this branch:

- `78` listings in `data/listings.json`
- `12 MB` final static artifact in `dist/sites/default`
- `8.2 MB` of that artifact is the `listing/**` HTML tree
- `2.1 MB` is `_next/**`
- `160 KB` is the client search index at `search/search-index.json`
- `352 KB` is the `categories/**` tree
- average listing-detail HTML is about `106.9 KB` per page
- average search-index payload is about `1.4 KB` per listing

These are repo-specific measurements, not universal constants. They are still useful because they show which parts of this starter are currently growing linearly with listing count.

## Hard platform limits that matter here

Current GitHub limits relevant to this starter:

- GitHub Pages source repositories have a recommended limit of `1 GB`
- published GitHub Pages sites may be no larger than `1 GB`
- GitHub Pages deployments time out after `10 minutes`
- GitHub Pages has a soft bandwidth limit of `100 GB/month`
- the `10 builds/hour` GitHub Pages limit does not apply when publishing from a custom GitHub Actions workflow
- GitHub recommends repositories stay under `1 GB`, with under `5 GB` strongly recommended, even outside Pages
- GitHub warns on files larger than `50 MiB` and blocks files larger than `100 MiB`
- GitHub-hosted Actions jobs can run for up to `6 hours`
- sitemap files and sitemap indexes can each hold up to `50,000` URLs and `50 MB`

## What bends first in this starter

### 1. Repo-sync deployment history

The current deploy model commits built artifacts into a target repo. That means the target repo grows with every deploy, not just with the latest snapshot.

This is usually the first large-site pain:

- clone/fetch times get worse
- Pages target repos become harder to work with
- history keeps all previous large artifacts unless the deploy strategy changes

If the site is growing quickly, Git repo history becomes a worse fit before the static HTML itself is the only problem.

### 2. Listing-detail HTML weight

Right now the detail pages are the biggest part of the shipped artifact.

At the current measured average of about `106.9 KB` per listing-detail page:

- `1,000` listings is roughly `107 MB` of detail HTML
- `5,000` listings is roughly `534 MB` of detail HTML
- `10,000` listings is roughly `1.0 GB` of detail HTML before counting `_next`, search, categories, feeds, and other pages

That means the current Pages ceiling is uncomfortable well before truly massive directory sizes.

### 3. Client-side search index size

The current search index is a single shipped JSON file downloaded by the client.

At the current measured average of about `1.4 KB` per listing:

- `1,000` listings is about `1.4 MB`
- `5,000` listings is about `7.2 MB`
- `10,000` listings is about `14.3 MB`

That is still technically shippable, but it becomes a real UX problem before it becomes a GitHub hard limit.

### 4. Build and deploy time

The build is fast at current scale, but static export, artifact copy, and deployment all grow with file count and total artifact size.

The relevant operational limits are:

- Pages deployment timeout: `10 minutes`
- GitHub-hosted Actions job limit: `6 hours`

In practice, the `10 minute` Pages deployment window is the more realistic ceiling for this starter before the `6 hour` Actions job limit matters.

### 5. Checked-in media

Brand asset staging is not the current bottleneck because the pipeline only stages a handful of site-level assets:

- `favicon.ico`
- `logo.png`
- `opengraph-image.png`

If the product later starts checking in many large per-listing images or binaries, Git becomes the wrong storage layer quickly because of:

- the `50 MiB` warning threshold
- the `100 MiB` hard block
- overall repo health and history growth

### 6. Sitemap volume

Sitemaps are not the first system that breaks here.

The starter already emits split sitemap-index style files, and the protocol allows:

- up to `50,000` URLs per sitemap file
- up to `50,000` sitemap entries per sitemap index

That means search index size, artifact size, and deployment shape will hurt before sitemap limits do.

## Recommended thresholds

### Safe zone

The current GitHub Pages plus repo-sync path is still a good fit when:

- listings are in the low thousands or less
- the final artifact is comfortably below `250 MB`
- the search index stays comfortably below `5 MB`
- deploys stay well under the `10 minute` Pages timeout
- checked-in assets remain small and site-level only

### Watch zone

Start migration planning when any of these happen:

- artifact size approaches `250 MB` to `500 MB`
- search index approaches `5 MB` to `10 MB`
- listing count moves into the mid-thousands
- deploys are getting slow enough that Pages timeout risk is plausible
- target repo history is becoming operationally annoying

### Exit zone

Treat the current model as the wrong long-term fit when:

- artifact size is approaching the `1 GB` Pages ceiling
- listing count is approaching `5,000+` at the current page weight
- the search index is large enough that client-side download cost is obviously hurting UX
- target repo history is bloating from repeated artifact commits
- deployments are flirting with the `10 minute` Pages limit

## Recommended next architecture

When the current model stops fitting, the next move should be:

1. Keep this repo as the build authority.
2. Stop using Git repo sync as the publish mechanism.
3. Publish built artifacts to object storage plus CDN-backed static hosting.
4. Split or externalize search instead of shipping one monolithic client JSON file.
5. Keep large media out of Git.

Why this is the right next step:

- it removes Git history bloat from the publish path
- it removes the `1 GB` GitHub Pages site ceiling
- it keeps the starter static-first instead of forcing a runtime rewrite
- it lets search and media scale independently from page generation

## Practical migration order

If a site is starting to outgrow the current path, make changes in this order:

1. Change deploy target first.
   Move from repo-sync Pages publishing to object-storage-backed static hosting.

2. Split search second.
   Move from one global shipped search JSON file to sharded search data or a hosted search service.

3. Keep media outside Git.
   Use object storage for large or numerous images instead of checking them into the repo.

4. Revisit build strategy last.
   Only move to incremental builds, partial regeneration, or a more dynamic runtime if static generation itself becomes the bottleneck.

## Important nuance

If repo history is the only pain, a different GitHub-based deploy shape may buy some short-term breathing room. But it does not remove the core `1 GB` Pages site limit, so it is not the real large-site answer.
