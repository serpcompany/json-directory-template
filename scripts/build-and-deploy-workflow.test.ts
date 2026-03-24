import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import yaml from 'js-yaml'
import { describe, expect, it } from 'vitest'

interface WorkflowJob {
  env?: Record<string, string>
  needs?: string | string[]
  steps?: Array<{
    uses?: string
    with?: Record<string, string>
  }>
}

interface WorkflowDefinition {
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
      path: '${{ needs.validate.outputs.artifact_dir }}'
    })
  })
})
