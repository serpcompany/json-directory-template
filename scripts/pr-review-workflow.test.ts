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

function loadE2eRelevantFilters(): string[] {
  const workflow = loadWorkflow()
  const changesJob = workflow.jobs.changes
  const filterStep = changesJob.steps?.find(step => step.id === 'filter')
  const filters = yaml.load(String(filterStep?.with?.filters ?? '')) as {
    e2e_relevant?: string[]
  }

  return filters.e2e_relevant ?? []
}

function pathMatchesFilter(path: string, filter: string): boolean {
  if (!filter.endsWith('/**')) {
    return path === filter
  }

  return path.startsWith(filter.slice(0, -3))
}

function isE2eRelevant(path: string): boolean {
  return loadE2eRelevantFilters().some(filter => pathMatchesFilter(path, filter))
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
    expect(stepRuns).toContain(
      'pnpm exec biome check --changed --since=origin/main --no-errors-on-unmatched'
    )
    expect(stepRuns).not.toContain('pnpm validate:site -- --site default')
    expect(stepRuns).not.toContain('pnpm validate:site -- --site serpdownloaders.com')
    expect(stepRuns).not.toContain('pnpm validate:site -- --site serp.software')
    expect(stepRuns).not.toContain('pnpm check:frontmatter')
  })

  it('installs Playwright browsers without sudo-only system dependency escalation', () => {
    const workflow = loadWorkflow()
    const e2eJob = workflow.jobs.e2e
    const stepRuns = e2eJob.steps?.map(step => step.run).filter(Boolean)

    expect(stepRuns).toContain('pnpm --filter e2e test:install')
    expect(stepRuns).not.toContain('npx playwright install --with-deps')
  })

  it('uses the Node 24-compatible paths-filter action for E2E gating', () => {
    const workflow = loadWorkflow()
    const changesJob = workflow.jobs.changes
    const filterStep = changesJob.steps?.find(step => step.id === 'filter')

    expect(filterStep?.uses).toBe('dorny/paths-filter@v4')
  })

  it('keeps E2E path filtering behavior scoped to relevant app and test paths', () => {
    const filters = loadE2eRelevantFilters()

    expect(filters).toEqual([
      'apps/starter/app/**',
      'apps/starter/components/**',
      'apps/starter/lib/**',
      'apps/starter/public/**',
      'apps/e2e/**',
      'packages/ui/**'
    ])
    expect(isE2eRelevant('apps/e2e/tests/home.spec.ts')).toBe(true)
    expect(isE2eRelevant('apps/starter/app/page.tsx')).toBe(true)
    expect(isE2eRelevant('apps/starter/components/site-header.tsx')).toBe(true)
    expect(isE2eRelevant('packages/ui/button.tsx')).toBe(true)
    expect(isE2eRelevant('docs/BUILD_PIPELINE.md')).toBe(false)
    expect(isE2eRelevant('packages/web-core/src/home-page.tsx')).toBe(false)
    expect(isE2eRelevant('.github/workflows/pr-review.yml')).toBe(false)
  })
})
