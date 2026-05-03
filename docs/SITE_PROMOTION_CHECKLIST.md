# Site Promotion Checklist

Use this checklist before promoting any new site into the active registry.

This repo now treats site promotion as an operational change, not just a code change. A site should
stay parked or incubating until every item below is complete.

## Promotion Gate

1. The site has an approved deploy target.
   - A real production destination exists.
   - The checked-in site config includes the final deploy repo/branch details.
2. The site has a checked-in contract.
   - `sites/<site>/site-config.ts` exists and validates.
   - Site-owned content/assets/config live under `sites/<site>`.
   - The site resolves cleanly through `packages/site-contract`.
3. The site has a wrapper app target.
   - Run `pnpm generate:site-wrapper -- --site <site-id>` unless the wrapper already exists.
   - `apps/<site>` exists as a thin wrapper app.
   - `apps/<site>/app/brands/page.tsx` exists and the resolved site config keeps `features.showBrands` enabled.
   - `sites/<site>/site-config.ts` sets `build.appPackageName` to `<site-id>`.
   - `sites/<site>/site-config.ts` sets `build.appOutDir` to `apps/<site-id>/out`.
   - Reusable logic stays in `packages/web-core` and `packages/site-contract`.
   - The wrapper app does not fork shared business logic from `apps/starter`.
   - If the site is being promoted into the active registry, update:
     - `packages/site-contract/src/index.ts`
     - `packages/site-contract/src/active-site-ids.ts`
4. Validation is green.
   - Run `pnpm validate:site -- --site <site-id>`.
   - Run active-site contract tests such as `pnpm exec vitest run scripts/validate-active-sites.test.ts scripts/site-config.test.ts`.
5. Build output is green.
   - Run `pnpm build:site -- --site <site-id>`.
   - Confirm the expected artifact families exist under `dist/sites/<site-id>`.
6. Deploy is green.
   - Run `pnpm deploy:site -- --site <site-id> --dry-run`.
   - Confirm the deploy plan points at the correct repo, branch, and artifact directory.
7. Docs and runbooks are updated.
   - Update `docs/BUILD_PIPELINE.md` if the site changes build behavior.
   - Update `docs/DEPLOY_RUNBOOK.md` if the site changes deploy behavior.
   - Update `docs/IMPLEMENTATION_TRACKER.md` and any relevant knowledge docs.
8. Tests covering active-site behavior are updated.
   - Add or update active-registry tests.
   - Add or update inactive-site rejection tests when promotion changes the registry boundary.

## Promotion Rule

Do not add a site to the active registry until every checklist item above is complete.

If any item is incomplete, keep the site parked or incubating outside the active runtime/build/deploy
graph.
