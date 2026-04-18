# Final Template Cleanliness Audit

Historical note:

- This audit records the repo state during the cleanliness pass that produced it.
- References to `apps/web/**` and generated starter artifacts are historical snapshots.
- Use the tracker and current architecture docs for present-day ownership decisions.

Date: 2026-04-05

Parent issue: [#50](https://github.com/serpcompany/json-directory-template/issues/50)

## Goal

Answer one question with evidence: does the active template still look like a lightly rebranded OSS clone, or has it been cleaned up enough that only explicit follow-up buckets remain?

## Review lanes

The audit used separate reviewer lanes so each pass behaved like a different human reviewer:

- public surface reviewer
- template-defaults/docs reviewer
- operator workflow reviewer
- data/config/assets reviewer
- final consolidation reviewer

## Outcome

The repo is cleaner than it was at MVP closeout, but it was not ready to close the audit untouched.

The active default starter still leaked inherited identity through:

- the default sample corpus in `data/listings.json`
- the default GitHub/social/submit targets in `sites/site-config.default.ts`
- the SERP-branded listing-logo fallback in `apps/web/lib/listing-logo-presentation.ts`
- the public cookie-policy copy in `packages/content/data/legal/cookies.mdx`
- the `tmp/**` deploy trigger and the release workflow's explicit `llmstxt-cli` build surface
- browser tests that still normalized legacy route assumptions like `/websites`

## Fixed now in #50

This audit pass intentionally cleaned the active starter surfaces first:

- removed `tmp/**` from `.github/workflows/build-and-deploy.yml`
- replaced the explicit `llmstxt-cli` release filter with the package path in `.github/workflows/release.yml`
- switched `sites/site-config.default.ts` to neutral placeholder GitHub/social defaults and hid those placeholder links from the public starter until they are configured
- replaced the default starter dataset in `data/listings.json` with three neutral sample entries
- regenerated `apps/web/public/search/search-index.json` from the neutral sample dataset
- made the logo fallback site-aware in `apps/web/lib/listing-logo-presentation.ts`: `/placeholder.svg` on the default starter and `/logo.png` on checked-in proof sites
- updated the default 404 page in `apps/web/app/not-found.tsx` so the starter no longer pushes users to the template repo issue flow
- rewrote the active starter setup docs and examples that still framed setup as clone-first or proof-site-first
- aligned `packages/content/data/legal/cookies.mdx` to the current optional-auth and local-storage runtime instead of the old Clerk/OpenPanel/Vercel assumptions
- updated the active default-site Playwright expectations so they verify the neutral sample corpus, the gated submit flow, and no longer normalize `/websites` as part of the core starter contract

## Follow-up issues

### [#51](https://github.com/serpcompany/json-directory-template/issues/51) De-proof the maintainer and operator contract

Use this for residue that still treats `serpdownloaders.com` or the old parked proof sites as the normative path in CI, onboarding docs, operator docs/tests, or rebrand/runbook guidance.

Named current examples:

- `packages/content/data/docs/commands.mdx`
- `docs/ONBOARDING.md`
- `docs/examples/new-site-onboarding-sop.template-pack.json`
- any remaining proof-site-first CI or runbook surfaces discovered while working `#51`

### [#52](https://github.com/serpcompany/json-directory-template/issues/52) Retire legacy public compatibility assumptions from the starter contract

Use this for the remaining public-contract residue:

- `/websites`
- stale root legal alias metadata
- browser/docs expectations that still treat legacy aliases as supported starter behavior by default

## Owned by #42

These findings are real, but they belong to taxonomy/discovery follow-up rather than this audit:

- template taxonomy/sample-data questions
- category-shape decisions that depend on the next discovery pass

## Intentional reference-only residue

These are allowed to remain for now as long as docs/workflows stop presenting them as the default path:

- checked-in proof-site configs in `sites/index.ts`
- proof-site-specific config under `sites/serpdownloaders.com/` and parked reference material under `_archive/incubating-sites/**`

## Verification run for this audit

- `pnpm validate:listings data/listings.json`
- `pnpm test:repo`
- `pnpm --filter web exec jest --runInBand lib/__tests__/content-loader.test.ts lib/__tests__/github-issue.test.ts lib/__tests__/listing-logo-presentation.test.ts lib/__tests__/site-config.test.ts`
- `pnpm build:site -- --site default`
- `pnpm generate-search-index`
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4317 pnpm --filter e2e exec playwright test tests/smoke.spec.ts tests/pages.spec.ts tests/interactions.spec.ts --project=chromium`
- `agent-browser open http://127.0.0.1:4317/`
- `agent-browser open http://127.0.0.1:4317/404.html`

## Closeout recommendation

`#50` can close once the immediate starter-surface fix bundle is published and the follow-up issues remain linked.

`#43` should stay open.

It still owns:

- `#42` taxonomy/discovery follow-up
- `#50` final audit closeout
- `#51` proof-site/operator contract cleanup
- `#52` legacy public compatibility cleanup
