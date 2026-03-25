import { render, screen } from '@/test/test-utils'
import { ProjectNavigation } from '@/components/project-navigation'

jest.mock('@/components/ui/favicon-with-fallback', () => ({
  FaviconWithFallback: ({
    logoUrl,
    name
  }: {
    logoUrl?: string
    name: string
  }) => (
    <div
      data-testid={`favicon-${name}`}
      data-logo-url={logoUrl || ''}
      data-name={name}
    />
  )
}))

describe('ProjectNavigation', () => {
  it('passes previous and next listing logos to the shared favicon renderer', () => {
    render(
      <ProjectNavigation
        previousWebsite={{
          media: { logo: 'https://cdn.example.com/previous-logo.png' },
          name: 'Previous Product',
          slug: 'previous-product',
          website: 'https://previous.example.com'
        }}
        nextWebsite={{
          media: { logo: 'https://cdn.example.com/next-logo.png' },
          name: 'Next Product',
          slug: 'next-product',
          website: 'https://next.example.com'
        }}
      />
    )

    expect(screen.getByTestId('favicon-Previous Product')).toHaveAttribute(
      'data-logo-url',
      'https://cdn.example.com/previous-logo.png'
    )
    expect(screen.getByTestId('favicon-Next Product')).toHaveAttribute(
      'data-logo-url',
      'https://cdn.example.com/next-logo.png'
    )
  })
})
