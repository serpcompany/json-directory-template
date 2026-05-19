import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import yaml from 'js-yaml'
import { describe, expect, it } from 'vitest'

interface WorkflowStep {
  uses?: string
  name?: string
  run?: string
  with?: Record<string, string | number>
}

interface WorkflowJob {
  steps?: WorkflowStep[]
}

interface WorkflowDefinition {
  jobs: Record<string, WorkflowJob>
  permissions?: Record<string, string>
}

function loadWorkflow(): WorkflowDefinition {
  const workflowPath = resolve(process.cwd(), '.github/workflows/pr-review.yml')
  const raw = readFileSync(workflowPath, 'utf8')

  return yaml.load(raw) as WorkflowDefinition
}

describe('pr-review workflow', () => {
  it('grants explicit permissions for PR change detection', () => {
    const workflow = loadWorkflow()

    expect(workflow.permissions).toMatchObject({
      contents: 'read',
      'pull-requests': 'read'
    })
  })

  it('validates the active checked-in sites through the generic site-validation entrypoint', () => {
    const workflow = loadWorkflow()
    const validateJob = workflow.jobs.validate
    const stepRuns = validateJob.steps?.map(step => step.run).filter(Boolean)
    const checkoutStep = validateJob.steps?.find(step => step.uses === 'actions/checkout@v6')

    expect(checkoutStep?.with?.['fetch-depth']).toBe(0)
    expect(stepRuns).toContain('pnpm validate:sites')
    expect(stepRuns).toContain('pnpm exec biome check --changed --since=origin/main')
    expect(stepRuns).not.toContain('pnpm validate:site -- --site default')
    expect(stepRuns).not.toContain('pnpm validate:site -- --site serpdownloaders.com')
    expect(stepRuns).not.toContain('pnpm validate:site -- --site serp.software')
    expect(stepRuns).not.toContain('pnpm check:frontmatter')
  })
})
