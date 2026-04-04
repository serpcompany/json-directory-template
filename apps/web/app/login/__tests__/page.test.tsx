import { render, screen } from '@/test/test-utils'

const mockNotFound = jest.fn()
const mockSiteConfig = {
  docsRouteBasePath: 'docs',
  features: {
    showAuth: true
  },
  listingRouteBasePath: 'listing',
  networkRouteBasePath: 'network'
}

jest.mock('@/lib/site-config', () => ({
  getTwitterHandleFromUrl: jest.fn(() => '@serpcompany'),
  siteConfig: mockSiteConfig
}))

jest.mock('@/lib/auth', () => ({
  getSafeCallbackUrl: (value?: string) => value ?? '/account',
  getSession: jest.fn(async () => null),
  isGitHubAuthConfigured: jest.fn(() => true)
}))

jest.mock('@/components/auth/github-sign-in-button', () => ({
  GitHubSignInButton: ({ disabled }: { disabled?: boolean }) => (
    <button type="button" disabled={disabled}>
      Continue with GitHub
    </button>
  )
}))

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
  redirect: jest.fn()
}))

describe('LoginPage', () => {
  beforeEach(() => {
    mockSiteConfig.features.showAuth = true
    mockNotFound.mockReset()
  })

  it('blocks the route when auth is disabled for the site', async () => {
    mockSiteConfig.features.showAuth = false

    const { default: LoginPage } = await import('@/app/login/page')

    await LoginPage({
      searchParams: Promise.resolve({})
    })

    expect(mockNotFound).toHaveBeenCalled()
  })

  it('renders the GitHub auth call to action when auth is enabled', async () => {
    const { default: LoginPage } = await import('@/app/login/page')

    const page = await LoginPage({
      searchParams: Promise.resolve({})
    })

    render(page)

    expect(screen.getByRole('heading', { level: 1, name: /sign up \/ sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with github/i })).toBeInTheDocument()
  })
})
