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
    expect(body).toContain('## Submission visibility')
    expect(body).toContain('public GitHub issue')
    expect(body).toContain('reviewed manually')
    expect(body).toContain('private source repo')
    expect(body).toContain(`## ${siteCopy.listingName.singularTitle} details`)
    expect(body).toContain('Name: Example Project')
    expect(body).toContain(`${siteCopy.listingName.singularTitle} URL: https://example.com`)
    expect(body).toContain('Category: developer-tools')
  })

  it('omits optional fields when they are blank', () => {
    const url = buildSubmissionIssueUrl({
      category: 'ai-ml',
      description: 'Short description',
      faqs: [{ answer: '', question: '' }],
      logoUrl: '',
      name: 'Example Project',
      notes: '',
      resourceLinks: [{ label: '', url: '' }],
      videoUrl: '',
      website: 'https://example.com'
    })

    const parsedUrl = new URL(url)
    const body = parsedUrl.searchParams.get('body')

    expect(body).not.toContain('## Additional notes')
    expect(body).not.toContain('## FAQs')
    expect(body).not.toContain('## Media')
    expect(body).not.toContain('## Resource links')
  })

  it('includes optional media, FAQs, reviewer notes, and resource links', () => {
    const url = buildSubmissionIssueUrl({
      category: 'developer-tools',
      description: 'Short description',
      faqs: [{ question: 'Does it work in Chrome?', answer: 'Yes.' }],
      logoUrl: 'https://example.com/logo.png',
      name: 'Example Project',
      notes: 'Private beta launches next week.',
      resourceLinks: [
        { label: 'Docs', url: 'https://example.com/docs' },
        { label: '', url: '' }
      ],
      videoUrl: 'https://www.youtube.com/watch?v=abc123',
      website: 'https://example.com'
    })

    const body = new URL(url).searchParams.get('body')

    expect(body).toContain('## Media')
    expect(body).toContain('Logo URL: https://example.com/logo.png')
    expect(body).not.toContain('Screenshot URL:')
    expect(body).toContain('Video URL: https://www.youtube.com/watch?v=abc123')
    expect(body).toContain('## Resource links')
    expect(body).toContain('- Docs: https://example.com/docs')
    expect(body).toContain('## FAQs')
    expect(body).toContain('### Does it work in Chrome?')
    expect(body).toContain('Yes.')
    expect(body).toContain('## Additional notes')
    expect(body).toContain('Private beta launches next week.')
  })
})
