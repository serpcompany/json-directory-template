import { buildSubmissionIssueUrl } from '@/lib/github-issue'
import { siteConfig } from '@/lib/site-config'

describe('buildSubmissionIssueUrl', () => {
  it('builds a prefilled GitHub issue URL with the required submission fields', () => {
    const url = buildSubmissionIssueUrl({
      category: 'developer-tools',
      description: 'A fast test project',
      llmsUrl: 'https://example.com/llms.txt',
      name: 'Example Project',
      website: 'https://example.com'
    })

    const parsedUrl = new URL(url)

    expect(parsedUrl.origin).toBe('https://github.com')
    expect(parsedUrl.pathname).toBe(
      `/${siteConfig.githubIssueOwner}/${siteConfig.githubIssueRepo}/issues/new`
    )
    expect(parsedUrl.searchParams.get('template')).toBe('submit-website.yml')
    expect(parsedUrl.searchParams.get('title')).toBe('Submit website: Example Project')

    const body = parsedUrl.searchParams.get('body')
    expect(body).toContain('## Website details')
    expect(body).toContain('Name: Example Project')
    expect(body).toContain('Website: https://example.com')
    expect(body).toContain('llms.txt URL: https://example.com/llms.txt')
    expect(body).toContain('Category: developer-tools')
  })

  it('omits optional fields when they are blank', () => {
    const url = buildSubmissionIssueUrl({
      category: 'ai-ml',
      description: 'Short description',
      llmsFullUrl: '',
      llmsUrl: 'https://example.com/llms.txt',
      name: 'Example Project',
      notes: '',
      website: 'https://example.com'
    })

    const parsedUrl = new URL(url)
    const body = parsedUrl.searchParams.get('body')

    expect(body).not.toContain('llms-full URL:')
    expect(body).not.toContain('Additional notes:')
  })
})
