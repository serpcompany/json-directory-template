import { afterEach, describe, expect, it, vi } from 'vitest'

describe('buildBadgeSubmissionInstructions', () => {
  afterEach(() => {
    delete process.env.SITE_ID
    delete process.env.NEXT_PUBLIC_SITE_ID
    vi.resetModules()
  })

  it('builds serp.co badge snippets before opening the GitHub issue', async () => {
    process.env.SITE_ID = 'serp.co'
    vi.resetModules()

    const { buildBadgeSubmissionInstructions } = await import('./github-issue-submit-form')
    const instructions = buildBadgeSubmissionInstructions({
      githubIssueUrl: 'https://github.com/serpcompany/serp.co/issues/new?title=Submit',
      name: 'SERP AI',
      website: 'https://www.serp.ai/'
    })

    expect(instructions.githubIssueUrl).toBe(
      'https://github.com/serpcompany/serp.co/issues/new?title=Submit'
    )
    expect(instructions.listingUrl).toBe('https://serp.co/products/serp.ai/reviews/')
    expect(instructions.badgePreviewPaths.light).toBe('/badge/featured-on-serp.co-light.svg')
    expect(instructions.badgePreviewPaths.dark).toBe('/badge/featured-on-serp.co-dark.svg')
    expect(
      instructions.badgeEmbeds.light
    ).toBe(`<a href="https://serp.co/products/serp.ai/reviews/" target="_blank" rel="noopener noreferrer" title="Featured on SERP">
  <img src="https://serp.co/badge/featured-on-serp.co-light.svg" alt="Featured on SERP" width="200" height="50" />
</a>`)
    expect(instructions.badgeEmbeds.dark).toContain(
      'https://serp.co/badge/featured-on-serp.co-dark.svg'
    )
  })
})
