# Static Starter Notes

## Dev Port

- Running `pnpm dev -- --port 3002` from the repo root forwards `--port` to every Turbo workspace.
- That breaks the CLI package because `tsup --watch` does not accept `--port`.
- Use `pnpm --filter web dev -- --port 3002` when you want a different local port for the web app only.

## Website Data

- `pnpm generate-websites` refreshes `data/websites.json` into the current JSON-first schema.
- The active loader now expects `slug`, `website`, `llmsUrl`, optional `llmsFullUrl`, and metadata like `featured` / `priority`.

## Agent Verification Quirk

- In sandboxed agent environments, `tsx` and `next build` can fail because they try to open local IPC pipes or ports.
- If that happens during verification, rerun the command outside the sandbox rather than treating it as an app regression.

## Playwright Verification

- The E2E package should launch the web app directly with `pnpm exec next dev --hostname 127.0.0.1 --port 3000`.
- That avoids inheriting the web package's local dev script flags and keeps Playwright aligned with its own `baseURL`.
- For CLI runs, set `CLAUDE=1` so Playwright uses the line reporter instead of the verbose HTML-only default.
