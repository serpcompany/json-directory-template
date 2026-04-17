# Static Starter Notes

## Dev Port

- Root `pnpm dev` now targets the web app only through `pnpm --filter web dev`.
- The default web dev script now uses `next dev --webpack` because Turbopack can hang on the first `/` compile in this repo's current Tailwind/PostCSS setup.
- The web package no longer forces `--inspect` during normal local dev; use `pnpm --filter web dev:inspect` when you explicitly want the Node inspector.
- Use `pnpm dev:all` when you explicitly want the old Turbo parallel workspace behavior.
- `apps/web/next.config.ts` still pins `turbopack.root` to this repo root so future Turbopack runs do not walk up to unrelated parent lockfiles during dev.

## Website Data

- `data/listings.json` is the active website-entry source for the default starter only.
- `sites/serpdownloaders.com/products.json` is the active checked-in listing source for the only currently powered checked-in site.
- `pnpm tsx scripts/validate-data.ts data/listings.json` validates the default starter JSON source.
- `pnpm validate:site -- --site serpdownloaders.com` validates the active checked-in site's real source and generated surface contract.
- `pnpm validate:sites` validates the active non-default checked-in sites; run `pnpm validate:site -- --site default` separately for the default starter.
- Site-specific build flows can transform alternative checked-in inputs into the shared listing shape during build time.
- The active loader now expects `slug`, `website`, `description`, `category`, `publishedAt`, and optional metadata like `featured`, `priority`, `content`, and `resourceLinks`.
- The formal schema for raw JSON website entries now lives in `apps/web/lib/website-schema.ts`.
- Optional `content` in `data/listings.json` now flows through the JSON loader and can power the detail page body.
- Optional `resourceLinks` in `data/listings.json` can power the detail-page Resources card without introducing special-case `llms.txt` fields.
- The active starter taxonomy now lives in `docs/knowledge/taxonomy-discovery-contract.md`.
- The current alias lane keeps `automation-workflow` and `integration-automation` mapped to `video-downloaders`.
- `pnpm validate:site -- --site <id>` now rejects unknown category slugs up front and reports the active category set derived from real listing data.
- `pnpm validate:listings` now rejects unknown category slugs too, so direct JSON edits follow the same shared taxonomy contract.
- Public category pages and category navigation should only come from categories that actually have attached listings; empty taxonomy buckets should not generate pages or nav links.
- Treat `packages/content/data/websites/**` as legacy/reference website content unless and until a future migration path is formalized.
- The old MDX-intake helpers and workflows now live under `_archive/legacy-mdx-authoring/**` and are not part of active CI, build, or maintainer scripts.

## Docs Content

- Public docs pages live in `packages/content/data/docs`.
- The About page now reads from `packages/content/data/about/about.mdx` through a dedicated content collection while keeping the existing route layout in `apps/web/app/about/page.tsx`.
- Docs are ordered by the frontmatter `order` field and rendered through the `/docs` routes.
- The public docs route base path and nav label now come from checked-in site config, with `docs` and `Docs` as the starter defaults.
- The starter's public listing route now defaults to `/listing`, while the internal filesystem route stays compatibility-oriented.
- Category pages are public at `/categories/[slug]`.
- Editorial guide content is public at `/posts` and `/posts/[slug]` when `features.showGuides` is enabled; otherwise that surface is pruned from the default static artifact.
- Use that folder for starter-facing docs such as submit flow, JSON shape references, taxonomy notes, and site-launch runbooks.
- Keep internal starter/operator notes such as `siteConfig` shapes in `docs/knowledge/**`, not in public `/docs`.
- Keep representative page references in `docs/knowledge/reference-surfaces.md` when you want to preserve old patterns without leaving whole features active.
- Use `docs/knowledge/legacy-reference-boundary.md` when deciding whether an older repo area is still active starter input or only reference material.
- Use the decision labels in `docs/knowledge/reference-surfaces.md` to drive cleanup order: `Keep + first`, then `Keep + later`, then `Reference only`.
- The checked-in site config source of truth now lives under `sites/**`, with `apps/web/lib/site-config.ts` acting as the app-facing adapter layer.
- Inactive or incubating checked-in sites should move to `_archive/incubating-sites/**` instead of staying registered under `sites/**`.
- The runtime starter config now also owns optional shell feature flags, including whether to render creator-project, featured-guides, external-resources, and newsletter sections.
- Reserve `/tools` for future first-party utility pages; the current `externalResources` surface is only for outbound/reference links configured per site.
- The old `/projects` concept is now treated as a site-owned network page. Keep the internal file-system route stable, but treat the public route and label as config-driven. The starter defaults are `/network` and `Network`.
- The network page always gets a reusable default link set from the checked-in GitHub repo/issues/profile fields, and sites can extend that list in `sites/<id>/site-content.ts`.
- The current website/entity data contract is documented in `docs/knowledge/entity-data-shape.md`.
- The config now covers both public social links and repo-specific submit/report fields, so shell links and GitHub issue flows can move without hardcoded owner/repo strings.
- The active app `tsconfig.json` now excludes `_archive`, which keeps typecheck and build focused on the starter instead of parked legacy code.
- Keep the active favorites browser storage key `llms-txt-hub-favorites` unchanged for now. Treat any rename as a future migration task, not a silent cleanup.

## Sitemaps

- Direct app environments still advertise `sitemap.xml`, because that is the app-served sitemap route.
- The final static artifact writes `sitemap-index.xml` as the canonical shipped sitemap entrypoint and also keeps `sitemap.xml` as a compatibility twin with the same sitemap-index XML.
- Split sitemap families are emitted as `pages-index.xml`, `<listingBasePath>-index.xml`, and `categories-index.xml`, with `10,000` URLs per leaf file by default.
- `routes.listingBasePath` cannot use reserved values like `pages` or `sitemap`, because those would collide with sitemap family filenames.
- Category sitemap files are emitted only when the final artifact actually contains category pages.
- The sitemap split runs against the finalized static artifact, so it reflects the shipped public route map after pruning and public path remaps.

## Brand Touchpoints

- The main shell brand strings live in `apps/web/app/layout.tsx`, `apps/web/lib/seo/seo-config.ts`, `apps/web/components/layout/header.tsx`, and `apps/web/components/layout/footer.tsx`.
- When you add starter-level site config, centralize `name`, `domain`, `tagline`, and social URLs in `sites/site-config.default.ts` and per-site overrides before wiring those values into the shell. The internal reference now lives in `docs/knowledge/site-config.md`.
- The first active starter-neutral pass is complete for `apps/web/app/page.tsx`, `apps/web/app/websites/[slug]/page.tsx`, `apps/web/app/submit/page.tsx`, and `apps/web/app/favorites/page.tsx`.
- The starter now keeps the raw `website` destination field for compatibility, but removes `llmsUrl` / `llmsFullUrl` from the active listing contract and routes listing extras through generic resource links instead.
- Starter-safe builds should keep legacy creator/tool/guide sidebars disabled unless a site explicitly enables them through checked-in site config feature flags.
- The standalone FAQ route was removed from the active starter. Do not keep `/faq` in nav, sitemap, or smoke-test coverage unless a future site explicitly needs it.
- Legal content pages are now canonical at `/legal/privacy`, `/legal/terms`, and `/legal/cookies`.
- The legacy root routes `/privacy`, `/terms`, and `/cookies` still exist only as redirects so existing links do not break.
- The live legal copy comes from `packages/content/data/legal/*.mdx`; changing those files updates the current frontend without changing the route components.
- The main visual brand assets live in `apps/web/app/favicon.ico`, `apps/web/app/opengraph-image.png`, `apps/web/app/opengraph-image.alt.txt`, and `apps/web/public/img/**`.
- Legal contact details live in `packages/content/data/legal/**`.
- The submit flow points at a GitHub repo from `apps/web/lib/github-issue.ts`, so new site launches usually need that updated too.

## Agent Verification Quirk

- In sandboxed agent environments, `tsx` and `next build` can fail because they try to open local IPC pipes or ports.
- If that happens during verification, rerun the command outside the sandbox rather than treating it as an app regression.

## Playwright Verification

- The E2E package should launch the web app directly with `pnpm exec next dev --hostname 127.0.0.1 --port 3000`.
- That avoids inheriting the web package's local dev script flags and keeps Playwright aligned with its own `baseURL`.
- For CLI runs, set `CLAUDE=1` so Playwright uses the line reporter instead of the verbose HTML-only default.

## Root Package Scripts

- The root `generate-search-index` script should target `scripts/search-index-generator.ts`; the older `.js` and `.cjs` references were stale.
- The old `generate-llms-chatbot-index` root script pointed at a missing file and was removed.
- Keep the root package name as `llms-txt-hub` until workspace-root discovery in internal tooling is made template-neutral.

## Workspace Cleanup

- The old app-only packages `packages/analytics`, `packages/auth`, `packages/api-utils`, `packages/caching`, `packages/security`, and `packages/flags` are no longer part of the active starter build.
- The web app package manifest should not depend on those packages anymore.
- `apps/web/env.ts` was removed because the active starter no longer consumes the old caching/env bundle.
