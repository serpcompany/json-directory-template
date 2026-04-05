# Submission Flow

Self-service badge verification flow. Submitters place a badge on their site as proof of intent; the directory verifies the backlink and auto-publishes the listing.

---

## How it works

1. Submitter fills out `/submit` → POSTs to `/api/submit` → gets a token
2. Submitter lands on `/submit/verify?token=...` → copies the badge embed snippet
3. Submitter places the snippet on their site (any public HTML page)
4. Submitter clicks **Verify Now** → `/api/verify-badge` crawls their page, checks for a backlink to the directory domain
5. On success: listing is auto-appended to `data/listings.json`, pages are revalidated, submitter sees a link to their live listing

---

## Submit form fields

| Field | Required | Notes |
|---|---|---|
| Name | ✅ | Listing display name |
| Website URL | ✅ | Must be a valid URL |
| Category | ✅ | Single primary category |
| Short Description | ✅ | One-liner, shown in cards |
| Full Description | — | Markdown, shown on detail page |
| Resource Links | — | Up to 5 label+url pairs |

---

## Badge embed snippet

The verify page generates this snippet (domain is resolved at runtime from `window.location.origin`):

```html
<a href="https://yourdomain.com" target="_blank" title="Featured on Directory Name">
  <img
    src="https://yourdomain.com/badge/featured-on-default-light.svg"
    alt="Featured on Directory Name"
    data-verify-token="<token>"
    width="200" height="54"
  />
</a>
```

The `data-verify-token` attribute ties the snippet to the submission. Verification checks for a backlink (`<a href>`) pointing to the directory domain — not the token itself — so entity-encoded or JS-rendered pages still pass.

---

## Verification logic (two-pass)

**Pass 1 — raw HTML + cheerio**
- Fetches the submitter's URL with `DirectoryVerifier/1.0` user-agent
- Decodes HTML entities (`&quot;` → `"`)
- Parses with cheerio, checks `$('a[href*="yourdomain.com"]').length > 0`

**Pass 2 — Playwright headless fallback**
- Runs only when pass 1 fails
- Full browser render (`networkidle`), same link check on the live DOM
- Handles JS-rendered pages and page builders that rewrite HTML

---

## Generating badge SVG assets

Run once after adding a new site config or changing branding:

```bash
pnpm generate:badges
```

Writes to `apps/web/public/badge/`:
- `featured-on-<site-id>-light.svg`
- `featured-on-<site-id>-dark.svg`

---

## Admin CLI

```bash
pnpm submissions list-pending     # view incoming queue
pnpm submissions list-verified    # view verified, see published status
pnpm submissions publish <token>  # manually publish a verified submission
```

`publish` appends a listing record to `data/listings.json` — use this if you want manual review before publish instead of auto-publish.

---

## Weekly badge re-check (cron)

A GitHub Actions workflow runs every Monday at 9am UTC and hits `/api/cron/check-badges`.

**Required GitHub secrets:**
- `SITE_URL` — your production domain (e.g. `https://yourdomain.com`)
- `CRON_SECRET` — a random secret string (generate with `openssl rand -hex 32`)

The endpoint checks every published listing's website for a backlink. Returns a JSON report of which listings are missing the badge. Manual trigger available from the Actions tab.

---

## Data files

| File | Purpose |
|---|---|
| `data/submissions-pending.json` | Submitted, awaiting verification |
| `data/submissions-verified.json` | Verified, pending or published |
| `data/listings.json` | Published listings shown on frontend |

All three are committed to the repo. Real submission data should live on a private branch.
