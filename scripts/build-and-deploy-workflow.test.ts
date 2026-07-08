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
    'fail-fast'?: boolean
    matrix?: Record<string, unknown>
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

  it('does not rebuild sites for target workflow-only maintenance changes', () => {
    const workflow = loadWorkflow()

    expect(workflow.on.push?.paths).toEqual(
      expect.arrayContaining([
        '!scripts/deploy-to-repo.sh',
        '!scripts/build-and-deploy-workflow.test.ts',
        '!scripts/deploy-to-repo-script.test.ts',
        '!scripts/target-verify-badge-workflow.test.ts',
        '!scripts/templates/target-verify-badge.yml'
      ])
    )
    expect(workflow.on.push?.paths).not.toContain('.github/workflows/build-and-deploy.yml')
    expect(workflow.on.push?.paths).not.toContain('.github/workflows/reusable-verify-badge.yml')
  })

  it('runs push and workflow dispatch through a resolver plus deploy matrix', () => {
    const workflow = loadWorkflow()
    const jobNames = Object.keys(workflow.jobs)
    const resolveJob = workflow.jobs.resolve
    const deployJob = workflow.jobs.deploy
    const namedSteps = deployJob.steps?.filter(step => step.name).map(step => step.name)

    expect(jobNames).toEqual(['resolve', 'deploy'])
    expect(resolveJob).toBeDefined()
    expect(deployJob).toBeDefined()
    expect(deployJob.if).toBe(`needs.resolve.outputs.should_deploy == 'true'`)
    expect(deployJob.needs).toBe('resolve')
    expect(deployJob.strategy?.['fail-fast']).toBe(false)
    expect(deployJob.strategy?.matrix).toEqual({
      target: `\${{ fromJson(needs.resolve.outputs.deploy_targets) }}`
    })
    expect(namedSteps).toEqual([
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

    expect(validateStep?.if).toBeUndefined()
    expect(validateStep?.run).toBe('pnpm validate:site')
    expect(validateStep?.env?.SITE_ID).toBe(`\${{ matrix.target.siteId }}`)
    expect(buildStep?.if).toBeUndefined()
    expect(buildStep?.run).toBe('pnpm build:site')
    expect(buildStep?.env?.SITE_ID).toBe(`\${{ matrix.target.siteId }}`)
    expect(sitemapAuditStep?.if).toBeUndefined()
    expect(sitemapAuditStep?.run).toBe('pnpm audit:sitemaps -- --site "$SITE_ID"')
    expect(sitemapAuditStep?.env?.SITE_ID).toBe(`\${{ matrix.target.siteId }}`)
    expect(forbiddenLinksAuditStep?.if).toBeUndefined()
    expect(forbiddenLinksAuditStep?.run).toBe('pnpm audit:forbidden-links -- --site "$SITE_ID"')
    expect(forbiddenLinksAuditStep?.env?.SITE_ID).toBe(`\${{ matrix.target.siteId }}`)
    expect(deployStep?.if).toBeUndefined()
    expect(deployStep?.run).toBe('pnpm deploy:site')
    expect(deployStep?.env?.SITE_ID).toBe(`\${{ matrix.target.siteId }}`)
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

  it('uses the GitHub Pages deploy secret for target repo syncs', () => {
    const workflow = loadWorkflow()
    const deployJob = workflow.jobs.deploy
    const deployStep = deployJob.steps?.find(step => step.name === 'Deploy')
    const authStep = deployJob.steps?.find(step => step.name === 'Verify deploy auth')

    expect(deployStep).toBeDefined()
    expect(deployStep?.env?.DEPLOY_TOKEN).toBe(`\${{ secrets.GH_PAT }}`)
    expect(authStep?.if).toBeUndefined()
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

  it('does not bypass the resolver with hardcoded active-site push deploys', () => {
    const workflow = loadWorkflow()
    const workflowRaw = readFileSync(
      resolve(process.cwd(), '.github/workflows/build-and-deploy.yml'),
      'utf8'
    )

    expect(workflow.jobs['deploy-active-sites']).toBeUndefined()
    expect(workflow.jobs.deploy.strategy?.matrix).toEqual({
      target: `\${{ fromJson(needs.resolve.outputs.deploy_targets) }}`
    })
    expect(workflowRaw).not.toContain('pnpm deploy:site -- --site')
  })

  it('does not use repo variables as a push fallback site id', () => {
    const workflow = loadWorkflow()
    const resolveJob = workflow.jobs.resolve
    const resolveStep = resolveJob.steps?.find(step => step.name === 'Resolve build input')
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
    const resolveJob = workflow.jobs.resolve
    const resolveStep = resolveJob.steps?.find(step => step.name === 'Resolve build input')

    expect(resolveStep?.env?.GITHUB_TOKEN).toBe(`\${{ github.token }}`)
    expect(workflow.permissions).toMatchObject({
      contents: 'read',
      'pull-requests': 'read'
    })
  })

  it('guards the deploy matrix job when the resolver returns no deploy target', () => {
    const workflow = loadWorkflow()
    const deployJob = workflow.jobs.deploy

    expect(deployJob.if).toBe(`needs.resolve.outputs.should_deploy == 'true'`)
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
