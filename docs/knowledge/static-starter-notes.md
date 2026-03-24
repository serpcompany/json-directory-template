# Static Starter Notes

## Dev Port

- Running `pnpm dev -- --port 3002` from the repo root forwards `--port` to every Turbo workspace.
- That breaks the CLI package because `tsup --watch` does not accept `--port`.
- Use `pnpm --filter web dev -- --port 3002` when you want a different local port for the web app only.

## Website Data

- `data/websites.json` is the active website-entry source for the current starter.
- `pnpm tsx scripts/validate-data.ts data/websites.json` validates the active JSON source.
- Site-specific build flows can transform alternative JSON inputs into this same shape during build time.
- The active loader now expects `slug`, `website`, `llmsUrl`, optional `llmsFullUrl`, and metadata like `featured` / `priority`.
- The formal schema for raw JSON website entries now lives in `apps/web/lib/website-schema.ts`.
- Optional `content` in `data/websites.json` now flows through the JSON loader and can power the detail page body.
- Prefer `automation-workflow` as the automation category slug. The loader still normalizes the older `integration-automation` value during the transition.
- Treat `packages/content/data/websites/**` as legacy/reference website content unless and until a future migration path is formalized.

## Docs Content

- Public docs pages live in `packages/content/data/docs`.
- The About page now reads from `packages/content/data/about/about.mdx` through a dedicated content collection while keeping the existing route layout in `apps/web/app/about/page.tsx`.
- Docs are ordered by the frontmatter `order` field and rendered through the `/docs` routes.
- Use that folder for starter-facing docs such as submit flow, JSON shape references, and rebrand runbooks.
- Keep internal starter/operator notes such as `siteConfig` shapes in `docs/knowledge/**`, not in public `/docs`.
- Keep representative page references in `docs/knowledge/reference-surfaces.md` when you want to preserve old patterns without leaving whole features active.
- Use the decision labels in `docs/knowledge/reference-surfaces.md` to drive cleanup order: `Keep + rebrand first`, then `Keep + rebrand later`, then `Reference only`.
- The checked-in site config source of truth now lives under `sites/**`, with `apps/web/lib/site-config.ts` acting as the app-facing adapter layer.
- The runtime starter config now also owns optional shell feature flags, including whether to render creator-project, featured-guides, developer-tools, and newsletter sections.
- The current website/entity data contract is documented in `docs/knowledge/entity-data-shape.md`.
- The config now covers both public social links and repo-specific submit/report fields, so shell links and GitHub issue flows can move without hardcoded owner/repo strings.
- The active app `tsconfig.json` now excludes `_archive`, which keeps typecheck and build focused on the starter instead of parked legacy code.

## Rebrand Touchpoints

- The main shell brand strings live in `apps/web/app/layout.tsx`, `apps/web/lib/seo/seo-config.ts`, `apps/web/components/layout/header.tsx`, and `apps/web/components/layout/footer.tsx`.
- When you add starter-level site config, centralize `name`, `domain`, `tagline`, social URLs, and the optional DR badge in `sites/site-config.default.ts` and per-site overrides before wiring those values into the shell. The internal reference now lives in `docs/knowledge/site-config.md`.
- The first active rebrand pass is complete for `apps/web/app/page.tsx`, `apps/web/app/websites/[slug]/page.tsx`, `apps/web/app/submit/page.tsx`, and `apps/web/app/favorites/page.tsx`.
- That pass keeps the existing `website` and `llmsUrl` data fields, but shifts visible copy toward generic directory language such as `directory`, `entries`, and `submit a website`.
- Starter-safe builds should keep legacy creator/tool/guide sidebars disabled unless a site explicitly enables them through checked-in site config feature flags.
- The standalone FAQ route was removed from the active starter. Do not keep `/faq` in nav, sitemap, or smoke-test coverage unless a future site explicitly needs it.
- Legal content pages are now canonical at `/legal/privacy`, `/legal/terms`, and `/legal/cookies`.
- The legacy root routes `/privacy`, `/terms`, and `/cookies` still exist only as redirects so existing links do not break.
- The live legal copy comes from `packages/content/data/legal/*.mdx`; changing those files updates the current frontend without changing the route components.
- The main visual brand assets live in `apps/web/app/favicon.ico`, `apps/web/app/opengraph-image.png`, `apps/web/app/opengraph-image.alt.txt`, and `apps/web/public/img/**`.
- Legal contact details live in `packages/content/data/legal/**`.
- The submit flow points at a GitHub repo from `apps/web/lib/github-issue.ts`, so rebrands usually need that updated too.

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
