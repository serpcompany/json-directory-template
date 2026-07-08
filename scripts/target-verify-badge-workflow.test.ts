import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import yaml from 'js-yaml'
import { describe, expect, it, vi } from 'vitest'

const githubExpression = (expression: string) => `$${expression}`
const reusableWorkflowPath = '.github/workflows/reusable-verify-badge.yml'
const targetWorkflowPath = 'scripts/templates/target-verify-badge.yml'
const AsyncFunction = (async () => {
  // no-op
}).constructor as new (
  ...args: string[]
) => (...args: unknown[]) => Promise<unknown>

interface WorkflowDefinition {
  jobs: Record<
    string,
    {
      if?: string
      permissions?: Record<string, string>
      'runs-on'?: string
      secrets?: Record<string, string>
      steps?: Array<{
        env?: Record<string, string>
        id?: string
        if?: string
        name?: string
        uses?: string
        with?: {
          script?: string
        }
      }>
      uses?: string
    }
  >
  on: Record<string, { secrets?: Record<string, { required: boolean }>; types?: string[] }>
  permissions?: Record<string, string>
}

function loadYamlWorkflow(path: string): WorkflowDefinition {
  return yaml.load(readFileSync(resolve(process.cwd(), path), 'utf8')) as WorkflowDefinition
}

function loadReusableWorkflow(): WorkflowDefinition {
  return loadYamlWorkflow(reusableWorkflowPath)
}

function loadTargetWorkflow(): WorkflowDefinition {
  return loadYamlWorkflow(targetWorkflowPath)
}

function loadWorkflowSource(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

function getBadgeCheckScript(): string {
  const workflow = loadReusableWorkflow()
  const checkStep = workflow.jobs.verify.steps?.find(
    step => step.name === 'Check badge and update issue labels'
  )

  expect(checkStep?.with?.script).toBeDefined()
  return checkStep?.with?.script ?? ''
}

function getCreateListingPrScript(): string {
  const workflow = loadReusableWorkflow()
  const createPrStep = workflow.jobs.verify.steps?.find(
    step => step.name === 'Create listing PR after badge verification'
  )

  expect(createPrStep?.with?.script).toBeDefined()
  return createPrStep?.with?.script ?? ''
}

function submissionIssueBody(url = 'https://serplists.com'): string {
  return `## Submission visibility

This submission will be filed as a public GitHub issue for SERP.

## Product details

Name: SERP Lists
Product URL: ${url}
Category: ai-project-management

## Description

Create and Run Checklists for Your Processes

## Media

Logo URL: https://example.com/logo.png
Video URL: https://example.com/video

## Resource links

- serplists.com: ${url}

## Additional notes

SERP Lists helps teams and solo operators.`
}

function badgeAnchor(
  attributes = 'href="https://serp.co/products/dr.serp.co/reviews/" target="_blank" rel="noopener noreferrer"',
  imageSrc = 'https://serp.co/badge/featured-on-serp.co-light.svg'
): string {
  return `<a ${attributes} title="Featured on SERP"><img src="${imageSrc}" alt="Featured on SERP" width="200" height="50"/></a>`
}

async function runBadgeCheck({
  eventName = 'issue_comment',
  html = '<html><body>No badge yet</body></html>',
  issueBody = submissionIssueBody(),
  repo = 'serp.co',
  responses
}: {
  eventName?: 'issue_comment' | 'issues'
  html?: string
  issueBody?: string
  repo?: string
  responses?: Array<{ html: string; ok?: boolean; status?: number; url?: string }>
} = {}) {
  const comments: string[] = []
  const labelsAdded: string[][] = []
  const labelsRemoved: string[] = []
  const notices: string[] = []
  const outputs: Record<string, string> = {}
  const responseQueue = responses ? [...responses] : undefined
  const fetch = vi.fn(async (url: string) => {
    const response = responseQueue?.shift() ?? { html, ok: true, status: 200, url }

    return {
      ok: response.ok ?? true,
      status: response.status ?? 200,
      text: async () => response.html,
      url: response.url ?? url
    }
  })
  const github = {
    rest: {
      issues: {
        addLabels: vi.fn(async ({ labels }: { labels: string[] }) => {
          labelsAdded.push(labels)
        }),
        createComment: vi.fn(async ({ body }: { body: string }) => {
          comments.push(body)
        }),
        createLabel: vi.fn(async () => undefined),
        getLabel: vi.fn(async () => undefined),
        removeLabel: vi.fn(async ({ name }: { name: string }) => {
          labelsRemoved.push(name)
        })
      }
    }
  }
  const context = {
    eventName,
    payload: {
      comment: {
        body: '/check-badge'
      },
      issue: {
        body: issueBody,
        number: 1,
        user: { login: 'devinschumacher' }
      }
    },
    repo: {
      owner: 'serpcompany',
      repo
    }
  }
  const core = {
    notice: vi.fn((message: string) => {
      notices.push(message)
    }),
    setOutput: vi.fn((name: string, value: string) => {
      outputs[name] = value
    })
  }
  const previousVitest = process.env.VITEST
  process.env.VITEST = 'true'

  try {
    await new AsyncFunction(
      'github',
      'context',
      'core',
      'fetch',
      'Buffer',
      'process',
      getBadgeCheckScript()
    )(github, context, core, fetch, Buffer, process)
  } finally {
    if (previousVitest === undefined) {
      delete process.env.VITEST
    } else {
      process.env.VITEST = previousVitest
    }
  }

  return { comments, fetch, github, labelsAdded, labelsRemoved, notices, outputs }
}

async function runCreateListingPr({
  ghPat = 'test-token',
  issueBody = submissionIssueBody(),
  mainProducts = {}
}: {
  ghPat?: null | string
  issueBody?: string
  mainProducts?: Record<string, unknown>
} = {}) {
  const comments: string[] = []
  const failures: string[] = []
  const outputs: Record<string, string> = {}
  const requests: Array<{ body?: unknown; method: string; path: string }> = []
  const github = {
    rest: {
      issues: {
        createComment: vi.fn(async ({ body }: { body: string }) => {
          comments.push(body)
        })
      }
    }
  }
  const context = {
    payload: {
      issue: {
        body: issueBody,
        number: 17
      }
    },
    repo: {
      owner: 'serpcompany',
      repo: 'serp.co'
    }
  }
  const core = {
    setFailed: vi.fn((message: string) => {
      failures.push(message)
    }),
    setOutput: vi.fn((name: string, value: string) => {
      outputs[name] = value
    })
  }
  const fetch = vi.fn(async (url: string, init?: { body?: unknown; method?: string }) => {
    const parsed = new URL(url)
    const method = init?.method ?? 'GET'
    const body = init?.body ? JSON.parse(String(init.body)) : undefined
    const path = `${parsed.pathname}${parsed.search}`
    const decodedPath = decodeURIComponent(path)
    requests.push({ body, method, path })

    let data: unknown
    if (
      method === 'GET' &&
      decodedPath ===
        '/repos/serpcompany/json-directory-template/pulls?state=open&head=serpcompany:listing/serp.co/serplists.com&base=main'
    ) {
      data = []
    } else if (
      method === 'GET' &&
      decodedPath === '/repos/serpcompany/json-directory-template/git/ref/heads/main'
    ) {
      data = { object: { sha: 'main-sha' } }
    } else if (
      method === 'GET' &&
      decodedPath === '/repos/serpcompany/json-directory-template/git/trees/main-sha:sites/serp.co'
    ) {
      data = { tree: [{ path: 'products.json', sha: 'main-products-sha' }] }
    } else if (
      method === 'GET' &&
      decodedPath === '/repos/serpcompany/json-directory-template/git/blobs/main-products-sha'
    ) {
      data = {
        content: Buffer.from(JSON.stringify(mainProducts), 'utf8').toString('base64')
      }
    } else {
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => JSON.stringify({ message: 'Not Found' })
      }
    }

    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => JSON.stringify(data)
    }
  })
  const previousGhPat = process.env.GH_PAT

  if (ghPat === null) {
    delete process.env.GH_PAT
  } else {
    process.env.GH_PAT = ghPat
  }

  try {
    await new AsyncFunction(
      'github',
      'context',
      'core',
      'fetch',
      'Buffer',
      'process',
      getCreateListingPrScript()
    )(github, context, core, fetch, Buffer, process)
  } finally {
    if (previousGhPat === undefined) {
      delete process.env.GH_PAT
    } else {
      process.env.GH_PAT = previousGhPat
    }
  }

  return { comments, failures, fetch, outputs, requests }
}

describe('reusable verify badge workflow', () => {
  it('is callable by target repos and accepts an optional GH_PAT secret', () => {
    const workflow = loadReusableWorkflow()
    const source = loadWorkflowSource(reusableWorkflowPath)

    expect(source).toContain('workflow_call:')
    expect(workflow.on.workflow_call.secrets?.GH_PAT).toEqual({ required: false })
    expect(workflow.permissions).toMatchObject({ issues: 'write' })
    expect(workflow.jobs.verify.permissions).toMatchObject({ issues: 'write' })
    expect(workflow.jobs.verify['runs-on']).toBe('ubuntu-latest')
  })

  it('contains JavaScript bodies that compile in github-script', () => {
    const workflow = loadReusableWorkflow()

    for (const step of workflow.jobs.verify.steps ?? []) {
      const script = step.with?.script
      if (!script) {
        continue
      }

      expect(() => {
        new AsyncFunction('github', 'context', 'core', 'fetch', 'Buffer', 'process', script)
      }, `${step.name} script should parse`).not.toThrow()
    }
  })

  it('uses caller repository context and badge state labels instead of legacy verified labels', () => {
    const source = loadWorkflowSource(reusableWorkflowPath)

    expect(source.indexOf('const submission = parseSubmission')).toBeLessThan(
      source.indexOf('await addLabel(badgePendingLabel)')
    )
    expect(source).toContain('const owner = context.repo.owner')
    expect(source).toContain('const repo = context.repo.repo')
    expect(source).toContain('const domain = repo')
    expect(source).toContain("if (context.eventName === 'issue_comment')")
    expect(source).toContain("const badgePendingLabel = 'badge-not-verified'")
    expect(source).toContain("const badgeVerifiedLabel = 'badge-verified'")
    expect(source).toContain('await addLabel(badgePendingLabel)')
    expect(source).toContain('await removeLabel(badgeVerifiedLabel)')
    expect(source).toContain('if (createError.status !== 422) throw createError')
    expect(source).not.toContain("labels: ['verified']")
    expect(source).not.toContain("labels: ['approved']")
  })

  it('creates an assigned source repo PR after successful verification', () => {
    const source = loadWorkflowSource(reusableWorkflowPath)
    const workflow = loadReusableWorkflow()
    const createPrStep = workflow.jobs.verify.steps?.find(
      step => step.name === 'Create listing PR after badge verification'
    )

    expect(createPrStep?.if).toBe("steps.badge.outputs.found == 'true'")
    expect(createPrStep?.env?.GH_PAT).toBe(githubExpression('{{ secrets.GH_PAT }}'))
    expect(source).toContain("const sourceRepo = 'json-directory-template'")
    expect(source).toContain("const assignee = 'devinschumacher'")
    expect(source).toContain('const mainProducts = await readProductsAt(mainRef.object.sha)')
    expect(source).toContain('const branchProducts = await readProductsAt(branchRef.object.sha)')
    expect(source).toContain('media.logo = submission.logoUrl')
    expect(source).not.toContain(`/media/products/$${'{'}submission.slug}/logo.png`)
    expect(source).toContain(`/repos/$${'{'}sourceOwner}/$${'{'}sourceRepo}/pulls`)
    expect(source).toContain('/assignees')
  })

  it('reports a verified badge without creating a PR when GH_PAT is missing', async () => {
    const { comments, failures, fetch } = await runCreateListingPr({ ghPat: null })

    expect(fetch).not.toHaveBeenCalled()
    expect(failures).toEqual(['Missing GH_PAT secret for source repo PR creation.'])
    expect(comments).toEqual([
      ':warning: **Badge verified, PR not created**\n\nThe badge is verified, but this repo is missing the `GH_PAT` secret required to create a PR in `serpcompany/json-directory-template`. @devinschumacher, please add the secret and rerun `/check-badge`.'
    ])
  })

  it('comments without creating a duplicate PR when the listing slug already exists', async () => {
    const { comments, failures, outputs, requests } = await runCreateListingPr({
      mainProducts: {
        'serplists.com': {
          product: {
            slug: 'serplists.com',
            title: 'SERP Lists'
          }
        }
      }
    })

    expect(failures).toEqual([])
    expect(outputs.pr_url).toBeUndefined()
    expect(comments).toEqual([
      ':white_check_mark: **Badge verified**\n\nA listing with slug `serplists.com` already exists in `sites/serp.co/products.json`. @devinschumacher, please review whether this issue should be closed.'
    ])
    expect(requests).toEqual([
      {
        body: undefined,
        method: 'GET',
        path: '/repos/serpcompany/json-directory-template/pulls?state=open&head=serpcompany:listing%2Fserp.co%2Fserplists.com&base=main'
      },
      {
        body: undefined,
        method: 'GET',
        path: '/repos/serpcompany/json-directory-template/git/ref/heads/main'
      },
      {
        body: undefined,
        method: 'GET',
        path: '/repos/serpcompany/json-directory-template/git/trees/main-sha%3Asites%2Fserp.co'
      },
      {
        body: undefined,
        method: 'GET',
        path: '/repos/serpcompany/json-directory-template/git/blobs/main-products-sha'
      }
    ])
    expect(requests).not.toContainEqual(
      expect.objectContaining({
        method: 'POST',
        path: '/repos/serpcompany/json-directory-template/pulls'
      })
    )
    expect(requests).not.toContainEqual(
      expect.objectContaining({
        method: 'POST',
        path: '/repos/serpcompany/json-directory-template/git/refs'
      })
    )
  })

  it('parses the details section so media URLs are not mistaken for the submitted website', () => {
    const source = loadWorkflowSource(reusableWorkflowPath)

    expect(source).toContain("const details = getSection(body, '.*details')")
    expect(source).toContain('^(?!Logo URL:|Video URL:)')
    expect(source).toContain("getSection(body, 'Media')")
  })

  it('uses site-specific listing URLs in badge snippets and rejects HTTP errors', () => {
    const source = loadWorkflowSource(reusableWorkflowPath)

    expect(source).toContain("'serp.ai': 'reviews'")
    expect(source).toContain("'serp.co': 'reviews'")
    expect(source).toContain('const badgeImageUrl = `https://')
    expect(source).toContain('/badge/featured-on-')
    expect(source).toContain('-light.svg`')
    expect(source).toContain('const expectedBadgeImageUrls = [')
    expect(source).toContain('expectedBadgeImageUrls.includes(src)')
    expect(source).toContain('if (lastAttempt.foundDofollow && lastAttempt.foundBadgeImage)')
    expect(source).not.toContain('if (foundDofollow) {')
    expect(source).toContain(
      "const listingPathParts = ['products', submission.slug, listingDetailSuffix].filter(Boolean)"
    )
    expect(source).toContain('[0, 30, 60, 120, 180, 300]')
    expect(source).toContain('[0, 15, 45]')
    expect(source).toContain('core.notice(')
    expect(source).toContain("fetchUrl.searchParams.set('badge-check'")
    expect(source).toContain("'Cache-Control': 'no-cache'")
  })

  it('parses submitted product URLs from multi-line details sections before checking the badge', async () => {
    const { comments, fetch, github, labelsAdded, outputs } = await runBadgeCheck()

    const [fetchUrl, fetchInit] = fetch.mock.calls[0] ?? []
    expect(String(fetchUrl)).toMatch(/^https:\/\/serplists\.com\/\?badge-check=\d+$/)
    expect(fetchInit).toMatchObject({
      headers: expect.objectContaining({
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        'User-Agent': 'DirectoryVerifier/1.0'
      })
    })
    expect(outputs).toMatchObject({ found: 'false', slug: 'serplists.com' })
    expect(github.rest.issues.addLabels).toHaveBeenCalledWith({
      owner: 'serpcompany',
      repo: 'serp.co',
      issue_number: 1,
      labels: ['badge-not-verified']
    })
    expect(github.rest.issues.createComment).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: 'serpcompany',
        repo: 'serp.co',
        issue_number: 1
      })
    )
    expect(labelsAdded).toContainEqual(['badge-not-verified'])
    expect(comments[0]).toContain('No badge link to serp.co found on https://serplists.com')
  })

  it('accepts the current dr.serp.co footer badge markup', async () => {
    const footerBadge =
      '<footer><a href="https://serp.co/products/dr.serp.co/reviews/" target="_blank" rel="noopener noreferrer" title="Featured on SERP"><img src="https://serp.co/badge/featured-on-serp.co-light.svg" alt="Featured on SERP" width="200" height="50"/></a></footer>'
    const { comments, labelsAdded, labelsRemoved, outputs } = await runBadgeCheck({
      html: footerBadge,
      issueBody: submissionIssueBody('https://dr.serp.co')
    })

    expect(outputs.found).toBe('true')
    expect(comments).toEqual([
      ':white_check_mark: **Badge Check**\n\nBadge verified on https://dr.serp.co — found a dofollow badge link.'
    ])
    expect(labelsRemoved).toContain('badge-not-verified')
    expect(labelsAdded).toContainEqual(['badge-verified'])
  })

  it('treats noopener noreferrer as dofollow', async () => {
    const { outputs } = await runBadgeCheck({
      html: badgeAnchor(
        'href="https://serp.co/products/serplists.com/reviews/" rel="noopener noreferrer"'
      )
    })

    expect(outputs.found).toBe('true')
  })

  it('accepts protocol-relative unquoted attributes case-insensitively', async () => {
    const { outputs } = await runBadgeCheck({
      html: '<A HREF=//www.serp.co/products/serplists.com/reviews/ REL=noopener><IMG SRC=//serp.co/badge/featured-on-serp.co-light.svg></A>'
    })

    expect(outputs.found).toBe('true')
  })

  it('rejects tokenized nofollow links even when other rel tokens are present', async () => {
    const { comments, outputs } = await runBadgeCheck({
      html: badgeAnchor(
        'href="https://serp.co/products/serplists.com/reviews/" rel="nofollow noopener"'
      )
    })

    expect(outputs.found).toBe('false')
    expect(comments).toHaveLength(1)
    expect(comments[0]).toContain('it is marked as **nofollow**')
  })

  it('rejects a dofollow link when the badge image is outside the anchor', async () => {
    const { comments, outputs } = await runBadgeCheck({
      html: '<a href="https://serp.co/products/serplists.com/reviews/">SERP</a><img src="https://serp.co/badge/featured-on-serp.co-light.svg">'
    })

    expect(outputs.found).toBe('false')
    expect(comments).toHaveLength(1)
    expect(comments[0]).toContain('does not wrap the expected Featured on badge image')
  })

  it('rejects a preloaded badge image without a linked image anchor', async () => {
    const { comments, outputs } = await runBadgeCheck({
      html: '<link rel="preload" as="image" href="https://serp.co/badge/featured-on-serp.co-light.svg"><a href="https://serp.co/products/serplists.com/reviews/">SERP</a>'
    })

    expect(outputs.found).toBe('false')
    expect(comments).toHaveLength(1)
    expect(comments[0]).toContain('does not wrap the expected Featured on badge image')
  })

  it('accepts dark and legacy serp.co badge image variants', async () => {
    for (const imageSrc of [
      'https://serp.co/badge/featured-on-serp.co-dark.svg',
      'https://serp.co/badge/featured-on-serp-co-light.svg',
      'https://serp.co/badge/featured-on-serp-co-dark.svg'
    ]) {
      const { outputs } = await runBadgeCheck({
        html: badgeAnchor(
          'HREF=https://www.serp.co/products/serplists.com/reviews/ REL="noopener noreferrer"',
          imageSrc
        )
      })

      expect(outputs.found).toBe('true')
    }
  })

  it('retries new issue badge checks until a later fetch contains the badge', async () => {
    const { comments, fetch, notices, outputs } = await runBadgeCheck({
      eventName: 'issues',
      responses: [
        { html: '<html><body>No badge yet</body></html>' },
        { html: '<html><body>No badge yet</body></html>' },
        { html: badgeAnchor("href='https://serp.co/products/serplists.com/reviews/'") }
      ]
    })

    expect(fetch).toHaveBeenCalledTimes(3)
    expect(notices).toHaveLength(3)
    expect(notices[0]).toContain('foundDofollow=false')
    expect(notices[2]).toContain('foundBadgeImage=true')
    expect(outputs.found).toBe('true')
    expect(comments).toHaveLength(1)
    expect(comments[0]).toContain('Badge verified on https://serplists.com')
  })

  it('posts exactly one failure comment after retries are exhausted', async () => {
    const { comments, fetch, notices, outputs } = await runBadgeCheck({
      responses: [
        { html: '<html><body>No badge yet</body></html>' },
        { html: '<html><body>No badge yet</body></html>' },
        { html: '<html><body>No badge yet</body></html>' }
      ]
    })

    expect(fetch).toHaveBeenCalledTimes(3)
    expect(notices).toHaveLength(3)
    expect(outputs.found).toBe('false')
    expect(comments).toHaveLength(1)
    expect(comments[0]).toContain('No badge link to serp.co found on https://serplists.com')
  })
})

describe('target verify badge workflow template', () => {
  it('runs on new issues and /check-badge comments', () => {
    const workflow = loadTargetWorkflow()
    const verifyJob = workflow.jobs.verify

    expect(workflow.on.issues.types).toEqual(['opened'])
    expect(workflow.on.issue_comment.types).toEqual(['created'])
    expect(verifyJob.if).toContain("github.event_name == 'issues'")
    expect(verifyJob.if).toContain('!github.event.issue.pull_request')
    expect(verifyJob.if).toContain('/check-badge')
    expect(workflow.permissions).toMatchObject({ issues: 'write' })
    expect(verifyJob.permissions).toMatchObject({ issues: 'write' })
  })

  it('calls the centralized reusable workflow and passes through GH_PAT', () => {
    const workflow = loadTargetWorkflow()
    const source = loadWorkflowSource(targetWorkflowPath)
    const verifyJob = workflow.jobs.verify

    expect(verifyJob.uses).toBe(
      'serpcompany/json-directory-template/.github/workflows/reusable-verify-badge.yml@main'
    )
    expect(verifyJob.secrets?.GH_PAT).toBe(githubExpression('{{ secrets.GH_PAT }}'))
    expect(verifyJob.steps).toBeUndefined()
    expect(source).not.toContain('actions/github-script')
    expect(source).not.toContain('script: |')
    expect(source).not.toContain('const badgePendingLabel')
  })
})
