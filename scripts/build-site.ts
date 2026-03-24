import {
  closeSync,
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  buildSiteEnvironment,
  resolveSiteAppOutDir,
  resolveSiteArtifactDir
} from './site-definition.ts'
import {
  loadBuildSpecFromInput,
  loadSiteDefinitionFromInput,
  parseBuildInputArgs,
  type BuildInputTarget
} from './build-spec.ts'
import { createRunTempDir } from './run-context.ts'
import { writeTrialWebsiteEntries } from './trial-build.ts'
import { validateSite } from './validate-site.ts'

const workspaceRoot = resolve(process.cwd())
const authRoutePath = resolve(workspaceRoot, 'apps/web/app/api/auth/[...nextauth]/route.ts')
const authRouteBackupPath = resolve(
  workspaceRoot,
  'apps/web/app/api/auth/[...nextauth]/route.static-export-disabled.ts'
)
const searchIndexPath = resolve(workspaceRoot, 'apps/web/public/search/search-index.json')

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

function ensureParentDir(path: string): void {
  mkdirSync(dirname(path), { recursive: true })
}

function backupFile(path: string, backupPath: string): boolean {
  if (!existsSync(path)) {
    return false
  }

  ensureParentDir(backupPath)
  copyFileSync(path, backupPath)
  return true
}

function restoreFile(path: string, backupPath: string, hadOriginal: boolean): void {
  if (hadOriginal && existsSync(backupPath)) {
    copyFileSync(backupPath, path)
  }
}

function restoreFileOrDelete(path: string, backupPath: string, hadOriginal: boolean): void {
  if (hadOriginal) {
    restoreFile(path, backupPath, true)
    return
  }

  if (existsSync(path)) {
    rmSync(path, { force: true })
  }
}

function prepareSourceData(input: BuildInputTarget): { restore: () => void } {
  const definition = loadSiteDefinitionFromInput(input)
  const sourcePlan = definition.source
  const restoreDir = createRunTempDir('build-site-source', definition.id)
  const outputPath = resolve(workspaceRoot, sourcePlan.outputPath)
  const backupPath = resolve(restoreDir.path, 'data-websites.json.backup')
  const hadOriginal = backupFile(outputPath, backupPath)

  ensureParentDir(outputPath)

  if (sourcePlan.kind === 'trial-products-json') {
    writeTrialWebsiteEntries(sourcePlan.path, sourcePlan.outputPath, {
      category: sourcePlan.category,
      featuredCount: sourcePlan.featuredCount,
      publishedAt: sourcePlan.publishedAt
    })
  } else {
    writeFileSync(outputPath, readFileSync(resolve(workspaceRoot, sourcePlan.path)))
  }

  return {
    restore: () => {
      restoreFile(outputPath, backupPath, hadOriginal)
      restoreDir.cleanup()
    }
  }
}

function prepareSearchIndex(input: BuildInputTarget, env: NodeJS.ProcessEnv): { restore: () => void } {
  const definition = loadSiteDefinitionFromInput(input)
  const restoreDir = createRunTempDir('build-site-search', definition.id)
  const backupPath = resolve(restoreDir.path, 'search-index.json.backup')
  const hadOriginal = backupFile(searchIndexPath, backupPath)

  run('node', ['scripts/search-index-generator.cjs'], env)

  return {
    restore: () => {
      restoreFile(searchIndexPath, backupPath, hadOriginal)
      restoreDir.cleanup()
    }
  }
}

type AssetStage = {
  backupPath: string
  hadOriginal: boolean
  targetPath: string
}

function stageLocalAsset(sourcePath: string, targetPath: string, backupPath: string): AssetStage {
  const hadOriginal = backupFile(targetPath, backupPath)
  ensureParentDir(targetPath)
  copyFileSync(sourcePath, targetPath)

  return {
    backupPath,
    hadOriginal,
    targetPath
  }
}

function prepareBrandAssets(input: BuildInputTarget): { restore: () => void } {
  const spec = loadBuildSpecFromInput(input)

  if (!spec) {
    return { restore: () => {} }
  }

  const restoreDir = createRunTempDir('build-site-assets', spec.build.siteId)
  const stages: AssetStage[] = []

  const favicon = spec.branding.favicon
  if (favicon?.source === 'local-path') {
    if (!favicon.path.endsWith('.ico')) {
      throw new Error('Build currently supports favicon staging only from .ico files. Use sites/<site-id>/favicon.ico.')
    }

    stages.push(
      stageLocalAsset(
        resolve(workspaceRoot, favicon.path),
        resolve(workspaceRoot, 'apps/web/app/favicon.ico'),
        resolve(restoreDir.path, 'favicon.ico.backup')
      )
    )
  }

  const logo = spec.branding.logo
  if (logo?.source === 'local-path') {
    if (!logo.path.endsWith('.png')) {
      throw new Error('Build currently supports logo staging only from .png files. Use sites/<site-id>/logo.png.')
    }

    stages.push(
      stageLocalAsset(
        resolve(workspaceRoot, logo.path),
        resolve(workspaceRoot, 'apps/web/public/logo.png'),
        resolve(restoreDir.path, 'logo.png.backup')
      )
    )
    stages.push(
      stageLocalAsset(
        resolve(workspaceRoot, logo.path),
        resolve(workspaceRoot, 'apps/web/public/apple-touch-icon.png'),
        resolve(restoreDir.path, 'apple-touch-icon.png.backup')
      )
    )
  }

  const opengraphImage = spec.branding.opengraphImage
  if (opengraphImage?.source === 'local-path') {
    if (!opengraphImage.path.endsWith('.png')) {
      throw new Error(
        'Build currently supports Open Graph image staging only from .png files. Use sites/<site-id>/opengraph-image.png.'
      )
    }

    stages.push(
      stageLocalAsset(
        resolve(workspaceRoot, opengraphImage.path),
        resolve(workspaceRoot, 'apps/web/app/opengraph-image.png'),
        resolve(restoreDir.path, 'opengraph-image.png.backup')
      )
    )
  }

  return {
    restore: () => {
      stages.forEach(stage => {
        restoreFileOrDelete(stage.targetPath, stage.backupPath, stage.hadOriginal)
      })
      restoreDir.cleanup()
    }
  }
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

function finalizeArtifactDir(input: BuildInputTarget): void {
  const definition = loadSiteDefinitionFromInput(input)
  const appOutDir = resolveSiteAppOutDir(definition)
  const artifactDir = resolveSiteArtifactDir(definition)
  const notFoundSourcePath = resolve(appOutDir, '_not-found/index.html')
  const notFoundTargetPath = resolve(artifactDir, '404.html')
  const noJekyllPath = resolve(artifactDir, '.nojekyll')
  const cnamePath = resolve(artifactDir, 'CNAME')

  rmSync(artifactDir, { force: true, recursive: true })
  mkdirSync(dirname(artifactDir), { recursive: true })
  cpSync(appOutDir, artifactDir, { recursive: true })

  if (existsSync(notFoundSourcePath)) {
    copyFileSync(notFoundSourcePath, notFoundTargetPath)
  }

  closeSync(openSync(noJekyllPath, 'w'))
  writeFileSync(cnamePath, `${definition.site.domain}\n`)
}

export function runBuildSite(input: BuildInputTarget): void {
  const definition = loadSiteDefinitionFromInput(input)
  validateSite(input)
  const env = {
    ...process.env,
    ...buildSiteEnvironment(definition),
    STATIC_EXPORT: 'true',
    WEBSITE_DATA_PATH: definition.source.outputPath
  }

  const sourceState = prepareSourceData(input)
  const searchIndexState = prepareSearchIndex(input, env)
  const brandAssetState = prepareBrandAssets(input)

  disableAuthRouteForStaticExport()

  try {
    run('pnpm', ['--filter', 'web', 'build'], env)
    finalizeArtifactDir(input)
  } finally {
    restoreAuthRouteAfterStaticExport()
    brandAssetState.restore()
    searchIndexState.restore()
    sourceState.restore()
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const input = parseBuildInputArgs(process.argv.slice(2))
  runBuildSite(input)
}
