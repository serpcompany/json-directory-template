import {
  closeSync,
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
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
  loadCheckedInSiteFromInput,
  parseSiteInputArgs,
  resolveSiteAppOutDir,
  resolveSiteArtifactDir,
  type SiteInputTarget
} from './site-config.ts'
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

function prepareSourceData(input: SiteInputTarget): { restore: () => void } {
  const definition = loadCheckedInSiteFromInput(input)
  const sourcePlan = definition.content.listingSource
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

function prepareSearchIndex(input: SiteInputTarget, env: NodeJS.ProcessEnv): { restore: () => void } {
  const definition = loadCheckedInSiteFromInput(input)
  const restoreDir = createRunTempDir('build-site-search', definition.id)
  const backupPath = resolve(restoreDir.path, 'search-index.json.backup')
  const hadOriginal = backupFile(searchIndexPath, backupPath)

  run('pnpm', ['tsx', 'scripts/search-index-generator.ts'], env)

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

function prepareBrandAssets(input: SiteInputTarget): { restore: () => void } {
  const siteConfig = loadCheckedInSiteFromInput(input)
  const restoreDir = createRunTempDir('build-site-assets', siteConfig.id)
  const stages: AssetStage[] = []

  const favicon = siteConfig.branding.favicon
  if (favicon?.source === 'local-path') {
    if (!favicon.path.endsWith('.ico')) {
      throw new Error(
        'Build currently supports favicon staging only from .ico files. Use sites/<site-id>/assets/favicon.ico.'
      )
    }

    stages.push(
      stageLocalAsset(
        resolve(workspaceRoot, favicon.path),
        resolve(workspaceRoot, 'apps/web/app/favicon.ico'),
        resolve(restoreDir.path, 'favicon.ico.backup')
      )
    )
  }

  const logo = siteConfig.branding.logo
  if (logo?.source === 'local-path') {
    if (!logo.path.endsWith('.png')) {
      throw new Error(
        'Build currently supports logo staging only from .png files. Use sites/<site-id>/assets/logo.png.'
      )
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

  const opengraphImage = siteConfig.branding.opengraphImage
  if (opengraphImage?.source === 'local-path') {
    if (!opengraphImage.path.endsWith('.png')) {
      throw new Error(
        'Build currently supports Open Graph image staging only from .png files. Use sites/<site-id>/assets/opengraph-image.png.'
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

type ArtifactSurfaceFlags = {
  showAuth: boolean
  showDocs: boolean
  showFavorites: boolean
  showGuides: boolean
  showProjects: boolean
}

function removeArtifactPath(path: string): void {
  if (existsSync(path)) {
    rmSync(path, { force: true, recursive: true })
  }
}

export function applyListingRouteBasePath(artifactDir: string, listingBasePath: string): void {
  applyPublicRouteBasePath(artifactDir, 'websites', listingBasePath)
}

function applyPublicRouteBasePath(
  artifactDir: string,
  defaultBasePath: string,
  publicBasePath: string
): void {
  const normalizedBasePath = publicBasePath.replace(/^\/+|\/+$/g, '')

  if (!normalizedBasePath || normalizedBasePath === defaultBasePath) {
    return
  }

  const defaultListingsPath = resolve(artifactDir, defaultBasePath)
  const targetListingsPath = resolve(artifactDir, normalizedBasePath)

  if (!existsSync(defaultListingsPath)) {
    return
  }

  removeArtifactPath(targetListingsPath)
  renameSync(defaultListingsPath, targetListingsPath)
}

type ArtifactPublicRoutePaths = {
  docsBasePath: string
  listingBasePath: string
  networkBasePath: string
}

export function applyConfiguredPublicRoutePaths(
  artifactDir: string,
  paths: ArtifactPublicRoutePaths
): void {
  applyListingRouteBasePath(artifactDir, paths.listingBasePath)
  applyPublicRouteBasePath(artifactDir, 'docs', paths.docsBasePath)
  applyPublicRouteBasePath(artifactDir, 'projects', paths.networkBasePath)
}

function pruneArtifactTree(path: string): void {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const entryPath = resolve(path, entry.name)

    if (entry.isDirectory()) {
      pruneArtifactTree(entryPath)
      continue
    }

    if (entry.name.endsWith('.map')) {
      rmSync(entryPath, { force: true })
      continue
    }

    if (entry.name.startsWith('__next') && entry.name.endsWith('.txt')) {
      rmSync(entryPath, { force: true })
      continue
    }

    if (entry.name === 'index.txt') {
      rmSync(entryPath, { force: true })
    }
  }
}

export function pruneStaticArtifactDir(artifactDir: string, flags: ArtifactSurfaceFlags): void {
  pruneArtifactTree(artifactDir)

  removeArtifactPath(resolve(artifactDir, '_not-found'))
  removeArtifactPath(resolve(artifactDir, '404'))

  if (!flags.showAuth) {
    removeArtifactPath(resolve(artifactDir, 'account'))
    removeArtifactPath(resolve(artifactDir, 'login'))
  }

  if (!flags.showFavorites) {
    removeArtifactPath(resolve(artifactDir, 'favorites'))
  }

  if (!flags.showProjects) {
    removeArtifactPath(resolve(artifactDir, 'projects'))
  }

  if (!flags.showDocs) {
    removeArtifactPath(resolve(artifactDir, 'docs'))
  }

  if (!flags.showGuides) {
    removeArtifactPath(resolve(artifactDir, 'guides'))
  }
}

function finalizeArtifactDir(input: SiteInputTarget): void {
  const definition = loadCheckedInSiteFromInput(input)
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

  pruneStaticArtifactDir(artifactDir, {
    showAuth: definition.features.showAuth,
    showDocs: definition.features.showDocs,
    showFavorites: definition.features.showFavorites,
    showGuides: definition.features.showGuides,
    showProjects: definition.features.showProjects
  })
  applyConfiguredPublicRoutePaths(artifactDir, {
    docsBasePath: definition.routes.docsBasePath,
    listingBasePath: definition.routes.listingBasePath,
    networkBasePath: definition.routes.networkBasePath
  })

  closeSync(openSync(noJekyllPath, 'w'))
  writeFileSync(cnamePath, `${definition.site.domain}\n`)
}

export function runBuildSite(input: SiteInputTarget): void {
  const definition = loadCheckedInSiteFromInput(input)
  validateSite(input)
  const env = {
    ...process.env,
    ...buildSiteEnvironment(definition),
    STATIC_EXPORT: 'true',
    WEBSITE_DATA_PATH: definition.content.listingSource.outputPath
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
  const input = parseSiteInputArgs(process.argv.slice(2))
  runBuildSite(input)
}
