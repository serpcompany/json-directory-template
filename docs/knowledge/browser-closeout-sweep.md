# Browser Closeout Sweep

Use `agent-browser` to verify each active site like a real user before calling the JSON-first MVP closeout complete.

## Required sweep

For each verified site:

- open the homepage and confirm branding, hero copy, and primary navigation are coherent
- run a search from the homepage and confirm results load
- open one listing detail page through the public listing route
- open the submit page and confirm the GitHub-issue flow still makes sense
- open privacy, terms, and cookies pages
- open `robots.txt` and confirm it points at the public sitemap entrypoint
- confirm `sitemap.xml` resolves and, when applicable, reflects sitemap-index style output
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

Legacy aliases such as `/websites` and `/news` may still redirect, but they are not part of the core MVP route set.

## Recording outcomes

- record which site was checked
- record the exact paths exercised
- record whether an issue was fixed now, explicitly deferred, or split into a follow-up issue
