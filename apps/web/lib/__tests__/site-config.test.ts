import { resolveSiteConfig } from '@/lib/site-config'

describe('resolveSiteConfig', () => {
  it('prefers environment overrides for deploy-specific branding', () => {
    const config = resolveSiteConfig({
      SITE_SHOW_AUTH: 'false',
      SITE_DESCRIPTION: 'A focused downloader directory.',
      SITE_DOMAIN: 'serpdownloaders.com',
      SITE_GITHUB_ISSUE_OWNER: 'serpcompany',
      SITE_GITHUB_ISSUE_REPO: 'json-directory-template',
      SITE_GITHUB_ISSUES_URL: 'https://github.com/serpcompany/json-directory-template/issues',
      SITE_GITHUB_REPO_URL: 'https://github.com/serpcompany/json-directory-template',
      SITE_GITHUB_URL: 'https://github.com/serpcompany',
      SITE_NAME: 'SERP Downloaders',
      SITE_REDDIT_URL: 'https://reddit.com/r/serp',
      SITE_SHOW_CREATOR_PROJECTS: 'true',
      SITE_SHOW_DOCS: 'false',
      SITE_SHOW_DEVELOPER_TOOLS: 'true',
      SITE_SHOW_FAVORITES: 'false',
      SITE_SHOW_FEATURED_GUIDES: 'false',
      SITE_SHOW_GUIDES: 'true',
      SITE_SHOW_NEWSLETTER: 'false',
      SITE_SHOW_PROJECTS: 'false',
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
    expect(config.features).toEqual({
      showAuth: false,
      showCreatorProjects: true,
      showDocs: false,
      showDeveloperTools: true,
      showFavorites: false,
      showFeaturedGuides: false,
      showGuides: true,
      showNewsletter: false,
      showProjects: false
    })
  })
})
