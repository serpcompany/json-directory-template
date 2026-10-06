import { afterEach, describe, expect, it, vi } from 'vitest'

describe('buildBadgeSubmissionInstructions', () => {
  afterEach(() => {
    delete process.env.SITE_ID
    delete process.env.NEXT_PUBLIC_SITE_ID
    vi.resetModules()
  })

  it('builds suffix-aware badge snippets before opening the GitHub issue', async () => {
    process.env.SITE_ID = 'serp.ai'
    vi.resetModules()

    const { buildBadgeSubmissionInstructions } = await import('./github-issue-submit-form')
    const instructions = buildBadgeSubmissionInstructions({
      githubIssueUrl: 'https://github.com/serpcompany/serp.ai/issues/new?title=Submit',
      name: 'LaunchBuzz',
      website: 'https://www.launchbuzz.io/'
    })

    expect(instructions.githubIssueUrl).toBe(
      'https://github.com/serpcompany/serp.ai/issues/new?title=Submit'
    )
    expect(instructions.listingUrl).toBe('https://serp.ai/products/launchbuzz.io/reviews/')
    expect(instructions.badgePreviewPaths.light).toBe('/badge/featured-on-serp.ai-light.svg')
    expect(instructions.badgePreviewPaths.dark).toBe('/badge/featured-on-serp.ai-dark.svg')
    expect(
      instructions.badgeEmbeds.light
    ).toBe(`<a href="https://serp.ai/products/launchbuzz.io/reviews/" target="_blank" rel="noopener noreferrer" title="Featured on SERP AI">
  <img src="https://serp.ai/badge/featured-on-serp.ai-light.svg" alt="Featured on SERP AI" width="200" height="50" />
</a>`)
    expect(instructions.badgeEmbeds.dark).toContain(
      'https://serp.ai/badge/featured-on-serp.ai-dark.svg'
    )
  })
})
