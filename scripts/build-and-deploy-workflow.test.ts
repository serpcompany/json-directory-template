import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import yaml from 'js-yaml'
import { describe, expect, it } from 'vitest'

interface WorkflowJob {
  environment?: Record<string, string>
  env?: Record<string, string>
  needs?: string | string[]
  steps?: Array<{
    env?: Record<string, string>
    name?: string
    uses?: string
    with?: Record<string, string>
  }>
}

interface WorkflowDefinition {
  on: {
    push?: {
      paths?: string[]
    }
    workflow_dispatch: {
      inputs: Record<string, { required?: boolean }>
    }
  }
  jobs: Record<string, WorkflowJob>
}

function loadWorkflow(): WorkflowDefinition {
  const workflowPath = resolve(process.cwd(), '.github/workflows/build-and-deploy.yml')
  const raw = readFileSync(workflowPath, 'utf8')

  return yaml.load(raw) as WorkflowDefinition
}

describe('build-and-deploy workflow', () => {
  it('makes deploy depend on validate outputs as well as build completion', () => {
    const workflow = loadWorkflow()
    const deployJob = workflow.jobs.deploy

    expect(deployJob).toBeDefined()
    expect(deployJob.needs).toEqual(['validate', 'build'])
  })

  it('downloads the build artifact into the validated artifact directory', () => {
    const workflow = loadWorkflow()
    const deployJob = workflow.jobs.deploy
    const downloadStep = deployJob.steps?.find(step => step.uses === 'actions/download-artifact@v4')

    expect(downloadStep).toBeDefined()
    expect(downloadStep?.with).toMatchObject({
      name: 'build-output',
      path: `\${{ needs.validate.outputs.artifact_dir }}`
    })
  })

  it('requires a checked-in site id instead of an explicit build spec path', () => {
    const workflow = loadWorkflow()
    const dispatchInputs = workflow.on.workflow_dispatch.inputs

    expect(dispatchInputs.site_id).toBeDefined()
    expect(dispatchInputs.site_id?.required).toBe(true)
    expect(dispatchInputs.build_spec_path).toBeUndefined()
    expect(dispatchInputs.deploy_repo).toBeUndefined()
    expect(dispatchInputs.deploy_branch).toBeUndefined()
  })

  it('uses the configured GH_PAT secret for repo sync pushes', () => {
    const workflow = loadWorkflow()
    const deployJob = workflow.jobs.deploy
    const deployStep = deployJob.steps?.find(step => step.name === 'Deploy')

    expect(deployStep).toBeDefined()
    expect(deployStep?.env?.DEPLOY_TOKEN).toBe(`\${{ secrets.GH_PAT }}`)
  })

  it('does not expose normal deploy target overrides in the workflow', () => {
    const workflow = loadWorkflow()
    const deployJob = workflow.jobs.deploy
    const deployStep = deployJob.steps?.find(step => step.name === 'Deploy')

    expect(deployStep).toBeDefined()
    expect(deployStep?.env?.DEPLOY_REPO_URL).toBeUndefined()
    expect(deployStep?.env?.DEPLOY_BRANCH).toBeUndefined()
  })

  it('does not let repo variables override push path site inference', () => {
    const workflow = loadWorkflow()
    const validateJob = workflow.jobs.validate
    const resolveStep = validateJob.steps?.find(step => step.name === 'Resolve build input')

    expect(resolveStep?.env?.SITE_ID).toBe(
      `\${{ github.event_name == 'workflow_dispatch' && github.event.inputs.site_id || '' }}`
    )
    expect(resolveStep?.env?.PUSH_FALLBACK_SITE_ID).toBe(
      `\${{ github.event_name == 'push' && vars.SITE_ID || '' }}`
    )
    expect(resolveStep?.env?.SITE_ID).not.toContain('vars.SITE_ID')
  })

  it('runs for changes to active wrapper apps', () => {
    const workflow = loadWorkflow()
    const paths = workflow.on.push?.paths ?? []

    expect(paths).toEqual(
      expect.arrayContaining([
        'apps/browserextensions.io/**',
        'apps/pornvideodownloaders.com/**',
        'apps/serp.ai/**',
        'apps/serp.co/**',
        'apps/serp.software/**',
        'apps/serpdownloaders.com/**',
        'apps/starter/**'
      ])
    )
  })
})
