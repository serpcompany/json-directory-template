import { resolveSiteConfig } from '@/lib/site-config'

describe('resolveSiteConfig', () => {
  it('prefers environment overrides for deploy-specific branding', () => {
    const config = resolveSiteConfig({
      SITE_DESCRIPTION: 'A focused downloader directory.',
      SITE_DOMAIN: 'serpdownloaders.com',
      SITE_GITHUB_ISSUE_OWNER: 'serpcompany',
      SITE_GITHUB_ISSUE_REPO: 'json-directory-template',
      SITE_GITHUB_ISSUES_URL: 'https://github.com/serpcompany/json-directory-template/issues',
      SITE_GITHUB_REPO_URL: 'https://github.com/serpcompany/json-directory-template',
      SITE_GITHUB_URL: 'https://github.com/serpcompany',
      SITE_NAME: 'SERP Downloaders',
      SITE_REDDIT_URL: 'https://reddit.com/r/serp',
      SITE_TAGLINE: 'Download-focused product directory',
      SITE_TWITTER_URL: 'https://x.com/serpcompany'
    })

    expect(config.name).toBe('SERP Downloaders')
    expect(config.domain).toBe('serpdownloaders.com')
    expect(config.description).toBe('A focused downloader directory.')
    expect(config.githubIssueOwner).toBe('serpcompany')
    expect(config.githubIssueRepo).toBe('json-directory-template')
    expect(config.githubIssuesUrl).toBe(
      'https://github.com/serpcompany/json-directory-template/issues'
    )
  })
})
