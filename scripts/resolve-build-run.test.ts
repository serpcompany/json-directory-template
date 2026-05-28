import { describe, expect, it, vi } from 'vitest'
import {
  inferSiteIdFromChangedPaths,
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

describe('resolveBuildRun', () => {
  it('resolves the artifact dir from the checked-in site config id', async () => {
    await expect(
      resolveBuildRun([], {
        SITE_ID: 'serpdownloaders.com'
      })
    ).resolves.toEqual({
      artifactDir: 'dist/sites/serpdownloaders.com',
      shouldDeploy: true,
      siteId: 'serpdownloaders.com'
    })
  })

  it('falls back to the default checked-in site config outside push events', async () => {
    await expect(resolveBuildRun([], {})).resolves.toEqual({
      artifactDir: 'dist/sites/default',
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

  it('infers a single checked-in site id from changed wrapper app paths', () => {
    expect(
      inferSiteIdFromChangedPaths([
        'apps/serp.co/lib/content-loader.ts',
        'apps/serp.co/app/products/[slug]/reviews/page.tsx'
      ])
    ).toBe('serp.co')
  })

  it('infers a single checked-in site id from changed site config paths', () => {
    expect(inferSiteIdFromChangedPaths(['sites/serp.co/site-config.ts'])).toBe('serp.co')
  })

  it('maps starter app changes to the default checked-in site', () => {
    expect(inferSiteIdFromChangedPaths(['apps/starter/app/layout.tsx'])).toBe('default')
  })

  it('prefers a concrete site over starter app changes', () => {
    expect(
      inferSiteIdFromChangedPaths([
        'apps/starter/app/layout.tsx',
        'sites/browserextensions.io/products.json'
      ])
    ).toBe('browserextensions.io')
  })

  it('requires manual workflow dispatch when push paths touch multiple concrete sites', () => {
    expect(() =>
      inferSiteIdFromChangedPaths(['apps/serp.co/app/layout.tsx', 'apps/serp.ai/app/layout.tsx'])
    ).toThrow(
      'Push changed multiple concrete site paths (serp.ai, serp.co); manual site_id required via workflow_dispatch for each site.'
    )
  })

  it('does not deploy when changed paths are not site-specific', () => {
    expect(
      resolvePushSiteInputFromChangedPaths([
        '.github/workflows/build-and-deploy.yml',
        'scripts/resolve-build-run.ts'
      ])
    ).toEqual({ shouldDeploy: false })
  })

  it('deploys the site inferred from push changed paths', () => {
    expect(resolvePushSiteInputFromChangedPaths(['apps/serp.co/lib/content-loader.ts'])).toEqual({
      shouldDeploy: true,
      siteId: 'serp.co'
    })
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
              id: 'abc123',
              modified: ['scripts/resolve-build-run.ts']
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
      siteId: 'browserextensions.io'
    })
  })

  it('prefers a concrete site over shared and starter files from associated PRs', async () => {
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
              id: 'abc123',
              modified: ['scripts/resolve-build-run.ts']
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
      siteId: 'browserextensions.io'
    })
  })

  it('returns no-deploy when current push and associated PR files are shared-only', async () => {
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
              id: 'abc123',
              modified: ['scripts/resolve-build-run.ts']
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
      shouldDeploy: false
    })
  })

  it('resolves BrowserExtensions.io from a shared-only PR body site URL', async () => {
    const fetch = createMockFetch({
      'https://api.github.test/repos/owner/repo/commits/abc123/pulls': [
        {
          body: 'Maintainer-only data cleanup for https://browserextensions.io/products/example.',
          merged_at: '2026-05-26T12:00:00Z',
          number: 42,
          title: 'Add accepted browser extension submission'
        }
      ],
      'https://api.github.test/repos/owner/repo/pulls/42/files?page=1&per_page=100': [
        {
          filename: 'scripts/resolve-build-run.ts'
        }
      ]
    })

    await expect(
      resolvePushSiteInput(
        {
          after: 'abc123',
          commits: [
            {
              id: 'abc123',
              modified: ['scripts/resolve-build-run.ts']
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
      siteId: 'browserextensions.io'
    })
  })

  it('does not infer a site from a near-match PR body domain', async () => {
    const fetch = createMockFetch({
      'https://api.github.test/repos/owner/repo/commits/abc123/pulls': [
        {
          body: 'Shared cleanup for https://notbrowserextensions.io/products/example.',
          merged_at: '2026-05-26T12:00:00Z',
          number: 42,
          title: 'Update shared resolver'
        }
      ],
      'https://api.github.test/repos/owner/repo/pulls/42/files?page=1&per_page=100': [
        {
          filename: 'scripts/resolve-build-run.ts'
        }
      ]
    })

    await expect(
      resolvePushSiteInput(
        {
          after: 'abc123',
          commits: [
            {
              id: 'abc123',
              modified: ['scripts/resolve-build-run.ts']
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
      shouldDeploy: false
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
      'https://api.github.test/repos/owner/repo/pulls/42/files?page=1&per_page=100': [
        {
          filename: 'docs/BUILD_PIPELINE.md'
        }
      ],
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
              id: 'abc123',
              modified: ['docs/BUILD_PIPELINE.md']
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
      siteId: 'browserextensions.io'
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
      'https://api.github.test/repos/owner/repo/pulls/42/files?page=1&per_page=100': [
        {
          filename: 'scripts/resolve-build-run.ts'
        }
      ],
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
              id: 'abc123',
              modified: ['scripts/resolve-build-run.ts']
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
      siteId: 'browserextensions.io'
    })
  })

  it('resolves BrowserExtensions.io from a push commit message when associated PR files are shared-only', async () => {
    const fetch = createMockFetch({
      'https://api.github.test/repos/owner/repo/commits/abc123/pulls': [
        {
          body: null,
          merged_at: '2026-05-26T12:00:00Z',
          number: 42,
          title: null
        }
      ],
      'https://api.github.test/repos/owner/repo/pulls/42/files?page=1&per_page=100': [
        {
          filename: 'scripts/resolve-build-run.ts'
        }
      ]
    })

    await expect(
      resolvePushSiteInput(
        {
          after: 'abc123',
          commits: [
            {
              id: 'abc123',
              message: 'Accept submission for browserextensions.io',
              modified: ['scripts/resolve-build-run.ts']
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
      siteId: 'browserextensions.io'
    })
  })

  it('requires manual workflow dispatch when PR metadata mentions multiple concrete sites', async () => {
    const fetch = createMockFetch({
      'https://api.github.test/repos/owner/repo/commits/abc123/pulls': [
        {
          body: 'Shared change affects https://browserextensions.io and https://serp.co.',
          merged_at: '2026-05-26T12:00:00Z',
          number: 42,
          title: 'Shared multi-site deploy'
        }
      ],
      'https://api.github.test/repos/owner/repo/pulls/42/files?page=1&per_page=100': [
        {
          filename: 'scripts/resolve-build-run.ts'
        }
      ]
    })

    await expect(
      resolvePushSiteInput(
        {
          after: 'abc123',
          commits: [
            {
              id: 'abc123',
              modified: ['scripts/resolve-build-run.ts']
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
      'Push metadata matched multiple concrete sites (browserextensions.io, serp.co); manual site_id required via workflow_dispatch for each site.'
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
      'https://api.github.test/repos/owner/repo/pulls/42/files?page=1&per_page=100': [
        {
          filename: 'scripts/resolve-build-run.ts'
        }
      ],
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
              id: 'abc123',
              modified: ['scripts/resolve-build-run.ts']
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

  it('requires manual workflow dispatch when associated PR files touch multiple concrete sites', async () => {
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
          filename: 'apps/serp.co/app/page.tsx'
        }
      ]
    })

    await expect(
      resolvePushSiteInput(
        {
          after: 'abc123',
          commits: [
            {
              id: 'abc123',
              modified: ['scripts/resolve-build-run.ts']
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
      'Push changed multiple concrete site paths (browserextensions.io, serp.co); manual site_id required via workflow_dispatch for each site.'
    )
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
              id: 'abc123',
              modified: ['scripts/resolve-build-run.ts']
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
      siteId: 'browserextensions.io'
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
          commits: [{ id: 'abc123', modified: ['scripts/resolve-build-run.ts'] }],
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

  it('returns no-deploy when no associated merged PR is found', async () => {
    const fetch = createMockFetch({
      'https://api.github.test/repos/owner/repo/commits/abc123/pulls': []
    })

    await expect(
      resolvePushSiteInput(
        {
          after: 'abc123',
          commits: [{ id: 'abc123', modified: ['scripts/resolve-build-run.ts'] }],
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
      shouldDeploy: false
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
          commits: [{ id: 'abc123', modified: ['scripts/resolve-build-run.ts'] }],
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
