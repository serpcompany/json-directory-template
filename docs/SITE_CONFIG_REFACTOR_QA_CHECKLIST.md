# Site Config Refactor QA Checklist

Use this checklist before merging or building on top of the checked-in site-config refactor batch.

## 1. Checked-in site config

- [ ] `sites/site-config.default.ts` is the starter default source of truth
- [ ] each active site has its own checked-in config under `sites/<site-id>/site-config.ts`
- [ ] canonical site-owned assets live under `sites/<site-id>/assets/*`
- [ ] temporary intake files are not being treated as source of truth

## 2. Build and validation flow

- [ ] `pnpm validate:site -- --site <site-id>` succeeds for the active site
- [ ] `pnpm build:site -- --site <site-id>` succeeds for the active site
- [ ] build output lands in `dist/sites/<site-id>`
- [ ] build still stages configured assets correctly
- [ ] route base path still resolves from checked-in site config

## 3. Public artifact review

- [ ] generated artifact does not include sourcemaps
- [ ] generated artifact does not include `__next*.txt` export debug files
- [ ] generated artifact does not include disabled starter routes like:
  `account`, `login`, `favorites`, `projects`, `docs`, `guides`
- [ ] listing detail pages are emitted under the expected public base path
- [ ] search index is generated and present in the artifact

## 4. Search and taxonomy

- [ ] submit form category options match the canonical taxonomy
- [ ] search autocomplete uses the generated search-index URLs
- [ ] search results still load and filter correctly
- [ ] category labels display as expected in search/category UI
- [ ] any taxonomy alias normalization still behaves as expected

## 5. Deploy behavior

- [ ] deploy still resolves the checked-in site config from `site_id`
- [ ] deploy still syncs only the built static artifact to the target repo
- [ ] target repo preserve rules still keep required files such as `CNAME` and Pages workflow files
- [ ] no new build-system source files are leaking into the target repo

## 6. Docs and runbooks

- [ ] pipeline docs describe checked-in site config, not the old `BuildSpec` model
- [ ] tracker and inventory docs reflect the current source-of-truth model
- [ ] any stale references to removed scripts or old config paths are cleaned up

## 7. Manual spot-checks

- [ ] homepage loads for the active site build
- [ ] at least one listing detail page loads
- [ ] search page loads and returns results
- [ ] submit page loads and shows the expected category choices
- [ ] branding assets shown in the built site match the checked-in site assets

## 8. If anything fails

- [ ] capture the exact failing command or page path
- [ ] note whether it is config, build, artifact, deploy, or UI behavior
- [ ] update [docs/IMPLEMENTATION_TRACKER.md](/Users/devin/dev/repos/json-directory-template/docs/IMPLEMENTATION_TRACKER.md) before continuing with more changes
