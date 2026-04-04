# JSON-First MVP Closeout Plan

## Goal

Finish the MVP with a truthful static/JSON contract, a washed repo surface, and a clear queue for the work that comes after MVP.

Execution tracking lives in:

- [docs/IMPLEMENTATION_TRACKER.md](/Users/devin/dev/repos/json-directory-template/docs/IMPLEMENTATION_TRACKER.md)
- [docs/knowledge/whole-repo-wash-audit.md](/Users/devin/dev/repos/json-directory-template/docs/knowledge/whole-repo-wash-audit.md)
- [docs/SITE_CONFIG_REFACTOR_QA_CHECKLIST.md](/Users/devin/dev/repos/json-directory-template/docs/SITE_CONFIG_REFACTOR_QA_CHECKLIST.md)

## Locked decisions

- [x] Keep the MVP on the current JSON/static publishing model
- [x] Keep the GitHub-issue submit flow as the MVP submission path
- [x] Use `serpdownloaders.com` as the live proof site for MVP closeout
- [x] Keep D1/Postgres, self-serve submissions, paid promoted spots, and other hosted-product work out of the MVP closeout lane

## Phase order

### Phase 0. Whole-repo wash audit

- [x] Produce one audit artifact with exact file evidence and cleanup buckets
- [x] Classify residue into:
      `MVP-now`, `post-MVP`, `internal-only`, `archive/reference`
- [x] Seed the audit with known residue:
      `.all-contributorsrc`, `CLAUDE.md`, root `package.json`, `lychee.toml`, stale `/websites` and old issue-url test assumptions, old `packages/content/data/websites/**` assumptions, and internal `@thedaviddias/*` / `llms-txt-hub` references
- [x] Reset the plan/tracker/checklist docs so they point at the same next steps

Acceptance:

- [x] The audit explains what must change before MVP closeout versus what can wait
- [x] The main planning docs no longer describe an old branch-era implementation pass

### Phase 1. MVP-now wash execution

- [x] Clean public-facing and operator-facing residue found in the audit
- [x] Clean root metadata/config surfaces that still misstate the repo or old brand
- [x] Update active tests and workflows that still enforce stale route or issue-url assumptions
- [x] Add the small MVP-now closeout cards for sitemap/robots verification and optional GTM verification under `#43`
- [x] Update docs/runbooks in the same change sets so cleanup does not drift back into chat
- [x] Add or update tests for every behavior change made during the wash pass
- [x] Verify any user-facing changes end to end before marking them done

Acceptance:

- [ ] Public, operator, and root metadata surfaces no longer leak stale brand or stale flow assumptions
- [ ] The remaining residue is either intentionally deferred or parked in archive/reference areas

### Phase 2. MVP truth and verification closeout

- [ ] Run the closeout checklist against the active static contract
- [x] Verify the shipped `sitemap.xml`/`sitemap-index.xml`/`robots.txt` contract in the built artifact
- [x] Verify site-owned GTM behavior for `serpdownloaders.com` production output and absence on non-GTM sites
- [x] Verify `default` and `serpdownloaders.com` with real validate/build runs
- [ ] Complete manual spot-checks for homepage, listing detail, search, and submit behavior where applicable
- [ ] Turn any failure or unverified item into an explicit follow-up issue instead of leaving it in a doc only
- [ ] Update docs with the actual verification outcome, not placeholder boxes

Acceptance:

- [ ] [docs/SITE_CONFIG_REFACTOR_QA_CHECKLIST.md](/Users/devin/dev/repos/json-directory-template/docs/SITE_CONFIG_REFACTOR_QA_CHECKLIST.md) has real pass/fail outcomes
- [ ] MVP closeout status is evidence-based instead of inferred from old issue history

Scope note:

- The active real-site verification lane is `serpdownloaders.com`.
- `serp.software` remains in this repo as an additional multi-site proof config.
- The board-tracked proof target is still `serpdownloaders.com` because it is the live site.

### Phase 3. `serpdownloaders.com` live proof-site closeout

- [ ] Retitle and keep issue `#41` as the `serpdownloaders.com` live proof-site issue
- [ ] Run the live closeout pass against `serpdownloaders.com`
- [ ] Spot-check homepage, listing detail, search, submit, sitemap, and robots behavior on the real site
- [ ] Compare the live site against the current local build/artifact contract
- [ ] Split any newly discovered shared-contract gaps into follow-up issues instead of hiding them in ad hoc fixes
- [ ] Update docs with the live proof-site findings and verification notes

Acceptance:

- [ ] `serpdownloaders.com` is the real second proof of concept for the current JSON/shared contract

### Phase 4. Taxonomy and discovery follow-up

- [ ] Run the taxonomy/discovery pass after the next proof-site work unless onboarding proves it is the blocker first
- [ ] Define the next category set to support
- [ ] Split follow-on data, UI, validation, and search work into narrow implementation issues
- [ ] Add or update tests covering taxonomy normalization and discovery behavior
- [ ] Update docs so supported category behavior matches the code and issue queue

Acceptance:

- [ ] Taxonomy work is tied to real onboarding/discovery needs, not broad speculation

### Later. Hosted and storage expansion

- [ ] Keep badge/embed generation as a possible static-lane enhancement later
- [ ] Keep self-serve submission, paid promoted spots, sponsor inventory, Stripe checkout, and moderation/admin workflows in a hosted lane
- [ ] Revisit storage/runtime expansion only after the JSON-first MVP closeout and next proof-site pass are complete
- [ ] Document any future hosted write-back model before implementation work starts

Acceptance:

- [ ] Hosted work remains a separate product lane and does not distort the MVP static contract

## GitHub sequencing

- [x] `#43` owns the whole-repo wash audit plus the JSON-first closeout sequence
- [x] `#41` stays blocked until the wash pass and MVP closeout are in good shape
- [x] `#42` stays downstream of the proof-site pass unless taxonomy becomes the blocker
- [x] `#39` is treated as later architecture/spec work, not as the gate in front of MVP closeout

## Working rules for this closeout pass

- [x] Keep tests and doc updates attached to every cleanup chunk
- [x] Prefer classification before cleanup when a residue surface could be risky
- [x] Keep archive/reference material clearly marked instead of half-cleaning it into active paths
- [x] Do not let future hosted/database ideas reopen the MVP publishing contract
