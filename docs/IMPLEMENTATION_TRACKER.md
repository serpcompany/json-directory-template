# Implementation Tracker

This doc turns the current closeout plan into the active execution queue.

## Current truth

- [x] JSON/static remains the MVP publishing model
- [x] The GitHub-issue submit flow remains the MVP submission bridge
- [x] The whole-repo wash audit is now the first closeout phase
- [x] `serpdownloaders.com` is the active live proof-site target for closeout
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
- [ ] Review active workflow/config assumptions that still point at legacy website-authoring paths
- [x] Update docs/runbooks together with every cleanup chunk
- [x] Add or update tests for every changed behavior

Acceptance:

- [ ] No `MVP-now` residue remains on public, operator, or root metadata surfaces

### Phase 1. MVP closeout verification

- [ ] Run the closeout checklist for `default`
- [ ] Run the closeout checklist for `serpdownloaders.com`
- [x] Verify the final sitemap/robots artifact contract
- [x] Verify site-owned GTM is present for `serpdownloaders.com` production output and absent on non-GTM sites
- [x] Record real command outcomes and manual checks in the checklist
- [ ] Run the browser closeout sweep with `agent-browser` for each verified site
- [ ] Open explicit follow-up issues for any failed or intentionally deferred items

Acceptance:

- [ ] MVP closeout is backed by evidence, not assumed from previous implementation issues

### Phase 2. Live proof site: `serpdownloaders.com`

- [ ] Retitle/rewrite issue `#41`
- [x] Run the first live comparison pass against `serpdownloaders.com`
- [x] Compare live behavior against the current built artifact
- [ ] Spot-check homepage, listing detail, search, submit, sitemap, and robots on the live site
- [ ] Capture shared-contract gaps as separate follow-up issues
- [ ] Update docs with live proof-site notes and verification

Acceptance:

- [ ] `serpdownloaders.com` stands as the real second proof of concept for the current JSON/shared contract

Notes:

- `serpdownloaders.com` remains the active real-site verification target for the current closeout pass.
- `serp.software` stays available in-repo as an additional multi-site proof config, but it is not the board-tracked proof target.
- Current confirmed live drift:
  homepage title is still the old `Websites, Tools, and Resources` contract, `/products/123movies-downloader`
  is still 404 live, `robots.txt` still serves the old content-signals file, and `/search/` still renders
  `Directory Starter`.

### Phase 3. Taxonomy and discovery

- [x] Re-scope issue `#42` around the real next category set
- [ ] Split implementation follow-ons across data, UI, validation, and search when needed
- [ ] Add or update taxonomy/discovery tests
- [ ] Update docs for supported taxonomy behavior

Acceptance:

- [ ] Taxonomy work is driven by real onboarding/discovery pressure

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
