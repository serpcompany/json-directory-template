import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { initBuildSpec } from './init-build-spec.ts'

describe('initBuildSpec', () => {
  it('creates a build spec from staged site inputs', () => {
    const outputPath = initBuildSpec('serpdownloaders', true)

    expect(existsSync(outputPath)).toBe(true)

    const spec = JSON.parse(readFileSync(outputPath, 'utf8')) as {
      branding: { drBadge: { provider?: string; domain?: string } }
      build: { siteId: string }
      content: { websiteSource: { kind: string; path: string } }
      site: { name: string }
    }

    expect(spec.build.siteId).toBe('serpdownloaders')
    expect(spec.content.websiteSource).toMatchObject({
      kind: 'trial-products-json',
      path: 'sites/serpdownloaders/products.json'
    })
    expect(spec.branding.drBadge).toMatchObject({
      domain: 'serpdownloaders.com',
      provider: 'serp-dr'
    })
    expect(spec.site.name).toBe('SERP Downloaders')
  })
})
