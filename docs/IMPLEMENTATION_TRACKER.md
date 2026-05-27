# Implementation Tracker

Historical note:

- The wrapper refactor and active-site migration work tracked here are complete.
- This file is preserved as a compact completion record, not as a live task queue.
- Current repo guidance now lives in [docs/PLAN.md](/Users/devin/dev/repos/json-directory-template/docs/PLAN.md).

## Completed outcomes

- `browserextensions.io`, `pornvideodownloaders.com`, `serp.ai`, `serp.co`, `serp.software`, and `serpdownloaders.com` are active checked-in sites in the runtime/build/deploy graph.
- Inactive sites are parked and excluded from active resolution paths.
- Thin wrapper apps are in place.
- `apps/web` was removed.
- `apps/starter` is the neutral starter wrapper.
- `apps/browserextensions.io`, `apps/pornvideodownloaders.com`, `apps/serp.ai`, `apps/serp.co`, `apps/serp.software`, and `apps/serpdownloaders.com` are active-site wrappers.
- Shared route/runtime logic lives in `packages/web-core`.
- Site contract logic lives in `packages/site-contract`.
- Build/deploy tooling now targets wrapper apps instead of the old shared app.
- The starter submit flow now uses a static-friendly GitHub issue handoff with PR-reviewed
  checked-in source updates.

## Verified pipeline

- `pnpm validate:site -- --site serpdownloaders.com`
- `pnpm build:site -- --site serpdownloaders.com`
- `pnpm deploy:site -- --site serpdownloaders.com --dry-run`
- `pnpm validate:site -- --site pornvideodownloaders.com`
- `pnpm build:site -- --site pornvideodownloaders.com`
- `pnpm deploy:site -- --site pornvideodownloaders.com --dry-run`
- `pnpm validate:site -- --site serp.software`
- `pnpm build:site -- --site serp.software`
- `pnpm deploy:site -- --site serp.software --dry-run`
- `pnpm validate:site -- --site serp.co`
- `pnpm build:site -- --site serp.co`
- `pnpm deploy:site -- --site serp.co --dry-run`

## Historical execution plans

- [docs/superpowers/plans/2026-04-18-wrapper-app-migration.md](/Users/devin/dev/repos/json-directory-template/docs/superpowers/plans/2026-04-18-wrapper-app-migration.md)
- [docs/superpowers/plans/2026-04-18-thin-wrapper-completion.md](/Users/devin/dev/repos/json-directory-template/docs/superpowers/plans/2026-04-18-thin-wrapper-completion.md)
- [docs/superpowers/plans/2026-04-18-apps-web-normalization.md](/Users/devin/dev/repos/json-directory-template/docs/superpowers/plans/2026-04-18-apps-web-normalization.md)

## Notes

- If a future task needs a new execution queue, create a new dated plan under `docs/superpowers/plans/` instead of reopening this file as a mutable backlog.
- If the repo architecture changes materially again, update [docs/PLAN.md](/Users/devin/dev/repos/json-directory-template/docs/PLAN.md) first.
