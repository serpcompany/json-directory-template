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
  return yaml.load(
    readFileSync(resolve(process.cwd(), path), 'utf8')
  ) as WorkflowDefinition
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
    expect(source).toContain('innerHtml.includes(badgeImageUrl)')
    expect(source).toContain('if (foundDofollow && foundBadgeImage)')
    expect(source).not.toContain('if (foundDofollow) {')
    expect(source).toContain(
      "const listingPathParts = ['products', submission.slug, listingDetailSuffix].filter(Boolean)"
    )
    expect(source).toContain('if (!response.ok)')
  })

  it('parses submitted product URLs from multi-line details sections before checking the badge', async () => {
    const workflow = loadReusableWorkflow()
    const checkStep = workflow.jobs.verify.steps?.find(
      step => step.name === 'Check badge and update issue labels'
    )
    const script = checkStep?.with?.script

    expect(script).toBeDefined()

    const labelsAdded: string[][] = []
    const comments: string[] = []
    const outputs: Record<string, string> = {}
    const fetch = vi.fn(async () => ({
      ok: true,
      text: async () => '<html><body>No badge yet</body></html>'
    }))
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
          removeLabel: vi.fn(async () => undefined)
        }
      }
    }
    const context = {
      eventName: 'issue_comment',
      payload: {
        comment: {
          body: '/check-badge'
        },
        issue: {
          body: `## Submission visibility

This submission will be filed as a public GitHub issue for SERP.

## Product details

Name: SERP Lists
Product URL: https://serplists.com
Category: ai-project-management

## Description

Create and Run Checklists for Your Processes

## Media

Logo URL: https://example.com/logo.png
Video URL: https://example.com/video

## Resource links

- serplists.com: https://serplists.com

## Additional notes

SERP Lists helps teams and solo operators.`,
          number: 1,
          user: { login: 'devinschumacher' }
        }
      },
      repo: {
        owner: 'serpcompany',
        repo: 'serp.co'
      }
    }
    const core = {
      setOutput: vi.fn((name: string, value: string) => {
        outputs[name] = value
      })
    }

    await new AsyncFunction('github', 'context', 'core', 'fetch', 'Buffer', 'process', script!)(
      github,
      context,
      core,
      fetch,
      Buffer,
      process
    )

    expect(fetch).toHaveBeenCalledWith('https://serplists.com', expect.any(Object))
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
})

describe('target verify badge workflow template', () => {
  it('runs on new issues and /check-badge comments', () => {
    const workflow = loadTargetWorkflow()
    const verifyJob = workflow.jobs.verify

    expect(workflow.on.issues.types).toEqual(['opened'])
    expect(workflow.on.issue_comment.types).toEqual(['created'])
    expect(verifyJob.if).toContain("github.event_name == 'issues'")
    expect(verifyJob.if).toContain("!github.event.issue.pull_request")
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
