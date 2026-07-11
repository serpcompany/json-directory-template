import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import yaml from 'js-yaml'
import { describe, expect, it } from 'vitest'

const activeListingSourcePaths = [
  'data/listings.json',
  'd1/**',
  'sites/browserextensions.io/products.json',
  'sites/pornvideodownloaders.com/products.json',
  'sites/serp.ai/products.json',
  'sites/serp.co/products.json',
  'sites/serp.software/products.json',
  'sites/serpdownloaders.com/products.json',
  'wrangler.jsonc'
]

interface WorkflowTrigger {
  branches?: string[]
  paths?: string[]
}

interface WorkflowDefinition {
  concurrency?: {
    group?: string
  }
  jobs: Record<
    string,
    {
      steps?: Array<{
        id?: string
        if?: string
        name?: string
        run?: string
        uses?: string
        with?: Record<string, string | number>
      }>
    }
  >
  on: {
    pull_request?: WorkflowTrigger
    push?: WorkflowTrigger
    workflow_dispatch?: Record<string, never>
  }
}

function loadWorkflow(): WorkflowDefinition {
  const workflowPath = resolve(process.cwd(), '.github/workflows/update-listings-json.yml')
  const raw = readFileSync(workflowPath, 'utf8')

  return yaml.load(raw) as WorkflowDefinition
}

describe('update-listings-json workflow', () => {
  it('validates active listing sources on pull requests as well as pushes to main', () => {
    const workflow = loadWorkflow()

    expect(workflow.on.pull_request).toMatchObject({
      branches: ['main'],
      paths: activeListingSourcePaths
    })
    expect(workflow.on.push).toMatchObject({
      branches: ['main'],
      paths: activeListingSourcePaths
    })
  })

  it('runs the listing-source validation steps for the current active surfaces', () => {
    const workflow = loadWorkflow()
    const validateJob = workflow.jobs['validate-listing-data']
    const checkoutStep = validateJob.steps?.find(step => step.name === 'Checkout')
    const detectDataListingsStep = validateJob.steps?.find(
      step => step.name === 'Detect data/listings.json changes'
    )
    const jsonValidateStep = validateJob.steps?.find(
      step => step.name === 'Validate data/listings.json'
    )
    const activeSiteValidateStep = validateJob.steps?.find(
      step => step.name === 'Validate active checked-in site data'
    )
    const localD1PrepareStep = validateJob.steps?.find(
      step => step.name === 'Prepare local D1 listing sources'
    )

    expect(checkoutStep?.with?.['fetch-depth']).toBe(0)
    expect(detectDataListingsStep?.id).toBe('detect-data-listings')
    expect(detectDataListingsStep?.run).toContain('origin/$' + '{{ github.base_ref }}...HEAD')
    expect(detectDataListingsStep?.run).toContain('github.event.before')
    expect(jsonValidateStep?.if).toBe("steps.detect-data-listings.outputs.changed == 'true'")
    expect(jsonValidateStep?.run).toBe('pnpm tsx scripts/validate-data.ts data/listings.json')
    expect(localD1PrepareStep?.run).toBe('pnpm d1:local:prepare')
    expect(activeSiteValidateStep?.run).toBe('pnpm validate:sites')
  })

  it('uses a concurrency key that separates pull requests from branch refs', () => {
    const workflow = loadWorkflow()

    expect(workflow.concurrency?.group).toContain('github.event.pull_request.number')
    expect(workflow.concurrency?.group).toContain('github.ref')
  })
})
