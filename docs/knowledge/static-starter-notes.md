# Static Starter Notes

## Dev Port

- Running `pnpm dev -- --port 3002` from the repo root forwards `--port` to every Turbo workspace.
- That breaks the CLI package because `tsup --watch` does not accept `--port`.
- Use `pnpm --filter web dev -- --port 3002` when you want a different local port for the web app only.

## Website Data

- `pnpm generate-websites` refreshes `data/websites.json` into the current JSON-first schema.
- The active loader now expects `slug`, `website`, `llmsUrl`, optional `llmsFullUrl`, and metadata like `featured` / `priority`.
- Prefer `automation-workflow` as the automation category slug. The loader still normalizes the older `integration-automation` value during the transition.

## Docs Content

- Public docs pages live in `packages/content/data/docs`.
- Docs are ordered by the frontmatter `order` field and rendered through the `/docs` routes.
- Use that folder for starter-facing docs such as submit flow, JSON shape references, and rebrand runbooks.
- Keep internal starter/operator notes such as `siteConfig` shapes in `docs/knowledge/**`, not in public `/docs`.
- The runtime starter config now lives at `apps/web/lib/site-config.ts`.

## Rebrand Touchpoints

- The main shell brand strings live in `apps/web/app/layout.tsx`, `apps/web/lib/seo/seo-config.ts`, `apps/web/components/layout/header.tsx`, and `apps/web/components/layout/footer.tsx`.
- When you add a starter-level `siteConfig`, centralize `name`, `domain`, `tagline`, social URLs, and the optional DR badge there before wiring those values into the shell. The internal reference now lives in `docs/knowledge/site-config.md`.
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

- The root `generate-search-index` script should target `scripts/search-index-generator.cjs`; the `.js` entry was stale.
- The old `generate-llms-chatbot-index` root script pointed at a missing file and was removed.
- Keep the root package name as `llms-txt-hub` until workspace-root discovery in internal tooling is made template-neutral.
