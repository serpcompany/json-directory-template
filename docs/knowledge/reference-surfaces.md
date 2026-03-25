# Reference Surfaces

This note keeps one representative page from each major surface so the team can trim and rebrand the starter without losing the old patterns entirely.

Use it as a quick reference, not as a source of truth for active product behavior.

## Next-Pass Decisions

1. `Keep + rebrand first`: Home, Website Detail, Submit, Favorites
- `Keep + rebrand later`: Docs, Guides, About, Projects
- `Reference only, do not restore by default`: Community, Members, Profile, Login, Settings
- `Drop`: FAQ, News redirect shell, Websites redirect shell

## Recommended Execution Order

1. Rebrand the high-traffic active pages first: home, detail, submit, favorites.
2. Rebrand the supporting static pages next: docs, guides, about, projects.
3. Use the archived pages only as pattern references if a future site needs profiles or community features.
4. Ignore the redirect-only shells unless they become useful again.

## Active Surfaces

### Home

- Representative route: `/`
- Source: `apps/web/app/page.tsx`
- Main supporting files: `apps/web/components/sections/hero-section.tsx`, `apps/web/components/static-websites-list.tsx`, `apps/web/components/sections/recently-added-section.tsx`
- Why keep it: This is the broadest snapshot of the current starter shell. It shows the hero, sidebar layout, featured modules, and the main directory listing in one place.
- Recommended action: `Keep + rebrand first`

### Website Detail

- Representative route: `/websites/[slug]`
- Source: `apps/web/app/websites/[slug]/page.tsx`
- Main supporting files: `apps/web/components/website/website-hero.tsx`, `apps/web/components/website/website-resources-section.tsx`, `apps/web/components/website/website-detail-sidebar.tsx`
- Data source: `data/listings.json`
- Why keep it: This is the most important detail-page pattern in the repo. It captures the hero, resource links, sidebar, related projects, and navigation treatment.
- Recommended action: `Keep + rebrand first`

### Docs

- Representative route: `/docs`
- Source: `apps/web/app/docs/page.tsx`
- Representative content file: `packages/content/data/docs/getting-started.mdx`
- Why keep it: This shows the docs landing pattern, breadcrumb treatment, and MDX rendering setup for starter-facing documentation.
- Recommended action: `Keep + rebrand later`

### Guides

- Representative route: `/guides`
- Source: `apps/web/app/guides/page.tsx`
- Representative content file: `packages/content/data/guides/getting-started-llms-txt.mdx`
- Why keep it: This is the clearest reference for the editorial/card-grid side of the site and the guide frontmatter pattern.
- Recommended action: `Keep + rebrand later`

### Submit

- Representative route: `/submit`
- Source: `apps/web/app/submit/page.tsx`
- Main supporting files: `apps/web/components/forms/github-issue-submit-form.tsx`, `apps/web/lib/github-issue.ts`
- Why keep it: This captures the current static-friendly contribution flow and the form pattern that hands off to GitHub.
- Recommended action: `Keep + rebrand first`

### Projects

- Representative route: `/projects`
- Source: `apps/web/app/projects/page.tsx`
- Why keep it: This is the clearest example of a static-friendly resource hub page that replaced a more dynamic GitHub-driven experience.
- Recommended action: `Keep + rebrand later`

### Favorites

- Representative route: `/favorites`
- Source: `apps/web/app/favorites/page.tsx`
- Main supporting files: `apps/web/contexts/favorites-context.tsx`, `apps/web/components/websites-list-with-search.tsx`
- Why keep it: This captures the local-storage favorites experience and the current mixed "directory plus extra sections" layout.
- Recommended action: `Keep + rebrand first`

### About

- Representative route: `/about`
- Source: `apps/web/app/about/page.tsx`
- Why keep it: This is a useful reference for the old mission/marketing copy layer that still needs stronger template cleanup.
- Recommended action: `Keep + rebrand later`

## Archived Surfaces

### Community

- Representative route: `/community`
- Source: `apps/web/_archive/app/community/page.tsx`
- Main supporting files: `apps/web/_archive/components/community/community-dashboard.tsx`
- Why keep it: This shows the old "community hub" concept and its dashboard pattern in one place.
- Recommended action: `Reference only`

### Members

- Representative route: `/members`
- Source: `apps/web/_archive/app/members/page.tsx`
- Main supporting files: `apps/web/_archive/app/members/members-list.tsx`, `apps/web/_archive/app/members/members-search.tsx`
- Why keep it: This is the best reference for the old searchable member directory and pagination behavior.
- Recommended action: `Reference only`

### Profile

- Representative route: `/profile`
- Source: `apps/web/_archive/app/profile/page.tsx`
- Main supporting files: `apps/web/_archive/app/profile/profile-content.tsx`
- Why keep it: This preserves the shape of the old authenticated self-serve profile area without keeping that feature active.
- Recommended action: `Reference only`

### Login

- Representative route: `/login`
- Source: `apps/web/_archive/app/login/page.tsx`
- Why keep it: This is the clearest snapshot of the old Clerk-based auth flow, including email-code and GitHub sign-in handling.
- Recommended action: `Reference only`

### Settings

- Representative route: `/settings`
- Source: `apps/web/_archive/app/settings/page.tsx`
- Why keep it: This is only a small redirect shell now, but it marks the old account-settings branch in the product model.
- Recommended action: `Reference only`

## Surfaces Not Worth Preserving Further

- `/faq` was removed from the active starter and should stay out unless a future site explicitly needs an FAQ surface
- `/news` already redirects to `/` from `apps/web/app/news/page.tsx`
- `/websites` already redirects to `/` from `apps/web/app/websites/page.tsx`
- Recommended action: `Drop`

Those are not useful long-term references beyond knowing that they were intentionally collapsed.
