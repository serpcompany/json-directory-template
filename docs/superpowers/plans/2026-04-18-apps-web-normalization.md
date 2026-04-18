# Apps Web Normalization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Execute each task as a bounded slice with coder/reviewer loops and fresh verification before marking it complete.

**Goal:** Finish the post-wrapper cleanup so `apps/web` is no longer a privileged implementation app. The repo should treat it as an intentional thin starter wrapper, with shared logic in packages and repo tooling no longer hardcoding `apps/web` as the only meaningful app.

## Current Reality

- `apps/serpdownloaders.com` is now the canonical active-site wrapper and builds independently.
- Shared route logic and shared route-facing UI now live in `packages/web-core`.
- `apps/web/app/**` now imports package-owned route modules directly for the shared content routes.
- `apps/web` still remains in the repo because it owns:
  - starter-only/public route wrappers such as login and submit
  - operator-only onboarding route wrapper
  - test helpers and compatibility shims
  - repo tooling assumptions in hooks, validators, defaults, and docs
- The remaining architectural gap is not active-site ownership anymore. It is repo normalization.

## Target End State

- `apps/web` remains only if it is an intentional thin starter wrapper.
- Shared starter-wide route surfaces and UI live in packages, not under `apps/web/components/**`.
- Tooling, defaults, and docs no longer imply `apps/web` is the canonical app for the repo.
- Deleting or replacing `apps/web` becomes a deliberate product decision rather than a technical blocker hidden in scripts and hooks.

## Task 1: Record The New Decision In Docs And Tracker

**Intent:**

- Make the repo state explicit now that thin-wrapper migration is complete.
- Start a dedicated follow-on phase for `apps/web` normalization instead of overloading the old wrapper tracker.

**Files:**

- Modify: `docs/IMPLEMENTATION_TRACKER.md`
- Create: `docs/superpowers/plans/2026-04-18-apps-web-normalization.md`
- Modify: any linked docs if they still describe `apps/web` as the main implementation app

**Verification:**

- Tracker and plan should explicitly distinguish:
  - active-site wrapper work: complete
  - `apps/web` normalization work: remaining

## Task 2: Extract Remaining Starter-Wide Surfaces Out Of `apps/web/components/**`

**Intent:**

- Move the remaining starter-wide route surfaces out of `apps/web/components/**` into packages so `apps/web` route files become thin wrappers even for login/submit/operator paths where that makes sense.

**Target surfaces:**

- login/auth UI:
  - `apps/web/components/auth/github-sign-in-button.tsx`
- submit flow UI:
  - `apps/web/components/forms/github-issue-submit-form.tsx`
  - `apps/web/components/forms/submit-form-guidelines.tsx`
- operator onboarding UI:
  - `apps/web/components/operator/site-onboarding-form.tsx`
- supporting package boundaries:
  - `packages/web-core` for starter/public web UI
  - `packages/site-contract` only if the onboarding form belongs there rather than in `web-core`

**Files:**

- Create: package-owned modules under `packages/web-core/src/**` and/or `packages/site-contract/src/**`
- Modify: `apps/web/app/login/page.tsx`
- Modify: `apps/web/app/submit/page.tsx`
- Modify: `apps/web/app/operator/onboard-site/page.tsx`
- Modify tests covering those surfaces

**Verification:**

- Run focused test suites for any touched route/components
- Run: `pnpm --dir apps/web typecheck`
- Run: `pnpm build:site -- --site serpdownloaders.com`
- Expected:
  - `apps/web` route files import package-owned modules directly where the surface is shared
  - no behavior changes for login, submit, or onboarding surfaces

Status:

- Completed. The shared login button, submit flow form/guidelines, and operator onboarding form now
  live in `packages/web-core`, while `apps/web` route files import those package-owned surfaces
  directly.

## Task 3: Normalize Tooling And Defaults That Hardcode `apps/web`

**Intent:**

- Remove the remaining repo assumptions that `apps/web` is the only or primary app.

**Likely files:**

- `lefthook.yml`
- `packages/validators/src/validate-imports.ts`
- `packages/site-contract/src/default-site-config.ts`
- `scripts/site-config.ts`
- docs that still present `apps/web` as the default implementation app

**Expected direction:**

- Hooks and validators should either:
  - operate generically over `apps/*`, or
  - clearly target the thin starter wrapper package by name, not by hidden convention
- Default checked-in site config should reflect an intentional starter-wrapper choice rather than a stale technical dependency

**Verification:**

- Run focused validation commands touched by the change
- Run: `pnpm --dir apps/web typecheck` if alias/validator behavior changes
- Run: `pnpm --filter serpdownloaders.com typecheck`
- Run: `pnpm build:site -- --site serpdownloaders.com`

## Task 4: Clean Up Legacy Compatibility Shims In `apps/web/components/**`

**Intent:**

- After route files and starter-wide surfaces import packages directly, delete dead one-line compatibility wrappers that are no longer needed.

**Files:**

- Modify/delete: only the wrappers that have zero remaining active imports
- Leave app-specific/operator-only UI that still belongs in `apps/web`

**Verification:**

- Run targeted Jest suites for changed imports
- Run: `pnpm --dir apps/web typecheck`

## Task 5: Final Apps Web Normalization Acceptance Pass

**Intent:**

- Prove the repo no longer depends on `apps/web` as a special implementation app.

**Verification:**

- Run: `pnpm --dir apps/web typecheck`
- Run: `pnpm --filter serpdownloaders.com typecheck`
- Run: `pnpm build:site -- --site serpdownloaders.com`
- Run: `pnpm deploy:site -- --site serpdownloaders.com --dry-run`
- Confirm:
  - `apps/serpdownloaders.com` remains the canonical active-site wrapper
  - `apps/web` is either a thin starter wrapper or a clearly scoped compatibility app
  - shared starter/public surfaces live in packages
  - repo tooling does not hide hard dependencies on `apps/web`
