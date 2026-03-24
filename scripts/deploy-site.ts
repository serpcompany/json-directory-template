import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { resolveSiteArtifactDir } from './site-definition.ts'
import { loadSiteDefinitionFromInput, parseBuildInputArgs, type BuildInputTarget } from './build-spec.ts'

const workspaceRoot = resolve(process.cwd())

export interface DeployPlan {
  branch: string
  buildDir: string
  preserve: string[]
  repoUrl: string
  siteId: string
  strategy: 'github-pages-repo-sync'
}

export function parseDeployArgs(argv: string[], env: NodeJS.ProcessEnv = process.env): BuildInputTarget & {
  dryRun: boolean
} {
  return {
    ...parseBuildInputArgs(argv, env),
    dryRun: argv.includes('--dry-run')
  }
}

export function buildDeployPlan(input: BuildInputTarget): DeployPlan {
  const definition = loadSiteDefinitionFromInput(input)

  if (!definition.deploy) {
    throw new Error(`Site ${definition.id} does not define a deploy target`)
  }

  return {
    branch: process.env.DEPLOY_BRANCH || definition.deploy.branch,
    buildDir: resolveSiteArtifactDir(definition),
    preserve: definition.deploy.preserve,
    repoUrl: process.env.DEPLOY_REPO_URL || definition.deploy.repoUrl,
    siteId: definition.id,
    strategy: definition.deploy.strategy
  }
}

export function runDeploySite(input: BuildInputTarget, dryRun = false): void {
  const plan = buildDeployPlan(input)

  if (!existsSync(plan.buildDir)) {
    const targetHint = input.specPath
      ? `pnpm build:site -- --spec ${input.specPath}`
      : `pnpm build:site -- --site ${plan.siteId}`
    throw new Error(`Build artifact not found at ${plan.buildDir}. Run ${targetHint} first.`)
  }

  if (dryRun) {
    console.log(JSON.stringify(plan, null, 2))
    return
  }

  const result = spawnSync('bash', ['scripts/deploy-to-repo.sh', plan.repoUrl, plan.branch], {
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
