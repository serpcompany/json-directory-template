import { matchesGlob } from 'node:path'
import { activeCheckedInSiteIds } from '@thedaviddias/site-contract/active-site-ids'

// Single source of truth for which changed files deploy which static sites.
//
// `.github/workflows/build-and-deploy.yml` lists exactly `buildAndDeployWorkflowPushPaths` as its
// push `paths:` filter (scripts/build-and-deploy-workflow.test.ts enforces this), and
// scripts/resolve-build-run.ts classifies changed files with the same list, so a push that starts
// the workflow is always one the resolver can explain.
//
// A changed file is build-affecting when it matches the list (patterns apply in order and a later
// `!pattern` excludes, as in GitHub Actions path filters). A build-affecting file under
// `apps/<site-id>/` or `sites/<site-id>/` belongs to that site. Every other build-affecting file is
// shared and redeploys every active checked-in site.

/** Per-site wrapper app and checked-in site source. */
export function getSiteDeployPathPrefixes(siteId: string): string[] {
  return [`apps/${siteId}/`, `sites/${siteId}/`]
}

/**
 * Shared inputs of every active site build: the workspace packages and configs the wrapper apps
 * import, the build/validate/audit/deploy scripts, the shared checked-in site files and default
 * categories, the workspace manifests and lockfile, and the pinned Node version.
 *
 * `data/listings.json` is not listed: every active site uses `trial-products-json`, and
 * `pnpm build:site` regenerates `data/listings.json` from `sites/<site-id>/products.json`.
 * `apps/starter/**` is not listed: no active wrapper imports it, and the `default` starter site has
 * no deploy target.
 */
export const sharedBuildPathPatterns = [
  'packages/**',
  'configs/**',
  'scripts/**',
  'sites/*',
  'sites/default/**',
  '.nvmrc',
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'turbo.json'
] as const

/**
 * Changes that never affect a deployed artifact: tests, Markdown docs, workspace packages no
 * active wrapper app depends on (scripts/build-and-deploy-workflow.test.ts checks the dependency
 * graph), and scripts that only run outside the build, audit, and deploy path.
 */
export const nonBuildPathPatterns = [
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/__tests__/**',
  '**/*.md',
  'packages/cli/**',
  'packages/generator/**',
  'packages/validators/**',
  'scripts/deploy-to-repo.sh',
  'scripts/featured-badge-approved-r2-assets.json',
  'scripts/generate-badges.ts',
  'scripts/import-downloaders-from-sheet.ts',
  'scripts/listing-rewrite-excluded.txt',
  'scripts/listing-rewrite-fact-overrides.json',
  'scripts/listing-rewrite-source-overrides.json',
  'scripts/listing-rewrite.ts',
  'scripts/r2-featured-badge-assets.json',
  'scripts/templates/target-verify-badge.yml',
  'scripts/test-submission-flow.ts',
  'scripts/upgrade-downloader-content.ts'
] as const

export const buildAndDeployWorkflowPushPaths: readonly string[] = [
  ...activeCheckedInSiteIds.flatMap(siteId =>
    getSiteDeployPathPrefixes(siteId).map(prefix => `${prefix}**`)
  ),
  ...sharedBuildPathPatterns,
  ...nonBuildPathPatterns.map(pattern => `!${pattern}`)
]

function normalizeChangedPath(path: string): string {
  return path.replace(/^\.?\//, '')
}

/** Evaluates a GitHub Actions style path filter: the last matching pattern wins. */
export function matchesWorkflowPathFilter(path: string, patterns: readonly string[]): boolean {
  const normalizedPath = normalizeChangedPath(path)
  let matched = false

  for (const pattern of patterns) {
    const negated = pattern.startsWith('!')
    const glob = negated ? pattern.slice(1) : pattern

    if (matchesGlob(normalizedPath, glob)) {
      matched = !negated
    }
  }

  return matched
}

export function isBuildAffectingPath(path: string): boolean {
  return matchesWorkflowPathFilter(path, buildAndDeployWorkflowPushPaths)
}

export type ChangedPathClassification = {
  /** Build-affecting files outside any per-site directory. */
  sharedBuildPaths: string[]
  /** Active sites whose own `apps/<site-id>/` or `sites/<site-id>/` files changed. */
  siteIds: string[]
}

export function classifyChangedPaths(paths: readonly string[]): ChangedPathClassification {
  const sharedBuildPaths: string[] = []
  const siteIds = new Set<string>()

  for (const path of paths) {
    const normalizedPath = normalizeChangedPath(path)

    if (!isBuildAffectingPath(normalizedPath)) {
      continue
    }

    const siteId = activeCheckedInSiteIds.find(activeSiteId =>
      getSiteDeployPathPrefixes(activeSiteId).some(prefix => normalizedPath.startsWith(prefix))
    )

    if (siteId) {
      siteIds.add(siteId)
    } else {
      sharedBuildPaths.push(normalizedPath)
    }
  }

  return {
    sharedBuildPaths,
    siteIds: [...siteIds].sort()
  }
}
