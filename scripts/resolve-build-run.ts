import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { activeCheckedInSiteIds } from '@thedaviddias/site-contract/active-site-ids'
import { loadCheckedInSite, loadCheckedInSiteFromInput, parseSiteInputArgs } from './site-config.ts'

const defaultSiteId = 'default'

const changedPathSitePrefixes: Array<readonly [string, string]> = [
  ...activeCheckedInSiteIds.flatMap(siteId => [
    [`apps/${siteId}/`, siteId] as const,
    [`sites/${siteId}/`, siteId] as const
  ]),
  ['apps/starter/', defaultSiteId]
]

type GitHubPushEvent = {
  after?: string
  commits?: Array<{
    added?: string[]
    id?: string
    message?: string
    modified?: string[]
    removed?: string[]
  }>
  head_commit?: {
    added?: string[]
    id?: string
    message?: string
    modified?: string[]
    removed?: string[]
  } | null
  repository?: {
    full_name?: string
  }
}

type GitHubPullRequest = {
  body?: string | null
  merged_at?: string | null
  number: number
  state?: string
  title?: string | null
}

type GitHubPullRequestFile = {
  filename: string
  previous_filename?: string
}

type GitHubIssue = {
  body?: string | null
  title?: string | null
}

type AssociatedMergedPullRequest = GitHubPullRequest & {
  changedPaths: string[]
}

type GitHubReadContext = {
  apiBaseUrl: string
  fetch: typeof fetch
  token: string
}

type CheckedInSiteSignal = {
  githubIssueRepoKey?: string
  githubIssuesUrl?: string
  normalizedDomain: string
  plainTextSignals: string[]
  siteId: string
}

type GitHubIssueReference = {
  issueNumber: string
  owner: string
  repo: string
  siteIds: string[]
}

type MetadataMatch = {
  issueReferences: GitHubIssueReference[]
  siteIds: Set<string>
}

type DeployTarget = {
  artifactDir: string
  siteId: string
}

type PushSiteResolution = {
  shouldDeploy: boolean
  siteId?: string
  siteIds?: string[]
}

type ChangedPathSiteResolution = PushSiteResolution & {
  ambiguousConcreteSitePaths: boolean
}

type BuildRunResolution = {
  artifactDir?: string
  deployTargets?: DeployTarget[]
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

  const concreteSiteIds = [...matchedSiteIds].filter(siteId => siteId !== defaultSiteId).sort()

  if (concreteSiteIds.length > 1) {
    return undefined
  }

  if (concreteSiteIds.length === 1) {
    return concreteSiteIds[0]
  }

  return matchedSiteIds.has(defaultSiteId) ? defaultSiteId : undefined
}

function inferSiteIdsFromChangedPaths(paths: string[]): string[] {
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

  const concreteSiteIds = [...matchedSiteIds].filter(siteId => siteId !== defaultSiteId).sort()

  if (concreteSiteIds.length > 0) {
    return concreteSiteIds
  }

  return matchedSiteIds.has(defaultSiteId) ? [defaultSiteId] : []
}

function resolveChangedPathSiteInput(paths: string[]): ChangedPathSiteResolution {
  const siteIds = inferSiteIdsFromChangedPaths(paths)
  const siteId = inferSiteIdFromChangedPaths(paths)

  if (siteIds.length > 0) {
    return {
      ambiguousConcreteSitePaths: false,
      shouldDeploy: true,
      siteId,
      siteIds
    }
  }

  return {
    ambiguousConcreteSitePaths: false,
    shouldDeploy: false
  }
}

export function resolvePushSiteInputFromChangedPaths(paths: string[]): PushSiteResolution {
  const { shouldDeploy, siteId, siteIds } = resolveChangedPathSiteInput(paths)

  if (shouldDeploy) {
    return { shouldDeploy, siteId, siteIds }
  }

  return {
    shouldDeploy: true,
    siteIds: [...activeCheckedInSiteIds]
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

function getPushCommitMessages(event: GitHubPushEvent | undefined): string[] {
  const messages = [
    event?.head_commit?.message,
    ...(event?.commits?.map(commit => commit.message) ?? [])
  ]
  const seen = new Set<string>()

  return messages.flatMap(message => {
    const normalizedMessage = message?.trim()

    if (!normalizedMessage || seen.has(normalizedMessage)) {
      return []
    }

    seen.add(normalizedMessage)
    return [normalizedMessage]
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeHostname(value: string): string {
  return value.toLowerCase().replace(/^www\./, '')
}

function normalizeUrlText(value: string): string {
  return value.replace(/\/+$/, '').toLowerCase()
}

function issueRepoKey(owner: string, repo: string): string {
  return `${owner.toLowerCase()}/${repo.toLowerCase()}`
}

function hasDelimitedText(haystack: string, needle: string): boolean {
  return new RegExp(`(^|[^a-z0-9.-])${escapeRegExp(needle)}(?=$|[^a-z0-9.-])`, 'i').test(haystack)
}

function stripTrailingUrlPunctuation(value: string): string {
  return value.replace(/[),.;!?\]]+$/g, '')
}

function extractUrls(text: string): URL[] {
  const urls: URL[] = []
  const urlPattern = /https?:\/\/[^\s<>"'`]+/gi

  for (const match of text.matchAll(urlPattern)) {
    try {
      urls.push(new URL(stripTrailingUrlPunctuation(match[0])))
    } catch {
      // Ignore malformed free-form text URLs.
    }
  }

  return urls
}

function parseGitHubIssueUrl(url: URL): Omit<GitHubIssueReference, 'siteIds'> | undefined {
  if (normalizeHostname(url.hostname) !== 'github.com') {
    return undefined
  }

  const [owner, repo, issuePath, issueNumber, ...rest] = url.pathname.split('/').filter(Boolean)

  if (
    !owner ||
    !repo ||
    issuePath !== 'issues' ||
    !issueNumber ||
    rest.length > 0 ||
    !/^\d+$/.test(issueNumber)
  ) {
    return undefined
  }

  return {
    issueNumber,
    owner: decodeURIComponent(owner),
    repo: decodeURIComponent(repo)
  }
}

function buildCheckedInSiteSignals(): CheckedInSiteSignal[] {
  const siteIds = [defaultSiteId, ...activeCheckedInSiteIds]

  return siteIds.map(siteId => {
    const siteConfig = loadCheckedInSite(siteId)
    const plainTextSignals = new Set<string>([
      siteConfig.id,
      siteConfig.site.domain,
      siteConfig.site.publicUrl
    ])

    if (siteConfig.id === defaultSiteId) {
      plainTextSignals.delete(defaultSiteId)
    }

    if (siteConfig.social.githubIssuesUrl) {
      plainTextSignals.add(siteConfig.social.githubIssuesUrl)
    }

    return {
      githubIssueRepoKey:
        siteConfig.social.githubIssueOwner && siteConfig.social.githubIssueRepo
          ? issueRepoKey(siteConfig.social.githubIssueOwner, siteConfig.social.githubIssueRepo)
          : undefined,
      githubIssuesUrl: siteConfig.social.githubIssuesUrl
        ? normalizeUrlText(siteConfig.social.githubIssuesUrl)
        : undefined,
      normalizedDomain: normalizeHostname(siteConfig.site.domain),
      plainTextSignals: [...plainTextSignals].filter(Boolean),
      siteId: siteConfig.id
    }
  })
}

function urlMatchesSiteSignal(url: URL, signal: CheckedInSiteSignal): boolean {
  const normalizedHost = normalizeHostname(url.hostname)

  if (normalizedHost === signal.normalizedDomain) {
    return true
  }

  if (!signal.githubIssuesUrl) {
    return false
  }

  const normalizedUrl = normalizeUrlText(url.toString())

  return (
    normalizedUrl === signal.githubIssuesUrl ||
    normalizedUrl.startsWith(`${signal.githubIssuesUrl}/`) ||
    normalizedUrl.startsWith(`${signal.githubIssuesUrl}?`)
  )
}

function mergeIssueReference(
  references: Map<string, GitHubIssueReference>,
  reference: GitHubIssueReference
): void {
  const key = `${issueRepoKey(reference.owner, reference.repo)}#${reference.issueNumber}`
  const existingReference = references.get(key)

  if (!existingReference) {
    references.set(key, reference)
    return
  }

  existingReference.siteIds = [...new Set([...existingReference.siteIds, ...reference.siteIds])]
}

function collectMetadataMatches(
  textValues: Array<string | null | undefined>,
  signals: CheckedInSiteSignal[],
  options: {
    allowedSiteIds?: Set<string>
    collectIssueReferences?: boolean
  } = {}
): MetadataMatch {
  const allowedSignals = options.allowedSiteIds
    ? signals.filter(signal => options.allowedSiteIds?.has(signal.siteId))
    : signals
  const collectIssueReferences = options.collectIssueReferences ?? true
  const issueReferences = new Map<string, GitHubIssueReference>()
  const siteIds = new Set<string>()

  for (const textValue of textValues) {
    const text = textValue?.trim()

    if (!text) {
      continue
    }

    for (const url of extractUrls(text)) {
      for (const signal of allowedSignals) {
        if (urlMatchesSiteSignal(url, signal)) {
          siteIds.add(signal.siteId)
        }
      }

      if (!collectIssueReferences) {
        continue
      }

      const issueReference = parseGitHubIssueUrl(url)

      if (!issueReference) {
        continue
      }

      const matchedSignals = allowedSignals.filter(
        signal =>
          signal.githubIssueRepoKey === issueRepoKey(issueReference.owner, issueReference.repo)
      )

      if (matchedSignals.length === 0) {
        continue
      }

      const matchedSiteIds = matchedSignals.map(signal => signal.siteId)

      for (const siteId of matchedSiteIds) {
        siteIds.add(siteId)
      }

      mergeIssueReference(issueReferences, {
        ...issueReference,
        siteIds: matchedSiteIds
      })
    }

    for (const signal of allowedSignals) {
      if (
        signal.plainTextSignals.some(plainTextSignal => hasDelimitedText(text, plainTextSignal))
      ) {
        siteIds.add(signal.siteId)
      }
    }
  }

  return {
    issueReferences: [...issueReferences.values()],
    siteIds
  }
}

function resolvePushSiteInputFromMatchedSiteIds(
  siteIds: Set<string>,
  sourceDescription: string
): PushSiteResolution {
  const concreteSiteIds = [...siteIds].filter(siteId => siteId !== defaultSiteId).sort()

  if (concreteSiteIds.length > 1) {
    throw new Error(
      `Push ${sourceDescription} matched multiple concrete sites (${concreteSiteIds.join(', ')}); manual site_id required via workflow_dispatch for each site.`
    )
  }

  if (concreteSiteIds.length === 1) {
    return {
      shouldDeploy: true,
      siteId: concreteSiteIds[0],
      siteIds: [concreteSiteIds[0]]
    }
  }

  if (siteIds.has(defaultSiteId)) {
    return {
      shouldDeploy: true,
      siteId: defaultSiteId,
      siteIds: [defaultSiteId]
    }
  }

  return {
    shouldDeploy: false
  }
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

async function readLinkedPublicIssue(
  reference: GitHubIssueReference,
  context: GitHubReadContext
): Promise<GitHubIssue> {
  const url = new URL(
    `${context.apiBaseUrl}/repos/${encodeRepositoryPath(
      `${reference.owner}/${reference.repo}`
    )}/issues/${encodeURIComponent(reference.issueNumber)}`
  )

  try {
    return await readGitHubJson<GitHubIssue>(url, context.token, context.fetch)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    throw new Error(
      `Failed to fetch linked public issue ${reference.owner}/${reference.repo}#${reference.issueNumber}: ${message}`
    )
  }
}

function isMergedPullRequest(pullRequest: GitHubPullRequest): boolean {
  return Boolean(pullRequest.merged_at)
}

export async function readAssociatedMergedPullRequestChangedPaths(
  event: GitHubPushEvent | undefined,
  env: NodeJS.ProcessEnv,
  fetchImpl: typeof fetch = fetch
): Promise<string[]> {
  const associatedPullRequests = await readAssociatedMergedPullRequests(event, env, fetchImpl)

  return associatedPullRequests.flatMap(pullRequest => pullRequest.changedPaths)
}

async function readAssociatedMergedPullRequests(
  event: GitHubPushEvent | undefined,
  env: NodeJS.ProcessEnv,
  fetchImpl: typeof fetch = fetch
): Promise<AssociatedMergedPullRequest[]> {
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

  const associatedPullRequests: AssociatedMergedPullRequest[] = []

  for (const pullRequest of mergedPullRequests.values()) {
    const files = await readPullRequestFiles(pullRequest.number, context)
    const changedPaths: string[] = []

    for (const file of files) {
      changedPaths.push(file.filename)

      if (file.previous_filename) {
        changedPaths.push(file.previous_filename)
      }
    }

    associatedPullRequests.push({
      ...pullRequest,
      changedPaths
    })
  }

  return associatedPullRequests
}

async function resolvePushSiteInputFromAssociatedPullRequestMetadata(
  associatedPullRequests: AssociatedMergedPullRequest[],
  event: GitHubPushEvent | undefined,
  env: NodeJS.ProcessEnv,
  fetchImpl: typeof fetch
): Promise<PushSiteResolution> {
  if (associatedPullRequests.length === 0) {
    return {
      shouldDeploy: false
    }
  }

  const token = env.GITHUB_TOKEN?.trim()

  if (!token) {
    throw new Error(
      'GITHUB_TOKEN is required to inspect associated merged PR metadata for push site inference.'
    )
  }

  const signals = buildCheckedInSiteSignals()
  const metadataMatch = collectMetadataMatches(
    [
      ...associatedPullRequests.flatMap(pullRequest => [pullRequest.title, pullRequest.body]),
      ...getPushCommitMessages(event)
    ],
    signals
  )
  const issueContext = {
    apiBaseUrl: getGitHubApiBaseUrl(env),
    fetch: fetchImpl,
    token
  }

  for (const issueReference of metadataMatch.issueReferences) {
    const issue = await readLinkedPublicIssue(issueReference, issueContext)

    for (const siteId of issueReference.siteIds) {
      metadataMatch.siteIds.add(siteId)
    }

    const allowedSiteIds = new Set(issueReference.siteIds)
    const issueMatch = collectMetadataMatches([issue.title, issue.body], signals, {
      allowedSiteIds,
      collectIssueReferences: false
    })

    for (const siteId of issueMatch.siteIds) {
      metadataMatch.siteIds.add(siteId)
    }
  }

  return resolvePushSiteInputFromMatchedSiteIds(metadataMatch.siteIds, 'metadata')
}

export async function resolvePushSiteInput(
  event: GitHubPushEvent | undefined,
  env: NodeJS.ProcessEnv,
  fetchImpl: typeof fetch = fetch
): Promise<PushSiteResolution> {
  const pushChangedPathResolution = resolveChangedPathSiteInput(readPushEventChangedPaths(event))

  if (pushChangedPathResolution.shouldDeploy) {
    return {
      shouldDeploy: true,
      siteId: pushChangedPathResolution.siteId,
      siteIds: pushChangedPathResolution.siteIds
    }
  }

  if (pushChangedPathResolution.ambiguousConcreteSitePaths) {
    return {
      shouldDeploy: false
    }
  }

  const associatedPullRequests = await readAssociatedMergedPullRequests(event, env, fetchImpl)
  const pullRequestChangedPaths = associatedPullRequests.flatMap(
    pullRequest => pullRequest.changedPaths
  )
  const pullRequestChangedPathResolution = resolveChangedPathSiteInput(pullRequestChangedPaths)

  if (pullRequestChangedPathResolution.shouldDeploy) {
    return {
      shouldDeploy: true,
      siteId: pullRequestChangedPathResolution.siteId,
      siteIds: pullRequestChangedPathResolution.siteIds
    }
  }

  if (pullRequestChangedPathResolution.ambiguousConcreteSitePaths) {
    return {
      shouldDeploy: false
    }
  }

  const metadataResolution = await resolvePushSiteInputFromAssociatedPullRequestMetadata(
    associatedPullRequests,
    event,
    env,
    fetchImpl
  )

  if (metadataResolution.shouldDeploy) {
    return metadataResolution
  }

  return {
    shouldDeploy: true,
    siteIds: [...activeCheckedInSiteIds]
  }
}

function createDeployTargets(siteIds: readonly string[]): DeployTarget[] {
  return siteIds.map(siteId => {
    const definition = loadCheckedInSite(siteId)

    return {
      artifactDir: definition.build.artifactDir,
      siteId: definition.id
    }
  })
}

function isWorkflowDispatchAllSites(env: NodeJS.ProcessEnv): boolean {
  return env.GITHUB_EVENT_NAME === 'workflow_dispatch' && env.SITE_ID?.trim() === 'all'
}

export async function resolveBuildRun(
  argv: string[],
  env: NodeJS.ProcessEnv = process.env,
  options: ResolveBuildRunOptions = {}
): Promise<BuildRunResolution> {
  if (isWorkflowDispatchAllSites(env)) {
    return {
      deployTargets: createDeployTargets(activeCheckedInSiteIds),
      shouldDeploy: true
    }
  }

  const input = hasExplicitSiteInput(argv, env)
    ? parseSiteInputArgs(argv, env)
    : env.GITHUB_EVENT_NAME === 'push'
      ? await resolvePushSiteInput(readPushEvent(env), env, options.fetch ?? fetch)
      : parseSiteInputArgs(argv, env)

  if ('shouldDeploy' in input && !input.shouldDeploy) {
    return {
      deployTargets: [],
      shouldDeploy: false
    }
  }

  if ('siteIds' in input && input.siteIds?.length) {
    const deployTargets = createDeployTargets(input.siteIds)

    return {
      artifactDir: deployTargets.length === 1 ? deployTargets[0]?.artifactDir : undefined,
      deployTargets,
      shouldDeploy: true,
      siteId: deployTargets.length === 1 ? deployTargets[0]?.siteId : undefined
    }
  }

  const definition = loadCheckedInSiteFromInput(input)
  const deployTargets = [
    {
      artifactDir: definition.build.artifactDir,
      siteId: definition.id
    }
  ]

  return {
    artifactDir: definition.build.artifactDir,
    deployTargets,
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
      console.log(`deploy_targets=${JSON.stringify(run.deployTargets ?? [])}`)

      if (!run.shouldDeploy) {
        console.error('No checked-in site could be inferred for this push; skipping deploy.')
      }
    })
    .catch(error => {
      console.error(error instanceof Error ? error.message : error)
      process.exit(1)
    })
}
