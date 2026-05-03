import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  generateSiteWrapper,
  rewriteWrapperPackageJson,
} from './generate-site-wrapper.ts'

const tempDirs: string[] = []

function makeTempWorkspace(): string {
  mkdirSync(resolve(process.cwd(), 'tmp'), { recursive: true })
  const dir = mkdtempSync(resolve(process.cwd(), 'tmp/generate-site-wrapper-'))
  tempDirs.push(dir)
  return dir
}

function writeFile(path: string, contents: string): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, contents)
}

afterEach(() => {
  tempDirs.splice(0).forEach(dir => {
    rmSync(dir, { force: true, recursive: true })
  })
})

describe('rewriteWrapperPackageJson', () => {
  it('sets the package name and site-aware scripts', () => {
    const rewritten = rewriteWrapperPackageJson(
      JSON.stringify({
        name: 'starter',
        scripts: {
          analyze: 'ANALYZE=true pnpm build',
          build: 'next build',
          clean: 'git clean -xdf .next',
          dev: 'next dev --webpack --port 3005',
          lint: 'biome check --write',
          start: 'next start',
          typecheck: 'tsc --noEmit',
        },
      }),
      'example.com'
    )

    const parsed = JSON.parse(rewritten) as {
      name: string
      scripts: Record<string, string>
    }

    expect(parsed.name).toBe('example.com')
    expect(parsed.scripts.build).toContain('NEXT_PUBLIC_SITE_ID=example.com SITE_ID=example.com')
    expect(parsed.scripts.dev).toContain('NEXT_PUBLIC_SITE_ID=example.com SITE_ID=example.com')
    expect(parsed.scripts.typecheck).toContain('NEXT_PUBLIC_SITE_ID=example.com SITE_ID=example.com')
  })
})

describe('generateSiteWrapper', () => {
  it('copies the starter wrapper shape while excluding generated and test-only files', () => {
    const workspaceRoot = makeTempWorkspace()

    writeFile(
      resolve(workspaceRoot, 'apps/starter/package.json'),
      JSON.stringify({
        name: 'starter',
        scripts: {
          analyze: 'ANALYZE=true pnpm build',
          build: 'next build',
          clean: 'git clean -xdf .next',
          dev: 'next dev --webpack --port 3005',
          lint: 'biome check --write',
          start: 'next start',
          typecheck: 'tsc --noEmit',
        },
      })
    )
    writeFile(resolve(workspaceRoot, 'apps/starter/app/layout.tsx'), 'export default function Layout() { return null }\n')
    writeFile(resolve(workspaceRoot, 'apps/starter/app/api/submission/route.ts'), 'export async function POST() { return new Response("ok") }\n')
    writeFile(resolve(workspaceRoot, 'apps/starter/app/brands/page.tsx'), "export { default } from '@thedaviddias/web-core/static-pages/brands-page'\n")
    writeFile(resolve(workspaceRoot, 'apps/starter/app/sitemap-index.xml/route.ts'), 'export async function GET() { return new Response("ok") }\n')
    writeFile(resolve(workspaceRoot, 'apps/starter/app/submit/verify/page.tsx'), 'export default function Verify() { return null }\n')
    writeFile(resolve(workspaceRoot, 'apps/starter/app/(files)/rss.xml/route.test.ts'), 'ignored test\n')
    writeFile(resolve(workspaceRoot, 'apps/starter/actions/get-home-page-data.ts'), 'export async function getHomePageData() { return {} }\n')
    writeFile(resolve(workspaceRoot, 'apps/starter/app/__tests__/ignore.test.ts'), 'ignored\n')
    writeFile(resolve(workspaceRoot, 'apps/starter/public/logo.png'), 'png')
    writeFile(resolve(workspaceRoot, 'apps/starter/public/search/search-index.json'), '{}')
    writeFile(resolve(workspaceRoot, 'apps/starter/lib/content-loader.ts'), 'export function getWebsites() { return [] }\n')
    writeFile(resolve(workspaceRoot, 'apps/starter/next.config.ts'), 'export default {}\n')
    writeFile(resolve(workspaceRoot, 'apps/starter/postcss.config.js'), 'module.exports = {}\n')
    writeFile(resolve(workspaceRoot, 'apps/starter/tsconfig.json'), '{"extends":"test"}\n')
    writeFile(resolve(workspaceRoot, 'apps/starter/turbopack-empty.ts'), 'export {}\n')

    const result = generateSiteWrapper({
      siteId: 'example.com',
      workspaceRoot,
    })

    expect(result.expectedAppOutDir).toBe('apps/example.com/out')
    expect(existsSync(resolve(workspaceRoot, 'apps/example.com/app/layout.tsx'))).toBe(true)
    expect(existsSync(resolve(workspaceRoot, 'apps/example.com/app/brands/page.tsx'))).toBe(true)
    expect(existsSync(resolve(workspaceRoot, 'apps/example.com/app/sitemap-index.xml/route.ts'))).toBe(true)
    expect(existsSync(resolve(workspaceRoot, 'apps/example.com/actions/get-home-page-data.ts'))).toBe(true)
    expect(existsSync(resolve(workspaceRoot, 'apps/example.com/public/logo.png'))).toBe(true)
    expect(existsSync(resolve(workspaceRoot, 'apps/example.com/app/api/submission/route.ts'))).toBe(false)
    expect(existsSync(resolve(workspaceRoot, 'apps/example.com/app/submit/verify/page.tsx'))).toBe(false)
    expect(existsSync(resolve(workspaceRoot, 'apps/example.com/app/(files)/rss.xml/route.test.ts'))).toBe(false)
    expect(existsSync(resolve(workspaceRoot, 'apps/example.com/public/search/search-index.json'))).toBe(false)
    expect(existsSync(resolve(workspaceRoot, 'apps/example.com/app/__tests__/ignore.test.ts'))).toBe(false)

    const generatedPackageJson = JSON.parse(
      readFileSync(resolve(workspaceRoot, 'apps/example.com/package.json'), 'utf8')
    ) as { name: string; scripts: Record<string, string> }

    expect(generatedPackageJson.name).toBe('example.com')
    expect(generatedPackageJson.scripts.dev).toContain('SITE_ID=example.com')
  })
})
