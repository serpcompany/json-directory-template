# Whole-Repo Wash Audit

## Purpose

Find and classify stale brand, stale workflow, and stale contract residue before finishing the JSON-first MVP sprint.

This is not the implementation queue by itself. It is the evidence file that tells us:

- what must be cleaned now
- what can wait until after MVP
- what is internal-only and needs a scoped refactor
- what should stay archived or reference-only

## Bucket definitions

### `MVP-now`

Active public, operator, test, workflow, or root metadata surfaces that can confuse the product story or mislead the next cleanup pass.

### `post-MVP`

Real cleanup work that matters, but does not need to block the MVP closeout once it is documented clearly.

### `internal-only`

Names, helpers, package namespaces, or migration-risk internals that need a scoped refactor instead of a quick sweep.

### `archive/reference`

Legacy or intentionally parked material that should stay clearly marked rather than being partially cleaned into active paths.

## Findings

| Surface | Evidence | Bucket | Why it matters | Recommended action |
| --- | --- | --- | --- | --- |
| Root contributor metadata | `.all-contributorsrc` still says `SERP Apps` and includes stale contributor entries such as `Onlyfans Downloader` | `MVP-now` | This is an active root metadata file and it tells operators the repo was not fully washed | Clean or remove the file and decide whether contributor automation still belongs in the repo |
| Root package metadata | `package.json` still uses `name: "llms-txt-hub"` and carries all-contributors scripts | `internal-only` | The root package name may still be tied to workspace/tooling assumptions, so this is risky to rename casually | Split a scoped internal refactor before changing the root package name; decide separately whether contributor scripts stay |
| Root link-checker config | `lychee.toml` base still points at `https://github.com/thedaviddias/llms-txt-hub/` | `MVP-now` | Active repo tooling should not point at the old repo | Update the base and exclusions so link checks reflect the current repo |
| Root operator instructions | `CLAUDE.md` still contains `llmstxt` scaffolding markers | `MVP-now` | This is an active operator-facing file and it signals stale repo assumptions | Replace the old scaffold with repo-appropriate guidance or remove it if no longer needed |
| Planning docs | `docs/PLAN.md`, `docs/IMPLEMENTATION_TRACKER.md`, and the QA checklist were still describing a past branch-era pass | `MVP-now` | The closeout queue was no longer trustworthy | Reset the docs first, then keep them in sync with issue/project state |
| Active end-to-end tests | `apps/e2e/tests/*.spec.ts` still assert `/websites` routes and the old `thedaviddias/llms-txt-hub` issue target in places | `MVP-now` | Tests can silently lock the repo to stale public behavior | Review each assertion and keep only the ones that are still intentional |
| Active workflow/test assumptions around legacy source paths | `.github/workflows/pr-review.yml`, `.github/labeler.yml`, `scripts/pr-triage.ts`, `scripts/check-frontmatter.ts`, and some tests still reference `packages/content/data/websites/**` | `MVP-now` | The repo already treats that corpus as legacy/reference, so active workflow guidance must be consistent | Clean active docs/checks that still frame the legacy corpus as the main authoring path |
| Favorites browser storage key | `apps/web/contexts/favorites-context.tsx` still uses `llms-txt-hub-favorites` | `post-MVP` | This is user-stateful and should not be renamed silently during closeout | Keep the current key for compatibility and plan an explicit migration if we ever rename it |
| Monorepo root discovery helper | `packages/utils/content-paths.ts` still walks upward until it finds `llms-txt-hub` | `internal-only` | This can block later repo/package renames and is too risky for an ad hoc cleanup | Refactor the helper to use a repo-neutral marker before any root package rename |
| Workspace package namespace | active packages and imports still use `@thedaviddias/*` | `internal-only` | This is broad internal naming residue with high blast radius | Classify package-by-package and only rename with a dedicated migration plan |
| CLI/generator surfaces | `packages/cli/**` and `packages/generator/**` still describe `llms-txt-hub` and registry behavior | `post-MVP` | Real residue, but separate from the static directory MVP closeout | Decide whether those packages remain in scope for this repo before cleaning them |
| Archive and knowledge references | `_archive/**`, `docs/knowledge/*`, and legacy route audits still mention old `/websites` and upstream repo details | `archive/reference` | Historical context is still useful as long as it is clearly marked | Leave archived/reference material intact unless a file is still presented as current guidance |

## What changes now versus later

### Do now

- clean active root metadata and operator-facing residue
- clean active docs and tests that still enforce stale repo or workflow assumptions
- keep the MVP closeout docs and issue queue synchronized

### Defer intentionally

- storage-key migrations
- root package rename
- wide workspace namespace rename
- CLI/generator repositioning

### Keep archived

- intentionally parked `_archive/**` material
- reference-only legacy website corpus
- historical knowledge docs, as long as they are not linked as the current source of truth

## Downstream issue mapping

- `#43` should own this audit and the closeout ordering
- `#47` should own the active workflow/test cleanup for legacy website-authoring assumptions
- `#48` should follow `#47` for the remaining default-site closeout verification
- `#42` should stay after the remaining closeout pass unless taxonomy becomes the blocker
- `#39` should move to the later architecture/spec lane

## Verification notes for this audit

- Root metadata evidence reviewed:
  `.all-contributorsrc`, `package.json`, `lychee.toml`, `CLAUDE.md`
- Active residue scan reviewed with:
  `rg -n --glob '!archive/**' --glob '!node_modules/**' --glob '!dist/**' --glob '!coverage/**' --glob '!tmp/**' 'thedaviddias/llms-txt-hub|llms-txt-hub|packages/content/data/websites|/websites\\b|@thedaviddias/' .`
- Representative internal-risk examples reviewed:
  `apps/web/contexts/favorites-context.tsx`, `packages/utils/content-paths.ts`
