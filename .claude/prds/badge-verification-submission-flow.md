---
name: badge-verification-submission-flow
description: Replace the manual GitHub-issue submission flow with a badge-based self-verification system where submitters earn their listing by proving badge placement on their site.
status: backlog
created: 2026-04-05T11:55:19Z
---

# PRD: badge-verification-submission-flow

## Executive Summary

The current submission flow is fully manual: a submitter fills out a form, GitHub redirects them to create an issue, and a directory owner manually reviews and adds the listing. There is no spam filter, no self-service path, and no signal that the submitter has real skin in the game.

This feature replaces that with a badge-first verification loop:

1. Submitter fills the form and gets a unique badge embed snippet (SVG + HTML).
2. They place the badge on their site (footer, homepage — visible to their own visitors).
3. Our system crawls their URL, confirms the badge is present, and auto-upgrades their submission to **verified**.
4. Directory owners see a clean inbox: verified submissions are ready to publish; unverified are held.
5. Publishing is one-click: merges the record into `data/listings.json` and triggers a rebuild.

The badge placement acts as a trust signal. Spam submitters won't bother placing a badge on a real site.

---

## Problem Statement

**For submitters**: The current flow drops them at a GitHub issue form mid-stream. There is no confirmation, no feedback, no next step they can act on immediately.

**For directory owners**: Every submission lands as a raw GitHub issue with no quality filter. Evaluation is entirely manual. There is no distinction between "probably real" and "definitely not real".

**For directory credibility**: No badge = no backlink = no SEO signal for the directory. The current flow forfeits that value entirely.

---

## User Stories

### Submitter: Product Maker

> **As a product maker**, I want to submit my product and receive a badge I can display on my site so that I can complete verification on my own without waiting for a human to contact me.

Acceptance criteria:
- After filling the submission form, I immediately see my badge embed code (HTML snippet and direct SVG URL).
- I can copy the snippet in one click.
- The page tells me exactly what to do next: paste the code, visit my site, click "Verify".
- When I click "Verify", I see a clear success or failure message within 10 seconds.
- On success, my submission status updates to "verified" and I know a review is underway.

### Directory Owner: Site Maintainer

> **As a directory owner**, I want to see a filtered inbox of verified submissions so I can publish quality listings with minimal manual effort.

Acceptance criteria:
- I can visit an admin page (or run a script) and see all pending submissions separated into: verified vs. unverified.
- Each verified submission shows: name, URL, category, badge placement URL, timestamp.
- Publishing a verified submission appends it to `data/listings.json` and triggers a site rebuild.
- I do not need to touch GitHub issues to manage the core workflow.

### Site Visitor: End User

> **As a visitor to a listed product's website**, I can see the "Featured on [directory]" badge and click it to visit the directory, building trust in both the product and the directory.

Acceptance criteria:
- Badge is visible and links back to the directory.
- Badge is available in light and dark variants.
- Badge renders correctly on any page background (no broken images, no CORS errors).

---

## Functional Requirements

### FR-1: Submission Form (Enhanced)
- Existing form fields retained: name, website URL, category, description.
- Form generates a **submission token** (UUID or short hash derived from website URL + timestamp) on submit.
- Token is embedded in the badge snippet and stored in a pending submissions file (`data/submissions-pending.json`).
- After submit, user is redirected to `/submit/verify?token=<token>` — not to GitHub.

### FR-2: Verify & Publish Page (`/submit/verify`)
- Shows the submitter's name and website URL for confirmation.
- Step 1: Display embed code — an HTML `<div>` with a `<img>` tag pointing to the hosted SVG badge URL, plus a "Copy" button.
- Step 2: Optionally display a lightweight JS script tag (mirrors code.market UX) that pings our verification endpoint.
- Light/dark badge toggle (mirrors nexty-monorepo badge design — 153×44px, "Featured on [site name]").
- "Verify Now" button triggers the crawl check.
- Troubleshooting section: "Make sure the badge is visible on your page — not hidden by CSS or loaded behind auth."

### FR-3: Badge SVGs (Static Assets)
- Each site gets two badge SVGs: `featured-on-<site-id>-light.svg` and `featured-on-<site-id>-dark.svg`.
- Badge design matches nexty-monorepo template: 153×44px, rounded, icon + "FEATURED ON" + site name.
- SVGs are committed to `public/badge/` of each site build.
- Per-site badge is generated at build time from `site-config.ts` (site name, logo).

### FR-4: Verification Endpoint (Edge/Serverless Function)
- `POST /api/verify-badge` accepts `{ token: string }`.
- Looks up the token in `data/submissions-pending.json` to get the submitter's URL.
- Fetches the submitter's URL (server-side, bypasses CORS), searches HTML for the token string.
- Returns `{ verified: boolean, message: string }` within 10 seconds.
- On success: writes the submission record into `data/submissions-verified.json`, removes from pending.
- Rate-limited: max 5 verify attempts per token.

### FR-5: Submissions Data Contract
- `data/submissions-pending.json` — array of pending submission objects:
  ```json
  {
    "token": "abc123",
    "name": "My Product",
    "website": "https://myproduct.com",
    "category": "developer-tools",
    "description": "Short description.",
    "submittedAt": "2026-04-05T12:00:00Z",
    "verifyAttempts": 0
  }
  ```
- `data/submissions-verified.json` — same shape + `verifiedAt` field.
- Both files are gitignored in the live data path; directory owners pull locally or via a sync script.

### FR-6: Admin View (Directory Owner Tooling)
- CLI script `scripts/submissions.ts` — commands: `list-pending`, `list-verified`, `publish <token>`.
- `publish <token>` reads the verified submission, appends to `data/listings.json`, and marks it as published in `submissions-verified.json`.
- No GUI required for MVP; a future hosted lane can add a web UI.

---

## Non-Functional Requirements

- **Static-first**: Badge SVGs are static files, no runtime image generation.
- **Edge-compatible**: Verification endpoint runs as a Netlify/Vercel edge function or standard serverless function — no persistent server.
- **Privacy**: The crawl only fetches the publicly visible page of the submitter's site. No auth tokens, no cookies.
- **Resilience**: If the crawl times out, the verifier returns a graceful error — "We couldn't reach your site. Make sure it's live and try again."
- **Zero new dependencies** for the SVG generation path — badges are templated at build time using existing TS scripts.

---

## Success Criteria

1. A new submitter can complete the full flow (form → badge embed → verify) in under 5 minutes.
2. ≥80% of verified submissions contain the badge token when crawled (i.e., false-positive rate ≤20%).
3. Directory owner can publish a verified listing in ≤2 minutes using the CLI script.
4. Badge SVGs are served from the same CDN as the rest of the static site (no external image host required).
5. Zero spam listings in `data/listings.json` originating from this flow within the first 30 days.

---

## Constraints & Assumptions

- **Static-first**: The project is JSON-first / static-first. No database. Submission state lives in checked-in JSON files.
- **Serverless only**: The verify endpoint must work in a serverless/edge context (Netlify Functions or Next.js API routes in edge runtime).
- **Badge design**: Reuse the existing nexty-monorepo badge SVG template (153×44px, light/dark) — do not design from scratch.
- **Token storage**: Tokens live in JSON files on the filesystem (or committed to a private branch). No Redis, no KV store for MVP.
- **GitHub issues not removed**: The current GitHub issue flow can remain as a parallel path; this is additive.

---

## Out of Scope

- Paid placement or featured listing tiers (later hosted lane).
- Email notifications to submitters (no email infra in scope).
- OAuth or account-based dashboards for submitters.
- Automated rebuild triggers via webhook (directory owner runs rebuild manually or on schedule).
- Multi-site badge variants beyond light/dark (e.g., animated, seasonal).
- Removing the existing GitHub issue submission form.

---

## Dependencies

- Existing nexty-monorepo badge SVG templates (copy design, do not import package).
- Netlify Functions or Next.js API routes (already in use in the project).
- `data/listings.json` append contract (already established).
- `sites/<id>/site-config.ts` for site name and logo used in per-site badge generation.
