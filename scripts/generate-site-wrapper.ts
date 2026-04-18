import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const TEMPLATE_APP_ID = 'starter'

const WRAPPER_TEMPLATE_ENTRIES = [
  'app',
  'auth.ts',
  'content-collections.ts',
  'contexts',
  'hooks',
  'lib',
  'next.config.ts',
  'package.json',
  'postcss.config.js',
  'public',
  'tsconfig.json',
  'turbopack-empty.ts',
] as const

const EXCLUDED_PATH_SEGMENTS = new Set([
  '__tests__',
  '.next',
  'coverage',
  'node_modules',
  'out',
])

const EXCLUDED_RELATIVE_PATHS = new Set([
  'next-env.d.ts',
  'search/search-index.json',
  'public/search/search-index.json',
])

type GenerateSiteWrapperOptions = {
  overwrite?: boolean
  siteId: string
  workspaceRoot?: string
}

function parseArgs(argv: string[]): GenerateSiteWrapperOptions {
  const siteFlagIndex = argv.findIndex(argument => argument === '--site')
  const siteId = siteFlagIndex >= 0 ? argv[siteFlagIndex + 1] : undefined
  const overwrite = argv.includes('--overwrite')

  if (!siteId) {
    throw new Error('Usage: pnpm tsx scripts/generate-site-wrapper.ts -- --site <site-id> [--overwrite]')
  }

  return {
    overwrite,
    siteId,
  }
}

function shouldCopyRelativePath(relativePath: string): boolean {
  if (!relativePath) {
    return true
  }

  const normalizedRelativePath = relativePath.replaceAll('\\', '/')

  if (EXCLUDED_RELATIVE_PATHS.has(normalizedRelativePath)) {
    return false
  }

  return normalizedRelativePath
    .split('/')
    .every(segment => !EXCLUDED_PATH_SEGMENTS.has(segment))
}

function copyEntry({
  sourcePath,
  targetPath,
}: {
  sourcePath: string
  targetPath: string
}): void {
  cpSync(sourcePath, targetPath, {
    filter: (candidatePath: string) => {
      const relativePath = relative(sourcePath, candidatePath)
      return shouldCopyRelativePath(relativePath)
    },
    recursive: true,
  })
}

function buildWrapperScripts(siteId: string, templateScripts: Record<string, string>): Record<string, string> {
  const buildPrefix = `NEXT_PUBLIC_SITE_ID=${siteId} SITE_ID=${siteId}`

  return {
    analyze: templateScripts.analyze,
    build: `NODE_NO_WARNINGS=1 ${buildPrefix} next build`,
    clean: templateScripts.clean,
    dev: `${buildPrefix} next dev --webpack --port \${PORT:-3005}`,
    'dev:inspect': `NODE_OPTIONS='--inspect' ${buildPrefix} next dev --webpack --port \${PORT:-3005}`,
    lint: templateScripts.lint,
    start: templateScripts.start,
    typecheck: `${buildPrefix} tsc --noEmit --emitDeclarationOnly false`,
  }
}

export function rewriteWrapperPackageJson(
  packageJsonSource: string,
  siteId: string
): string {
  const packageJson = JSON.parse(packageJsonSource) as {
    name: string
    scripts: Record<string, string>
  } & Record<string, unknown>

  packageJson.name = siteId
  packageJson.scripts = buildWrapperScripts(siteId, packageJson.scripts)

  return `${JSON.stringify(packageJson, null, 2)}\n`
}

export function generateSiteWrapper({
  overwrite = false,
  siteId,
  workspaceRoot = process.cwd(),
}: GenerateSiteWrapperOptions): {
  targetAppDir: string
  expectedAppOutDir: string
} {
  const sourceAppDir = resolve(workspaceRoot, 'apps', TEMPLATE_APP_ID)
  const targetAppDir = resolve(workspaceRoot, 'apps', siteId)

  if (siteId === TEMPLATE_APP_ID) {
    throw new Error(`Refusing to generate wrapper for reserved template app "${TEMPLATE_APP_ID}".`)
  }

  if (!existsSync(sourceAppDir)) {
    throw new Error(`Starter wrapper template not found at ${sourceAppDir}`)
  }

  if (existsSync(targetAppDir) && !overwrite) {
    throw new Error(
      `Target wrapper app already exists at ${targetAppDir}. Re-run with --overwrite to replace it.`
    )
  }

  mkdirSync(targetAppDir, { recursive: true })

  for (const entry of WRAPPER_TEMPLATE_ENTRIES) {
    const sourcePath = resolve(sourceAppDir, entry)
    const targetPath = resolve(targetAppDir, entry)

    if (!existsSync(sourcePath)) {
      continue
    }

    copyEntry({ sourcePath, targetPath })
  }

  const packageJsonPath = resolve(targetAppDir, 'package.json')
  const packageJsonSource = readFileSync(packageJsonPath, 'utf8')
  writeFileSync(packageJsonPath, rewriteWrapperPackageJson(packageJsonSource, siteId))

  return {
    expectedAppOutDir: `apps/${siteId}/out`,
    targetAppDir,
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const options = parseArgs(process.argv.slice(2))
  const result = generateSiteWrapper(options)

  const packageNameReminder = [
    `Generated wrapper app at ${result.targetAppDir}.`,
    `Next step: set build.appPackageName to "${options.siteId}" and build.appOutDir to "${result.expectedAppOutDir}" in sites/${options.siteId}/site-config.ts before promotion.`,
  ].join('\n')

  console.log(packageNameReminder)
}
