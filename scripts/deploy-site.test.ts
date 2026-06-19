import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  assertDeploySourceStateAllowsPush,
  buildDeployPlan,
  type DeploySourceState,
  runDeploySite
} from './deploy-site.ts'

function deploySourceState(overrides: Partial<DeploySourceState> = {}): DeploySourceState {
  return {
    ahead: 0,
    behind: 0,
    branch: 'main',
    isDirty: false,
    upstream: 'origin/main',
    ...overrides
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('buildDeployPlan', () => {
  it('builds a deterministic deploy plan from the checked-in site config', () => {
    expect(buildDeployPlan({ siteId: 'serpdownloaders.com' })).toEqual({
      branch: 'main',
      buildDir: expect.stringMatching(/dist\/sites\/serpdownloaders.com$/),
      preserve: ['.github/workflows/deploy.yml', 'CNAME'],
      repoUrl: 'https://github.com/serpcompany/serpdownloaders.com.git',
      siteId: 'serpdownloaders.com',
      strategy: 'github-pages-repo-sync'
    })
  })

  it('builds a deterministic deploy plan for pornvideodownloaders.com', () => {
    expect(buildDeployPlan({ siteId: 'pornvideodownloaders.com' })).toEqual({
      branch: 'main',
      buildDir: expect.stringMatching(/dist\/sites\/pornvideodownloaders.com$/),
      preserve: ['.github/workflows/deploy.yml', 'CNAME'],
      repoUrl: 'https://github.com/serpcompany/pornvideodownloaders.com.git',
      siteId: 'pornvideodownloaders.com',
      strategy: 'github-pages-repo-sync'
    })
  })

  it('builds a deterministic deploy plan for serp.software', () => {
    expect(buildDeployPlan({ siteId: 'serp.software' })).toEqual({
      branch: 'main',
      buildDir: expect.stringMatching(/dist\/sites\/serp.software$/),
      preserve: ['.github/workflows/deploy.yml', 'CNAME'],
      repoUrl: 'https://github.com/serpcompany/serp.software.git',
      siteId: 'serp.software',
      strategy: 'github-pages-repo-sync'
    })
  })

  it('builds a deterministic deploy plan for browserextensions.io', () => {
    expect(buildDeployPlan({ siteId: 'browserextensions.io' })).toEqual({
      branch: 'main',
      buildDir: expect.stringMatching(/dist\/sites\/browserextensions.io$/),
      preserve: ['.github/workflows/deploy.yml', 'CNAME'],
      repoUrl: 'https://github.com/serpcompany/browserextensions.io.git',
      siteId: 'browserextensions.io',
      strategy: 'github-pages-repo-sync'
    })
  })

  it('builds a deterministic deploy plan for serp.ai', () => {
    expect(buildDeployPlan({ siteId: 'serp.ai' })).toEqual({
      accountId: 'cec5f04e1d18bcc65f2be0aefb04f059',
      branch: 'main',
      buildDir: expect.stringMatching(/dist\/sites\/serp.ai$/),
      projectName: 'serp-ai',
      siteId: 'serp.ai',
      strategy: 'cloudflare-pages-direct-upload'
    })
  })

  it('throws when the selected site has no deploy target', () => {
    expect(() => buildDeployPlan({ siteId: 'default' })).toThrow(/does not define a deploy target/)
  })

  it('rejects normal deploy target overrides instead of bypassing checked-in config', () => {
    expect(() =>
      buildDeployPlan(
        { siteId: 'browserextensions.io' },
        {
          env: {
            DEPLOY_REPO_URL: 'https://github.com/example/other.git'
          }
        }
      )
    ).toThrow(/Refusing deploy target override/)
  })

  it('requires an explicit audited bypass for deploy target overrides', () => {
    expect(
      buildDeployPlan(
        { siteId: 'browserextensions.io' },
        {
          env: {
            ALLOW_DEPLOY_TARGET_OVERRIDE: 'true',
            DEPLOY_BRANCH: 'emergency',
            DEPLOY_REPO_URL: 'https://github.com/example/other.git'
          }
        }
      )
    ).toMatchObject({
      branch: 'emergency',
      repoUrl: 'https://github.com/example/other.git'
    })
  })

  it('rejects GitHub repo overrides for Cloudflare Pages deploy targets', () => {
    expect(() =>
      buildDeployPlan(
        { siteId: 'serp.ai' },
        {
          env: {
            ALLOW_DEPLOY_TARGET_OVERRIDE: 'true',
            DEPLOY_REPO_URL: 'https://github.com/example/other.git'
          }
        }
      )
    ).toThrow(/DEPLOY_REPO_URL is not supported/)
  })

  it('enables GitHub Pages in the target deploy workflow', () => {
    const workflowSource = readFileSync(
      resolve(process.cwd(), 'scripts/templates/target-pages-deploy.yml'),
      'utf8'
    )

    expect(workflowSource).toContain('uses: actions/configure-pages@v5')
    expect(workflowSource).toContain('enablement: true')
  })
})

describe('deploy source guard', () => {
  it('allows dry-run deploy plan inspection without a built artifact', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    expect(() => runDeploySite({ siteId: 'browserextensions.io' }, true)).not.toThrow()

    expect(log).toHaveBeenCalledWith(expect.stringContaining('"siteId": "browserextensions.io"'))
  })

  it('allows real deploys from a clean branch synced with upstream', () => {
    expect(() => assertDeploySourceStateAllowsPush(deploySourceState(), {})).not.toThrow()
  })

  it('refuses real deploys when the source worktree is dirty', () => {
    expect(() =>
      assertDeploySourceStateAllowsPush(deploySourceState({ isDirty: true }), {})
    ).toThrow(/uncommitted or untracked changes/)
  })

  it('refuses real deploys when the branch has no upstream', () => {
    expect(() =>
      assertDeploySourceStateAllowsPush(
        deploySourceState({ branch: 'feature/sitemap-fix', upstream: null }),
        {}
      )
    ).toThrow(/has no upstream tracking branch/)
  })

  it('refuses real deploys when source commits have not been pushed', () => {
    expect(() => assertDeploySourceStateAllowsPush(deploySourceState({ ahead: 2 }), {})).toThrow(
      /2 commit\(s\) ahead of origin\/main/
    )
  })

  it('refuses real deploys when the local branch is behind upstream', () => {
    expect(() => assertDeploySourceStateAllowsPush(deploySourceState({ behind: 1 }), {})).toThrow(
      /1 commit\(s\) behind origin\/main/
    )
  })

  it('refuses real deploys when the local branch has diverged from upstream', () => {
    expect(() =>
      assertDeploySourceStateAllowsPush(deploySourceState({ ahead: 1, behind: 3 }), {})
    ).toThrow(/1 commit\(s\) ahead and 3 commit\(s\) behind origin\/main/)
  })

  it('allows GitHub Actions to deploy the checked-out source commit', () => {
    expect(() =>
      assertDeploySourceStateAllowsPush(
        deploySourceState({
          ahead: 2,
          behind: 1,
          isDirty: true,
          upstream: null
        }),
        {
          GITHUB_ACTIONS: 'true',
          GITHUB_SHA: '9c3f6d5'
        }
      )
    ).not.toThrow()
  })
})

describe('deploy guardrail docs', () => {
  it('documents real deploy commands as git push operations in AGENTS.md', () => {
    const source = readFileSync(resolve(process.cwd(), 'AGENTS.md'), 'utf8')

    expect(source).toContain('pnpm deploy:site')
    expect(source).toContain('git push operations')
    expect(source).toContain('branch, commit, push, review/merge')
  })

  it('keeps the deploy runbook on the source-first gitflow path', () => {
    const source = readFileSync(resolve(process.cwd(), 'docs/DEPLOY_RUNBOOK.md'), 'utf8')

    expect(source).toContain('Local verification flow')
    expect(source).toContain('deploy:site -- --site <site-id> --dry-run')
    expect(source).toContain('Do not run a real local deploy while source changes are uncommitted')
    expect(source).toContain('let `.github/workflows/build-and-deploy.yml` deploy')
  })
})
