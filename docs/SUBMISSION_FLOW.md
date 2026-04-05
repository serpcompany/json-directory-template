# Submission Flow

This document explains the full badge verification submission flow introduced in the
`badge-verification-submission-flow` epic. It covers how submitters add their sites and
how directory owners review and publish approved submissions.

---

## Overview

The flow replaces the old GitHub-issue-redirect approach with a self-contained API that:

1. Accepts a JSON form submission and returns a unique verification token.
2. Lets the submitter embed a badge snippet on their site.
3. Verifies that the badge (containing the token) is reachable on the public web.
4. Allows the directory owner to promote verified submissions to published listings via CLI.

---

## Generating Badge SVG Assets

Badge SVGs are statically generated from site configs and committed to the repo.  
Run once after adding a new site config, or whenever branding changes:

```bash
pnpm generate:badges
```

This produces files in `apps/web/public/badge/`:

```
featured-on-<siteId>-light.svg
featured-on-<siteId>-dark.svg
```

The badge images are then publicly served at:

```
https://<siteUrl>/badge/featured-on-<siteId>-light.svg
https://<siteUrl>/badge/featured-on-<siteId>-dark.svg
```

---

## Submit Form (POST → `/api/submit`)

The `SubmitForm` (`apps/web/components/forms/github-issue-submit-form.tsx`) POSTs
JSON to `/api/submit`:

```json
{
  "name": "My Tool",
  "website": "https://example.com",
  "category": "developer-tools",
  "description": "A longer description of the tool (min 10 chars)."
}
```

### What the API does

- Validates the request body with Zod.
- Derives a **verification token** from the hostname + a short timestamp hash.
- Writes the pending submission to `data/submissions-pending.json` (idempotent — same
  token is returned if the website was already submitted).
- Returns `{ "token": "<token>" }`.

### What happens next

- The browser is navigated to `/submit/verify?token=<token>`.

---

## Verify Page (`/submit/verify`)

The verify page (`apps/web/app/submit/verify/page.tsx`) reads `?token` from the URL
and fetches submission details from `/api/submission?token=<token>`.  
It then displays:

| Component | Purpose |
|-----------|---------|
| `BadgePreview` | Shows a live preview of the light/dark badge image. |
| `CopySnippet` | Displays the HTML embed snippet for the submitter to paste on their site. |
| `VerifyButton` | Triggers a POST to `/api/verify-badge` to check the badge is live. |

### Embed snippet format

```html
<a href="https://<siteUrl>" title="Featured on <siteName>">
  <img
    src="https://<siteUrl>/badge/featured-on-<siteId>-light.svg"
    alt="Featured on <siteName>"
    data-verify-token="<token>"
    width="153"
    height="44"
  />
</a>
```

The `data-verify-token` attribute is what the verify API looks for when it crawls the
submitter's page.

---

## Verify Badge API (`POST /api/verify-badge`)

**Request body:** `{ "token": "<token>" }`

### What it does

1. Looks up the submission in `submissions-pending.json`.
2. Increments `verifyAttempts` (max 5 before rate-limiting).
3. Fetches the submitter's website (up to 500 KB, 8 s timeout).
4. Checks the HTML for `data-verify-token="<token>"`.
5. **On success** — promotes the submission from `submissions-pending.json` to
   `submissions-verified.json` (with a `verifiedAt` timestamp) and removes it from
   pending.

**Response:**

```json
{ "verified": true,  "message": "Verified! Your submission is now in review." }
{ "verified": false, "message": "<reason>" }
```

---

## Admin CLI (`scripts/submissions.ts`)

Directory owners manage submissions via:

```bash
# List pending (awaiting verification)
pnpm submissions list-pending

# List verified (awaiting publish)
pnpm submissions list-verified

# Publish a verified submission → appends to data/listings.json
pnpm submissions publish <token>
```

### `publish <token>`

- Reads the verified submission from `data/submissions-verified.json`.
- Appends a new listing record to `data/listings.json`.
- Marks the verified submission with a `publishedAt` timestamp.
- The new listing is immediately picked up by the site on the next build.

---

## Data Flow Diagram

```
Submitter                 API / Next.js              File System
─────────                 ─────────────              ───────────

[Submit Form]
      │
      │  POST /api/submit {name, website, …}
      │ ─────────────────────────────────────►
      │                                          write → submissions-pending.json
      │◄──────────────────────────────────────
      │  { token }
      │
[Verify Page /submit/verify?token=…]
      │
      │  GET /api/submission?token=…
      │ ─────────────────────────────────────►
      │                                          read  ← submissions-pending.json
      │◄──────────────────────────────────────
      │  { name, website }
      │
[Paste badge snippet on own site]
      │
[Click "Verify badge"]
      │
      │  POST /api/verify-badge { token }
      │ ─────────────────────────────────────►
      │                         fetch submitter's page
      │                         check for data-verify-token="<token>"
      │                                          write → submissions-verified.json
      │                                          write → submissions-pending.json (remove)
      │◄──────────────────────────────────────
      │  { verified: true }
      │

Directory Owner
───────────────

pnpm submissions list-verified
                                          read  ← submissions-verified.json

pnpm submissions publish <token>
                                          write → data/listings.json
                                          write → submissions-verified.json (publishedAt)
```

---

## Smoke Test

A file-based smoke test (no running server required) can be run with:

```bash
pnpm test:submission-flow
```

The test (`scripts/test-submission-flow.ts`):

1. Verifies `generateToken` produces url-safe, unique tokens.
2. Writes a test pending submission and reads it back.
3. Checks the in-memory HTML fixture contains / does not contain the token as expected.
4. Promotes the submission from pending → verified.
5. Publishes the verified submission to `listings.json`.
6. Confirms badge SVG assets exist in `apps/web/public/badge/`.
7. Restores all data files to their pre-test state.

---

## Files Involved

| Path | Purpose |
|------|---------|
| `apps/web/app/api/submit/route.ts` | POST /api/submit — accepts form data, writes to pending |
| `apps/web/app/api/submission/route.ts` | GET /api/submission — returns submission details by token |
| `apps/web/app/api/verify-badge/route.ts` | POST /api/verify-badge — crawls submitter's site |
| `apps/web/lib/submission-token.ts` | `generateToken(website)` utility |
| `apps/web/lib/submissions-store.ts` | `readSubmissions` / `writeSubmissions` helpers |
| `apps/web/components/forms/github-issue-submit-form.tsx` | Submit form (POSTs to API) |
| `apps/web/components/verify/BadgePreview.tsx` | Badge image preview |
| `apps/web/components/verify/CopySnippet.tsx` | Embed snippet display + copy button |
| `apps/web/components/verify/VerifyButton.tsx` | Triggers POST /api/verify-badge |
| `apps/web/app/submit/verify/page.tsx` | Full verify page |
| `apps/web/public/badge/` | Generated badge SVG assets |
| `sites/submission-schema.ts` | Zod schemas + TypeScript types |
| `data/submissions-pending.json` | Pending submissions store |
| `data/submissions-verified.json` | Verified submissions store |
| `data/listings.json` | Published listings (append-only from CLI) |
| `scripts/generate-badges.ts` | Badge SVG generator |
| `scripts/submissions.ts` | Admin CLI |
| `scripts/test-submission-flow.ts` | Smoke test |
