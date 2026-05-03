import { render, screen } from '@/test/test-utils'

const mockSiteConfig = {
  branding: {
    appleTouchIconUrl: 'https://example.com/apple-touch-icon.png',
    faviconUrl: 'https://example.com/favicon.ico',
    logoUrl: 'https://example.com/logo.png',
    ogImageUrl: 'https://example.com/opengraph-image.png',
  },
  copy: {
    listingName: {
      plural: 'listings',
      singular: 'listing',
    },
    networkLabel: 'Network',
    submitLabel: 'Submit a Listing',
  },
  brandsRouteBasePath: 'brands',
  description: 'Curated directory of listings and resources.',
  docsRouteBasePath: 'docs',
  features: {
    showProjects: true,
  },
  githubRepoUrl: 'https://github.com/serpcompany/json-directory-template',
  githubIssuesUrl: 'https://github.com/serpcompany/json-directory-template/issues',
  githubUrl: 'https://github.com/serpcompany',
  listingRouteBasePath: 'listing',
  name: 'Directory Starter',
  networkRouteBasePath: 'network',
  publicUrl: 'https://example.com',
  site: 'Directory Starter',
  tagline: 'Discover listings and resources',
  twitterUrl: 'https://x.com/serpcompany',
}

jest.mock('@thedaviddias/web-core/site-config', () => ({
  getTwitterHandleFromUrl: jest.fn(() => '@serpcompany'),
  hasConfiguredPublicSocialLinks: jest.fn(() => true),
  siteConfig: mockSiteConfig,
}))

jest.mock('@thedaviddias/design-system/breadcrumb', () => ({
  Breadcrumb: () => <nav aria-label="breadcrumb" />,
}))

describe('ProjectsPageRoute', () => {
  it('uses the configured public network metadata', async () => {
    const { generateProjectsPageMetadata } = await import('@thedaviddias/web-core/projects-page')
    const metadata = generateProjectsPageMetadata()

    expect(metadata.title).toBe(mockSiteConfig.copy.networkLabel)
    expect(metadata.description).toBe(
      `Explore related brands, repositories, partners, and contribution links for ${mockSiteConfig.name}.`
    )
  })

  it('renders listing-neutral network copy and links', async () => {
    const { ProjectsPageRoute } = await import('@thedaviddias/web-core/projects-page')

    render(<ProjectsPageRoute />)

    expect(
      screen.getByRole('heading', {
        name: new RegExp(`^${mockSiteConfig.copy.networkLabel}$`, 'i'),
      })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/browse linked brands, repositories, partner sites, and related resources/i)
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /submit a listing/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /have a listing to submit/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view repository/i })).toHaveAttribute(
      'href',
      mockSiteConfig.githubRepoUrl
    )
  })
})
