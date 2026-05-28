import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import yaml from 'js-yaml'
import { describe, expect, it } from 'vitest'

interface WorkflowJob {
  environment?: Record<string, string>
  env?: Record<string, string>
  needs?: string | string[]
  strategy?: {
    matrix?: {
      site_id?: string[]
    }
  }
  steps?: Array<{
    env?: Record<string, string>
    name?: string
    uses?: string
    with?: Record<string, string>
  }>
}

interface WorkflowDefinition {
  jobs: Record<string, WorkflowJob>
  on: {
    push?: {
      paths?: string[]
    }
    workflow_dispatch: {
      inputs: Record<string, { required?: boolean }>
    }
  }
}

function loadWorkflow(): WorkflowDefinition {
  const workflowPath = resolve(process.cwd(), '.github/workflows/build-and-deploy.yml')
  const raw = readFileSync(workflowPath, 'utf8')

  return yaml.load(raw) as WorkflowDefinition
}

describe('build-and-deploy workflow', () => {
  it('runs when shared web-core brands sources change', () => {
    const workflow = loadWorkflow()

    expect(workflow.on.push?.paths).toEqual(expect.arrayContaining(['packages/web-core/**']))
  })

  it('fans out push deploys to every active checked-in directory site', () => {
    const workflow = loadWorkflow()
    const pushJob = workflow.jobs['deploy-active-sites']

    expect(pushJob).toBeDefined()
    expect(pushJob.strategy?.matrix?.site_id).toEqual([
      'browserextensions.io',
      'pornvideodownloaders.com',
      'serp.ai',
      'serp.co',
      'serp.software',
      'serpdownloaders.com'
    ])
  })

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
    const dispatchInputs = (
      workflow as WorkflowDefinition & {
        on: { workflow_dispatch: { inputs: Record<string, { required?: boolean }> } }
      }
    ).on.workflow_dispatch.inputs

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
})
