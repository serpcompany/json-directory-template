import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { activeCheckedInSiteIds } from '@thedaviddias/site-contract/active-site-ids'
import yaml from 'js-yaml'
import { describe, expect, it } from 'vitest'
import { runBuildSite } from './build-site.ts'
import { buildDeployPlan } from './deploy-site.ts'
import { loadCheckedInSite } from './site-config.ts'
import { getSitemapTargets } from './submit-gsc-sitemaps.ts'
import { validateSite } from './validate-site.ts'
import { matchesWorkflowPathFilter } from './deploy-trigger-paths.ts'

const retiredSiteIds = ['pornvideodownloaders.com', 'serp.co', 'serp.software'] as const
const activeSiteIds = ['browserextensions.io', 'serp.ai', 'serpdownloaders.com'] as const

function read(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

describe('retired legacy sites', () => {
  it('keeps the active legacy registry limited to supported static targets', () => {
    expect(activeCheckedInSiteIds).toEqual(activeSiteIds)
  })

  it.each(retiredSiteIds)('has no checked-in app or site tree for %s', siteId => {
    expect(existsSync(resolve(process.cwd(), 'apps', siteId))).toBe(false)
    expect(existsSync(resolve(process.cwd(), 'sites', siteId))).toBe(false)
  })

  it.each(retiredSiteIds)(
    'rejects %s across validate, build, deploy, and GSC entrypoints',
    async siteId => {
      const message = `Site "${siteId}" was removed from this repo.`

      expect(() => loadCheckedInSite(siteId)).toThrow(message)
      expect(() => validateSite({ siteId })).toThrow(message)
      await expect(runBuildSite({ siteId })).rejects.toThrow(message)
      expect(() => buildDeployPlan({ siteId })).toThrow(message)
      expect(() => getSitemapTargets([siteId])).toThrow(message)
    }
  )

  it('offers only supported targets in manual deployment dispatch', () => {
    const workflow = yaml.load(read('.github/workflows/build-and-deploy.yml')) as {
      on: {
        workflow_dispatch: {
          inputs: {
            site_id: {
              description: string
              options: string[]
              required: boolean
              type: string
            }
          }
        }
      }
    }

    expect(workflow.on.workflow_dispatch.inputs.site_id).toEqual({
      description: 'Checked-in site config id',
      options: ['all', ...activeSiteIds],
      required: true,
      type: 'choice'
    })
  })

  it('does not trigger a static deployment for deletion of retired site trees', () => {
    const workflow = yaml.load(read('.github/workflows/build-and-deploy.yml')) as {
      on: { push: { paths: string[] } }
    }

    // The push filter lists only active site directories, so retired trees never match it.
    for (const siteId of retiredSiteIds) {
      for (const path of [`sites/${siteId}/products.json`, `apps/${siteId}/app/page.tsx`]) {
        expect(matchesWorkflowPathFilter(path, workflow.on.push.paths), path).toBe(false)
      }
    }
  })

  it('can explicitly skip the cleanup merge even when shared registries changed', () => {
    const workflow = yaml.load(read('.github/workflows/build-and-deploy.yml')) as {
      jobs: { resolve: { if: string } }
    }

    expect(workflow.jobs.resolve.if).toContain("'[skip static deploy]'")
  })

  it('keeps retired repositories out of current workflow and badge authority', () => {
    const operationalSources = [
      '.github/workflows/reusable-verify-badge.yml',
      '.github/workflows/submit-gsc-sitemaps.yml',
      '.github/workflows/update-listings-json.yml',
      'scripts/featured-badge-approved-r2-assets.json',
      'scripts/r2-featured-badge-assets.json'
    ]

    for (const sourcePath of operationalSources) {
      const source = read(sourcePath)

      for (const retiredSiteId of retiredSiteIds) {
        expect(source, `${sourcePath} must not authorize ${retiredSiteId}`).not.toContain(
          retiredSiteId
        )
      }
    }

    const reusableBadgeWorkflow = read('.github/workflows/reusable-verify-badge.yml')
    for (const activeSiteId of activeSiteIds) {
      expect(reusableBadgeWorkflow).toContain(`'${activeSiteId}'`)
    }
  })
})
