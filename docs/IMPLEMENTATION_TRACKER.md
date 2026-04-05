# Implementation Tracker

This doc turns the current closeout plan into the active execution queue.

## Current truth

- [x] JSON/static remains the MVP publishing model
- [x] The GitHub-issue submit flow remains the MVP submission bridge
- [x] The whole-repo wash audit is now the first closeout phase
- [x] `serpdownloaders.com` is the active live proof-site target for closeout
- [x] The live `serpdownloaders.com` proof pass is now aligned on the public domain after the April 5, 2026 recheck
- [x] Hosted/database work stays outside the MVP closeout lane

## Planning resets completed

- [x] Replace the old branch-era roadmap in [docs/PLAN.md](/Users/devin/dev/repos/json-directory-template/docs/PLAN.md)
- [x] Create the audit artifact in [docs/knowledge/whole-repo-wash-audit.md](/Users/devin/dev/repos/json-directory-template/docs/knowledge/whole-repo-wash-audit.md)
- [x] Reframe [docs/SITE_CONFIG_REFACTOR_QA_CHECKLIST.md](/Users/devin/dev/repos/json-directory-template/docs/SITE_CONFIG_REFACTOR_QA_CHECKLIST.md) as the MVP closeout checklist
- [x] Sync GitHub issues `#39`, `#41`, `#42`, and `#43` to the new order and language
- [x] Sync the GitHub project statuses so they reflect the real queue

## Active queue

### Phase 0. Whole-repo wash execution

- [x] Clean root metadata/config residue:
      `.all-contributorsrc`, `CLAUDE.md`, `lychee.toml`, and any other root-level surfaces classified `MVP-now`
- [x] Review README and operator-facing entry docs for stale brand or stale flow language
- [x] Fix active tests that still enforce stale route or submit-target assumptions
- [x] Clean active checked-in site-owned copy that still surfaces stale brand labels
- [x] Add the small closeout cards for sitemap/robots verification and optional GTM verification under `#43`
- [x] Review active workflow/config assumptions that still point at legacy website-authoring paths under `#47`
- [x] Update docs/runbooks together with every cleanup chunk
- [x] Add or update tests for every changed behavior

Acceptance:

- [ ] No `MVP-now` residue remains on public, operator, or root metadata surfaces

### Phase 1. MVP closeout verification

- [x] Truth-pass the closeout docs and board after the live proof-site alignment under `#46`
- [x] Run the closeout checklist for `default` under `#48`
- [x] Run the default-site browser closeout pass on an isolated local dev server and record the route outcomes
- [x] Run the closeout checklist for `serpdownloaders.com`
- [x] Verify the final sitemap/robots artifact contract
- [x] Verify site-owned GTM is present for `serpdownloaders.com` production output and absent on non-GTM sites
- [x] Replace stale `serpdownloaders.com` favicon/logo/Open Graph assets and verify the built artifact stages them correctly
- [x] Record real command outcomes and manual checks in the checklist
- [x] Finish the remaining default-site artifact, deploy, and docs residue under `#48`
- [x] Open explicit follow-up issues for any failed or intentionally deferred items

Acceptance:

- [x] MVP closeout is backed by evidence, not assumed from previous implementation issues
- [x] The board, tracker, and checklist agree on the remaining unresolved work

### Phase 2. Live proof site: `serpdownloaders.com`

- [x] Keep issue `#41` scoped to the `serpdownloaders.com` live proof-site pass
- [x] Run the first live comparison pass against `serpdownloaders.com`
- [x] Compare live behavior against the current built artifact
- [x] Spot-check homepage, listing detail, search, submit, sitemap, and robots on the live site
- [x] Recheck live `robots.txt` and unversioned root assets on April 5, 2026; the old cache-based blocker no longer reproduces
- [x] Close `#41` and `#44` once the live recheck confirms the public domain is aligned
- [x] Update docs with live proof-site notes and verification

Acceptance:

- [x] `serpdownloaders.com` stands as the real second proof of concept for the current JSON/shared contract

Notes:

- `serpdownloaders.com` remains the active real-site verification target for the current closeout pass.
- `serp.software` stays available in-repo as an additional multi-site proof config, but it is not the board-tracked proof target.
- 2026-04-05: A first local default-site browser verification attempt during `#47` was blocked by
  the machine environment before route checks completed. `agent-browser` needed a one-time Chrome
  install, and `next dev` initially hit `No space left on device (os error 28)` under Turbopack.
- 2026-04-05: After freeing disk space, reran the default-site browser pass on an isolated dev
  port (`3317`) and confirmed `/`, `/listing/123movies-downloader`, the `/websites -> /listing`
  compatibility redirect, and the submit redirect to
  `github.com/serpcompany/json-directory-template/issues/new`. That rerun also exposed and fixed
  two stale active assumptions: the smoke test was still expecting `/websites -> /`, and the
  default site config was still pointing at `serpapps/support`.
- 2026-04-05: Finished the remaining `#48` default-site closeout evidence. `pnpm build:site -- --site default`
  now prunes `.DS_Store` from the shipped artifact, and the rebuilt `dist/sites/default` artifact
  no longer contains sourcemaps, `__next*.txt`, or disabled starter routes. The default artifact
  still stages the expected root assets and sitemap family files.
- 2026-04-05: `pnpm exec vitest run scripts/build-artifact-pruning.test.ts
  scripts/build-workflow.test.ts scripts/deploy-site.test.ts scripts/resolve-build-run.test.ts
  scripts/search-index-generator.test.ts scripts/site-config.test.ts` passed. This confirms the
  artifact pruning, search-index generation, and deploy-resolution rules still hold under the
  current checked-in site-config flow.
- 2026-04-05: `pnpm deploy:site -- --site serpdownloaders.com --dry-run` still resolves the
  checked-in `site_id`, plans an artifact-only repo sync, and preserves `CNAME` plus the target
  repo Pages workflow file.
- 2026-04-05: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3317 PLAYWRIGHT_PORT=3317 pnpm --filter e2e exec playwright test tests/smoke.spec.ts tests/pages.spec.ts tests/interactions.spec.ts --project=chromium`
  passed after tightening stale homepage and mobile-menu locators to the current UI contract.
- 2026-04-05: Cleaned the last active docs residue found during `#48` in
  [docs/SITE_CONFIG_INVENTORY.md](/Users/devin/dev/repos/json-directory-template/docs/SITE_CONFIG_INVENTORY.md)
  and
  [docs/knowledge/reference-surfaces.md](/Users/devin/dev/repos/json-directory-template/docs/knowledge/reference-surfaces.md).
  The remaining open checklist items are taxonomy-specific and stay with `#42`; no new follow-up
  issue was needed from the `#48` pass.
- [x] Keep `sitemap-index.xml` as the canonical shipped static sitemap entrypoint while preserving
  `sitemap.xml` for direct app/runtime environments and compatibility
- Additional confirmed live state as of 2026-04-05:
  homepage, product route, search, submit, sitemap, `robots.txt`, and the unversioned root
  branding assets are aligned to the current repo contract on the public domain.
- Next concrete step:
  keep any future live drift as a fresh follow-up issue instead of leaving `#41` or `#44` open as
  stale blockers.
- 2026-04-05: The final human-style audit under `#50` found one more immediate starter-surface
  cleanup bundle before the repo can be treated as a clean template default. Local fixes now
  neutralize the default sample corpus, hide placeholder GitHub/social surfaces until the starter is
  configured, keep the default submit flow gated until a real issue target is set, restore a
  site-aware listing-logo fallback, align the cookie-policy copy to the current runtime, and update
  the active starter setup docs. The audit also split the remaining residue into follow-up issues
  `#51` (proof-site/operator contract) and `#52` (legacy public compatibility assumptions).
- 2026-04-05: Verification for the local `#50` bundle passed with `pnpm validate:listings
  data/listings.json`, `pnpm test:repo`, `pnpm --filter web exec jest --runInBand
  lib/__tests__/content-loader.test.ts lib/__tests__/github-issue.test.ts
  lib/__tests__/listing-logo-presentation.test.ts lib/__tests__/site-config.test.ts`, `pnpm
  build:site -- --site default`, `pnpm generate-search-index`, and `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4317
  pnpm --filter e2e exec playwright test tests/smoke.spec.ts tests/pages.spec.ts
  tests/interactions.spec.ts --project=chromium`.
- 2026-04-05: Browser verification for the local `#50` bundle used `agent-browser` against the
  built default artifact on `http://127.0.0.1:4317/`. The homepage now renders the neutral sample
  listings (`Example API Toolkit`, `Northwind Analytics`, `Harbor Cloud`), no longer exposes
  placeholder GitHub links in the public chrome, keeps the default submit CTA disabled until the
  issue target is configured, and renders a built `404.html` that stays on-site instead of pushing
  the template repo issue flow. The old `/websites` compatibility surface is no longer treated as
  part of the active starter verification contract; it now belongs to follow-up issue `#52`.

### Phase 3. Taxonomy and discovery

- [x] Re-scope issue `#42` around the real next category set
- [x] Split implementation follow-ons across data, UI, validation, and search when needed
- [x] Add or update taxonomy/discovery tests
- [x] Update docs for supported taxonomy behavior

Acceptance:

- [x] Taxonomy work is driven by real onboarding/discovery pressure

### Phase 4. Final template cleanliness audit

- [x] Create the audit issue `#50` and split the work into reviewer lanes
- [x] Record the consolidated findings in
      [docs/knowledge/final-template-cleanliness-audit.md](/Users/devin/dev/repos/json-directory-template/docs/knowledge/final-template-cleanliness-audit.md)
- [x] File follow-up issue `#51` for proof-site/operator contract cleanup
- [x] File follow-up issue `#52` for legacy public compatibility cleanup
- [x] Publish the immediate `#50` starter-surface cleanup bundle

Acceptance:

- [x] The active default starter surface is neutral enough to treat remaining residue as explicit follow-up work

- 2026-04-05: Landed the remaining closeout contract pass for taxonomy and starter-surface cleanup.
  Added
  [docs/knowledge/taxonomy-discovery-contract.md](/Users/devin/dev/repos/json-directory-template/docs/knowledge/taxonomy-discovery-contract.md),
  made public submit explicitly single-category with maintainer-added secondary categories, made
  `pnpm validate:listings` enforce the shared taxonomy, added `pnpm validate:sites` for generic
  checked-in site validation, removed proof-site-specific site validation steps from
  `PR Review`, softened operator docs so `/operator/onboard-site` is treated as an optional local
  helper instead of the default maintainer path, and marked the legacy `/websites` shell page as a
  noindex compatibility redirect.
- 2026-04-05: Verification for this pass used `pnpm test:repo`, `pnpm validate:listings
  data/listings.json`, `pnpm validate:sites`, `pnpm build:site -- --site default`, and
  `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3318 PLAYWRIGHT_PORT=3318 pnpm --filter e2e exec
  playwright test tests/smoke.spec.ts --project=chromium --grep "default starter submit flow stays
  disabled until the GitHub issue target is configured|news alias still redirects to the supported
  public surface"` plus `--grep "core public MVP routes load successfully"`.

### Later. Storage/runtime expansion

- [x] Re-scope issue `#39` as later architecture/spec work
- [ ] Do not start D1/Postgres/runtime workflow work until the JSON-first closeout and next proof site are complete
- [ ] Document any hosted write-back model before implementation work starts

Acceptance:

- [ ] Storage/runtime expansion is clearly separated from MVP closeout

## Audit-driven findings to keep visible

- [x] `.all-contributorsrc` is stale and should be treated as `MVP-now` root metadata cleanup
- [x] `CLAUDE.md` is still carrying `llmstxt` scaffolding and should be treated as active operator-facing residue
- [x] `lychee.toml` still points at `thedaviddias/llms-txt-hub` and should be treated as `MVP-now`
- [x] Active tests still assert old `/websites` and old issue-submit targets in places that need deliberate review
- [x] Internal names such as `@thedaviddias/*`, `llms-txt-hub-favorites`, and root-discovery helpers are real residue but need scoped classification before cleanup

## Working rules for this queue

- [x] Keep tests attached to every behavior change
- [x] Keep doc updates attached to every cleanup chunk
- [x] Add newly discovered residue to the audit doc and this tracker instead of letting it float in chat
- [x] Verify user-facing behavior before calling a cleanup task done
