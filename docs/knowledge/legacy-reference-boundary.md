# Legacy Reference Boundary

This note classifies the deferred legacy/reference areas so the active starter surface is easier to reason about.

## Decisions

| Area                                                           | Decision                        | Notes                                                                                             |
| -------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------- |
| `README.md`                                                    | Rewrite                         | The repo root README should explain the current starter, not the old llms listing corpus.         |
| `packages/content/data/websites/**`                            | Keep as reference-only          | Not the active source of truth; keep only as migration/reference material for now.                |
| `apps/e2e/tests/**`                                            | Keep active                     | The E2E package is still part of the repo workflow and remains the active Playwright source area. |
| `apps/e2e/playwright-report/**` and `apps/e2e/test-results/**` | Move to archive                 | Generated artifacts do not belong in the active package tree.                                     |
| `websites/**`                                                  | Move to archive / mark inactive | No longer part of the active starter pipeline.                                                    |
| `_archive/**`                                                  | Keep as reference-only          | Safe place for legacy material that should not shape current starter assumptions.                 |

## Practical boundary

Treat these as active starter inputs:

- `sites/**`
- `data/websites.json`
- `packages/content/data/about/**`
- `packages/content/data/docs/**`
- `packages/content/data/guides/**`
- `packages/content/data/legal/**`
- `packages/content/data/resources/**`

Treat these as legacy/reference-only unless a future doc changes the contract:

- `packages/content/data/websites/**`
- `websites/**`
- `_archive/**`

## Why this matters

The repo still contains useful historical material, but leaving that material ambiguous makes the starter feel unsafe to reuse. The rule now is simple:

- active starter inputs stay in the active paths above
- old examples, artifacts, and experiments stay in archive/reference paths
