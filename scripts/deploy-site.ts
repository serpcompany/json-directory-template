import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  loadCheckedInSiteFromInput,
  parseSiteInputArgs,
  resolveSiteArtifactDir,
  type SiteInputTarget
} from './site-config.ts'

const workspaceRoot = resolve(process.cwd())

export interface DeployPlan {
  branch: string
  buildDir: string
  siteId: string
}

export interface GitHubPagesRepoSyncDeployPlan extends DeployPlan {
  preserve: string[]
  repoUrl: string
  strategy: 'github-pages-repo-sync'
}

export interface CloudflarePagesDirectUploadDeployPlan extends DeployPlan {
  accountId: string
  projectName: string
  strategy: 'cloudflare-pages-direct-upload'
}

export type SiteDeployPlan = GitHubPagesRepoSyncDeployPlan | CloudflarePagesDirectUploadDeployPlan

export interface DeploySourceState {
  ahead: number
  behind: number
  branch: string
  isDirty: boolean
  upstream: string | null
}

export interface DeployPlanOptions {
  env?: NodeJS.ProcessEnv
}

export function parseDeployArgs(
  argv: string[],
  env: NodeJS.ProcessEnv = process.env
): SiteInputTarget & {
  dryRun: boolean
} {
  return {
    ...parseSiteInputArgs(argv, env),
    dryRun: argv.includes('--dry-run')
  }
}

export function hasDeployTargetOverride(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.DEPLOY_REPO_URL || env.DEPLOY_BRANCH)
}

export function assertDeployTargetOverrideAllowed(env: NodeJS.ProcessEnv = process.env): void {
  if (!hasDeployTargetOverride(env)) {
    return
  }

  if (env.ALLOW_DEPLOY_TARGET_OVERRIDE === 'true') {
    return
  }

  throw new Error(
    [
      'Refusing deploy target override.',
      'Deploy repo and branch must come from checked-in site config during normal deploys.',
      'Remove DEPLOY_REPO_URL/DEPLOY_BRANCH, update the site config in source, and ship that change through gitflow.',
      'An audited emergency override requires ALLOW_DEPLOY_TARGET_OVERRIDE=true and explicit same-turn user approval.'
    ].join('\n')
  )
}

export function buildDeployPlan(
  input: SiteInputTarget,
  options: DeployPlanOptions = {}
): SiteDeployPlan {
  const definition = loadCheckedInSiteFromInput(input)
  const env = options.env ?? process.env

  assertDeployTargetOverrideAllowed(env)

  if (!definition.deploy) {
    throw new Error(`Site ${definition.id} does not define a deploy target`)
  }

  const branch = env.DEPLOY_BRANCH || definition.deploy.branch
  const buildDir = resolveSiteArtifactDir(definition)

  if (definition.deploy.strategy === 'cloudflare-pages-direct-upload') {
    if (env.DEPLOY_REPO_URL) {
      throw new Error('DEPLOY_REPO_URL is not supported for Cloudflare Pages deploy targets.')
    }

    return {
      accountId: definition.deploy.accountId,
      branch,
      buildDir,
      projectName: definition.deploy.projectName,
      siteId: definition.id,
      strategy: definition.deploy.strategy
    }
  }

  return {
    branch,
    buildDir,
    preserve: definition.deploy.preserve,
    repoUrl: env.DEPLOY_REPO_URL || definition.deploy.repoUrl,
    siteId: definition.id,
    strategy: definition.deploy.strategy
  }
}

function runGit(args: string[], description: string, allowFailure = false): string | null {
  const result = spawnSync('git', args, {
    cwd: workspaceRoot,
    encoding: 'utf8'
  })

  if (result.status === 0) {
    return result.stdout.trim()
  }

  if (allowFailure) {
    return null
  }

  const stderr = typeof result.stderr === 'string' ? result.stderr.trim() : ''
  const suffix = stderr ? ` ${stderr}` : ''
  throw new Error(`Unable to inspect source git state before deploy (${description}).${suffix}`)
}

export function readDeploySourceState(): DeploySourceState {
  const dirtyOutput = runGit(['status', '--porcelain', '--untracked-files=normal'], 'git status')
  const branch = runGit(['branch', '--show-current'], 'git branch', true) || 'HEAD'
  const upstream = runGit(
    ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'],
    'git upstream',
    true
  )

  let ahead = 0
  let behind = 0

  if (upstream) {
    const counts = runGit(['rev-list', '--left-right', '--count', 'HEAD...@{u}'], 'git rev-list')
    const [aheadRaw, behindRaw] = (counts || '').split(/\s+/)
    ahead = Number.parseInt(aheadRaw || '0', 10)
    behind = Number.parseInt(behindRaw || '0', 10)
  }

  return {
    ahead,
    behind,
    branch,
    isDirty: Boolean(dirtyOutput),
    upstream
  }
}

export function isGitHubActionsDeploy(env: NodeJS.ProcessEnv): boolean {
  return env.GITHUB_ACTIONS === 'true' && Boolean(env.GITHUB_SHA)
}

export function assertDeploySourceStateAllowsPush(
  sourceState: DeploySourceState,
  env: NodeJS.ProcessEnv = process.env
): void {
  if (isGitHubActionsDeploy(env)) {
    return
  }

  const reasons: string[] = []

  if (sourceState.isDirty) {
    reasons.push('the source worktree has uncommitted or untracked changes')
  }

  if (!sourceState.upstream) {
    reasons.push(`branch "${sourceState.branch}" has no upstream tracking branch`)
  }

  if (sourceState.ahead > 0 && sourceState.behind > 0) {
    reasons.push(
      `branch "${sourceState.branch}" is ${sourceState.ahead} commit(s) ahead and ${sourceState.behind} commit(s) behind ${sourceState.upstream}`
    )
  } else if (sourceState.ahead > 0) {
    reasons.push(
      `branch "${sourceState.branch}" is ${sourceState.ahead} commit(s) ahead of ${sourceState.upstream}`
    )
  } else if (sourceState.behind > 0) {
    reasons.push(
      `branch "${sourceState.branch}" is ${sourceState.behind} commit(s) behind ${sourceState.upstream}`
    )
  }

  if (reasons.length === 0) {
    return
  }

  throw new Error(
    [
      'Refusing to deploy target repo from unreviewed source state.',
      'Reason(s):',
      ...reasons.map(reason => `- ${reason}`),
      '',
      'Commit source changes on a branch, push it, open/merge the PR, then deploy from a clean branch synced with its upstream or let GitHub Actions deploy the checked-out commit.',
      'Dry-run remains available: pnpm deploy:site -- --site <site-id> --dry-run',
      'Emergency bypass requires explicit same-turn user approval acknowledging that gitflow is being bypassed.'
    ].join('\n')
  )
}

export function assertDeploySourceIsReviewable(env: NodeJS.ProcessEnv = process.env): void {
  if (isGitHubActionsDeploy(env)) {
    return
  }

  assertDeploySourceStateAllowsPush(readDeploySourceState(), env)
}

export function runDeploySite(input: SiteInputTarget, dryRun = false): void {
  const plan = buildDeployPlan(input)

  if (dryRun) {
    console.log(JSON.stringify(plan, null, 2))
    return
  }

  assertDeploySourceIsReviewable()

  if (!existsSync(plan.buildDir)) {
    const targetHint = `pnpm build:site -- --site ${plan.siteId}`
    throw new Error(`Build artifact not found at ${plan.buildDir}. Run ${targetHint} first.`)
  }

  const result =
    plan.strategy === 'cloudflare-pages-direct-upload'
      ? spawnSync(
          'npx',
          [
            '-y',
            'wrangler',
            'pages',
            'deploy',
            plan.buildDir,
            '--project-name',
            plan.projectName,
            '--branch',
            plan.branch
          ],
          {
            cwd: workspaceRoot,
            env: {
              ...process.env,
              CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || plan.accountId
            },
            stdio: 'inherit'
          }
        )
      : spawnSync('bash', ['scripts/deploy-to-repo.sh', plan.repoUrl, plan.branch], {
          cwd: workspaceRoot,
          env: {
            ...process.env,
            DEPLOY_BUILD_DIR: plan.buildDir,
            DEPLOY_PRESERVE_PATHS: plan.preserve.join('\n')
          },
          stdio: 'inherit'
        })

  if (result.status !== 0) {
    throw new Error(`Deploy failed with exit code ${result.status ?? 1}`)
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const { dryRun, ...input } = parseDeployArgs(process.argv.slice(2))
  runDeploySite(input, dryRun)
}
