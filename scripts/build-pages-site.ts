import { closeSync, copyFileSync, existsSync, openSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { writeTrialWebsiteEntries } from './trial-build.ts'

const workspaceRoot = resolve(process.cwd())
const authRoutePath = resolve(workspaceRoot, 'apps/web/app/api/auth/[...nextauth]/route.ts')
const authRouteBackupPath = resolve(
  workspaceRoot,
  'apps/web/app/api/auth/[...nextauth]/route.static-export-disabled.ts'
)
const outDir = resolve(workspaceRoot, 'apps/web/out')
const notFoundSourcePath = resolve(outDir, '_not-found/index.html')
const notFoundTargetPath = resolve(outDir, '404.html')
const noJekyllPath = resolve(outDir, '.nojekyll')
const cnamePath = resolve(outDir, 'CNAME')

function run(command: string, args: string[], env: NodeJS.ProcessEnv): void {
  const result = spawnSync(command, args, {
    cwd: workspaceRoot,
    env,
    stdio: 'inherit'
  })

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status ?? 1}`)
  }
}

function prepareTrialData(env: NodeJS.ProcessEnv): void {
  const sourceJsonPath = env.TRIAL_SOURCE_JSON

  if (!sourceJsonPath) {
    return
  }

  writeTrialWebsiteEntries(sourceJsonPath, env.TRIAL_OUTPUT_JSON || 'data/websites.json', {
    category: env.TRIAL_WEBSITE_CATEGORY || 'automation-workflow',
    featuredCount: Number(env.TRIAL_WEBSITE_FEATURED_COUNT || '6'),
    publishedAt: env.TRIAL_WEBSITE_PUBLISHED_AT || new Date().toISOString().slice(0, 10)
  })
}

function disableAuthRouteForStaticExport(): void {
  if (!existsSync(authRoutePath)) {
    return
  }

  renameSync(authRoutePath, authRouteBackupPath)
}

function restoreAuthRouteAfterStaticExport(): void {
  if (!existsSync(authRouteBackupPath)) {
    return
  }

  renameSync(authRouteBackupPath, authRoutePath)
}

function finalizeOutDir(): void {
  if (existsSync(notFoundSourcePath)) {
    copyFileSync(notFoundSourcePath, notFoundTargetPath)
  }

  closeSync(openSync(noJekyllPath, 'w'))

  const domain = process.env.SITE_DOMAIN?.trim()
  if (domain) {
    writeFileSync(cnamePath, `${domain}\n`)
  }
}

const env = {
  ...process.env,
  STATIC_EXPORT: 'true'
}

prepareTrialData(env)
disableAuthRouteForStaticExport()

try {
  run('pnpm', ['--filter', 'web', 'build'], env)
  finalizeOutDir()
} finally {
  restoreAuthRouteAfterStaticExport()
}
