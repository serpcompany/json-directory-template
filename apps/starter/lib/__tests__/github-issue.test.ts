import { buildSubmissionIssueUrl } from '@thedaviddias/web-core/github-issue'
import { siteConfig } from '@thedaviddias/web-core/site-config'
import { siteCopy } from '@thedaviddias/web-core/site-copy'

describe('buildSubmissionIssueUrl', () => {
  it('builds a prefilled GitHub issue URL with the required submission fields', () => {
    const url = buildSubmissionIssueUrl({
      category: 'developer-tools',
      description: 'A fast test project',
      name: 'Example Project',
      website: 'https://example.com'
    })

    const parsedUrl = new URL(url)

    expect(parsedUrl.origin).toBe('https://github.com')
    expect(parsedUrl.pathname).toBe(
      `/${siteConfig.githubIssueOwner}/${siteConfig.githubIssueRepo}/issues/new`
    )
    expect(parsedUrl.searchParams.get('template')).toBeNull()
    expect(parsedUrl.searchParams.get('title')).toBe(
      `Submit ${siteCopy.listingName.singularTitle}: Example Project`
    )

    const body = parsedUrl.searchParams.get('body')
    expect(body).toContain(`## ${siteCopy.listingName.singularTitle} details`)
    expect(body).toContain('Name: Example Project')
    expect(body).toContain(`${siteCopy.listingName.singularTitle} URL: https://example.com`)
    expect(body).toContain('Category: developer-tools')
  })

  it('omits optional fields when they are blank', () => {
    const url = buildSubmissionIssueUrl({
      category: 'ai-ml',
      description: 'Short description',
      name: 'Example Project',
      notes: '',
      website: 'https://example.com'
    })

    const parsedUrl = new URL(url)
    const body = parsedUrl.searchParams.get('body')

    expect(body).not.toContain('Additional notes:')
  })
})
