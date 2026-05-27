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
  after?: string
  commits?: Array<{
    added?: string[]
    id?: string
    modified?: string[]
    removed?: string[]
  }>
  head_commit?: {
    added?: string[]
    id?: string
    modified?: string[]
    removed?: string[]
  } | null
  repository?: {
    full_name?: string
  }
}

type GitHubPullRequest = {
  merged_at?: string | null
  number: number
  state?: string
}

type GitHubPullRequestFile = {
  filename: string
  previous_filename?: string
}

type PushSiteResolution = {
  shouldDeploy: boolean
  siteId?: string
}

type BuildRunResolution = {
  artifactDir?: string
  shouldDeploy: boolean
  siteId?: string
}

type ResolveBuildRunOptions = {
  fetch?: typeof fetch
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

  const concreteSiteIds = [...matchedSiteIds].filter(siteId => siteId !== 'default').sort()

  if (concreteSiteIds.length > 1) {
    throw new Error(
      `Push changed multiple concrete site paths (${concreteSiteIds.join(', ')}); manual site_id required via workflow_dispatch for each site.`
    )
  }

  if (concreteSiteIds.length === 1) {
    return concreteSiteIds[0]
  }

  return matchedSiteIds.has('default') ? 'default' : undefined
}

export function resolvePushSiteInputFromChangedPaths(paths: string[]): PushSiteResolution {
  const siteId = inferSiteIdFromChangedPaths(paths)

  if (siteId) {
    return { shouldDeploy: true, siteId }
  }

  return {
    shouldDeploy: false
  }
}

function readPushEvent(env: NodeJS.ProcessEnv): GitHubPushEvent | undefined {
  if (env.GITHUB_EVENT_NAME !== 'push' || !env.GITHUB_EVENT_PATH) {
    return undefined
  }

  return JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, 'utf8')) as GitHubPushEvent
}

function readPushEventChangedPaths(event: GitHubPushEvent | undefined): string[] {
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

function getPushCommitShas(event: GitHubPushEvent | undefined, env: NodeJS.ProcessEnv): string[] {
  const shas = [
    env.GITHUB_SHA,
    event?.after,
    event?.head_commit?.id,
    ...(event?.commits?.map(commit => commit.id) ?? [])
  ]
  const seen = new Set<string>()

  return shas.flatMap(sha => {
    const normalizedSha = sha?.trim()

    if (!normalizedSha || seen.has(normalizedSha)) {
      return []
    }

    seen.add(normalizedSha)
    return [normalizedSha]
  })
}

function getRepositoryFullName(
  event: GitHubPushEvent | undefined,
  env: NodeJS.ProcessEnv
): string | undefined {
  return env.GITHUB_REPOSITORY?.trim() || event?.repository?.full_name?.trim() || undefined
}

function getGitHubApiBaseUrl(env: NodeJS.ProcessEnv): string {
  return (env.GITHUB_API_URL?.trim() || 'https://api.github.com').replace(/\/+$/, '')
}

function encodeRepositoryPath(repositoryFullName: string): string {
  const [owner, repo, ...rest] = repositoryFullName.split('/')

  if (!owner || !repo || rest.length > 0) {
    throw new Error(`Invalid GitHub repository full name "${repositoryFullName}".`)
  }

  return `${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
}

async function readGitHubJson<T>(url: URL, token: string, fetchImpl: typeof fetch): Promise<T> {
  const response = await fetchImpl(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'json-directory-build-resolver',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    const suffix = body ? ` ${body.slice(0, 500)}` : ''

    throw new Error(
      `GitHub API request failed (${response.status} ${response.statusText}) for ${url.pathname}.${suffix}`
    )
  }

  return (await response.json()) as T
}

async function readAssociatedPullRequestsForCommit(
  commitSha: string,
  context: {
    apiBaseUrl: string
    fetch: typeof fetch
    repositoryPath: string
    token: string
  }
): Promise<GitHubPullRequest[]> {
  const url = new URL(
    `${context.apiBaseUrl}/repos/${context.repositoryPath}/commits/${encodeURIComponent(commitSha)}/pulls`
  )

  return readGitHubJson<GitHubPullRequest[]>(url, context.token, context.fetch)
}

async function readPullRequestFiles(
  pullRequestNumber: number,
  context: {
    apiBaseUrl: string
    fetch: typeof fetch
    repositoryPath: string
    token: string
  }
): Promise<GitHubPullRequestFile[]> {
  const files: GitHubPullRequestFile[] = []

  for (let page = 1; ; page += 1) {
    const url = new URL(
      `${context.apiBaseUrl}/repos/${context.repositoryPath}/pulls/${pullRequestNumber}/files`
    )
    url.searchParams.set('page', String(page))
    url.searchParams.set('per_page', '100')

    const pageFiles = await readGitHubJson<GitHubPullRequestFile[]>(
      url,
      context.token,
      context.fetch
    )
    files.push(...pageFiles)

    if (pageFiles.length < 100) {
      break
    }
  }

  return files
}

function isMergedPullRequest(pullRequest: GitHubPullRequest): boolean {
  return Boolean(pullRequest.merged_at)
}

export async function readAssociatedMergedPullRequestChangedPaths(
  event: GitHubPushEvent | undefined,
  env: NodeJS.ProcessEnv,
  fetchImpl: typeof fetch = fetch
): Promise<string[]> {
  const commitShas = getPushCommitShas(event, env)
  const repositoryFullName = getRepositoryFullName(event, env)

  if (commitShas.length === 0 || !repositoryFullName) {
    return []
  }

  const token = env.GITHUB_TOKEN?.trim()

  if (!token) {
    throw new Error(
      'GITHUB_TOKEN is required to inspect associated merged PR files for push site inference.'
    )
  }

  const context = {
    apiBaseUrl: getGitHubApiBaseUrl(env),
    fetch: fetchImpl,
    repositoryPath: encodeRepositoryPath(repositoryFullName),
    token
  }
  const mergedPullRequests = new Map<number, GitHubPullRequest>()

  for (const commitSha of commitShas) {
    const pullRequests = await readAssociatedPullRequestsForCommit(commitSha, context)

    for (const pullRequest of pullRequests) {
      if (isMergedPullRequest(pullRequest)) {
        mergedPullRequests.set(pullRequest.number, pullRequest)
      }
    }
  }

  const paths: string[] = []

  for (const pullRequest of mergedPullRequests.values()) {
    const files = await readPullRequestFiles(pullRequest.number, context)

    for (const file of files) {
      paths.push(file.filename)

      if (file.previous_filename) {
        paths.push(file.previous_filename)
      }
    }
  }

  return paths
}

export async function resolvePushSiteInput(
  event: GitHubPushEvent | undefined,
  env: NodeJS.ProcessEnv,
  fetchImpl: typeof fetch = fetch
): Promise<PushSiteResolution> {
  const pushChangedPathResolution = resolvePushSiteInputFromChangedPaths(
    readPushEventChangedPaths(event)
  )

  if (pushChangedPathResolution.shouldDeploy) {
    return pushChangedPathResolution
  }

  const pullRequestChangedPaths = await readAssociatedMergedPullRequestChangedPaths(
    event,
    env,
    fetchImpl
  )

  return resolvePushSiteInputFromChangedPaths(pullRequestChangedPaths)
}

export async function resolveBuildRun(
  argv: string[],
  env: NodeJS.ProcessEnv = process.env,
  options: ResolveBuildRunOptions = {}
): Promise<BuildRunResolution> {
  const input = hasExplicitSiteInput(argv, env)
    ? parseSiteInputArgs(argv, env)
    : env.GITHUB_EVENT_NAME === 'push'
      ? await resolvePushSiteInput(readPushEvent(env), env, options.fetch ?? fetch)
      : parseSiteInputArgs(argv, env)

  if ('shouldDeploy' in input && !input.shouldDeploy) {
    return {
      shouldDeploy: false
    }
  }

  const definition = loadCheckedInSiteFromInput(input)

  return {
    artifactDir: definition.build.artifactDir,
    shouldDeploy: true,
    siteId: definition.id
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  resolveBuildRun(process.argv.slice(2))
    .then(run => {
      console.log(`should_deploy=${run.shouldDeploy ? 'true' : 'false'}`)
      console.log(`artifact_dir=${run.artifactDir ?? ''}`)
      console.log(`site_id=${run.siteId ?? ''}`)

      if (!run.shouldDeploy) {
        console.error('No checked-in site could be inferred for this push; skipping deploy.')
      }
    })
    .catch(error => {
      console.error(error instanceof Error ? error.message : error)
      process.exit(1)
    })
}
