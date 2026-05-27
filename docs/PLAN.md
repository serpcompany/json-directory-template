# Current Repo Plan

This file is the current, human-readable repo status summary.

It is not an execution log and it is not a migration-era task list.

For historical implementation plans, see:

- [`docs/superpowers/plans/`](./superpowers/plans/)

For completed execution history, see:

- [docs/IMPLEMENTATION_TRACKER.md](/Users/devin/dev/repos/json-directory-template/docs/IMPLEMENTATION_TRACKER.md)

## Current state

- The wrapper refactor is complete.
- `apps/web` no longer exists.
- `apps/starter` is the neutral starter wrapper.
- `apps/browserextensions.io`, `apps/pornvideodownloaders.com`, `apps/serp.ai`,
  `apps/serp.co`, `apps/serp.software`, and `apps/serpdownloaders.com` are
  active checked-in site wrappers.
- Shared runtime and route logic lives in `packages/web-core`.
- Checked-in site contract and site resolution live in `packages/site-contract`.
- The starter submit flow now uses a static-friendly GitHub issue handoff with PR-reviewed
  checked-in source updates.

## Current priorities

1. Keep the active-site pipeline stable:
   - `pnpm validate:site -- --site serpdownloaders.com`
   - `pnpm build:site -- --site serpdownloaders.com`
   - `pnpm deploy:site -- --site serpdownloaders.com --dry-run`
   - `pnpm validate:site -- --site pornvideodownloaders.com`
   - `pnpm build:site -- --site pornvideodownloaders.com`
   - `pnpm deploy:site -- --site pornvideodownloaders.com --dry-run`
   - `pnpm validate:site -- --site serp.co`
   - `pnpm build:site -- --site serp.co`
   - `pnpm deploy:site -- --site serp.co --dry-run`
2. Keep `apps/starter` thin and generic.
3. Add or promote new sites only through the checked-in site contract and promotion checklist.
4. Use `pnpm generate:site-wrapper -- --site <site-id>` as the standard starting point for new wrapper apps.
5. Treat old migration docs as historical context, not live implementation guidance.

## Current ownership model

- `apps/<site>`
  Thin wrapper apps only.
  They own Next entrypoints, app-local wiring, and app-specific runtime hooks.
- `packages/web-core`
  Shared route modules, rendering logic, runtime helpers, and reusable UI.
- `packages/site-contract`
  Checked-in site config resolution, source-path ownership, validation helpers, and related contract logic.
- `sites/<site>`
  Site-owned config, content, and assets.
- `dist/sites/<site>`
  Build artifacts only.

## When to use which doc

- Read [README.md](/Users/devin/dev/repos/json-directory-template/README.md) for setup and daily commands.
- Read [docs/ONBOARDING.md](/Users/devin/dev/repos/json-directory-template/docs/ONBOARDING.md) for the current site-scaffolding flow.
- Read [docs/BUILD_PIPELINE.md](/Users/devin/dev/repos/json-directory-template/docs/BUILD_PIPELINE.md) for validate/build/deploy behavior.
- Read [docs/knowledge/site-config.md](/Users/devin/dev/repos/json-directory-template/docs/knowledge/site-config.md) for site ownership and config boundaries.
- Read [docs/SITE_PROMOTION_CHECKLIST.md](/Users/devin/dev/repos/json-directory-template/docs/SITE_PROMOTION_CHECKLIST.md) before adding a new active site.
