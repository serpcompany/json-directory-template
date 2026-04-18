import { render, screen } from '@/test/test-utils'
import OperatorOnboardSitePage from '@/app/operator/onboard-site/page'

const mockLoadOperatorOnboardingDocument = jest.fn(() => ({
  listings: [],
  site: {
    defaultCategory: 'developer-tools',
    description: 'Example description',
    docsLabel: 'Docs',
    docsRouteBasePath: 'docs',
    domain: 'example.com',
    featuredCount: 6,
    listingPluralLabel: 'listings',
    listingRouteBasePath: 'listing',
    listingSingularLabel: 'listing',
    name: 'Directory Starter',
    networkLabel: 'Network',
    networkRouteBasePath: 'network',
    publicUrl: 'https://example.com',
    publishedAt: '2026-03-25',
    siteId: 'default',
    submitLabel: 'Submit a Listing',
    tagline: 'Discover listings and resources'
  }
}))

const mockNotFound = jest.fn()

jest.mock('@thedaviddias/site-contract/operator-onboarding-server', () => ({
  loadOperatorOnboardingDocument: (...args: unknown[]) =>
    mockLoadOperatorOnboardingDocument(...args)
}))

jest.mock('@thedaviddias/web-core/site-config', () => ({
  siteConfig: {
    id: 'serpdownloaders.com'
  }
}))

jest.mock('@thedaviddias/web-core/operator/site-onboarding-form', () => ({
  SiteOnboardingForm: () => <div>Mock Site Onboarding Form</div>
}))

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound()
}))

describe('OperatorOnboardSitePage', () => {
  const originalEnv = process.env.ENABLE_OPERATOR_UI

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.ENABLE_OPERATOR_UI
    } else {
      process.env.ENABLE_OPERATOR_UI = originalEnv
    }

    mockNotFound.mockReset()
  })

  it('blocks the route when operator mode is disabled', async () => {
    delete process.env.ENABLE_OPERATOR_UI

    await OperatorOnboardSitePage()

    expect(mockNotFound).toHaveBeenCalled()
  })

  it('renders the operator onboarding surface when operator mode is enabled', async () => {
    process.env.ENABLE_OPERATOR_UI = 'true'

    const page = await OperatorOnboardSitePage()

    render(page)

    expect(screen.getByText('Mock Site Onboarding Form')).toBeInTheDocument()
  })
})
