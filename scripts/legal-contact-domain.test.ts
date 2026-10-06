import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { activeCheckedInSiteIds } from '@thedaviddias/site-contract/active-site-ids'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

describe('legal contact email domains', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('only uses the {{domain}} legal placeholder inside contact addresses', () => {
    const legalDir = resolve(process.cwd(), 'packages/content/data/legal')
    const placeholderUses = readdirSync(legalDir)
      .filter(fileName => fileName.endsWith('.mdx'))
      .flatMap(fileName => {
        const source = readFileSync(resolve(legalDir, fileName), 'utf8')

        return [...source.matchAll(/(\S*)\{\{domain\}\}/g)].map(
          match => `${fileName}: ${match[1]}{{domain}}`
        )
      })

    expect(placeholderUses).toEqual([
      'dmca.mdx: dmca[@]{{domain}}',
      'privacy.mdx: privacy[@]{{domain}}',
      'terms.mdx: privacy[@]{{domain}}'
    ])
  })

  it('keeps every active site on its own domain for legal contact addresses', async () => {
    const { resolveSiteConfig } = await import('@thedaviddias/web-core/site-config')

    for (const siteId of ['default', ...activeCheckedInSiteIds]) {
      const config = resolveSiteConfig(siteId)

      expect(config.legalContactEmailDomain, siteId).toBe(config.domain)
    }
  })
})
