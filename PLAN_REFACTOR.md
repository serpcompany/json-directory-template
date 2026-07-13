# UI, CMS, and Data Refactor Plan

This plan coordinates the project refactor around ShadcnBlocks UI, future Payload CMS
support, and a possible Cloudflare D1-backed content source.

## USER STORY / WANTS:

_I want to do a few things to this project and i need help planning which ones to do in what order... if they should be done at the same time..etc, and then actually planning them fully a-z so we can delegate items to subagent experts and have others QA their work for maximum success. Overall i want to refactor the project UI to use shadcnblocks.com so we can also use the https://www.shadcnblocks.com/payload-cms to put a CMS on the project. the CMS will make it easier to deal with accepting and adding new things (ie: Submit Yours) businesses. And I think to do this we will also need to refactor from being JSON POWERED content to cloudflare d1 db powered.  look thoroughly through the project and help me coordinate this. _

## Decision Summary

Do the ShadcnBlocks UI refactor first.

Do not combine the UI refactor with Payload CMS, D1, runtime submissions, or deploy
strategy changes. The current project is intentionally static-first:

- checked-in site config and listing data
- per-site source data prepared into `data/listings.json`
- static export builds
- GitHub Pages repo-sync deploys
- GitHub issue based public submissions

Payload CMS and D1 are architecture changes. They should happen only after the UI
foundation is stable and the data-source boundary has been made explicit.

## Current Refactor Status: 2026-07-13

Latest repository and GitHub evidence:

- Phase 0 was merged into `main` before the current Phase 1 branch was created.
- Current branch: `agent/shadcnblocks-source-adoption`, tracking the same remote branch.
- Active pull request: PR #147, `Adopt ShadcnBlocks UI and local D1 source`:
  - URL: `https://github.com/serpcompany/json-directory-template/pull/147`
  - Head/base: `agent/shadcnblocks-source-adoption` into `main`.
  - State: open draft PR.
- Phase 1A baseline and parity coverage is present for the pilot public routes and
  interactive states.
- Phase 1B is complete. The inspected registry candidates and adopted, adapted, and
  rejected decisions are recorded in `docs/PHASE_1_REGISTRY_MAPPING.md`.
- Phase 1C implementation is complete on the branch for the planned shared surfaces:
  empty states, search/autocomplete, listing cards/grid, sidebar/mobile drawer,
  header/application shell, and homepage sections.
- Six reusable ShadcnBlocks-derived components are owned by
  `packages/design-system/components/shadcnblocks`; shared public composition remains
  in `packages/web-core`.
- The public UI is ShadcnBlocks-backed for the Phase 1 surfaces. Route wrappers,
  filtering, favorites, analytics, metadata, schema, and other application behavior
  remain project-owned rather than being replaced by generic blocks.
- PR #147 also contains a local D1 build-time source adapter. That work is separate
  from the Phase 1 UI goal even though it currently shares the PR.
- Listing-logo fallback behavior now uses the checked-in local
  `/listing-logos/favicon-fallback-512x512.png` asset in every app. Public rendering,
  schema, trial data, and Next.js image configuration no longer depend on Google or
  gstatic favicon endpoints.

Observed PR #147 checks before this documentation/fallback closeout commit:

- `PR Review / Validate Site & Policy`: success.
- `PR Review / Type Check`: success.
- `PR Review / Unit Tests`: success.
- `PR Review / E2E Tests`: success.
- CodeQL and CodeRabbit checks: success.
- `Validate Listing Sources / validate-listing-data`: cancelled and must be rerun or
  otherwise resolved before merge.

Phase status:

- Phase 0: complete and merged.
- Phase 1A: complete.
- Phase 1B: complete.
- Phase 1C: implemented and locally verified; pending final PR review and merge.
- Phase 1 is not closed until PR #147 has a clean worktree, required checks are
  successful, the draft is reviewed, and the PR is merged.
- No deployment is part of this closeout.

Next action:

1. Commit and push the documentation and local favicon fallback closeout to PR #147.
2. Confirm the new PR checks pass, including `Validate Listing Sources`.
3. Review the combined Phase 1 and D1 scope explicitly before marking PR #147 ready.
4. Merge PR #147 only after all task-related files are committed and checks pass.
5. Make Phase 7, runtime D1-backed public sites, the next main implementation
   initiative after the current branch is consolidated.

Registry smoke-test status:

```bash
set -a
source /Users/devin/dev/repos/shadcnblocks/.env
set +a
cd packages/design-system
pnpm dlx shadcn@latest add @shadcnblocks/hero125 --dry-run
```

The command reached the configured `https://www.shadcnblocks.com/r/{name}` registry
without printing or committing the API key and exited successfully. It was a dry-run
only; no `components/hero125.tsx` file or ShadcnBlocks source was installed.

Earlier failed candidates remain recorded for context:

- `@shadcnblocks/empty-standard-1` returned
  `[Block, component, example, or page not found]`.
- `@shadcnblocks/hero-1` also returned not found with `shadcn@latest` and
  `shadcn@4.12.0`.

Use `@shadcnblocks/hero125` or another catalog-verified block-name pattern such as
`<category><number>` for future smoke tests. Do not use the hyphenated `hero-1`
example as a registry smoke candidate unless the registry or docs are rechecked and
prove it exists.

## Current Facts

- The repo uses a pnpm monorepo with thin site wrappers under `apps/<site>`.
- Shared route rendering and reusable UI live in `packages/web-core`.
- Shadcn primitives live in `packages/design-system`.
- `packages/design-system/components.json` is configured for the authenticated
  ShadcnBlocks registry on branch `july11`.
- Official ShadcnBlocks docs checked on 2026-07-11 require:
  - installing blocks through the shadcn CLI, for example
    `pnpm dlx shadcn add @shadcnblocks/hero-1`
  - adding an authenticated `@shadcnblocks` registry to `components.json`
  - exposing `SHADCNBLOCKS_API_KEY` through the environment, not source code
- Official shadcn/ui registry docs support authenticated namespaced registries through
  `components.json` `registries` entries with environment-variable-backed headers.
- Source docs:
  - `https://www.shadcnblocks.com/docs/blocks/getting-started`
  - `https://www.shadcnblocks.com/docs/extension/getting-started`
  - `https://ui.shadcn.com/docs/registry/authentication`
  - `https://ui.shadcn.com/docs/registry/namespace`
- Local ShadcnBlocks secret facts checked on 2026-07-11:
  - `/Users/devin/dev/repos/shadcnblocks/.env` exists and contains
    `SHADCNBLOCKS_API_KEY`.
  - `/Users/devin/repos/dev/shadcnblocks/.env` does not exist on this machine, even
    though AGENTS.md mentions `~/repos/dev/shadcnblocks/.env`.
  - VS Code user settings contain `shadcnblocks.apiKey`.
  - Cursor and Windsurf user settings do not contain `shadcnblocks.apiKey`.
  - The current shell process does not export `SHADCNBLOCKS_API_KEY`.
  - The API key value must not be printed, copied into this plan, committed, or added
    to any tracked file.
- The original baseline had stale design-system exports that pointed to missing files.
  Branch `july11` removes the known missing exports and adds exports for real shadcn
  component files used by the repo.
- The original baseline had some `packages/web-core` relative imports into
  design-system internals. Branch `july11` moves the touched runtime imports to
  package exports, and the latest search did not find remaining relative imports from
  `packages/web-core` or `apps` into `packages/design-system` internals.
- Runtime app loaders read normalized `data/listings.json`.
- Site data preparation currently supports only:
  - `listing-json`
  - `trial-products-json`
- Active public submissions use GitHub issue handoff, badge verification, and generated
  PRs into `sites/<site-id>/products.json`.
- The current docs explicitly keep databases, runtime submissions, moderation state,
  auth, and sessions outside the active static build pipeline.

## Non-Negotiable Constraints

- Do not run real deploy commands unless explicitly requested and gitflow is complete.
- Treat `pnpm deploy`, `pnpm deploy:site`, target GitHub Pages repo syncs, and generated
  site artifact pushes as git push operations.
- Do not run direct database commands without explicit permission.
- Keep `apps/<site>` thin.
- Put reusable public UI in `packages/web-core`.
- Put reusable primitives and installed shadcn/shadcnblocks components in
  `packages/design-system`.
- Keep the current submission backend unchanged during the UI refactor.
- Keep published listing output validated against the current normalized listing shape
  until a separate architecture decision changes that.

## Phase 0: Foundation PR

Goal: make the design system safe for ShadcnBlocks before changing public pages.

Current status on `july11`:

- Implemented in code:
  - `packages/design-system/components.json` has the authenticated `@shadcnblocks`
    registry entry.
  - `packages/design-system/components.json` aliases now resolve `utils` through the
    design-system package boundary.
  - `packages/design-system/package.json` no longer exports missing `accordion` or
    `stats-card` files.
  - Missing exports for real shadcn component files used by this repo were added,
    including `alert-dialog`, `aspect-ratio`, `command`, `drawer`, `pagination`, and
    `sheet`.
  - `packages/web-core` imports touched in the branch were moved from relative
    design-system internals to `@thedaviddias/design-system/*` package exports.
- Verified:
  - `pnpm --filter @thedaviddias/design-system typecheck` passed.
  - `pnpm typecheck` passed.
  - `pnpm test:repo` passed.
- Closed by the 2026-07-11 closeout pass:
  - `@shadcnblocks/hero125` dry-run succeeds from `packages/design-system` with
    `SHADCNBLOCKS_API_KEY` sourced from `/Users/devin/dev/repos/shadcnblocks/.env`.
  - The successful dry-run proves the authenticated registry is reachable from this
    repo context without committing or printing the API key.
  - No ShadcnBlocks source files were installed during Phase 0.

Scope:

- Configure the ShadcnBlocks registry in `packages/design-system/components.json`.
- Verify `SHADCNBLOCKS_API_KEY` is available to the shadcn CLI without committing or
  printing the value:
  - source it from `/Users/devin/dev/repos/shadcnblocks/.env` for local CLI runs, or
    export it in the shell before running `pnpm shadcn`
  - keep any repo-local `.env`/`.env.local` files untracked; the current `.gitignore`
    excludes `**/.env` and `**/.env.*`
  - do not rely on the VS Code extension key for terminal-based installs unless the
    CLI command proves it can read the registry from this repo context
- Fix the missing or wrong Tailwind config path in `components.json`.
- Clean stale `packages/design-system/package.json` exports that point to missing files.
- Replace relative imports from `packages/web-core` into design-system internals with
  package exports.
- Add missing package exports only when they map to real files.

Registry config to add under `packages/design-system/components.json`:

```json
{
  "registries": {
    "@shadcnblocks": {
      "url": "https://www.shadcnblocks.com/r/{name}",
      "headers": {
        "Authorization": "Bearer ${SHADCNBLOCKS_API_KEY}"
      }
    }
  }
}
```

Local CLI smoke check after registry config:

```bash
set -a
source /Users/devin/dev/repos/shadcnblocks/.env
set +a
cd packages/design-system
pnpm dlx shadcn@latest add @shadcnblocks/hero125 --dry-run
```

Use `--view` instead of `--dry-run` when the implementer needs to inspect the resolved
registry payload without writing files. Do not use `@shadcnblocks/empty-standard-1`
or `@shadcnblocks/hero-1` as the smoke-test candidate unless the registry is rechecked
and proves either name exists. If the CLI needs an actual install smoke test, use a
catalog-verified low-risk block candidate, confirm generated files land under
`packages/design-system`, then remove any unused evaluation files before the PR is
considered ready. Do not commit API key material.

Out of scope:

- Public page redesigns.
- Submit flow behavior changes.
- Payload CMS.
- D1.
- Deploy changes.

Suggested subagents:

- Implementer: design-system foundation cleanup.
- Spec reviewer: verify ShadcnBlocks setup follows repo ownership boundaries.
- Code-quality reviewer: check exports, package boundaries, and no unrelated UI churn.
- Decision-policing QA: verify no shortcuts or scope creep.

Verification:

```bash
pnpm --filter @thedaviddias/design-system typecheck
pnpm typecheck
pnpm test:repo
```

## Phase 1: Public Directory UI Refactor

Goal: refactor shared public directory surfaces so their owned source comes from
ShadcnBlocks/shadcn patterns and primitives while preserving the current UI contract.

Current status on `agent/shadcnblocks-source-adoption`:

- Phase 1A is complete:
  - `apps/e2e/tests/visual.spec.ts` now includes pilot desktop/tablet/mobile visual
    coverage for homepage, search, category, listing detail, empty search,
    autocomplete, favorites-only, sort/result-count, mobile drawer, and mobile search
    overlay states.
  - `apps/e2e/tests/public-parity.spec.ts` now covers pilot functional parity for
    homepage search submit, autocomplete keyboard navigation, mobile search overlay,
    mobile drawer behavior, favorites-only filtering, sort persistence, empty-state
    action behavior, and public link href/target/rel semantics.
  - New pilot snapshots are present under
    `apps/e2e/tests/visual.spec.ts-snapshots/`.
- Phase 1B is complete in `docs/PHASE_1_REGISTRY_MAPPING.md` with registry evidence
  and adopted, adapted, and rejected decisions for every required public surface.
- Phase 1C is implemented for all eight planned slices. Reusable adapted source is
  installed under `packages/design-system/components/shadcnblocks`, and shared public
  composition in `packages/web-core` consumes those package exports.
- Final Phase 1 acceptance remains pending PR #147 review, successful required checks,
  and merge. This is a delivery-state requirement, not missing UI implementation.

The intended result is no user-visible redesign. Spacing, layout breakpoints, colors,
border radii, typography scale, copy, ordering, routes, metadata, analytics attributes,
and responsive behavior should remain visually equivalent unless an explicit follow-up
design change is approved.

Phase 1 must not start until Phase 0 has made the design-system package safe for
registry installs. In particular:

- `packages/design-system/components.json` must include the ShadcnBlocks registry.
- The local shadcn MCP/CLI must be able to see `@shadcnblocks` from this repo context,
  not only the default `@shadcn` registry.
- `SHADCNBLOCKS_API_KEY` must be available from local environment configuration and
  must not be committed, printed, or copied into docs. On this machine the verified
  env-file source is `/Users/devin/dev/repos/shadcnblocks/.env`; the current shell
  does not export the variable by default.
- The design-system package must expose only real component files.
- `packages/web-core` must import design-system components through package exports,
  not relative paths into `packages/design-system`.

Current factual baseline:

- The pilot wrapper should be `apps/serpdownloaders.com` unless changed explicitly.
- `apps/serpdownloaders.com/app/page.tsx` is a thin route that passes slots into
  `HomePageRoute`.
- Shared public rendering lives in `packages/web-core`.
- Registry installs should be run from `packages/design-system` through the repo's
  `pnpm shadcn` workflow or an equivalent `pnpm dlx shadcn@latest add ...` command
  scoped to that package, with `SHADCNBLOCKS_API_KEY` exported from the verified local
  env file first. Confirm installed files land under `packages/design-system` before
  any `web-core` import consumes them.
- The homepage shell currently combines:
  - `packages/web-core/src/home-page.tsx`
  - `packages/web-core/src/layout/header.tsx`
  - `packages/web-core/src/layout/app-sidebar.tsx`
  - `packages/web-core/src/websites-list-with-search.tsx`
  - `packages/web-core/src/websites-search-controls.tsx`
  - `packages/web-core/src/llm/llm-grid.tsx`
  - section route wrappers under `packages/web-core/src/sections/*`
- Existing visual coverage includes homepage, listing detail, brands, and search
  screenshots in `apps/e2e/tests/visual.spec.ts`.

Primary target areas:

- `packages/web-core/src/home-page.tsx`
- `packages/web-core/src/layout/header.tsx`
- `packages/web-core/src/layout/header-search.tsx`
- `packages/web-core/src/layout/mobile-drawer.tsx`
- `packages/web-core/src/layout/app-sidebar.tsx`
- `packages/web-core/src/websites-list-with-search.tsx`
- `packages/web-core/src/websites-search-controls.tsx`
- `packages/web-core/src/llm/llm-grid.tsx`
- `packages/web-core/src/empty-state.tsx`
- `packages/web-core/src/sections/*`
- search, category, listing-detail, listing-card, sidebar, empty-state, browse-list,
  favorites, and mobile navigation surfaces

Recommended ShadcnBlocks/component families:

- `application-shell`
- `sidebar`
- `product-list`
- `product-card`
- `command` or combobox-style search components
- `pagination`
- `empty`
- `tabs`
- `card`
- `button`
- `badge`
- `input`
- `toggle-group`
- `sheet` or `drawer` for mobile navigation only if the current drawer behavior can
  be preserved exactly

Do not use `data-table` for public directory cards unless the existing surface is already
tabular. Dense table/admin patterns belong in later admin/operator phases.

Phase 1A: Baseline and Inventory

Before installing or editing UI code:

- Run `git status --short` and account for modified/untracked files.
- Capture the current dependency/component state:
  - `packages/design-system/components.json`
  - `packages/design-system/package.json`
  - existing files under `packages/design-system/components/shadcn`
  - existing package exports consumed by `packages/web-core`
- Produce a public-surface inventory table with:
  - file path
  - current visual role
  - current shadcn/design-system imports
  - candidate shadcnblocks/shadcn replacement source
  - whether the replacement is a block, primitive, or extracted pattern
  - exact behavioral contracts to preserve
  - owner for the refactor slice
- Record the current visual baseline for the pilot site:
  - homepage desktop
  - homepage tablet
  - homepage mobile
  - search desktop, tablet, and mobile
  - listing detail desktop, tablet, and mobile
  - category page desktop, tablet, and mobile
  - empty/no-results state
  - autocomplete/recent-search state
  - favorites-only state when favorites exist
  - sort state and result-count text
  - mobile drawer and mobile search overlay
- Save any temporary screenshots only under a repo-local `./tmp/` folder and remove
  them before finishing the task.

Phase 1B: Registry-Backed Component Mapping

Source-of-truth mapping table: `docs/PHASE_1_REGISTRY_MAPPING.md`.

For each target surface, use the shadcn MCP or CLI against the configured registries
to inspect candidate source before deciding. The mapping should prefer the smallest
source change that improves library alignment without visual churn:

- If a ShadcnBlocks block matches the current structure closely, install it into
  `packages/design-system` and adapt the owned source to the existing UI contract.
- If a full block would force layout or visual changes, install/use the underlying
  shadcn primitives and keep the existing composition.
- If a current component already uses shadcn primitives and only has import-boundary
  issues, fix the ownership/import problem instead of replacing working markup.
- Do not copy examples manually when the registry can install the source.
- Do not add generated ShadcnBlocks source directly to `packages/web-core`.
- Do not keep unused installed block files after evaluation.

Required mapping decisions:

- Header/nav/search:
  - Candidate families: `application-shell`, `navbar`, `command`, `input`, `button`,
    `sheet`/`drawer`.
  - Preserve sticky header height, backdrop, desktop centered search, mobile search
    overlay, mobile menu behavior, auth/submit button conditions, analytics tracking,
    body scroll locking, autocomplete keyboard behavior, recent-search behavior, and
    route generation.
- Sidebar/category navigation:
  - Candidate families: `sidebar`, `scroll-area`, `separator`, `badge`, `button`.
  - Preserve `240px` desktop width, sticky `top-16` behavior, category filtering,
    featured count, favorites section, external resources, and active category state.
- Listing cards/grid:
  - Candidate families: `product-card`, `product-list`, `card`, `badge`, `button`.
  - Preserve current grid breakpoints, max-item collapse behavior, favorite button
    affordance, favicon fallback, unofficial badge, link overlay, analytics data
    attributes, line clamping, animation classes, and compact variant behavior.
- Search/filter controls:
  - Candidate families: `command`, `input`, `toggle-group`, `tabs`, `button`.
  - Preserve local filtering, sort persistence in `localStorage`, homepage search
    submit behavior, favorites-only behavior, counts, labels, and keyboard focus
    behavior.
- Empty states:
  - Candidate families: `empty`, `button`, `card` only if the current unframed
    presentation remains visually equivalent.
  - Preserve action href/callback semantics and current centered vertical rhythm.
- Sections:
  - Candidate families: `card`, `product-list`, `product-card`, `tabs` only where
    the section already behaves that way.
  - Preserve section titles, descriptions, anchors, slot contracts, and site-copy
    behavior.

Phase 1C: Refactor Slices

Use small PR-sized slices. Do not refactor every public page in one change unless the
diff proves the slices cannot be separated.

Recommended order:

1. Shared primitive/import cleanup needed by Phase 1 only.
2. Empty state and small controls.
3. Search controls and command/input primitives.
4. Listing card/grid.
5. Sidebar and mobile drawer.
6. Header/application shell.
7. Homepage/section composition after the lower-level pieces are stable.
8. Listing detail/category/search page parity checks and minor alignment fixes.

Each slice must include:

- The exact ShadcnBlocks/shadcn source inspected or installed.
- The reason a block was adopted, adapted, or rejected.
- A before/after visual comparison for affected desktop and mobile routes.
- A check that route URLs, metadata, schema, analytics attributes, and data loading
  did not change.
- Removal of unused evaluation files and repo-local tmp files.

Execution notes:

- Refactor shared `web-core` components first, not each wrapper app.
- Keep site-specific wrappers as route/data adapters.
- Preserve current routes, metadata behavior, sitemap behavior, and data loading.
- Use `serpdownloaders.com` as the first visual target unless another site is chosen.
- Keep public UI in `packages/web-core`; keep installed primitives, blocks, and
  reusable design-system components in `packages/design-system`.
- Installed block source is owned source. It may be edited to preserve the existing
  visual contract.
- Do not accept default ShadcnBlocks styling when it changes the current UI.
- Do not introduce new runtime state, API routes, CMS reads, D1 reads, auth/session
  behavior, or submission behavior.
- Do not change listing sorting, filtering, slug routing, or normalized listing shape.
- Do not move public rendering logic into `apps/<site>` wrappers.
- Do not import design-system internals by relative path from `packages/web-core`.
- Do not run deploy commands. Dry-run deploy commands are allowed only if explicitly
  needed and the worktree state is accounted for.

Out of scope:

- Any intentional redesign.
- Re-theming, color palette changes, font changes, or new animation systems.
- Changing card density, grid breakpoints, header height, sidebar width, or mobile
  navigation behavior without explicit approval.
- Submit backend changes.
- Submit page UI changes; that is Phase 2.
- CMS/admin runtime.
- D1 data reads.
- Deploy strategy changes.
- Payload CMS.
- Operator/admin UI.
- Database-backed submissions.
- New public runtime dependencies on auth, sessions, or databases.
- Generated ShadcnBlocks files committed directly under `packages/web-core`.

Suggested subagents:

- Decision-policing QA: challenge shortcuts, unsupported assumptions, scope creep,
  unverified registry claims, and any visual change framed as "just refactor".
- Registry/component mapper: inspect ShadcnBlocks/shadcn candidates and produce the
  mapping table before implementation.
- Implementer 1: empty state, small controls, and search controls.
- Implementer 2: listing cards/grid only, if write scopes are clearly separated from
  search controls.
- Implementer 3: sidebar/mobile drawer/header shell only after card/search work is
  stable.
- Spec reviewer: compare against current public routes, site-copy behavior, metadata,
  schema, analytics attributes, and data loading.
- Code-quality reviewer: package boundaries, accessibility, responsive layout,
  dependency hygiene, dead installed files, and no relative design-system imports.
- Visual QA reviewer: desktop/mobile screenshots, mobile drawer/search overlay,
  no overlapping text, no unexpected responsive breakpoint changes.
- Accessibility reviewer, or an explicit accessibility checklist inside code-quality
  review: preserve or improve `aria-label`, `aria-current`, keyboard navigation,
  Escape handling, focus rings, focus order, button/link semantics, screen-reader-only
  headings, live-region result count behavior, and color contrast.

Do not dispatch multiple implementers into the same files at the same time.

Verification:

```bash
git status --short
pnpm --filter @thedaviddias/design-system typecheck
pnpm typecheck
pnpm validate:site -- --site serpdownloaders.com
pnpm build:site -- --site serpdownloaders.com
pnpm test:repo
pnpm test:e2e
```

Subagent tool/access requirements:

- Registry/component mapper:
  - Must have access to the shadcn MCP or shadcn CLI from the repo context.
  - Must verify `@shadcnblocks` appears in configured registries before claiming a
    ShadcnBlocks candidate is available.
  - Must inspect candidate source/examples before recommending adoption.
  - Must install or evaluate candidates only through `packages/design-system`.
- Visual QA reviewer:
  - Must have browser automation access through Playwright or an equivalent browser
    driver that can navigate pages, click controls, type into inputs, press keyboard
    shortcuts, set viewport sizes, and capture screenshots.
  - Must drive the actual UI, not only inspect code.
  - Must test desktop, tablet, and mobile viewports.
  - Must exercise open/closed interactive states, including mobile drawer, mobile
    search overlay, autocomplete, favorites-only, sorting, and empty/no-results action.
  - Must inspect console errors and failed network requests during the exercised flows.
  - Must keep artifacts in repo-local `./tmp/` or approved Playwright artifact paths
    and clean up temporary files before finishing.
- Spec reviewer:
  - Must verify route/link/section parity from rendered pages, not only static imports.
  - Must check that all expected public sections, nav links, category links, listing
    links, submit links, and external-resource links are still present with the same
    href/target/rel semantics.
- Decision-policing QA:
  - Must be read-only unless explicitly assigned an implementation fix.
  - Must challenge any unverified third-party-tool, registry, or visual-parity claim.

Third-party visual parity tooling:

- Playwright `toHaveScreenshot()` remains the required repo-local baseline because the
  current e2e suite already uses it. This is the local oracle that every implementer
  and reviewer can run.
- The hosted visual tool is not a separate ad-hoc checklist. If used, it must run the
  same parity states as the local Playwright visual suite and block/flag the same UI
  regressions in PR review.
- Phase 1 hosted-tool preflight:
  1. Inspect repo config and package manifests for an existing integration.
  2. Inspect checked-in env examples and CI config for a referenced token name. Do not
     print or commit secret values.
  3. If an existing provider is found, use that provider.
  4. If no provider is found, recommend one provider and ask for explicit approval
     before adding a dependency, CI secret, or paid account dependency.
  5. Record the result in the Phase 1 PR notes: provider used, token/config source,
     snapshots covered, and whether hosted visual review is blocking or advisory.
- Recommended provider choice if there is no existing integration:
  - First choice: Argos, because it is Playwright-native and can publish PR visual diffs
    from the same browser journeys as `apps/e2e/tests/visual.spec.ts`.
  - Use Percy/BrowserStack instead if the org already has BrowserStack/Percy access.
  - Use Chromatic if the repo adds Storybook/component-story coverage or already has a
    Chromatic project.
  - Use Applitools Eyes only if the org explicitly wants AI-assisted visual comparison
    and has an Eyes account/API key.
- Hosted visual setup plan after provider approval:
  1. Add the provider SDK to `apps/e2e` only.
  2. Add a dedicated script such as `test:e2e:visual:hosted` in `apps/e2e/package.json`.
  3. Keep the existing `pnpm test:e2e:visual` local Playwright snapshot command.
  4. Reuse the same route/state list as `visual.spec.ts`; do not create a weaker hosted
     suite that checks only the homepage.
  5. Capture desktop, tablet, and mobile snapshots for each changed public route.
  6. Capture interactive open states: mobile drawer, mobile search overlay,
     autocomplete/recent-search, favorites-only, sort state, and empty/no-results.
  7. Mask or stabilize only genuinely dynamic noise. Do not mask the regions being
     refactored.
  8. Run hosted visual checks against the pilot site build/dev server used by Playwright,
     not a different deployment target.
  9. Treat any hosted diff in changed surfaces as a review item that must be explained,
     fixed, or explicitly approved as an intentional design change outside Phase 1.
  10. Do not run a real deploy to satisfy hosted visual testing.
- Phase 1 cannot claim "third-party visual QA passed" unless the provider has compared
  before/after screenshots for the same changed routes and interactive states.
- If no hosted tool is configured, the PR must explicitly say that hosted visual review
  was not configured and must rely on local Playwright screenshots plus browser-driven
  Visual QA. Do not imply third-party coverage exists.

Concrete local UI parity suite plan:

- Expand `apps/e2e/tests/visual.spec.ts` or add a sibling parity visual spec that:
  - sets stable desktop, tablet, and mobile viewports,
  - disables animations/transitions the same way the current visual helper does,
  - snapshots homepage, search, category, listing detail, empty/no-results, mobile
    drawer open, mobile search overlay open, autocomplete/recent-search, favorites-only,
    and sort/result-count states,
  - uses stable names for each snapshot so before/after diffs are reviewable.
- Add or expand a functional parity spec that:
  - crawls visible header/sidebar/drawer/section links on the pilot pages,
  - verifies href/target/rel semantics for nav, category, listing, submit, and external
    resource links,
  - verifies all expected public sections still render by role/heading/landmark,
  - verifies search submit, autocomplete selection, sort persistence, favorites-only,
    mobile drawer close/navigation, mobile search close/search, and empty-state actions.
- The Visual QA subagent must run both the local visual suite and the functional parity
  suite after each UI slice. If a hosted tool is configured, the same subagent must also
  run or inspect the hosted visual job and include its diff URL/status in the review.

Visual verification requirements:

- Keep the existing visual snapshots for homepage, listing detail, brands, and search.
- Add or update visual coverage for any changed public route or state.
- Add mobile viewport screenshot coverage for homepage, search, listing detail,
  category page, mobile drawer, and mobile search overlay if it does not already exist.
- Add tablet viewport coverage for any surface whose breakpoint behavior changes or
  whose current layout is not sufficiently covered by desktop/mobile screenshots.
- If a snapshot changes, classify the change as:
  - expected no-op rendering noise,
  - accidental visual regression to fix,
  - or intentional design change requiring explicit approval outside Phase 1.
- Check interactive states that screenshots can miss:
  - desktop header search submit
  - autocomplete keyboard navigation and recent-search behavior
  - mobile search open/search/close
  - mobile drawer open/close/navigation
  - body scroll lock while overlays are open
  - favorites-only toggle when favorites exist
  - sort toggle persistence
  - empty/no-results action

Responsive parity requirements:

- Desktop sidebar remains sticky, `240px` wide, and hidden on mobile.
- Mobile drawer remains mobile-only and does not replace desktop sidebar behavior.
- Desktop search remains hidden at the same mobile breakpoints.
- Mobile search overlay remains positioned below the sticky header.
- No horizontal overflow is introduced at mobile, tablet, desktop, or wide desktop
  widths.
- Card/grid columns, truncation, line clamps, and wide-screen item visibility remain
  equivalent.

Acceptance criteria:

- The pilot site builds and validates.
- E2E visual coverage passes without meaningful visual differences.
- Public routes, route params, metadata, JSON-LD/schema, sitemap behavior, listing
  ordering, analytics attributes, and submit links are unchanged.
- All new installed UI source lives under the design-system ownership boundary or a
  clearly reusable `web-core` public component boundary.
- No unused ShadcnBlocks evaluation files, tmp screenshots, generated artifacts, or
  stale exports are left behind.
- `git status --short` is inspected and every modified/untracked file is accounted for
  before any PR/deploy-related action.

## Phase 2: Submit UI Refactor

Goal: improve the `/submit` experience with shadcn/shadcnblocks form components while
keeping the current GitHub issue handoff.

Primary target:

- `packages/web-core/src/forms/github-issue-submit-form.tsx`

Use:

- form
- field
- input
- input-group
- select or combobox
- textarea
- alert
- dialog
- sheet if the badge instructions are better as a side panel

Behavior to preserve:

- Client validation with React Hook Form and Zod.
- GitHub issue URL generation.
- Badge embed instructions.
- No direct database writes.
- No runtime moderation.
- No replacement of the public issue flow.

Out of scope:

- Payload forms.
- D1 submission storage.
- File uploads, unless explicitly approved later.

Suggested subagents:

- Implementer: submit UI only.
- Spec reviewer: verify generated issue payload and validation behavior are unchanged.
- Code-quality reviewer: accessibility, form ergonomics, no duplicated schema logic.
- Visual QA reviewer: add `/submit` visual coverage.

Verification:

```bash
pnpm test:repo
pnpm --dir apps/starter exec jest --runInBand packages/web-core/src/forms/github-issue-submit-form.test.ts
pnpm validate:site -- --site serpdownloaders.com
pnpm build:site -- --site serpdownloaders.com
```

## Phase 3: Operator/Admin UI Refactor

Goal: improve the local operator onboarding/admin-style surfaces after public UI and
submit UI are stable.

Primary target:

- `packages/web-core/src/operator/site-onboarding-form.tsx`

Recommended families:

- `application-shell`
- `sidebar`
- `form`
- `tabs`
- `data-table`
- `dialog`
- `sheet`
- `resizable`
- code or textarea preview components

Important boundary:

- This is local/operator tooling, not the deployed public site.
- Do not treat this as the Payload CMS implementation.

Suggested subagents:

- Implementer: operator UI shell and reusable form sections.
- Spec reviewer: verify exported JSON payloads remain identical.
- Code-quality reviewer: state management, component boundaries, no fragile string
  manipulation.

Verification:

```bash
pnpm dev:operator -- --site serpdownloaders.com
pnpm test:repo
pnpm typecheck
```

Add local visual checks for the operator page if practical.

## Phase 4: Data Source Adapter Foundation

Goal: prepare for D1 or Payload without changing behavior.

Current seam:

- `packages/site-contract/src/types.ts` defines `content.listingSource`.
- `scripts/site-data.ts` prepares site data into `data/listings.json`.
- `scripts/validate-site.ts` repeats source branching for validation.
- `scripts/build-site.ts` depends on prepared normalized listings before static export.

Scope:

- Add a source adapter abstraction with no behavior change.
- Move existing `listing-json` copy behavior into an adapter.
- Move existing `trial-products-json` transformation behavior into an adapter.
- Reuse the adapter from site preparation and validation.
- Keep writing normalized `data/listings.json`.
- Preserve deterministic ordering and current validation errors.

Out of scope:

- Real D1 reads.
- Payload setup.
- Submit write changes.
- Runtime public page database queries.

Suggested subagents:

- Implementer: adapter abstraction and existing source adapters.
- Spec reviewer: verify no generated output changes for active sites.
- Code-quality reviewer: adapter shape, error messages, tests.
- Decision-policing QA: make sure this stays behavior-preserving.

Verification:

```bash
pnpm test:repo
pnpm validate:sites
pnpm validate:site -- --site serpdownloaders.com
pnpm build:site -- --site serpdownloaders.com
```

Tests likely touched:

- `scripts/site-data.test.ts`
- `scripts/validate-site.test.ts`
- `scripts/site-config.test.ts`
- workflow tests that assume checked-in listing paths
- e2e fixture assumptions around `data/listings.json`

## Phase 5: Payload CMS and Runtime D1 Architecture Decision

Goal: record the architecture for the user-approved runtime D1 initiative before
implementation. Runtime D1 and database ownership of published listing data are product
decisions; this ADR must still decide the implementation and operational topology.

Questions to answer:

- Is Payload CMS a separate control plane, a new app inside this monorepo, or a
  replacement for the current starter?
- How do reviewed records become canonical D1 records while retaining an auditable
  publication history?
- Which supported D1-capable Next.js runtime and adapter will replace static GitHub
  Pages serving for migrated sites?
- How do approvals trigger rebuild/deploy?
- Where do media uploads live?
- What auth providers are required?
- What moderation states are required?
- What is the rollback story?
- Does the project actually have Payblocks source access, and should it be adapted or
  used only as a reference?

Required direction:

- Make D1 canonical for approved, published listing records and query it through a
  server-only repository at public runtime.
- Keep Payload, submissions, moderation, ownership verification, and reviewer actions
  as a separate control plane that publishes into the D1 contract.
- Keep runtime public reads independent from user sessions unless a later feature
  explicitly requires authentication.
- Explicitly reconcile or supersede `docs/DEPLOY_STRATEGY_EXIT_PLAN.md`: its current
  object-storage/CDN recommendation remains valid for static sites, but migrated sites
  require the hosted runtime justified by the approved runtime-D1 product requirement.

Required output:

- Architecture decision record.
- Data ownership decision.
- Deployment decision.
- Migration and rollback plan.
- Security/secrets plan.
- QA plan.

Suggested subagents:

- Architecture explorer: Payload/D1 deployment and source-of-truth options.
- Security reviewer: auth, roles, secrets, abuse controls.
- Data reviewer: schema mapping to normalized listings.
- Decision-policing QA: challenge unsupported assumptions.

## Phase 6: Payload/D1 Build-Time Source Adapter Foundation

Goal: read approved CMS/database records into the existing normalized listing shape at
build time.

Prerequisite:

- Phase 5 architecture decision is approved.
- Phase 4 source adapter foundation exists.

Scope:

- Add a new source kind only after the architecture is decided.
- Validate required environment variables and bindings.
- Read approved listing records.
- Normalize into the existing `websiteJsonEntrySchema` shape.
- Keep deterministic ordering.
- Keep static export.
- Keep public runtime independent from D1.

Out of scope:

- Direct public runtime D1 reads.
- Replacing GitHub issue flow unless a separate submission-control-plane plan is
  approved.
- Direct database writes from local scripts without explicit permission.

Suggested subagents:

- Implementer: source adapter and schema mapping.
- Spec reviewer: parity with normalized listing contract.
- Code-quality reviewer: failure modes, env validation, deterministic output.
- Data QA reviewer: fixture parity and duplicate handling.

Verification:

```bash
pnpm test:repo
pnpm validate:site -- --site <pilot-site>
pnpm build:site -- --site <pilot-site>
pnpm deploy:site -- --site <pilot-site> --dry-run
```

Only dry-run deploys unless explicitly approved and gitflow is complete.

## Phase 7: Runtime D1-Backed Public Sites

Goal: make D1 the canonical serving source for public listing data and remove
`data/listings.json` from the request-time public rendering path.

This is the next main initiative after the current Phase 1/D1 foundation branch is
consolidated. It is a runtime and hosting migration, not an extension of the current
build-time adapter. Success means a public listing, category, search, homepage, feed,
schema, and sitemap request obtains listing data through the runtime D1 repository
without first materializing `data/listings.json`.

Current factual constraint:

- Every active checked-in deployable site currently uses `github-pages-repo-sync` as a
  static export.
- GitHub Pages cannot provide a Next.js server runtime or bind Cloudflare D1.
- The runtime phase therefore requires an approved D1-capable hosting architecture,
  DNS/certificate migration, runtime bindings, and rollback plan before public
  cutover.

Prerequisites:

- Phase 5 ADR explicitly selects the D1-capable runtime and deployment model. Evaluate
  Cloudflare Workers with the supported Next.js adapter against any other candidate;
  record the decision from current official platform documentation and a repo proof of
  concept rather than assuming compatibility.
- Define whether there is one D1 database per site or one database partitioned by
  `site_id`, including ownership, limits, isolation, backup, and restore consequences.
- Approve D1 as the canonical source of published listing records.
- Inventory every reader of `data/listings.json`, including public routes, metadata,
  schema, sitemap, RSS/feed, search indexes, validation, E2E fixtures, build scripts,
  and deploy workflows.
- Define service-level objectives, query budgets, caching policy, observability,
  incident ownership, and acceptable stale-read behavior.

Implementation slices:

1. Runtime architecture and deployment proof:
   - Add an ADR for the selected Next.js runtime and D1 binding model.
   - Prove one non-production site can render a server-side route with a read-only D1
     binding.
   - Verify supported Node/runtime APIs, static assets, image behavior, custom domains,
     environment separation, logs, and rollback mechanics.
   - Do not change production DNS or deploy a production site in this slice.
2. Runtime repository boundary:
   - Add a typed listing repository interface owned outside React components.
   - Implement a D1 repository through the project's chosen query/ORM layer and
     checked-in migrations; do not embed SQL in page components.
   - Support deterministic pagination, category filters, featured/latest ordering,
     slug lookups, counts, and related/previous/next listing queries.
   - Keep authorization and moderation filters server-side. Under the current schema,
     public rows require `status = 'approved'` and an eligible `published_at`; any
     separate publication-state column requires a versioned migration and backfill.
3. Schema and data migration:
   - Map the normalized listing contract to versioned D1 migrations and constraints.
   - Preserve the existing deterministic identity contract, `(site_id, slug)`, unless a
     reviewed migration explicitly introduces a different primary key.
   - Validate record counts, slugs, categories, links, media, timestamps, and content
     hashes against the accepted source snapshot.
   - Make migration and import operations idempotent and provide an export/restore
     path before cutover.
4. Dual-read parity mode:
   - Keep the existing JSON path available only as a temporary rollback reader.
   - Read D1 for the pilot while comparing route-level results against the accepted
     JSON snapshot outside the user response path.
   - Block cutover on missing, duplicate, reordered, unpublished, or schema-invalid
     records and on route/metadata/schema/sitemap parity failures.
   - Do not silently fall back from D1 to stale JSON in production; failures must be
     observable and follow the approved incident policy.
   - Define the final consistency strategy before cutover: an approval write freeze,
     incremental delta capture, or verified dual-write. Perform a final reconciliation
     after the last accepted write and before traffic changes so approvals cannot be
     lost between snapshot and cutover.
5. Pilot runtime cutover:
   - Use `serpdownloaders.com` as the pilot unless the ADR selects another site with
     recorded evidence.
   - Move its build and deploy workflow to the selected runtime with development,
     preview, and production D1 bindings separated.
   - Verify homepage, search, category, listing detail, favorites behavior, metadata,
     schema, sitemap, RSS, analytics attributes, and cache behavior against the
     pre-cutover baseline.
   - Rehearse rollback before changing production traffic, then require explicit user
     approval for the production deploy and DNS cutover.
6. Network rollout:
   - Roll out one site at a time with per-site parity evidence, migration report,
     rollback checkpoint, and post-cutover monitoring.
   - Keep sites not yet migrated on their existing serving path; do not perform an
     all-sites atomic cutover.
7. JSON serving-path retirement:
   - Remove public runtime imports and preparation steps that require
     `data/listings.json`.
   - Remove build/deploy workflow steps that materialize listing JSON for migrated
     sites.
   - Retain only explicit D1 export fixtures needed for tests, disaster recovery, or
     audited snapshots; label them as exports rather than serving sources.
   - Remove the temporary JSON rollback reader only after every site has completed its
     rollback window and D1 restore has been rehearsed.

Runtime requirements:

- Use server-only D1 bindings; never expose database credentials or direct database
  access to browser code.
- Parameterize every query and enforce `site_id`, approval status, and publication
  state at the repository boundary.
- Define indexes from measured query plans for slug, site/status, category, featured,
  and publication ordering queries.
- Bound list and search queries with pagination and maximum limits.
- Verify the selected Cloudflare account plan and current official D1/Workers limits;
  gate the design on projected database size, query and bound-parameter limits, batch
  sizes, concurrency/overload behavior, Worker CPU/memory, and bundle size.
- Preserve canonical URLs, trailing-slash behavior, redirects, metadata, structured
  data, analytics attributes, and public copy.
- Define cache keys and invalidation by site, query, and content version. Document how
  Payload publication invalidates or revalidates affected pages.
- Emit metrics for query latency, query errors, empty/partial result anomalies, cache
  hit rate, and D1 binding/configuration failures.
- Keep local, preview, staging, and production data/bindings isolated.
- Use least-privilege runtime and migration identities, protected CI environments,
  auditable migration/publication actions, documented secret rotation and revocation,
  and tenant-isolation negative tests. Preview environments must never bind production
  D1, and runtime credentials must not have migration authority.
- Deploy only reviewed source SHAs. Record billing/quota ownership, environment
  approval gates, health thresholds, automated rollback triggers, DNS TTL preparation,
  domain ownership/certificate validation, and coexistence rules for the Pages and
  runtime origins during cutover.

Rollback requirements:

- Capture and verify a restorable D1 export before each schema migration and site
  cutover.
- Record a pre-change D1 Time Travel bookmark when supported by the verified account
  plan. Document that in-place restore affects the live database, and test the restore
  procedure outside production before relying on it.
- Define RPO, RTO, backup retention beyond the platform Time Travel window, encrypted
  export storage, integrity checks, and access ownership.
- Make imports and migrations checkpointed and resumable. Define when to forward-repair
  versus restore, and how writes after a restore point are reconciled.
- Keep the last accepted static deployment available during the pilot rollback window.
- Document separate rollback procedures for application code, DNS/traffic, and data
  migrations.
- Use backward-compatible expand/migrate/contract schema changes; do not combine a
  destructive migration with the code release that first stops reading the old shape.
- Define a point-of-no-return review before removing the JSON rollback reader or old
  deployment target.

Out of scope until separately approved:

- Browser-to-D1 access.
- Public writes directly into published tables.
- Production database commands or production deploys without explicit user approval.
- Payload CMS installation, submission authentication, and moderation UI; those remain
  separate control-plane work even when they publish into D1.
- Removing JSON fixtures used only by deterministic unit/E2E tests.

Required QA evidence per site:

- Record-count, slug, category, status, and content-hash migration report.
- Query-plan/index review for representative list and detail queries.
- Functional and visual parity for homepage, search, category, listing detail, empty
  results, autocomplete, favorites-only, sorting, mobile drawer, and mobile search.
- Metadata, schema, sitemap, RSS/feed, robots, canonical, redirect, analytics, and link
  parity.
- Load, cold-start, cache, D1 failure, empty-result anomaly, and rollback tests.
- Preview-runtime smoke test using the same bindings and adapter shape as production.
- Decision-policing, security, data-quality, accessibility, and code-quality reviews.

Suggested subagents:

- Runtime architecture reviewer: hosting adapter, bindings, platform limits, and deploy
  topology.
- Database implementer: repository, migrations, indexes, and import/export tooling.
- Data-quality reviewer: parity reports, constraints, duplicate detection, and restore
  verification.
- Route/spec reviewer: routes, metadata, schema, sitemap, RSS, analytics, and copy.
- Performance reviewer: query plans, caching, cold starts, limits, and load tests.
- Security reviewer: binding isolation, secrets, parameterization, publication filters,
  and abuse boundaries.
- Decision-policing QA: prevent hidden JSON dependencies, silent fallback, unverified
  platform claims, and premature production cutover.

Completion criteria:

- Every active public site reads canonical listing data from D1 at runtime.
- No migrated public request or deploy workflow requires `data/listings.json`.
- D1 publication changes can become visible through the documented cache/revalidation
  path without rebuilding a complete static listing artifact.
- All sites have passing parity evidence, monitoring, backups, restore rehearsal, and
  rollback documentation.
- The old GitHub Pages/static listing-serving path is retired only after explicit
  approval and the rollback window closes.

Platform references to re-verify during the ADR and before each production migration:

- `https://developers.cloudflare.com/d1/platform/limits/`
- `https://developers.cloudflare.com/d1/reference/time-travel/`
- The current official Next.js-on-Cloudflare adapter and deployment documentation
  selected by the ADR.

## Phase 8: Optional Hosted Submission and Moderation Flow

Goal: replace or supplement GitHub issue intake with a hosted CMS/control-plane workflow.

Prerequisite:

- Phase 5 architecture decision is approved.
- Phase 6 source adapter, Phase 7 runtime repository, or an approved write-back path is
  proven.

Recommended flow:

1. Submitter signs in or passes approved anti-abuse controls.
2. Submitter creates a listing draft.
3. Ownership/badge verification runs.
4. Submission enters moderation.
5. Reviewer approves, rejects, or requests changes.
6. Approval creates either:
   - a repo-owned PR consumed by a reviewed publisher, or
   - an approved database record written through the control-plane publication path.
7. For Phase 6 sites, the existing validate/build/deploy pipeline publishes the result.
   For Phase 7 sites, the publisher updates canonical D1 and triggers the documented
   cache invalidation or revalidation path.

Required moderation states:

- draft
- submitted
- needs-review
- changes-requested
- approved
- rejected
- published

Out of scope until explicitly approved:

- Direct publish from user input.
- Bypassing review.
- Making the public site require auth.
- Treating unreviewed database rows as public content.

## Preferred First Execution Sequence

1. Phase 0: Foundation PR.
2. Phase 1: Public directory UI refactor for one pilot site.
3. Phase 2: Submit UI refactor.
4. Phase 3: Operator/admin UI refactor.
5. Phase 4: Source adapter foundation.
6. Phase 5: Payload/D1 ADR.
7. Phase 6: Build-time D1 adapter foundation.
8. Phase 7: Runtime D1-backed public sites as the next main initiative.
9. Phase 8: Hosted submission and moderation after the runtime/control-plane boundary
   is approved.

## QA Gates Per PR

Every PR should have:

- Implementer self-review.
- Spec compliance review.
- Code quality review.
- Decision-policing QA when architecture boundaries are involved.
- `git status --short` inspected before any PR/deploy-related action.
- Explicit accounting for modified and untracked files.

## Open Decisions

- Which site is the visual pilot? Recommended: `serpdownloaders.com`, because it is
  the default `pnpm dev` site.
- Should Payblocks be used as source code, design reference, or not at all?
- D1 is the intended canonical source for published listing data; Phase 5 must still
  record the ownership, backup, and operational consequences.
- Public sites should move to runtime D1 reads through Phase 7. The remaining decision
  is which D1-capable Next.js runtime and deployment topology meets the verified
  requirements.
- What auth and moderation requirements are actually needed for "Submit Yours"?
