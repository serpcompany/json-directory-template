import { activeCheckedInSiteIds } from '@thedaviddias/site-contract/active-site-ids'
import { resolveCheckedInSiteConfig } from '@thedaviddias/site-contract'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSitemapTargets, runSubmitGscSitemaps } from './submit-gsc-sitemaps.ts'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getSitemapTargets', () => {
  it('derives canonical sitemap targets from active checked-in site config', () => {
    expect(getSitemapTargets()).toEqual(
      activeCheckedInSiteIds.map(siteId => {
        const siteConfig = resolveCheckedInSiteConfig(siteId)

        return {
          domain: siteConfig.site.domain,
          sitemapUrl: `${siteConfig.site.publicUrl}/sitemap-index.xml`,
        }
      })
    )
  })

  it('can scope canonical sitemap targets to specific site ids', () => {
    expect(getSitemapTargets(['browserextensions.io'])).toEqual([
      {
        domain: 'browserextensions.io',
        sitemapUrl: 'https://browserextensions.io/sitemap-index.xml',
      },
    ])
  })
})

describe('runSubmitGscSitemaps', () => {
  it('prints canonical submit operations during dry-run without credentials', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await runSubmitGscSitemaps(['--dry-run', '--site', 'browserextensions.io'], {})

    expect(log).toHaveBeenCalledWith(
      'SUBMIT https://browserextensions.io/ -> https://browserextensions.io/sitemap-index.xml'
    )
  })

  it('prints all active canonical submit operations during dry-run by default', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await runSubmitGscSitemaps(['--dry-run'], {})

    expect(log).toHaveBeenCalledTimes(activeCheckedInSiteIds.length)
    expect(log).toHaveBeenCalledWith(
      'SUBMIT https://serp.co/ -> https://serp.co/sitemap-index.xml'
    )
  })

  it('prints delete operations for stale sitemap URLs during dry-run', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await runSubmitGscSitemaps(
      [
        '--dry-run',
        '--no-submit',
        '--delete-sitemap',
        'https://browserextensions.io/pages-sitemap.xml',
      ],
      {}
    )

    expect(log).toHaveBeenCalledWith(
      'DELETE https://browserextensions.io/ -> https://browserextensions.io/pages-sitemap.xml'
    )
  })

  it('submits canonical sitemaps after deleting stale sitemap URLs', async () => {
    const calls: Array<{ method: string; url: string }> = []
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({
        method: init?.method ?? 'GET',
        url,
      })

      return new Response('{}', {
        status: 200,
      })
    })
    vi.stubGlobal('fetch', fetchMock)
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await runSubmitGscSitemaps(
      [
        '--site',
        'browserextensions.io',
        '--delete-sitemap',
        'https://browserextensions.io/pages-sitemap.xml',
      ],
      {
        GSC_ACCESS_TOKEN: 'token',
      }
    )

    expect(calls.map(call => call.method)).toEqual(['DELETE', 'PUT'])
    expect(calls[0]?.url).toContain(
      '/sites/https%3A%2F%2Fbrowserextensions.io%2F/sitemaps/https%3A%2F%2Fbrowserextensions.io%2Fpages-sitemap.xml'
    )
    expect(calls[1]?.url).toContain(
      '/sites/https%3A%2F%2Fbrowserextensions.io%2F/sitemaps/https%3A%2F%2Fbrowserextensions.io%2Fsitemap-index.xml'
    )
    expect(log).toHaveBeenCalledWith(
      'Deleted https://browserextensions.io/pages-sitemap.xml for https://browserextensions.io/'
    )
    expect(log).toHaveBeenCalledWith(
      'Submitted https://browserextensions.io/sitemap-index.xml for https://browserextensions.io/'
    )
  })

  it('uses configured GSC site URL mappings for delete and submit calls', async () => {
    const calls: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        calls.push(url)
        return new Response('{}', { status: 200 })
      })
    )

    await runSubmitGscSitemaps(
      [
        '--site',
        'browserextensions.io',
        '--delete-sitemap',
        'https://browserextensions.io/pages-sitemap.xml',
      ],
      {
        GSC_ACCESS_TOKEN: 'token',
        GSC_SITE_URL_MAP: JSON.stringify({
          'browserextensions.io': 'sc-domain:browserextensions.io',
        }),
      }
    )

    expect(calls.every(url => url.includes('/sites/sc-domain%3Abrowserextensions.io/'))).toBe(true)
  })

  it('treats already-deleted stale sitemap URLs as successful deletes', async () => {
    const calls: Array<{ method: string; url: string }> = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({
          method: init?.method ?? 'GET',
          url,
        })

        return new Response('{}', {
          status: init?.method === 'DELETE' ? 404 : 200,
        })
      })
    )
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await runSubmitGscSitemaps(
      [
        '--site',
        'browserextensions.io',
        '--delete-sitemap',
        'https://browserextensions.io/pages-sitemap.xml',
      ],
      {
        GSC_ACCESS_TOKEN: 'token',
      }
    )

    expect(calls.map(call => call.method)).toEqual(['DELETE', 'PUT'])
    expect(log).toHaveBeenCalledWith(
      'Deleted https://browserextensions.io/pages-sitemap.xml for https://browserextensions.io/'
    )
  })
})
