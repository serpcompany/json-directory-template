# GitHub Actions Notes

## Active content label

- `area:content`
  - use it for PRs that touch active listing-entry source files
  - current scope: `data/listings.json` and `sites/**/products.json`

## Active rule

- do not treat `data/listings.json` as generated output in the active starter flow
- do not keep the old MDX fast-lane labels active in current repo automation

## Archived reference

- the retired MDX PR-intake/automerge flow now lives under `_archive/legacy-mdx-authoring/**`

## Runners

- `.github/workflows/build-and-deploy.yml` (both jobs), `.github/workflows/submit-gsc-sitemaps.yml`
  and `.github/workflows/release.yml` run on GitHub-hosted `ubuntu-latest` for now because the
  self-hosted runners are offline (owner decision, #161). `.github/actions/install` sets up pnpm and
  the `.nvmrc` Node version itself.
- Release and Build & Deploy share the `main-ci-<ref>` concurrency group so they run one after the
  other. A run queued on an offline runner holds that group, so every workflow in it must be able
  to start; that is why `release.yml` moved too.
- `labels.yml`, `link-checker.yml`, and `update-listings-json.yml` still use `self-hosted` and will
  not run until those runners are back or they are switched too.

## Deploy triggers

- `scripts/deploy-trigger-paths.ts` is the single source of truth for which changed files deploy
  which sites. The build-and-deploy `paths:` filter must equal its `buildAndDeployWorkflowPushPaths`;
  `scripts/build-and-deploy-workflow.test.ts` enforces this. See `docs/BUILD_PIPELINE.md`.
