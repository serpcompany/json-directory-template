import { render, screen, waitFor } from '@/test/test-utils'

let mockToken = ''

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(mockToken ? `token=${mockToken}` : ''),
}))

jest.mock('@thedaviddias/web-core/verify/badge-preview', () => ({
  BadgePreview: ({ siteId, theme }: { siteId: string; theme: string }) => (
    <div data-testid="badge-preview">{`${siteId}:${theme}`}</div>
  ),
}))

jest.mock('@thedaviddias/web-core/verify/copy-snippet', () => ({
  CopySnippet: ({ siteName, token }: { siteName: string; token: string }) => (
    <div data-testid="copy-snippet">{`${siteName}:${token}`}</div>
  ),
}))

jest.mock('@thedaviddias/web-core/verify/verify-button', () => ({
  VerifyButton: ({
    token,
    verifyEndpoint,
  }: {
    token: string
    verifyEndpoint: string
  }) => (
    <button type="button">Verify {`${token}:${verifyEndpoint}`}</button>
  ),
}))

jest.mock('@thedaviddias/web-core/site-config', () => ({
  siteConfig: {
    id: 'directory-starter',
    name: 'Directory Starter',
  },
}))

describe('SubmitVerifyPageRoute', () => {
  beforeEach(() => {
    mockToken = ''
    global.fetch = jest.fn()
  })

  it('renders a not-found state when the token query param is missing', async () => {
    const { SubmitVerifyPageRoute } = await import(
      '@thedaviddias/web-core/verify/submit-verify-page'
    )

    render(
      <SubmitVerifyPageRoute
        submissionEndpoint="/api/submission"
        verifyEndpoint="/api/verify-badge"
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /submission not found/i })).toBeInTheDocument()
    })
  })

  it('loads the submission and renders the verification instructions', async () => {
    mockToken = 'example-token'
    jest.mocked(global.fetch).mockResolvedValue({
      json: async () => ({
        name: 'Example Listing',
        website: 'https://example.com',
      }),
      ok: true,
      status: 200,
    } as Response)

    const { SubmitVerifyPageRoute } = await import(
      '@thedaviddias/web-core/verify/submit-verify-page'
    )

    render(
      <SubmitVerifyPageRoute
        submissionEndpoint="/api/submission"
        verifyEndpoint="/api/verify-badge"
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /verify & publish/i })).toBeInTheDocument()
    })
    expect(screen.getByText(/verifying/i)).toHaveTextContent('Example Listing')
    expect(screen.getByTestId('badge-preview')).toHaveTextContent('directory-starter:light')
    expect(screen.getByTestId('copy-snippet')).toHaveTextContent('Directory Starter:example-token')
    expect(global.fetch).toHaveBeenCalledWith('/api/submission?token=example-token')
    expect(
      screen.getByRole('button', {
        name: /verify example-token:\/api\/verify-badge/i,
      })
    ).toBeInTheDocument()
  })
})

describe('SubmitVerifyPage app wrapper', () => {
  beforeEach(() => {
    mockToken = ''
    global.fetch = jest.fn()
  })

  it('wraps the client verify route so the page can prerender', async () => {
    const { default: SubmitVerifyPage } = await import('@/app/submit/verify/page')

    render(<SubmitVerifyPage />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /submission not found/i })).toBeInTheDocument()
    })
  })
})
