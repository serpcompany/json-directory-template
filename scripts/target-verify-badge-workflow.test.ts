import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import yaml from 'js-yaml'
import { describe, expect, it } from 'vitest'

const githubExpression = (expression: string) => `$${expression}`
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
      steps: Array<{
        env?: Record<string, string>
        id?: string
        if?: string
        name?: string
        uses?: string
        with?: {
          script?: string
        }
      }>
    }
  >
  on: Record<string, { types: string[] }>
  permissions: Record<string, string>
}

function loadWorkflow(): WorkflowDefinition {
  return yaml.load(
    readFileSync(resolve(process.cwd(), 'scripts/templates/target-verify-badge.yml'), 'utf8')
  ) as WorkflowDefinition
}

function loadWorkflowSource(): string {
  return readFileSync(resolve(process.cwd(), 'scripts/templates/target-verify-badge.yml'), 'utf8')
}

describe('target verify badge workflow template', () => {
  it('contains JavaScript bodies that compile in github-script', () => {
    const workflow = loadWorkflow()

    for (const step of workflow.jobs.verify.steps) {
      const script = step.with?.script
      if (!script) {
        continue
      }

      expect(() => {
        new AsyncFunction('github', 'context', 'core', 'fetch', 'Buffer', 'process', script)
      }, `${step.name} script should parse`).not.toThrow()
    }
  })

  it('runs on new issues and /check-badge comments', () => {
    const workflow = loadWorkflow()
    const verifyJob = workflow.jobs.verify

    expect(workflow.on.issues.types).toEqual(['opened'])
    expect(workflow.on.issue_comment.types).toEqual(['created'])
    expect(verifyJob.if).toContain("github.event_name == 'issues'")
    expect(verifyJob.if).toContain('/check-badge')
    expect(workflow.permissions).toMatchObject({ issues: 'write' })
  })

  it('uses badge state labels instead of legacy verified labels', () => {
    const source = loadWorkflowSource()

    expect(source.indexOf('const submission = parseSubmission')).toBeLessThan(
      source.indexOf('await addLabel(badgePendingLabel)')
    )
    expect(source).toContain("if (github.eventName === 'issue_comment')")
    expect(source).toContain("const badgePendingLabel = 'badge-not-verified'")
    expect(source).toContain("const badgeVerifiedLabel = 'badge-verified'")
    expect(source).toContain('await addLabel(badgePendingLabel)')
    expect(source).toContain('await removeLabel(badgeVerifiedLabel)')
    expect(source).toContain('if (createError.status !== 422) throw createError')
    expect(source).not.toContain("labels: ['verified']")
    expect(source).not.toContain("labels: ['approved']")
  })

  it('creates an assigned source repo PR after successful verification', () => {
    const source = loadWorkflowSource()
    const workflow = loadWorkflow()
    const createPrStep = workflow.jobs.verify.steps.find(
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
    const source = loadWorkflowSource()

    expect(source).toContain("const details = getSection(body, '.*details')")
    expect(source).toContain('^(?!Logo URL:|Video URL:)')
    expect(source).toContain("getSection(body, 'Media')")
  })

  it('uses site-specific listing URLs in badge snippets and rejects HTTP errors', () => {
    const source = loadWorkflowSource()

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
})
