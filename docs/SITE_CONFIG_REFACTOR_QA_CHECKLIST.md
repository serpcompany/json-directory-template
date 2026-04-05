# MVP Closeout QA Checklist

Use this checklist after the wash pass and before calling the JSON-first MVP closeout complete.

## 1. Wash alignment

- [x] active planning docs point at the current closeout sequence:
  audit -> wash execution -> MVP verification -> `serpdownloaders.com` live proof site ->
  docs/default-site closeout follow-up -> taxonomy follow-up
- [x] default starter public surfaces now use neutral sample listings and keep placeholder social/submit targets hidden or gated until configured
- [ ] root metadata/config files no longer leak stale repo or old-brand assumptions
- [x] active tests/workflows no longer enforce stale route or stale issue-target assumptions unless they are still intentional
- [x] any intentionally deferred residue is captured in the audit/tracker instead of left implicit

## 2. Checked-in site config

- [x] `sites/site-config.default.ts` is the starter default source of truth
- [x] each active site has its own checked-in config under `sites/<site-id>/site-config.ts`
- [x] site config files under `sites/<site-id>/` stay sparse override-only instead of full copied configs
- [x] canonical site-owned assets live under `sites/<site-id>/assets/*`
- [x] temporary intake files are not being treated as source of truth

## 3. Build and validation flow

- [x] `pnpm validate:site -- --site default` succeeds
- [x] `pnpm build:site -- --site default` succeeds
- [x] `pnpm validate:site -- --site serpdownloaders.com` succeeds
- [x] `pnpm build:site -- --site serpdownloaders.com` succeeds
- [x] `pnpm validate:site -- --site serp.software` succeeds
- [x] `pnpm build:site -- --site serp.software` succeeds
- [x] build output lands in `dist/sites/<site-id>`
- [x] build still stages configured assets correctly
- [x] route base path still resolves from checked-in site config

## 4. Public artifact review

- [x] generated artifact does not include sourcemaps
- [x] generated artifact does not include `__next*.txt` export debug files
- [x] generated artifact includes both `sitemap.xml` and `sitemap-index.xml`
- [x] generated artifact includes the expected split sitemap family files for the site
- [x] generated artifact does not include disabled starter routes like:
  `account`, `login`, `favorites`, `projects`, `docs`, `guides`
- [x] listing detail pages are emitted under the expected public base path
- [x] search index is generated and present in the artifact
- [x] `robots.txt` points at the expected sitemap entrypoint for the environment under test

## 5. Search and taxonomy

- [x] submit form category options match the canonical taxonomy
- [ ] search autocomplete uses the generated search-index URLs
- [x] search results still load and filter correctly
- [x] category labels display as expected in search/category UI
- [ ] any taxonomy alias normalization still behaves as expected

## 6. Deploy behavior

- [x] deploy still resolves the checked-in site config from `site_id`
- [x] deploy still syncs only the built static artifact to the target repo
- [x] target repo preserve rules still keep required files such as `CNAME` and Pages workflow files
- [x] no new build-system source files are leaking into the target repo

## 7. Docs and runbooks

- [x] pipeline docs describe the current checked-in site-config model
- [x] the tracker and audit docs reflect the current source-of-truth model
- [x] any stale references to removed scripts, old config paths, or legacy source paths are cleaned up or clearly marked reference-only

## 8. Browser closeout sweep

- [x] run the sweep in [browser-closeout-sweep.md](/Users/devin/dev/repos/json-directory-template/docs/knowledge/browser-closeout-sweep.md) with `agent-browser`
- [x] verify the default site only exposes the feature-flag-enabled public routes
- [x] verify disabled default routes such as auth, favorites, docs, guides/posts, and network/projects do not stay publicly available
- [x] verify GTM is absent for sites without checked-in `analytics.gtmId`
- [x] verify GTM bootstrap + noscript render for `serpdownloaders.com` in production output
- [x] capture browser-found copy, branding, redirect, form, and layout issues before calling closeout done

- [x] homepage loads for `default`
- [x] homepage loads for `serpdownloaders.com`
- [x] homepage loads for `serp.software`
- [x] at least one listing detail page loads for each verified site
- [x] search page loads and returns results
- [x] submit page loads and shows the expected category choices
- [x] branding assets shown in the built site match the checked-in site assets

## 9. If anything fails

- [x] capture the exact failing command or page path
- [x] note whether it is wash, config, build, artifact, deploy, or UI behavior
- [x] update [docs/IMPLEMENTATION_TRACKER.md](/Users/devin/dev/repos/json-directory-template/docs/IMPLEMENTATION_TRACKER.md) before continuing
- [x] create or update a GitHub issue if the failure should survive beyond the current pass

## Verification notes

- 2026-04-04: `pnpm --filter web exec jest --runInBand lib/__tests__/site-config.test.ts lib/__tests__/site-content.test.ts`
  passed.
- 2026-04-04: `pnpm exec vitest run scripts/site-config.test.ts scripts/sitemap-files.test.ts`
  passed.
- 2026-04-04: `pnpm validate:site -- --site default`, `serpdownloaders.com`, and
  `serp.software` all passed for the active closeout set.
- 2026-04-04: `pnpm build:site -- --site default`, `serpdownloaders.com`, and
  `serp.software` all passed for the active closeout set.
- 2026-04-04: `agent-browser` verified `serp.software` homepage, listing detail, search,
  submit, privacy, and disabled-route behavior. Disabled `/docs` and `/network` metadata were
  also regression-fixed after the first browser pass surfaced title leakage.
- 2026-04-04: Built artifact review for `dist/sites/serp.software` confirmed `sitemap.xml`,
  `sitemap-index.xml`, split sitemap files, `robots.txt`, `search/search-index.json`, and
  listing pages under `/software/<slug>`.
- 2026-04-04: `pnpm --filter web exec jest --runInBand lib/__tests__/site-config.test.ts lib/__tests__/google-tag-manager.test.ts`
  passed after moving GTM ownership into checked-in site config.
- 2026-04-04: `pnpm exec vitest run scripts/site-config.test.ts` passed with `analytics.gtmId`
  validation coverage.
- 2026-04-04: `pnpm build:site -- --site serpdownloaders.com`, `default`, and `serp.software`
  all passed. `dist/sites/serpdownloaders.com/index.html` contains `GTM-M82HC3SC`,
  `googletagmanager.com`, and `ns.html?id=GTM-M82HC3SC`; `dist/sites/default/index.html` and
  `dist/sites/serp.software/index.html` do not.
- 2026-04-04: Replaced stale `serpdownloaders.com` brand assets in
  `sites/serpdownloaders.com/assets/favicon.ico`, `logo.png`, and `opengraph-image.png`. Then ran
  `pnpm validate:site -- --site serpdownloaders.com`, `pnpm build:site -- --site serpdownloaders.com`,
  served `dist/sites/serpdownloaders.com` on `http://127.0.0.1:4322`, and verified:
  homepage title still renders `SERP Downloaders Directory of Products and Resources`;
  `favicon.ico`, `logo.png`, `apple-touch-icon.png`, and `opengraph-image.png` all serve the new
  SERP Downloaders asset set from the built artifact; the built favicon hash no longer matches the
  old starter/default favicon.
- 2026-04-04: Deployed the refreshed `serpdownloaders.com` asset set to
  `serpcompany/serpdownloaders.com` at commit `a4cf150`. The target repo root files now match the
  new local hashes. Live unversioned root asset URLs are still serving the prior cached files, but
  `https://serpdownloaders.com/favicon.ico?v=20260404`,
  `https://serpdownloaders.com/apple-touch-icon.png?v=20260404`, and
  `https://serpdownloaders.com/opengraph-image.png?v=20260404` all return the refreshed assets.
  That confirms a live CDN cache lag on the old root URLs, not a bad build or deploy.
- 2026-04-04: Local browser verification against the existing dev server at
  `http://localhost:3005` confirmed `SERP Downloaders` renders on `/` and
  `/products/123movies-downloader`, and direct HTML checks for both routes confirmed GTM is not
  rendered in dev output.
- 2026-04-04: Served the built `dist/sites/serpdownloaders.com` artifact on
  `http://127.0.0.1:4321` and verified `SERP Downloaders` renders on `/` and
  `/products/123movies-downloader/`. Direct HTML checks against that served build confirmed
  `GTM-M82HC3SC`, `googletagmanager.com`, and `ns.html?id=GTM-M82HC3SC` are present in
  production output.
- 2026-04-04: Pre-deploy live `serpdownloaders.com` browser pass confirmed the current production
  site was still on the older contract. `https://serpdownloaders.com/` renders
  `SERP Downloaders Directory of Websites, Tools, and Resources`, not the repo's current
  `Products and Resources` title. `https://serpdownloaders.com/products/123movies-downloader`
  currently resolves to `Page Not Found | SERP Downloaders`, while the local artifact serves
  `/products/123movies-downloader/` successfully.
- 2026-04-04: Pre-deploy live `https://serpdownloaders.com/robots.txt` still served the old
  content-signals file, and live `https://serpdownloaders.com/search/` still rendered
  `Search | Directory Starter`. These drift notes were later superseded by the same-day deploy
  checks and the April 5 public-domain recheck below.
- 2026-04-04: Additional pre-deploy live checks confirmed `https://serpdownloaders.com/submit/` and
  `https://serpdownloaders.com/legal/privacy/` both return HTTP 200. Live `sitemap.xml` also
  returns HTTP 200, but it is still the old flat `<urlset>` sitemap rather than the repo's current
  sitemap-index style artifact. Live search is inconsistent across user-facing checks:
  direct HTML reads show `Search | SERP Downloaders`, while `agent-browser` still reports
  `Search | Directory Starter`, which is enough to treat live search branding as not yet aligned.
- 2026-04-04: `pnpm deploy:site -- --site serpdownloaders.com` completed successfully and pushed
  commit `4bca6bc` to `serpcompany/serpdownloaders.com`. Post-deploy checks now show the live
  homepage title is `SERP Downloaders Directory of Products and Resources`, the live product page
  `/products/123movies-downloader/` loads, live `/search/` resolves to `Search | SERP Downloaders`,
  live `/submit/` resolves to `Submit a Product | SERP Downloaders`, and live `sitemap.xml` now
  serves the sitemap-index contract.
- 2026-04-04: The deployed target repo contains the expected `robots.txt` (`User-Agent: *` with
  `Sitemap: https://serpdownloaders.com/sitemap-index.xml` after the canonical-entrypoint update),
  but the live domain is still serving the old
  content-signals `robots.txt`. Treat this as a post-deploy propagation/cache mismatch and recheck
  before filing a permanent follow-up issue. This mismatch was resolved on the public domain by the
  April 5 recheck below.
- 2026-04-04: Direct app/runtime environments should continue to advertise `sitemap.xml` from
  `robots.txt`; only the finalized static artifact should advertise `sitemap-index.xml`.
- 2026-04-04: A second deploy pushed commit `6f3ef58` to `serpcompany/serpdownloaders.com` with
  the canonical sitemap update. Post-deploy checks confirm live `sitemap-index.xml` and
  compatibility `sitemap.xml` both return sitemap-index XML, the homepage/product/search routes are
  still aligned, and the target repo `robots.txt` now references
  `https://serpdownloaders.com/sitemap-index.xml`. Live `robots.txt` is still serving the older
  content-signals file with a cached `last-modified` of `2026-04-04 04:28:39 GMT`; that
  edge-cache lag was resolved on the public domain by the April 5 recheck below.
- 2026-04-05: Rechecked the live domain directly. `https://serpdownloaders.com/` still serves the
  current `Products and Resources` title, `https://serpdownloaders.com/products/123movies-downloader/`
  still resolves, and `https://serpdownloaders.com/robots.txt` now serves the expected
  sitemap-index-aware file on the public domain.
- 2026-04-05: Rechecked the live unversioned root assets. The SHA-256 for
  `https://serpdownloaders.com/favicon.ico` now matches the query-busted
  `?v=20260404` variant, and the SHA-256 for `https://serpdownloaders.com/opengraph-image.png`
  now matches the query-busted `?v=20260404` variant as well. The earlier cache-lag note is no
  longer the current blocker.
- 2026-04-05: `pnpm test:repo` passed after replacing the old frontmatter/fast-lane policy tests
  with `scripts/pr-review-workflow.test.ts`, `scripts/labels-workflow.test.ts`, and the existing
  `scripts/update-listings-json-workflow.test.ts`.
- 2026-04-05: `pnpm --filter web exec jest --runInBand lib/__tests__/content-loader.test.ts
  lib/__tests__/github-issue.test.ts lib/__tests__/site-config.test.ts` passed. The new
  `content-loader` coverage confirms active listing resolution stays on JSON-backed listing data
  and does not fall back to the legacy website MDX collection.
- 2026-04-05: Active workflow/docs cleanup under `#47` now matches the JSON-first maintainer
  model: `PR Review` validates `default`, `serpdownloaders.com`, and `serp.software`; active label
  rules only target `data/listings.json` and `sites/**/products.json`; the old MDX-intake scripts
  and workflows now live under `_archive/legacy-mdx-authoring/**` as reference-only material.
- 2026-04-05: Local default-site browser verification was attempted for `#47`, but the run was
  blocked before route checks completed. `agent-browser` required a one-time Chrome install, then
  `next dev` panicked under Turbopack with `No space left on device (os error 28)` while serving
  `http://127.0.0.1:3005`.
- 2026-04-05: After freeing disk space, reran a targeted default-site browser pass on an isolated
  webpack dev server at `http://127.0.0.1:3317`. `agent-browser` still stalled in this shell, so
  the actual browser verification was completed with Playwright against that isolated port.
- 2026-04-05: The rerun confirmed `http://127.0.0.1:3317/` loads, the default-site public listing
  detail route `http://127.0.0.1:3317/listing/123movies-downloader` loads, `/websites` redirects
  to `/listing`, and the submit flow redirects to
  `https://github.com/serpcompany/json-directory-template/issues/new`.
- 2026-04-05: The isolated rerun surfaced two stale active assumptions and both were fixed in the
  repo: `apps/e2e/tests/smoke.spec.ts` was still expecting `/websites -> /`, and
  `sites/site-config.default.ts` still pointed the default submit flow at `serpapps/support`.
- 2026-04-05: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3317 PLAYWRIGHT_PORT=3317 pnpm --filter e2e exec playwright test tests/smoke.spec.ts --project=chromium --grep 'core public MVP routes load successfully|listing detail pages load under the public listing route|submit flow redirects to the configured prefilled GitHub issue|legacy aliases still redirect to the supported public surface'`
  passed after the route/test/config fixes above.
- 2026-04-05: `pnpm build:site -- --site default` passed after adding `.DS_Store` pruning to the
  artifact-finalize step. A follow-up `find dist/sites/default -maxdepth 3 \( -name '*.map' -o
  -name '__next*.txt' -o -name '.DS_Store' \) | sort` returned no results, and the default artifact
  no longer ships disabled starter routes such as `account`, `login`, `favorites`, `projects`,
  `docs`, or `guides`.
- 2026-04-05: `pnpm exec vitest run scripts/build-artifact-pruning.test.ts
  scripts/build-workflow.test.ts scripts/deploy-site.test.ts scripts/resolve-build-run.test.ts
  scripts/search-index-generator.test.ts scripts/site-config.test.ts` passed. This covers the
  `.DS_Store` pruning fix, deploy path resolution from `site_id`, preserve rules, and generated
  search-index behavior.
- 2026-04-05: `pnpm --filter web exec jest --runInBand components/forms/__tests__/github-issue-submit-form.test.tsx
  lib/__tests__/category-display.test.ts lib/__tests__/categories.test.ts
  components/search/__tests__/search-utils.test.ts` passed during the `#48` verification pass,
  confirming the submit-form taxonomy choices, category-display labels, and current search helper
  behavior.
- 2026-04-05: `pnpm deploy:site -- --site serpdownloaders.com --dry-run` still resolves
  `site_id=serpdownloaders.com`, plans an artifact-only sync from `dist/sites/serpdownloaders.com`,
  and preserves `.github/workflows/deploy.yml` plus `CNAME` in the target repo.
- 2026-04-05: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3317 PLAYWRIGHT_PORT=3317 pnpm --filter e2e exec playwright test tests/smoke.spec.ts tests/pages.spec.ts tests/interactions.spec.ts --project=chromium`
  passed after tightening stale homepage, directory-search, and mobile-drawer locators to the
  real default-site UI.
- 2026-04-05: Cleaned the last active docs residue in
  [docs/SITE_CONFIG_INVENTORY.md](/Users/devin/dev/repos/json-directory-template/docs/SITE_CONFIG_INVENTORY.md)
  and
  [docs/knowledge/reference-surfaces.md](/Users/devin/dev/repos/json-directory-template/docs/knowledge/reference-surfaces.md).
  The only remaining open checklist items are the taxonomy/discovery items already queued under
  `#42` plus internal-only root metadata residue tracked under the `#43` umbrella; `#48` did not
  need a new follow-up issue.
- 2026-04-05: The final template-cleanliness audit under `#50` replaced the default starter corpus
  with neutral sample listings, kept neutral social/submit placeholders in config while hiding or
  gating them in the public starter UI, rewrote the cookie-policy content to match the current
  runtime, and made listing-logo fallback site-aware: `/placeholder.svg` on the default starter and
  `/logo.png` for checked-in proof sites.
- 2026-04-05: `pnpm validate:listings data/listings.json`, `pnpm test:repo`, `pnpm --filter web
  exec jest --runInBand lib/__tests__/content-loader.test.ts lib/__tests__/github-issue.test.ts
  lib/__tests__/listing-logo-presentation.test.ts lib/__tests__/site-config.test.ts`, `pnpm
  build:site -- --site default`, `pnpm generate-search-index`, and `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4317
  pnpm --filter e2e exec playwright test tests/smoke.spec.ts tests/pages.spec.ts
  tests/interactions.spec.ts --project=chromium` all passed for the local `#50` bundle.
- 2026-04-05: `agent-browser` confirmed the built default homepage and built `404.html` on
  `http://127.0.0.1:4317/`. The homepage now shows `Example API Toolkit`, `Northwind Analytics`,
  and `Harbor Cloud`, hides the placeholder GitHub chrome on the default starter, leaves the submit
  CTA disabled until the issue target is configured, and keeps the starter 404 page on-site instead
  of pushing users to the template repo issue flow.
- 2026-04-05: The remaining legacy public compatibility work now lives in follow-up issue `#52`.
  `/websites` is no longer treated as part of the active starter verification contract in the smoke
  suite or browser closeout sweep.
