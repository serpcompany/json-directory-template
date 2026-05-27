import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadCheckedInSiteFromInput, parseSiteInputArgs } from './site-config.ts'

const changedPathSitePrefixes = [
  ['apps/browserextensions.io/', 'browserextensions.io'],
  ['apps/pornvideodownloaders.com/', 'pornvideodownloaders.com'],
  ['apps/serp.ai/', 'serp.ai'],
  ['apps/serp.co/', 'serp.co'],
  ['apps/serp.software/', 'serp.software'],
  ['apps/serpdownloaders.com/', 'serpdownloaders.com'],
  ['apps/starter/', 'default'],
  ['sites/browserextensions.io/', 'browserextensions.io'],
  ['sites/pornvideodownloaders.com/', 'pornvideodownloaders.com'],
  ['sites/serp.ai/', 'serp.ai'],
  ['sites/serp.co/', 'serp.co'],
  ['sites/serp.software/', 'serp.software'],
  ['sites/serpdownloaders.com/', 'serpdownloaders.com']
] as const

type GitHubPushEvent = {
  commits?: Array<{
    added?: string[]
    modified?: string[]
    removed?: string[]
  }>
  head_commit?: {
    added?: string[]
    modified?: string[]
    removed?: string[]
  } | null
}

function hasExplicitSiteInput(argv: string[], env: NodeJS.ProcessEnv): boolean {
  return (
    argv.includes('--site') ||
    Boolean(env.SITE_ID?.trim()) ||
    Boolean(env.NEXT_PUBLIC_SITE_ID?.trim())
  )
}

function normalizeChangedPath(path: string): string {
  return path.replace(/^\.?\//, '')
}

export function inferSiteIdFromChangedPaths(paths: string[]): string | undefined {
  const matchedSiteIds = new Set<string>()

  for (const path of paths) {
    const normalizedPath = normalizeChangedPath(path)
    const matchedPrefix = changedPathSitePrefixes.find(([prefix]) =>
      normalizedPath.startsWith(prefix)
    )

    if (matchedPrefix) {
      matchedSiteIds.add(matchedPrefix[1])
    }
  }

  if (matchedSiteIds.size > 1) {
    throw new Error(
      `Push changed multiple site-specific paths (${[...matchedSiteIds].sort().join(', ')}). Set SITE_ID explicitly or run workflow_dispatch for one site.`
    )
  }

  return [...matchedSiteIds][0]
}

export function resolvePushSiteInputFromChangedPaths(
  paths: string[],
  fallbackSiteId?: string
): { siteId?: string } {
  const siteId = inferSiteIdFromChangedPaths(paths)

  if (siteId) {
    return { siteId }
  }

  return {
    siteId: fallbackSiteId?.trim() || undefined
  }
}

function readPushEventChangedPaths(env: NodeJS.ProcessEnv): string[] {
  if (env.GITHUB_EVENT_NAME !== 'push' || !env.GITHUB_EVENT_PATH) {
    return []
  }

  const event = JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, 'utf8')) as GitHubPushEvent
  const commits = event.commits?.length
    ? event.commits
    : event.head_commit
      ? [event.head_commit]
      : []

  return commits.flatMap(commit => [
    ...(commit.added ?? []),
    ...(commit.modified ?? []),
    ...(commit.removed ?? [])
  ])
}

export function resolveBuildRun(
  argv: string[],
  env: NodeJS.ProcessEnv = process.env
): {
  artifactDir: string
  siteId: string
} {
  const input = hasExplicitSiteInput(argv, env)
    ? parseSiteInputArgs(argv, env)
    : env.GITHUB_EVENT_NAME === 'push'
      ? resolvePushSiteInputFromChangedPaths(
          readPushEventChangedPaths(env),
          env.PUSH_FALLBACK_SITE_ID
        )
      : {}
  const definition = loadCheckedInSiteFromInput(input)

  return {
    artifactDir: definition.build.artifactDir,
    siteId: definition.id
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const run = resolveBuildRun(process.argv.slice(2))
  console.log(`artifact_dir=${run.artifactDir}`)
  console.log(`site_id=${run.siteId}`)
}
