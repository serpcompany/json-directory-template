# Browser Closeout Sweep

Use `agent-browser` to verify each active site like a real user before calling the JSON-first MVP closeout complete.

## Required sweep

For each verified site:

- open the homepage and confirm branding, hero copy, and primary navigation are coherent
- run a search from the homepage and confirm results load
- open one listing detail page through the public listing route
- open the submit page and confirm the GitHub-issue flow still makes sense
- open privacy, terms, and cookies pages
- open `robots.txt` and confirm it points at the correct sitemap entrypoint for that environment
- for both direct app/runtime environments and shipped static artifacts, expect `sitemap-index.xml` to be the canonical entrypoint
- confirm `sitemap-index.xml` resolves and reflects sitemap-index output
- confirm `sitemap.xml` also resolves as the compatibility twin
- confirm disabled optional routes are not publicly available when their feature flags are off
- confirm GTM is absent for sites without a checked-in `analytics.gtmId`
- if a site is configured with `analytics.gtmId`, confirm the GTM script and noscript iframe render in production output
- note any stale copy, stale redirects, broken layouts, broken forms, or dead links

## Default-site route expectations

For `default`, treat these as core public routes:

- `/`
- `/about`
- `/search`
- `/submit`
- `/legal/privacy`
- `/legal/terms`
- `/legal/cookies`
- `/listing/[slug]`

For `default`, treat these as disabled unless the site config changes:

- `/login`
- `/account`
- `/favorites`
- `/docs`
- `/posts`
- `/network`

Legacy aliases such as `/websites` and `/news` may still exist, but they are not part of the core starter route set.
Do not treat `/websites` as a required closeout behavior unless a site intentionally keeps that compatibility surface.

## Recording outcomes

- record which site was checked
- record the exact paths exercised
- record whether an issue was fixed now, explicitly deferred, or split into a follow-up issue
- if `agent-browser` stalls in the local shell, rerun the check on an isolated dev port with a targeted Playwright pass and record the fallback command plus the reason it was needed
