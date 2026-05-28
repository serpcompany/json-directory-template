import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import yaml from 'js-yaml'
import { describe, expect, it } from 'vitest'

interface WorkflowJob {
  environment?: Record<string, string>
  env?: Record<string, string>
  if?: string
  needs?: string | string[]
  strategy?: {
    matrix?: {
      site_id?: string[]
    }
  }
  steps?: Array<{
    env?: Record<string, string>
    if?: string
    name?: string
    run?: string
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
      inputs: Record<string, { default?: string; required?: boolean }>
    }
  }
  permissions?: Record<string, string>
  jobs: Record<string, WorkflowJob>
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
    expect(pushJob.if).toBe(`github.event_name == 'push'`)
    expect(pushJob.strategy?.matrix?.site_id).toEqual([
      'browserextensions.io',
      'pornvideodownloaders.com',
      'serp.ai',
      'serp.co',
      'serp.software',
      'serpdownloaders.com'
    ])
  })

  it('runs workflow dispatch validate, build, audit, and deploy in one job', () => {
    const workflow = loadWorkflow()
    const jobNames = Object.keys(workflow.jobs)
    const deployJob = workflow.jobs.deploy
    const namedSteps = deployJob.steps?.filter(step => step.name).map(step => step.name)

    expect(jobNames).toEqual(['deploy', 'deploy-active-sites'])
    expect(deployJob).toBeDefined()
    expect(deployJob.if).toBe(`github.event_name == 'workflow_dispatch'`)
    expect(deployJob.needs).toBeUndefined()
    expect(namedSteps).toEqual([
      'Resolve build input',
      'Validate site data',
      'Build static site',
      'Audit XML sitemaps',
      'Audit forbidden listing links',
      'Verify deploy auth',
      'Deploy'
    ])
  })

  it('does not upload or download build artifacts for the normal deploy path', () => {
    const workflow = loadWorkflow()
    const deployJob = workflow.jobs.deploy
    const stepActions = deployJob.steps?.map(step => step.uses).filter(Boolean) ?? []
    const artifactActions = stepActions.filter(
      action => action?.includes('upload-artifact') || action?.includes('download-artifact')
    )

    expect(artifactActions).toEqual([])
  })

  it('requires a checked-in site id instead of an explicit build spec path', () => {
    const workflow = loadWorkflow()
    const dispatchInputs = workflow.on.workflow_dispatch.inputs

    expect(dispatchInputs.site_id).toBeDefined()
    expect(dispatchInputs.site_id?.required).toBe(true)
    expect(dispatchInputs.site_id?.default).toBeUndefined()
    expect(dispatchInputs.build_spec_path).toBeUndefined()
    expect(dispatchInputs.deploy_repo).toBeUndefined()
    expect(dispatchInputs.deploy_branch).toBeUndefined()
  })

  it('does not bypass validation or audits before workflow dispatch deploy', () => {
    const workflow = loadWorkflow()
    const deployJob = workflow.jobs.deploy
    const steps = deployJob.steps ?? []
    const validateStep = steps.find(step => step.name === 'Validate site data')
    const buildStep = steps.find(step => step.name === 'Build static site')
    const sitemapAuditStep = steps.find(step => step.name === 'Audit XML sitemaps')
    const forbiddenLinksAuditStep = steps.find(
      step => step.name === 'Audit forbidden listing links'
    )
    const deployStep = steps.find(step => step.name === 'Deploy')
    const stepNames = steps.map(step => step.name)
    const deployGuard = `steps.resolve.outputs.should_deploy == 'true'`

    expect(validateStep?.if).toBe(deployGuard)
    expect(validateStep?.run).toBe('pnpm validate:site')
    expect(validateStep?.env?.SITE_ID).toBe(`\${{ steps.resolve.outputs.site_id }}`)
    expect(buildStep?.if).toBe(deployGuard)
    expect(buildStep?.run).toBe('pnpm build:site')
    expect(buildStep?.env?.SITE_ID).toBe(`\${{ steps.resolve.outputs.site_id }}`)
    expect(sitemapAuditStep?.if).toBe(deployGuard)
    expect(sitemapAuditStep?.run).toBe('pnpm audit:sitemaps -- --site "$SITE_ID"')
    expect(sitemapAuditStep?.env?.SITE_ID).toBe(`\${{ steps.resolve.outputs.site_id }}`)
    expect(forbiddenLinksAuditStep?.if).toBe(deployGuard)
    expect(forbiddenLinksAuditStep?.run).toBe('pnpm audit:forbidden-links -- --site "$SITE_ID"')
    expect(forbiddenLinksAuditStep?.env?.SITE_ID).toBe(`\${{ steps.resolve.outputs.site_id }}`)
    expect(deployStep?.if).toBe(deployGuard)
    expect(deployStep?.run).toBe('pnpm deploy:site')
    expect(deployStep?.env?.SITE_ID).toBe(`\${{ steps.resolve.outputs.site_id }}`)
    expect(stepNames.indexOf('Validate site data')).toBeLessThan(
      stepNames.indexOf('Build static site')
    )
    expect(stepNames.indexOf('Build static site')).toBeLessThan(
      stepNames.indexOf('Audit XML sitemaps')
    )
    expect(stepNames.indexOf('Audit XML sitemaps')).toBeLessThan(
      stepNames.indexOf('Audit forbidden listing links')
    )
    expect(stepNames.indexOf('Audit forbidden listing links')).toBeLessThan(
      stepNames.indexOf('Deploy')
    )
  })

  it('uses the configured GH_PAT secret for repo sync pushes', () => {
    const workflow = loadWorkflow()
    const deployJob = workflow.jobs.deploy
    const deployStep = deployJob.steps?.find(step => step.name === 'Deploy')
    const authStep = deployJob.steps?.find(step => step.name === 'Verify deploy auth')
    const deployGuard = `steps.resolve.outputs.should_deploy == 'true'`

    expect(deployStep).toBeDefined()
    expect(deployStep?.env?.DEPLOY_TOKEN).toBe(`\${{ secrets.GH_PAT }}`)
    expect(authStep?.if).toBe(deployGuard)
    expect(authStep?.env?.DEPLOY_TOKEN).toBe(`\${{ secrets.GH_PAT }}`)
    expect(authStep?.run).toContain('Missing GH_PAT secret required for cross-repo deploy.')
  })

  it('clears inherited normal deploy target overrides in workflow dispatch deploy', () => {
    const workflow = loadWorkflow()
    const deployJob = workflow.jobs.deploy
    const deployStep = deployJob.steps?.find(step => step.name === 'Deploy')

    expect(deployStep).toBeDefined()
    expect(deployStep?.env?.ALLOW_DEPLOY_TARGET_OVERRIDE).toBe('')
    expect(deployStep?.env?.DEPLOY_REPO_URL).toBe('')
    expect(deployStep?.env?.DEPLOY_BRANCH).toBe('')
  })

  it('clears inherited deploy target overrides in active-site push deploys', () => {
    const workflow = loadWorkflow()
    const pushDeployJob = workflow.jobs['deploy-active-sites']
    const deployStep = pushDeployJob.steps?.find(step => step.name === 'Deploy')

    expect(deployStep).toBeDefined()
    expect(deployStep?.env?.ALLOW_DEPLOY_TARGET_OVERRIDE).toBe('')
    expect(deployStep?.env?.DEPLOY_REPO_URL).toBe('')
    expect(deployStep?.env?.DEPLOY_BRANCH).toBe('')
  })

  it('does not use repo variables as a push fallback site id', () => {
    const workflow = loadWorkflow()
    const deployJob = workflow.jobs.deploy
    const resolveStep = deployJob.steps?.find(step => step.name === 'Resolve build input')
    const workflowRaw = readFileSync(
      resolve(process.cwd(), '.github/workflows/build-and-deploy.yml'),
      'utf8'
    )
    const legacyPushFallbackEnv = ['PUSH', 'FALLBACK_SITE_ID'].join('_')
    const legacyRepoSiteVariable = ['vars', 'SITE_ID'].join('.')

    expect(resolveStep?.env?.SITE_ID).toBe(
      `\${{ github.event_name == 'workflow_dispatch' && github.event.inputs.site_id || '' }}`
    )
    expect(resolveStep?.env?.[legacyPushFallbackEnv]).toBeUndefined()
    expect(resolveStep?.env?.NEXT_PUBLIC_SITE_ID).toBe('')
    expect(resolveStep?.env?.SITE_ID).not.toContain(legacyRepoSiteVariable)
    expect(workflowRaw).not.toContain(legacyPushFallbackEnv)
    expect(workflowRaw).not.toContain(legacyRepoSiteVariable)
  })

  it('passes the GitHub token to the resolver with PR read permissions', () => {
    const workflow = loadWorkflow()
    const deployJob = workflow.jobs.deploy
    const resolveStep = deployJob.steps?.find(step => step.name === 'Resolve build input')

    expect(resolveStep?.env?.GITHUB_TOKEN).toBe(`\${{ github.token }}`)
    expect(workflow.permissions).toMatchObject({
      contents: 'read',
      'pull-requests': 'read'
    })
  })

  it('guards workflow dispatch deploy work when the resolver returns no deploy target', () => {
    const workflow = loadWorkflow()
    const deployJob = workflow.jobs.deploy
    const guardedStepNames = [
      'Validate site data',
      'Build static site',
      'Audit XML sitemaps',
      'Audit forbidden listing links',
      'Verify deploy auth',
      'Deploy'
    ]

    for (const stepName of guardedStepNames) {
      const step = deployJob.steps?.find(candidate => candidate.name === stepName)

      expect(step?.if).toBe(`steps.resolve.outputs.should_deploy == 'true'`)
    }
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
