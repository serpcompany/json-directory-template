---
name: badge-verification-submission-flow
status: completed
created: 2026-04-05T11:57:18Z
updated: 2026-04-05T13:47:35Z
progress: 100%
prd: .claude/prds/badge-verification-submission-flow.md
github: https://github.com/serpcompany/json-directory-template/issues/57
---

# Epic: badge-verification-submission-flow

## Overview

Replace the dead-end GitHub-issue redirect with a self-service badge verification loop. Submitters get a badge snippet immediately; placing the badge on their site is the verification signal. A serverless crawl endpoint checks for badge presence and promotes verified submissions. Directory owners use a CLI script to publish verified submissions to `data/listings.json`.

All new code fits inside the existing Next.js app and static data layer — no new infra required.

## Architecture Decisions

1. **Token = URL-slug + timestamp hash**: Keeps tokens deterministic and avoids UUID sprawl. Short enough to embed in the badge `alt` attribute and the `data-token` attribute on the HTML snippet.

2. **Badge SVGs as static build artifacts**: Per-site SVGs generated at build time from `site-config.ts`. Template is ported from nexty-monorepo (153×44px, light/dark). No runtime image generation.

3. **Submissions as JSON files**: `data/submissions-pending.json` and `data/submissions-verified.json`. These are gitignored from main but can be synced to a private branch. No database required for MVP.

4. **Verification via Next.js API route**: `POST /api/verify-badge` runs as a standard Next.js serverless function. Fetches the submitter's URL server-side, scans HTML for the token string, returns `{ verified, message }`.

5. **Admin via CLI script**: `scripts/submissions.ts` — directory owners don't need a web UI for MVP. `pnpm submissions publish <token>` appends to `data/listings.json`.

6. **No breaking changes to existing flow**: GitHub issue redirect path stays. The new flow is the default; the old path is a fallback.

## Technical Approach

### Frontend Components

- **`SubmitForm` (modified)**: After validation, POSTs to `/api/submit` instead of redirecting to GitHub. On 200, redirects to `/submit/verify?token=<token>`.
- **`VerifyPage` (`/submit/verify`)**: Shows badge embed code (HTML snippet + SVG URL), light/dark toggle, copy button, "Verify Now" button. Calls `/api/verify-badge` on click. Shows success/error state.
- **`BadgePreview`**: Renders the live SVG inline for preview (uses `<img>` tag pointing to `/badge/<site-id>-light.svg`).
- **Badge SVG template**: A TS string template that generates the 153×44px SVG from `{ siteName, siteId, logoBase64 }`. Run at build time, written to `public/badge/`.

### Backend Services

- **`POST /api/submit`**: Validates form input (Zod), generates token, writes to `data/submissions-pending.json`, returns `{ token }`.
- **`POST /api/verify-badge`**: Reads token → finds submission → fetches submitter URL → scans for token → updates JSON files → returns result.
- **`scripts/submissions.ts`**: CLI for `list-pending`, `list-verified`, `publish <token>`.
- **`scripts/generate-badges.ts`**: Build-time script; reads all site configs, writes SVGs to `public/badge/` per site.

### Infrastructure

- All endpoints: standard Next.js API routes (no edge runtime required — server-side fetch is fine).
- Badge assets: committed static files in `apps/web/public/badge/` — served by CDN at build time.
- JSON data files: committed to repo root `data/` (existing pattern).

## Implementation Strategy

Work streams are largely sequential due to shared data contract:

1. **Data contracts first** — define the JSON schemas for pending/verified submissions. Unblocks everything else.
2. **Badge generation** — static SVG template + build script. Parallel with step 3.
3. **Submit API + form** — replace redirect with API call + token flow.
4. **Verify page + badge preview** — UI for step 2 of the submitter flow.
5. **Verify API** — crawl endpoint. Depends on data contract (step 1).
6. **Admin CLI** — `submissions.ts` script. Depends on data contract (step 1) and verified JSON format.
7. **Integration + wiring** — connect all pieces, test end-to-end, write docs update.

## Task Breakdown Preview

| # | Task | Parallel? | Depends On |
|---|------|-----------|------------|
| 1 | Define submission JSON schemas + Zod types | — | — |
| 2 | Badge SVG template + `generate-badges.ts` build script | Yes (with 3) | 1 |
| 3 | `POST /api/submit` — form ingest + token write | Yes (with 2) | 1 |
| 4 | `VerifyPage` + `BadgePreview` UI components | — | 2, 3 |
| 5 | `POST /api/verify-badge` — crawl + status update | — | 1, 3 |
| 6 | `scripts/submissions.ts` admin CLI | — | 1 |
| 7 | Wire + integration: form → verify flow, e2e smoke test | — | 4, 5 |

## Dependencies

- `apps/web/components/forms/github-issue-submit-form.tsx` — existing form to be modified.
- `sites/types.ts` — SiteConfig type; badge generator reads `siteName` from here.
- `data/listings.json` — append target for `publish` command.
- nexty-monorepo badge design reference (copy SVG template, do not import package).

## Success Criteria (Technical)

- `pnpm generate:badges` writes correct SVG files to `public/badge/` for each configured site.
- `POST /api/submit` returns 200 with `{ token }` for valid input; 400 for invalid.
- `POST /api/verify-badge` returns `{ verified: true }` when token is present in fetched HTML.
- `pnpm submissions publish <token>` appends a well-formed listing record to `data/listings.json`.
- Verify page renders badge preview, copy button works, "Verify Now" shows success/error within 10s.

## Estimated Effort

~7 tasks, ~3–4 days of focused work. Tasks 2 and 3 can run in parallel.
