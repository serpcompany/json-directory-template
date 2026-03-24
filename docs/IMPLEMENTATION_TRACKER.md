# Implementation Tracker

This doc turns [docs/PLAN.md](/Users/devin/dev/repos/json-directory-template/docs/PLAN.md) into branch-ready execution work.

## Current branch

- [x] Working branch: `plan/multi-site-directory-next`
- [x] Finalize early decisions below before starting implementation
- [ ] Split the first 3 execution chunks into GitHub issues if we want issue-level tracking

## Recommended decisions

- [x] Treat JSON as the primary website source of truth for the next phase
- [x] Keep MDX supported for docs, guides, legal, and any legacy website migration path only
- [x] Build one site per workflow run for now
- [x] Keep target repos dumb static outputs only for the first generalized deploy model
- [x] Preserve required target-managed files only:
  Pages workflow, CNAME, and any explicitly configured keep-list entries
- [x] Treat auth/submission as an optional hosted add-on, not a core requirement for the generalized static pipeline
- [x] Treat the current GitHub issue submit flow as a bridge feature until the hosted direction is decided
- [x] Treat `github-pages-repo-sync` as the first stable deploy strategy

## Execution order

### Chunk 0. Plan-shaping audit

- [x] Capture repo-evidence notes for:
  MDX-first assumptions, single-site assumptions, hardcoded starter defaults, workflow/docs mismatches
- [x] Update [docs/PLAN.md](/Users/devin/dev/repos/json-directory-template/docs/PLAN.md) only if those findings materially change scope or sequencing
- [x] Write a short audit summary doc or issue checklist for reference during implementation

Acceptance:
- [x] We can explain the chosen source-of-truth model, single-site workflow model, and deploy model without ambiguity
- [x] The audit did not surface any missing blocker that changes Phase 1 to Phase 3 ordering

### Chunk 1. Lock the source-of-truth model

- [x] Decide and document whether `data/websites.json` is generated output, editable source, or build intermediate
- [x] Decide the role of `packages/content/data/websites/**`
- [x] Update [data/README.md](/Users/devin/dev/repos/json-directory-template/data/README.md)
- [x] Update workflow/docs references that still describe MDX-only website authoring
- [x] Add or update tests around the intended ingestion path

Acceptance:
- [x] Docs, workflow assumptions, and tests all point at the same content model

### Chunk 2. Define site config as the build contract

- [x] Introduce a checked-in site config shape
- [x] Document the required fields and defaults
- [x] Replace special-case env naming with generic site-aware inputs
- [x] Add tests for config parsing and validation
- [x] Update runbooks for adding a new site
- [x] Add a first explicit `BuildSpec` input path for operator-provided build bundles
- [x] Define `sites/<site-id>/` as a local, gitignored operator staging area
- [x] Add `build-spec:init` to scaffold `BuildSpec` from staged inputs
- [x] Audit what is already configurable vs what still needs to move into the site/build contract
- [x] Add a field-type pass for the contract:
  boolean vs enum vs free text vs URL vs file reference vs provider payload
- [x] Redesign the DR badge input away from low-level asset fields if the operator is really given embed/provider data

Acceptance:
- [x] A new site can be described by config instead of one-off env wiring

### Chunk 3. Generalize the build surface

- [x] Move to per-site output directories
- [x] Add site-aware validate/build commands
- [x] Make generated side artifacts site-aware where needed
- [x] Remove or isolate single-site assumptions in the current Pages build path
- [x] Add build verification coverage
- [x] Allow workflow/script entrypoints to prefer explicit `BuildSpec` input via `BUILD_SPEC_PATH`
- [x] Add concurrency-safe temp/output paths so overlapping local or CI runs do not share scratch files

Acceptance:
- [x] We can build one named site deterministically into its own output directory

### Chunk 4. Generalize deploy behavior

- [x] Define deploy strategy types and shared contract
- [x] Keep `github-pages-repo-sync` as the first implemented strategy
- [x] Add preserve rules, dry-run support, repair behavior, and rollback notes
- [x] Add deterministic post-deploy verification hooks
- [x] Document target repo lifecycle expectations

Acceptance:
- [x] Deploy behavior is explicit, testable, and no longer encoded as one special-case script path

### Chunk 5. Finish starter templatization

- [x] Remove or move remaining hardcoded brand, ownership, and marketing assumptions
- [x] Decide which content blocks are starter defaults vs per-site content
- [x] Continue cleaning residual `llms.txt`-specific language where it should now be generic
- [ ] Audit and normalize the core directory-item vocabulary:
  replace loose `website` / `product` wording with one canonical term, and decide whether the generated `/websites/...` route should stay fixed or become configurable
- [x] Update tests and starter docs to match the generalized model
- [x] Add site-config-driven feature flags for optional shell sections:
  creator projects, featured guides, developer tools, newsletter
- [x] Keep legacy creator/tool/guide content disabled by default for starter-safe builds
- [x] Finish asset staging so staged favicon/logo/OG image inputs can actually affect the build
- [x] Audit remaining active route/content surfaces and decide:
  build contract vs starter default vs site-owned content
- [x] Decide which metadata and marketing surfaces should remain starter defaults instead of expanding the contract too far
- [x] Complete a first classification pass for `/projects`, `/guides`, `/docs`, RSS, tools, communities, and website-doc surfaces
- [x] Finish the metadata/logo pass so public metadata surfaces share the staged asset URLs
- [x] Decide the long-term treatment of tools, communities, guides, docs, and website-doc/llms surfaces
- [x] Strip sourcemaps and export-debug text artifacts from the public deploy artifact by default
- [x] Remove auth, favorites, projects, docs, and guides routes from the default static artifact unless explicitly enabled
- [ ] Complete the deeper upstream audit for placeholder/demo routes against `thedaviddias/llms-txt-hub`

Acceptance:
- [x] The active starter shell is largely site-config/content driven instead of repo-brand driven

### Chunk 6. Optional hosted/product workflows

- [ ] Decide whether hosted auth/submission work belongs in this repo or a separate control plane
- [ ] Define the future moderation and write-back model
- [x] Keep this chunk blocked until the static multi-site pipeline is stable

Acceptance:
- [x] Hosted/product work no longer blocks the core static template roadmap

## Issue candidates

### Issue 1. Plan-shaping audit

- [ ] Gather repo evidence for MDX-first assumptions, single-site build/deploy assumptions, and hardcoded starter branding
- [ ] Produce a short audit artifact used to lock the plan

### Issue 2. Source-of-truth decision

- [ ] Decide JSON vs MDX role for website entries
- [ ] Align docs, workflows, and tests to that decision

### Issue 3. Site config contract

- [ ] Define the site config schema and defaults
- [ ] Add parser/validation tests

### Issue 4. Site-aware build output

- [ ] Move build output to per-site directories
- [ ] Generalize validate/build commands

### Issue 5. Deploy strategy abstraction

- [ ] Add strategy contract and preserve rules
- [ ] Keep GitHub Pages repo sync as strategy one

### Issue 6. Template cleanup sweep

- [x] Remove hardcoded starter branding and ownership assumptions from active surfaces

## Working rules for this branch

- [x] Keep tests and doc updates attached to every implementation chunk
- [x] Verify real build/deploy behavior before marking any pipeline work done
- [x] Add newly discovered cleanup tasks here during implementation instead of letting them float in chat
