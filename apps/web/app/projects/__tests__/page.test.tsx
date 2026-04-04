import { render, screen } from '@/test/test-utils'

const mockNotFound = jest.fn()
const mockSiteConfig = {
  copy: {
    listingName: {
      plural: 'listings',
      singular: 'listing'
    },
    networkLabel: 'Network',
    submitLabel: 'Submit a Listing'
  },
  docsRouteBasePath: 'docs',
  features: {
    showProjects: true
  },
  githubRepoUrl: 'https://github.com/serpcompany/json-directory-template',
  listingRouteBasePath: 'listing',
  name: 'Directory Starter',
  networkRouteBasePath: 'network',
  publicUrl: 'https://example.com',
  site: 'Directory Starter',
  tagline: 'Discover listings and resources',
  twitterUrl: 'https://x.com/serpcompany',
  description: 'Curated directory of listings and resources.'
}

jest.mock('@/lib/site-config', () => ({
  getTwitterHandleFromUrl: jest.fn(() => '@serpcompany'),
  siteConfig: mockSiteConfig
}))

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound()
}))

jest.mock('@thedaviddias/design-system/breadcrumb', () => ({
  Breadcrumb: () => <nav aria-label="breadcrumb" />
}))

describe('ProjectsPage', () => {
  beforeEach(() => {
    mockSiteConfig.features.showProjects = true
    mockNotFound.mockReset()
  })

  it('blocks the route when network/projects is disabled for the site', async () => {
    mockSiteConfig.features.showProjects = false

    const { default: ProjectsPage } = await import('@/app/projects/page')

    ProjectsPage()

    expect(mockNotFound).toHaveBeenCalled()
  })

  it('uses the configured public network metadata instead of the old projects copy', async () => {
    const { generateMetadata } = await import('@/app/projects/page')
    const metadata = generateMetadata()

    expect(metadata.title).toBe(mockSiteConfig.copy.networkLabel)
    expect(metadata.description).toBe(
      `Explore related brands, repositories, partners, and contribution links for ${mockSiteConfig.name}.`
    )
  })

  it('renders listing-neutral network copy for the public route when enabled', async () => {
    const { default: ProjectsPage } = await import('@/app/projects/page')

    render(<ProjectsPage />)

    expect(
      screen.getByRole('heading', { name: new RegExp(`^${mockSiteConfig.copy.networkLabel}$`, 'i') })
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

  it('uses not-found metadata when network/projects is disabled', async () => {
    mockSiteConfig.features.showProjects = false

    const { generateMetadata } = await import('@/app/projects/page')
    const metadata = generateMetadata()

    expect(metadata.title).toBe('Page Not Found')
    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false
    })
  })
})
