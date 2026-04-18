# Incubating Sites

This directory holds site configs and assets that are intentionally **not** part of the active
runtime/build/deploy graph.

Current rule:

- parked sites may be kept for reference or future promotion work
- parked sites must not be imported from active registry files under `sites/**`
- parked sites must not participate in `pnpm validate:sites`, default build flows, or deploy flows

Promotion rule:

- a site only moves back into the active graph after it has an approved deploy target, current
  site-owned config/content, validation coverage, and explicit docs/runbook updates
