# MVP Closeout QA Checklist

Use this checklist after the wash pass and before calling the JSON-first MVP closeout complete.

## 1. Wash alignment

- [x] active planning docs point at the current closeout sequence:
  audit -> wash execution -> MVP verification -> `serp.software` proof site -> taxonomy follow-up
- [ ] root metadata/config files no longer leak stale repo or old-brand assumptions
- [ ] active tests/workflows no longer enforce stale route or stale issue-target assumptions unless they are still intentional
- [ ] any intentionally deferred residue is captured in the audit/tracker instead of left implicit

## 2. Checked-in site config

- [ ] `sites/site-config.default.ts` is the starter default source of truth
- [x] each active site has its own checked-in config under `sites/<site-id>/site-config.ts`
- [x] site config files under `sites/<site-id>/` stay sparse override-only instead of full copied configs
- [ ] canonical site-owned assets live under `sites/<site-id>/assets/*`
- [ ] temporary intake files are not being treated as source of truth

## 3. Build and validation flow

- [x] `pnpm validate:site -- --site default` succeeds
- [x] `pnpm build:site -- --site default` succeeds
- [x] `pnpm validate:site -- --site serpdownloaders.com` succeeds
- [x] `pnpm build:site -- --site serpdownloaders.com` succeeds
- [x] `pnpm validate:site -- --site serp.software` succeeds
- [x] `pnpm build:site -- --site serp.software` succeeds
- [x] build output lands in `dist/sites/<site-id>`
- [ ] build still stages configured assets correctly
- [x] route base path still resolves from checked-in site config

## 4. Public artifact review

- [ ] generated artifact does not include sourcemaps
- [ ] generated artifact does not include `__next*.txt` export debug files
- [x] generated artifact includes both `sitemap.xml` and `sitemap-index.xml`
- [x] generated artifact includes the expected split sitemap family files for the site
- [ ] generated artifact does not include disabled starter routes like:
  `account`, `login`, `favorites`, `projects`, `docs`, `guides`
- [x] listing detail pages are emitted under the expected public base path
- [x] search index is generated and present in the artifact
- [x] `robots.txt` points at the expected public sitemap entrypoint

## 5. Search and taxonomy

- [ ] submit form category options match the canonical taxonomy
- [ ] search autocomplete uses the generated search-index URLs
- [ ] search results still load and filter correctly
- [ ] category labels display as expected in search/category UI
- [ ] any taxonomy alias normalization still behaves as expected

## 6. Deploy behavior

- [ ] deploy still resolves the checked-in site config from `site_id`
- [ ] deploy still syncs only the built static artifact to the target repo
- [ ] target repo preserve rules still keep required files such as `CNAME` and Pages workflow files
- [ ] no new build-system source files are leaking into the target repo

## 7. Docs and runbooks

- [ ] pipeline docs describe the current checked-in site-config model
- [ ] the tracker and audit docs reflect the current source-of-truth model
- [ ] any stale references to removed scripts, old config paths, or legacy source paths are cleaned up or clearly marked reference-only

## 8. Browser closeout sweep

- [x] run the sweep in [browser-closeout-sweep.md](/Users/devin/dev/repos/json-directory-template/docs/knowledge/browser-closeout-sweep.md) with `agent-browser`
- [x] verify the default site only exposes the feature-flag-enabled public routes
- [x] verify disabled default routes such as auth, favorites, docs, guides/posts, and network/projects do not stay publicly available
- [x] verify GTM is absent for sites without checked-in `analytics.gtmId`
- [x] verify GTM bootstrap + noscript render for `serpdownloaders.com` in production output
- [ ] capture browser-found copy, branding, redirect, form, and layout issues before calling closeout done

- [ ] homepage loads for `default`
- [x] homepage loads for `serpdownloaders.com`
- [x] homepage loads for `serp.software`
- [ ] at least one listing detail page loads for each verified site
- [ ] search page loads and returns results
- [ ] submit page loads and shows the expected category choices
- [ ] branding assets shown in the built site match the checked-in site assets

## 9. If anything fails

- [ ] capture the exact failing command or page path
- [ ] note whether it is wash, config, build, artifact, deploy, or UI behavior
- [ ] update [docs/IMPLEMENTATION_TRACKER.md](/Users/devin/dev/repos/json-directory-template/docs/IMPLEMENTATION_TRACKER.md) before continuing
- [ ] create or update a GitHub issue if the failure should survive beyond the current pass

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
- 2026-04-04: Local browser verification against the existing dev server at
  `http://localhost:3005` confirmed `SERP Downloaders` renders on `/` and
  `/products/123movies-downloader`, and direct HTML checks for both routes confirmed GTM is not
  rendered in dev output.
- 2026-04-04: Served the built `dist/sites/serpdownloaders.com` artifact on
  `http://127.0.0.1:4321` and verified `SERP Downloaders` renders on `/` and
  `/products/123movies-downloader/`. Direct HTML checks against that served build confirmed
  `GTM-M82HC3SC`, `googletagmanager.com`, and `ns.html?id=GTM-M82HC3SC` are present in
  production output.
- 2026-04-04: Live `serpdownloaders.com` browser pass confirmed the current production site is
  still on the older contract. `https://serpdownloaders.com/` renders
  `SERP Downloaders Directory of Websites, Tools, and Resources`, not the repo's current
  `Products and Resources` title. `https://serpdownloaders.com/products/123movies-downloader`
  currently resolves to `Page Not Found | SERP Downloaders`, while the local artifact serves
  `/products/123movies-downloader/` successfully.
- 2026-04-04: Live `https://serpdownloaders.com/robots.txt` still serves the old content-signals
  file, and live `https://serpdownloaders.com/search/` still renders `Search | Directory Starter`.
  This confirms the live site has not been aligned to the current repo contract yet.
- 2026-04-04: Additional live checks confirmed `https://serpdownloaders.com/submit/` and
  `https://serpdownloaders.com/legal/privacy/` both return HTTP 200. Live `sitemap.xml` also
  returns HTTP 200, but it is still the old flat `<urlset>` sitemap rather than the repo's current
  sitemap-index style artifact. Live search is inconsistent across user-facing checks:
  direct HTML reads show `Search | SERP Downloaders`, while `agent-browser` still reports
  `Search | Directory Starter`, which is enough to treat live search branding as not yet aligned.
