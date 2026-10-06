# Implementation Tracker

Historical note:

- The wrapper refactor and active-site migration work tracked here are complete.
- This file is preserved as a compact completion record, not as a live task queue.
- Current repo guidance now lives in [docs/PLAN.md](./PLAN.md).

## Completed outcomes

- Historical: the wrapper migration originally activated `browserextensions.io`,
  `pornvideodownloaders.com`, `serp.ai`, `serp.co`, `serp.software`, and
  `serpdownloaders.com`.
- Current: `pornvideodownloaders.com` and `serp.software` are superseded by
  D1/OpenNext applications and retired from this repository's active graph.
- Current: `serp.co` is retired from this repository as well; its directory is
  served from `https://best.serp.co` by the `serpcompany/best.serp.co` repo.
- Inactive sites are parked and excluded from active resolution paths.
- Thin wrapper apps are in place.
- `apps/web` was removed.
- `apps/starter` is the neutral starter wrapper.
- Current active wrappers are `apps/browserextensions.io`, `apps/serp.ai`, and
  `apps/serpdownloaders.com`.
- Shared route/runtime logic lives in `packages/web-core`.
- Site contract logic lives in `packages/site-contract`.
- Build/deploy tooling now targets wrapper apps instead of the old shared app.
- The starter submit flow now uses a static-friendly GitHub issue handoff with PR-reviewed
  checked-in source updates.

## Verified pipeline

- `pnpm validate:site -- --site serpdownloaders.com`
- `pnpm build:site -- --site serpdownloaders.com`
- `pnpm deploy:site -- --site serpdownloaders.com --dry-run`
- `pnpm validate:site -- --site serp.ai`
- `pnpm build:site -- --site serp.ai`
- `pnpm deploy:site -- --site serp.ai --dry-run`

## Historical execution plans

- [docs/superpowers/plans/2026-04-18-wrapper-app-migration.md](./superpowers/plans/2026-04-18-wrapper-app-migration.md)
- [docs/superpowers/plans/2026-04-18-thin-wrapper-completion.md](./superpowers/plans/2026-04-18-thin-wrapper-completion.md)
- [docs/superpowers/plans/2026-04-18-apps-web-normalization.md](./superpowers/plans/2026-04-18-apps-web-normalization.md)

## Notes

- If a future task needs a new execution queue, create a new dated plan under `docs/superpowers/plans/` instead of reopening this file as a mutable backlog.
- If the repo architecture changes materially again, update [docs/PLAN.md](./PLAN.md) first.
