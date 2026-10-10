import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { activeCheckedInSiteIds, removedSiteIds } from '@thedaviddias/site-contract/active-site-ids'
import yaml from 'js-yaml'
import { describe, expect, it } from 'vitest'
import {
  buildAndDeployWorkflowPushPaths,
  isBuildAffectingPath,
  matchesWorkflowPathFilter,
  nonBuildPathPatterns
} from './deploy-trigger-paths.ts'

interface WorkflowJob {
  'runs-on'?: string
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
  it('uses the shared deploy trigger paths as its push path filter', () => {
    const workflow = loadWorkflow()

    expect(workflow.on.push?.paths).toEqual([...buildAndDeployWorkflowPushPaths])
  })

  it('runs when any shared build input changes', () => {
    for (const path of [
      '.github/actions/install/action.yml',
      'packages/web-core/.eslintrc.json',
      'packages/web-core/src/.generated/routes.ts',
      'scripts/.build-env.json',
      'packages/web-core/src/schema.ts',
      'packages/site-contract/src/trial-products.ts',
      'packages/design-system/components/custom/breadcrumb.tsx',
      'packages/content/data/about/about.mdx',
      'configs/next/index.ts',
      'scripts/sitemap-files.ts',
      'scripts/build-site.ts',
      'sites/site-config.default.ts',
      'sites/default/categories.json',
      'package.json',
      'pnpm-lock.yaml',
      '.nvmrc'
    ]) {
      expect(isBuildAffectingPath(path), path).toBe(true)
    }
  })

  it('does not rebuild sites for tests, docs, non-build scripts, or target workflow-only maintenance', () => {
    const workflow = loadWorkflow()

    for (const path of [
      'scripts/resolve-build-run.test.ts',
      'packages/web-core/src/structured-data.test.ts',
      'apps/starter/lib/__tests__/schema-copy.test.ts',
      'docs/BUILD_PIPELINE.md',
      'sites/serpdownloaders.com/README.md',
      'scripts/listing-rewrite.ts',
      'scripts/listing-rewrite-brief.md',
      'scripts/deploy-to-repo.sh',
      'scripts/templates/target-verify-badge.yml',
      'data/listings.json',
      'apps/starter/app/layout.tsx',
      '.github/workflows/build-and-deploy.yml',
      '.github/workflows/reusable-verify-badge.yml',
      'packages/web-core/src/.cache/schema.test.ts',
      'docs/.notes.md'
    ]) {
      expect(isBuildAffectingPath(path), path).toBe(false)
    }
    expect(workflow.on.push?.paths).not.toContain('.github/workflows/build-and-deploy.yml')
    expect(workflow.on.push?.paths).not.toContain('.github/workflows/reusable-verify-badge.yml')
  })

  it('matches dotfiles and dot directories like GitHub path filters do', () => {
    expect(matchesWorkflowPathFilter('packages/.hidden/a.ts', ['packages/**'])).toBe(true)
    expect(matchesWorkflowPathFilter('.nvmrc', ['*'])).toBe(true)
    expect(matchesWorkflowPathFilter('scripts/a/b.ts', ['scripts/*'])).toBe(false)
    expect(matchesWorkflowPathFilter('scripts/a.ts', ['scripts/*'])).toBe(true)
    expect(matchesWorkflowPathFilter('apps/x/.next/a.test.ts', ['apps/**', '!**/*.test.ts'])).toBe(
      false
    )
    expect(matchesWorkflowPathFilter('a.test.ts', ['**', '!**/*.test.ts'])).toBe(false)
    expect(matchesWorkflowPathFilter('sites/serp.ai/x', ['sites/serp?ai/**'])).toBe(true)
  })

  it('ignores retired site directories', () => {
    for (const siteId of removedSiteIds) {
      expect(isBuildAffectingPath(`sites/${siteId}/products.json`), siteId).toBe(false)
      expect(isBuildAffectingPath(`apps/${siteId}/app/page.tsx`), siteId).toBe(false)
    }
  })

  it('covers every workspace package an active wrapper app depends on', () => {
    const workspacePackageDirs = new Map<string, string>()

    for (const root of ['packages', 'configs']) {
      for (const entry of readdirSync(resolve(process.cwd(), root), { withFileTypes: true })) {
        const packageJsonPath = resolve(process.cwd(), root, entry.name, 'package.json')

        if (entry.isDirectory() && existsSync(packageJsonPath)) {
          const { name } = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { name: string }
          workspacePackageDirs.set(name, `${root}/${entry.name}`)
        }
      }
    }

    const readWorkspaceDependencies = (dir: string): string[] => {
      const packageJson = JSON.parse(
        readFileSync(resolve(process.cwd(), dir, 'package.json'), 'utf8')
      ) as Record<string, Record<string, string> | undefined>

      return ['dependencies', 'devDependencies', 'peerDependencies'].flatMap(field =>
        Object.keys(packageJson[field] ?? {}).filter(name => workspacePackageDirs.has(name))
      )
    }

    const reachedDirs = new Set<string>()
    const queue = activeCheckedInSiteIds.flatMap(siteId =>
      readWorkspaceDependencies(`apps/${siteId}`)
    )

    while (queue.length > 0) {
      const dir = workspacePackageDirs.get(queue.pop() ?? '')

      if (dir && !reachedDirs.has(dir)) {
        reachedDirs.add(dir)
        queue.push(...readWorkspaceDependencies(dir))
      }
    }

    expect(reachedDirs.size).toBeGreaterThan(0)
    for (const dir of reachedDirs) {
      expect(isBuildAffectingPath(`${dir}/src/index.ts`), dir).toBe(true)
      expect(isBuildAffectingPath(`${dir}/package.json`), dir).toBe(true)
    }

    const excludedPackageDirs = nonBuildPathPatterns
      .filter(pattern => pattern.startsWith('packages/'))
      .map(pattern => pattern.replace(/\/\*\*$/, ''))

    for (const dir of excludedPackageDirs) {
      expect(reachedDirs.has(dir), dir).toBe(false)
    }
  })

  it('runs both jobs on GitHub-hosted runners while the self-hosted runners are offline', () => {
    const workflow = loadWorkflow()

    expect(workflow.jobs.resolve['runs-on']).toBe('ubuntu-latest')
    expect(workflow.jobs.deploy['runs-on']).toBe('ubuntu-latest')
  })

  it('runs push and workflow dispatch through a resolver plus deploy matrix', () => {
    const workflow = loadWorkflow()
    const jobNames = Object.keys(workflow.jobs)
    const resolveJob = workflow.jobs.resolve
    const deployJob = workflow.jobs.deploy
    const namedSteps = deployJob.steps?.filter(step => step.name).map(step => step.name)

    expect(jobNames).toEqual(['resolve', 'deploy'])
    expect(resolveJob).toBeDefined()
    expect(resolveJob.if).toBe(
      "github.event_name != 'push' || !contains(github.event.head_commit.message, '[skip static deploy]')"
    )
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

  it('supports a one-commit static deployment skip without weakening manual dispatch', () => {
    const workflow = loadWorkflow()

    expect(workflow.jobs.resolve.if).toContain("'[skip static deploy]'")
    expect(workflow.jobs.resolve.if).toContain("github.event_name != 'push'")
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

  it('runs for changes to active wrapper apps and checked-in site sources', () => {
    const workflow = loadWorkflow()
    const paths = workflow.on.push?.paths ?? []

    expect(paths).toEqual(
      expect.arrayContaining([
        'apps/browserextensions.io/**',
        'apps/serp.ai/**',
        'apps/serpdownloaders.com/**',
        'sites/browserextensions.io/**',
        'sites/serp.ai/**',
        'sites/serpdownloaders.com/**'
      ])
    )
    expect(paths).not.toContain('apps/serp.co/**')
    expect(paths).not.toContain('apps/starter/**')
  })
})
