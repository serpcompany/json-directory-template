import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { activeCheckedInSiteIds } from '@thedaviddias/site-contract/active-site-ids'
import { describe, expect, it, vi } from 'vitest'
import {
  readAssociatedMergedPullRequestChangedPaths,
  resolveBuildRun,
  resolvePushSiteInput,
  resolvePushSiteInputFromChangedPaths
} from './resolve-build-run.ts'

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json'
    },
    ...init
  })
}

function createMockFetch(routes: Record<string, Response | unknown>): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const response = routes[url]

    if (!response) {
      throw new Error(`Unexpected fetch URL: ${url}`)
    }

    return response instanceof Response ? response : jsonResponse(response)
  }) as unknown as typeof fetch
}

function writePushEvent(event: unknown): string {
  mkdirSync(resolve(process.cwd(), 'tmp'), { recursive: true })
  const dir = mkdtempSync(resolve(process.cwd(), 'tmp/resolve-build-run-'))
  const path = resolve(dir, 'event.json')
  writeFileSync(path, JSON.stringify(event))
  return path
}

function expectedDeployTargets(siteIds: readonly string[]) {
  return siteIds.map(siteId => ({
    artifactDir: `dist/sites/${siteId}`,
    siteId
  }))
}

describe('resolveBuildRun', () => {
  it('resolves the artifact dir from the checked-in site config id', async () => {
    await expect(
      resolveBuildRun([], {
        SITE_ID: 'serpdownloaders.com'
      })
    ).resolves.toEqual({
      artifactDir: 'dist/sites/serpdownloaders.com',
      deployTargets: expectedDeployTargets(['serpdownloaders.com']),
      shouldDeploy: true,
      siteId: 'serpdownloaders.com'
    })
  })

  it('resolves workflow dispatch site_id=all to every active checked-in site', async () => {
    await expect(
      resolveBuildRun([], {
        GITHUB_EVENT_NAME: 'workflow_dispatch',
        SITE_ID: 'all'
      })
    ).resolves.toEqual({
      deployTargets: expectedDeployTargets(activeCheckedInSiteIds),
      shouldDeploy: true
    })
  })

  it('rejects serp.co, which moved to serpcompany/best.serp.co', async () => {
    await expect(resolveBuildRun(['--site', 'serp.co'], {})).rejects.toThrow(
      'Site "serp.co" was removed from this repo. Use a supported checked-in site id instead.'
    )
  })

  it('falls back to the default checked-in site config outside push events', async () => {
    await expect(resolveBuildRun([], {})).resolves.toEqual({
      artifactDir: 'dist/sites/default',
      deployTargets: expectedDeployTargets(['default']),
      shouldDeploy: true,
      siteId: 'default'
    })
  })

  it('rejects removed checked-in site ids instead of falling back to default', async () => {
    await expect(
      resolveBuildRun([], {
        SITE_ID: 'extensions.serp.co'
      })
    ).rejects.toThrow(
      'Site "extensions.serp.co" was removed from this repo. Use a supported checked-in site id instead.'
    )
  })

  it('rejects unknown checked-in site ids instead of silently loading default', async () => {
    await expect(
      resolveBuildRun([], {
        SITE_ID: 'unknown-site'
      })
    ).rejects.toThrow(
      'Site "unknown-site" is not an active checked-in site in this repo. Use "default" or a supported checked-in site id instead.'
    )
  })

  it('deploys the site whose wrapper app paths changed', () => {
    expect(
      resolvePushSiteInputFromChangedPaths([
        'apps/serpdownloaders.com/lib/content-loader.ts',
        'apps/serpdownloaders.com/app/products/[slug]/page.tsx'
      ])
    ).toEqual({
      shouldDeploy: true,
      siteId: 'serpdownloaders.com',
      siteIds: ['serpdownloaders.com']
    })
  })

  it('deploys the site whose checked-in site files changed', () => {
    expect(
      resolvePushSiteInputFromChangedPaths(['sites/serpdownloaders.com/site-config.ts'])
    ).toEqual({
      shouldDeploy: true,
      siteId: 'serpdownloaders.com',
      siteIds: ['serpdownloaders.com']
    })
  })

  it('deploys exact sites when changed paths touch multiple concrete sites only', () => {
    expect(
      resolvePushSiteInputFromChangedPaths([
        'sites/serpdownloaders.com/products.json',
        'apps/serp.ai/app/page.tsx'
      ])
    ).toEqual({
      shouldDeploy: true,
      siteIds: ['serp.ai', 'serpdownloaders.com']
    })
  })

  it.each([
    ['scripts/resolve-build-run.ts'],
    ['scripts/sitemap-files.ts'],
    ['packages/web-core/src/schema.ts'],
    ['packages/site-contract/src/trial-products.ts'],
    ['packages/design-system/components/custom/breadcrumb.tsx'],
    ['packages/content/data/about/about.mdx'],
    ['configs/next/index.ts'],
    ['sites/site-config.default.ts'],
    ['sites/default/categories.json'],
    ['package.json'],
    ['pnpm-lock.yaml'],
    ['.nvmrc']
  ])('deploys every active site when the shared build path %s changes', path => {
    expect(resolvePushSiteInputFromChangedPaths([path])).toEqual({
      shouldDeploy: true,
      siteIds: activeCheckedInSiteIds
    })
  })

  it('deploys every active site when shared and site paths change together (#159)', () => {
    // #159 changed scripts/sitemap-files.ts plus sites/browserextensions.io/site-config.ts and
    // deployed only browserextensions.io, so serpdownloaders.com and serp.ai missed the fix.
    expect(
      resolvePushSiteInputFromChangedPaths([
        'scripts/sitemap-files.test.ts',
        'scripts/sitemap-files.ts',
        'sites/browserextensions.io/site-config.ts'
      ])
    ).toEqual({
      shouldDeploy: true,
      siteIds: activeCheckedInSiteIds
    })
  })

  it.each([
    ['scripts/listing-rewrite.ts'],
    ['scripts/listing-rewrite-brief.md'],
    ['scripts/resolve-build-run.test.ts'],
    ['packages/web-core/src/structured-data.test.ts'],
    ['packages/cli/src/index.ts'],
    ['docs/BUILD_PIPELINE.md'],
    ['sites/serpdownloaders.com/README.md'],
    ['data/listings.json'],
    ['apps/starter/app/layout.tsx'],
    ['.github/workflows/build-and-deploy.yml']
  ])('does not deploy when only the non-build path %s changes', path => {
    expect(resolvePushSiteInputFromChangedPaths([path])).toEqual({ shouldDeploy: false })
  })

  it('ignores retired site paths', () => {
    expect(
      resolvePushSiteInputFromChangedPaths([
        'apps/serp.co/app/page.tsx',
        'sites/serp.co/products.json',
        'sites/pornvideodownloaders.com/products.json',
        'sites/serp.software/site-config.ts'
      ])
    ).toEqual({ shouldDeploy: false })
    expect(
      resolvePushSiteInputFromChangedPaths([
        'sites/serp.co/products.json',
        'sites/serpdownloaders.com/products.json'
      ])
    ).toEqual({
      shouldDeploy: true,
      siteId: 'serpdownloaders.com',
      siteIds: ['serpdownloaders.com']
    })
  })

  it('deploys every active site for a shared push even when PR metadata names one site', async () => {
    const fetch = vi.fn() as unknown as typeof globalThis.fetch

    await expect(
      resolvePushSiteInput(
        {
          after: 'abc123',
          commits: [
            {
              id: 'abc123',
              message:
                'fix(sitemaps): keep noindex and alias pages out of browserextensions.io sitemaps (#159)',
              modified: ['scripts/sitemap-files.ts', 'sites/browserextensions.io/site-config.ts']
            }
          ],
          repository: {
            full_name: 'owner/repo'
          }
        },
        {
          GITHUB_API_URL: 'https://api.github.test',
          GITHUB_EVENT_NAME: 'push',
          GITHUB_TOKEN: 'token'
        },
        fetch
      )
    ).resolves.toEqual({
      shouldDeploy: true,
      siteIds: activeCheckedInSiteIds
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('skips the deploy when a push only changes non-build files', async () => {
    const fetch = vi.fn() as unknown as typeof globalThis.fetch

    await expect(
      resolveBuildRun(
        [],
        {
          GITHUB_EVENT_NAME: 'push',
          GITHUB_EVENT_PATH: writePushEvent({
            after: 'abc123',
            commits: [{ id: 'abc123', modified: ['scripts/listing-rewrite.ts', 'docs/PLAN.md'] }],
            repository: { full_name: 'owner/repo' }
          }),
          GITHUB_TOKEN: 'token'
        },
        { fetch }
      )
    ).resolves.toEqual({
      deployTargets: [],
      shouldDeploy: false
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('resolves BrowserExtensions.io from associated merged PR files', async () => {
    const fetch = createMockFetch({
      'https://api.github.test/repos/owner/repo/commits/abc123/pulls': [
        {
          merged_at: '2026-05-26T12:00:00Z',
          number: 42,
          state: 'closed'
        }
      ],
      'https://api.github.test/repos/owner/repo/pulls/42/files?page=1&per_page=100': [
        {
          filename: 'sites/browserextensions.io/products.json'
        }
      ]
    })

    await expect(
      resolvePushSiteInput(
        {
          after: 'abc123',
          commits: [
            {
              id: 'abc123'
            }
          ],
          repository: {
            full_name: 'owner/repo'
          }
        },
        {
          GITHUB_API_URL: 'https://api.github.test',
          GITHUB_EVENT_NAME: 'push',
          GITHUB_TOKEN: 'token'
        },
        fetch
      )
    ).resolves.toEqual({
      shouldDeploy: true,
      siteId: 'browserextensions.io',
      siteIds: ['browserextensions.io']
    })
  })

  it('ignores starter and docs files in associated PR files', async () => {
    const fetch = createMockFetch({
      'https://api.github.test/repos/owner/repo/commits/abc123/pulls': [
        {
          merged_at: '2026-05-26T12:00:00Z',
          number: 42
        }
      ],
      'https://api.github.test/repos/owner/repo/pulls/42/files?page=1&per_page=100': [
        {
          filename: 'apps/starter/app/layout.tsx'
        },
        {
          filename: 'docs/BUILD_PIPELINE.md'
        },
        {
          filename: 'apps/browserextensions.io/app/page.tsx'
        }
      ]
    })

    await expect(
      resolvePushSiteInput(
        {
          after: 'abc123',
          commits: [
            {
              id: 'abc123'
            }
          ],
          repository: {
            full_name: 'owner/repo'
          }
        },
        {
          GITHUB_API_URL: 'https://api.github.test',
          GITHUB_EVENT_NAME: 'push',
          GITHUB_TOKEN: 'token'
        },
        fetch
      )
    ).resolves.toEqual({
      shouldDeploy: true,
      siteId: 'browserextensions.io',
      siteIds: ['browserextensions.io']
    })
  })

  it('deploys all active sites when current push and associated PR files are shared-only', async () => {
    const fetch = createMockFetch({
      'https://api.github.test/repos/owner/repo/commits/abc123/pulls': [
        {
          body: 'Shared resolver cleanup only.',
          merged_at: '2026-05-26T12:00:00Z',
          number: 42,
          title: 'Update shared resolver'
        }
      ],
      'https://api.github.test/repos/owner/repo/pulls/42/files?page=1&per_page=100': [
        {
          filename: 'scripts/resolve-build-run.ts'
        },
        {
          filename: 'docs/BUILD_PIPELINE.md'
        }
      ]
    })

    await expect(
      resolvePushSiteInput(
        {
          after: 'abc123',
          commits: [
            {
              id: 'abc123'
            }
          ],
          repository: {
            full_name: 'owner/repo'
          }
        },
        {
          GITHUB_API_URL: 'https://api.github.test',
          GITHUB_EVENT_NAME: 'push',
          GITHUB_TOKEN: 'token'
        },
        fetch
      )
    ).resolves.toEqual({
      shouldDeploy: true,
      siteIds: activeCheckedInSiteIds
    })
  })

  it('deploys exact sites when the push payload touches multiple concrete sites', async () => {
    const fetch = vi.fn() as unknown as typeof globalThis.fetch

    await expect(
      resolvePushSiteInput(
        {
          after: 'abc123',
          commits: [
            {
              id: 'abc123',
              modified: ['sites/serpdownloaders.com/products.json', 'sites/serp.ai/products.json']
            }
          ],
          repository: {
            full_name: 'owner/repo'
          }
        },
        {
          GITHUB_API_URL: 'https://api.github.test',
          GITHUB_EVENT_NAME: 'push',
          GITHUB_TOKEN: 'token'
        },
        fetch
      )
    ).resolves.toEqual({
      shouldDeploy: true,
      siteIds: ['serp.ai', 'serpdownloaders.com']
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('deploys exact sites from associated PR files instead of fuzzy PR metadata', async () => {
    const fetch = createMockFetch({
      'https://api.github.test/repos/owner/repo/commits/abc123/pulls': [
        {
          body: 'Shared import for serpdownloaders.com.',
          merged_at: '2026-05-26T12:00:00Z',
          number: 42,
          title: 'Refresh serpdownloaders.com data'
        }
      ],
      'https://api.github.test/repos/owner/repo/pulls/42/files?page=1&per_page=100': [
        {
          filename: 'sites/serpdownloaders.com/products.json'
        },
        {
          filename: 'sites/serp.ai/products.json'
        }
      ]
    })

    await expect(
      resolvePushSiteInput(
        {
          after: 'abc123',
          commits: [
            {
              id: 'abc123'
            }
          ],
          repository: {
            full_name: 'owner/repo'
          }
        },
        {
          GITHUB_API_URL: 'https://api.github.test',
          GITHUB_EVENT_NAME: 'push',
          GITHUB_TOKEN: 'token'
        },
        fetch
      )
    ).resolves.toEqual({
      shouldDeploy: true,
      siteIds: ['serp.ai', 'serpdownloaders.com']
    })
  })

  it('resolves BrowserExtensions.io from a PR body site URL when no changed paths are available', async () => {
    const fetch = createMockFetch({
      'https://api.github.test/repos/owner/repo/commits/abc123/pulls': [
        {
          body: 'Maintainer-only data cleanup for https://browserextensions.io/products/example.',
          merged_at: '2026-05-26T12:00:00Z',
          number: 42,
          title: 'Add accepted browser extension submission'
        }
      ],
      'https://api.github.test/repos/owner/repo/pulls/42/files?page=1&per_page=100': []
    })

    await expect(
      resolvePushSiteInput(
        {
          after: 'abc123',
          commits: [
            {
              id: 'abc123'
            }
          ],
          repository: {
            full_name: 'owner/repo'
          }
        },
        {
          GITHUB_API_URL: 'https://api.github.test',
          GITHUB_EVENT_NAME: 'push',
          GITHUB_TOKEN: 'token'
        },
        fetch
      )
    ).resolves.toEqual({
      shouldDeploy: true,
      siteId: 'browserextensions.io',
      siteIds: ['browserextensions.io']
    })
  })

  it('deploys all active sites when no changed paths are available and the PR body has no exact site match', async () => {
    const fetch = createMockFetch({
      'https://api.github.test/repos/owner/repo/commits/abc123/pulls': [
        {
          body: 'Shared cleanup for https://notbrowserextensions.io/products/example.',
          merged_at: '2026-05-26T12:00:00Z',
          number: 42,
          title: 'Update shared resolver'
        }
      ],
      'https://api.github.test/repos/owner/repo/pulls/42/files?page=1&per_page=100': []
    })

    await expect(
      resolvePushSiteInput(
        {
          after: 'abc123',
          commits: [
            {
              id: 'abc123'
            }
          ],
          repository: {
            full_name: 'owner/repo'
          }
        },
        {
          GITHUB_API_URL: 'https://api.github.test',
          GITHUB_EVENT_NAME: 'push',
          GITHUB_TOKEN: 'token'
        },
        fetch
      )
    ).resolves.toEqual({
      shouldDeploy: true,
      siteIds: activeCheckedInSiteIds
    })
  })

  it('resolves BrowserExtensions.io from a linked configured public issue repo', async () => {
    const fetch = createMockFetch({
      'https://api.github.test/repos/owner/repo/commits/abc123/pulls': [
        {
          body: 'Accepted submission: https://github.com/serpcompany/browserextensions.io/issues/1',
          merged_at: '2026-05-26T12:00:00Z',
          number: 42,
          title: 'Accept public browser extension submission'
        }
      ],
      'https://api.github.test/repos/owner/repo/pulls/42/files?page=1&per_page=100': [],
      'https://api.github.test/repos/serpcompany/browserextensions.io/issues/1': {
        body: 'Website URL: https://submitted-product.example',
        title: 'Submission: Example extension'
      }
    })

    await expect(
      resolvePushSiteInput(
        {
          after: 'abc123',
          commits: [
            {
              id: 'abc123'
            }
          ],
          repository: {
            full_name: 'owner/repo'
          }
        },
        {
          GITHUB_API_URL: 'https://api.github.test',
          GITHUB_EVENT_NAME: 'push',
          GITHUB_TOKEN: 'token'
        },
        fetch
      )
    ).resolves.toEqual({
      shouldDeploy: true,
      siteId: 'browserextensions.io',
      siteIds: ['browserextensions.io']
    })
    expect(fetch).toHaveBeenCalledWith(
      new URL('https://api.github.test/repos/serpcompany/browserextensions.io/issues/1'),
      expect.any(Object)
    )
  })

  it('fetches and scans linked public issue body without treating product URLs as site targets', async () => {
    const fetch = createMockFetch({
      'https://api.github.test/repos/owner/repo/commits/abc123/pulls': [
        {
          body: 'Fixes https://github.com/serpcompany/browserextensions.io/issues/7',
          merged_at: '2026-05-26T12:00:00Z',
          number: 42,
          title: 'Accept unrelated-domain submission'
        }
      ],
      'https://api.github.test/repos/owner/repo/pulls/42/files?page=1&per_page=100': [],
      'https://api.github.test/repos/serpcompany/browserextensions.io/issues/7': {
        body: [
          'Website URL: https://serp.co/products/not-the-target',
          'Submitted through https://browserextensions.io/submit'
        ].join('\n'),
        title: 'Submission for BrowserExtensions.io'
      }
    })

    await expect(
      resolvePushSiteInput(
        {
          after: 'abc123',
          commits: [
            {
              id: 'abc123'
            }
          ],
          repository: {
            full_name: 'owner/repo'
          }
        },
        {
          GITHUB_API_URL: 'https://api.github.test',
          GITHUB_EVENT_NAME: 'push',
          GITHUB_TOKEN: 'token'
        },
        fetch
      )
    ).resolves.toEqual({
      shouldDeploy: true,
      siteId: 'browserextensions.io',
      siteIds: ['browserextensions.io']
    })
  })

  it('resolves BrowserExtensions.io from a push commit message when no changed paths are available', async () => {
    const fetch = createMockFetch({
      'https://api.github.test/repos/owner/repo/commits/abc123/pulls': [
        {
          body: null,
          merged_at: '2026-05-26T12:00:00Z',
          number: 42,
          title: null
        }
      ],
      'https://api.github.test/repos/owner/repo/pulls/42/files?page=1&per_page=100': []
    })

    await expect(
      resolvePushSiteInput(
        {
          after: 'abc123',
          commits: [
            {
              id: 'abc123',
              message: 'Accept submission for browserextensions.io'
            }
          ],
          repository: {
            full_name: 'owner/repo'
          }
        },
        {
          GITHUB_API_URL: 'https://api.github.test',
          GITHUB_EVENT_NAME: 'push',
          GITHUB_TOKEN: 'token'
        },
        fetch
      )
    ).resolves.toEqual({
      shouldDeploy: true,
      siteId: 'browserextensions.io',
      siteIds: ['browserextensions.io']
    })
  })

  it('requires manual workflow dispatch when PR metadata mentions multiple concrete sites', async () => {
    const fetch = createMockFetch({
      'https://api.github.test/repos/owner/repo/commits/abc123/pulls': [
        {
          body: 'Shared change affects https://browserextensions.io and https://serpdownloaders.com.',
          merged_at: '2026-05-26T12:00:00Z',
          number: 42,
          title: 'Shared multi-site deploy'
        }
      ],
      'https://api.github.test/repos/owner/repo/pulls/42/files?page=1&per_page=100': []
    })

    await expect(
      resolvePushSiteInput(
        {
          after: 'abc123',
          commits: [
            {
              id: 'abc123'
            }
          ],
          repository: {
            full_name: 'owner/repo'
          }
        },
        {
          GITHUB_API_URL: 'https://api.github.test',
          GITHUB_EVENT_NAME: 'push',
          GITHUB_TOKEN: 'token'
        },
        fetch
      )
    ).rejects.toThrow(
      'Push metadata matched multiple concrete sites (browserextensions.io, serpdownloaders.com); manual site_id required via workflow_dispatch for each site.'
    )
  })

  it('fails clearly when linked public issue lookup fails', async () => {
    const fetch = createMockFetch({
      'https://api.github.test/repos/owner/repo/commits/abc123/pulls': [
        {
          body: 'Accepted submission: https://github.com/serpcompany/browserextensions.io/issues/1',
          merged_at: '2026-05-26T12:00:00Z',
          number: 42,
          title: 'Accept public browser extension submission'
        }
      ],
      'https://api.github.test/repos/owner/repo/pulls/42/files?page=1&per_page=100': [],
      'https://api.github.test/repos/serpcompany/browserextensions.io/issues/1': jsonResponse(
        { message: 'API rate limit exceeded' },
        {
          status: 403,
          statusText: 'Forbidden'
        }
      )
    })

    await expect(
      resolvePushSiteInput(
        {
          after: 'abc123',
          commits: [
            {
              id: 'abc123'
            }
          ],
          repository: {
            full_name: 'owner/repo'
          }
        },
        {
          GITHUB_API_URL: 'https://api.github.test',
          GITHUB_EVENT_NAME: 'push',
          GITHUB_TOKEN: 'token'
        },
        fetch
      )
    ).rejects.toThrow(
      'Failed to fetch linked public issue serpcompany/browserextensions.io#1: GitHub API request failed (403 Forbidden) for /repos/serpcompany/browserextensions.io/issues/1.'
    )
  })

  it('deploys exact targets when associated PR files touch multiple concrete sites', async () => {
    const fetch = createMockFetch({
      'https://api.github.test/repos/owner/repo/commits/abc123/pulls': [
        {
          merged_at: '2026-05-26T12:00:00Z',
          number: 42
        }
      ],
      'https://api.github.test/repos/owner/repo/pulls/42/files?page=1&per_page=100': [
        {
          filename: 'sites/browserextensions.io/products.json'
        },
        {
          filename: 'apps/serpdownloaders.com/app/page.tsx'
        }
      ]
    })

    await expect(
      resolvePushSiteInput(
        {
          after: 'abc123',
          commits: [
            {
              id: 'abc123'
            }
          ],
          repository: {
            full_name: 'owner/repo'
          }
        },
        {
          GITHUB_API_URL: 'https://api.github.test',
          GITHUB_EVENT_NAME: 'push',
          GITHUB_TOKEN: 'token'
        },
        fetch
      )
    ).resolves.toEqual({
      shouldDeploy: true,
      siteIds: ['browserextensions.io', 'serpdownloaders.com']
    })
  })

  it('reads paginated associated PR files for site inference', async () => {
    const firstPageFiles = Array.from({ length: 100 }, (_, index) => ({
      filename: `docs/shared-${index}.md`
    }))
    const fetch = createMockFetch({
      'https://api.github.test/repos/owner/repo/commits/abc123/pulls': [
        {
          merged_at: '2026-05-26T12:00:00Z',
          number: 42
        }
      ],
      'https://api.github.test/repos/owner/repo/pulls/42/files?page=1&per_page=100': firstPageFiles,
      'https://api.github.test/repos/owner/repo/pulls/42/files?page=2&per_page=100': [
        {
          filename: 'apps/browserextensions.io/app/page.tsx'
        }
      ]
    })

    await expect(
      resolvePushSiteInput(
        {
          after: 'abc123',
          commits: [
            {
              id: 'abc123'
            }
          ],
          repository: {
            full_name: 'owner/repo'
          }
        },
        {
          GITHUB_API_URL: 'https://api.github.test',
          GITHUB_EVENT_NAME: 'push',
          GITHUB_TOKEN: 'token'
        },
        fetch
      )
    ).resolves.toEqual({
      shouldDeploy: true,
      siteId: 'browserextensions.io',
      siteIds: ['browserextensions.io']
    })
  })

  it('uses renamed PR file previous paths for site inference', async () => {
    const fetch = createMockFetch({
      'https://api.github.test/repos/owner/repo/commits/abc123/pulls': [
        {
          merged_at: '2026-05-26T12:00:00Z',
          number: 42
        }
      ],
      'https://api.github.test/repos/owner/repo/pulls/42/files?page=1&per_page=100': [
        {
          filename: 'docs/moved-products.md',
          previous_filename: 'sites/browserextensions.io/products.json'
        }
      ]
    })

    await expect(
      readAssociatedMergedPullRequestChangedPaths(
        {
          after: 'abc123',
          commits: [{ id: 'abc123' }],
          repository: {
            full_name: 'owner/repo'
          }
        },
        {
          GITHUB_API_URL: 'https://api.github.test',
          GITHUB_EVENT_NAME: 'push',
          GITHUB_TOKEN: 'token'
        },
        fetch
      )
    ).resolves.toEqual(['docs/moved-products.md', 'sites/browserextensions.io/products.json'])
  })

  it('does not call the PR API when an explicit site id is provided on push', async () => {
    const fetch = vi.fn(async () => {
      throw new Error('fetch should not be called for explicit site id')
    }) as unknown as typeof fetch

    await expect(
      resolveBuildRun(
        [],
        {
          GITHUB_EVENT_NAME: 'push',
          GITHUB_TOKEN: 'token',
          SITE_ID: 'serpdownloaders.com'
        },
        { fetch }
      )
    ).resolves.toEqual({
      artifactDir: 'dist/sites/serpdownloaders.com',
      deployTargets: expectedDeployTargets(['serpdownloaders.com']),
      shouldDeploy: true,
      siteId: 'serpdownloaders.com'
    })

    expect(fetch).not.toHaveBeenCalled()
  })

  it('fails clearly when PR file lookup requires a missing GitHub token', async () => {
    await expect(
      resolvePushSiteInput(
        {
          after: 'abc123',
          commits: [{ id: 'abc123' }],
          repository: {
            full_name: 'owner/repo'
          }
        },
        {
          GITHUB_EVENT_NAME: 'push'
        },
        createMockFetch({})
      )
    ).rejects.toThrow(
      'GITHUB_TOKEN is required to inspect associated merged PR files for push site inference.'
    )
  })

  it('deploys all active sites when neither the push nor an associated merged PR lists changed paths', async () => {
    const fetch = createMockFetch({
      'https://api.github.test/repos/owner/repo/commits/abc123/pulls': []
    })

    await expect(
      resolvePushSiteInput(
        {
          after: 'abc123',
          commits: [{ id: 'abc123' }],
          repository: {
            full_name: 'owner/repo'
          }
        },
        {
          GITHUB_API_URL: 'https://api.github.test',
          GITHUB_EVENT_NAME: 'push',
          GITHUB_TOKEN: 'token'
        },
        fetch
      )
    ).resolves.toEqual({
      shouldDeploy: true,
      siteIds: activeCheckedInSiteIds
    })
  })

  it('surfaces GitHub API failures during PR file lookup', async () => {
    const fetch = createMockFetch({
      'https://api.github.test/repos/owner/repo/commits/abc123/pulls': jsonResponse(
        { message: 'Bad credentials' },
        {
          status: 401,
          statusText: 'Unauthorized'
        }
      )
    })

    await expect(
      resolvePushSiteInput(
        {
          after: 'abc123',
          commits: [{ id: 'abc123' }],
          repository: {
            full_name: 'owner/repo'
          }
        },
        {
          GITHUB_API_URL: 'https://api.github.test',
          GITHUB_EVENT_NAME: 'push',
          GITHUB_TOKEN: 'token'
        },
        fetch
      )
    ).rejects.toThrow(
      'GitHub API request failed (401 Unauthorized) for /repos/owner/repo/commits/abc123/pulls.'
    )
  })
})
