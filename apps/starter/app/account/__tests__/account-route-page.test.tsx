import { render, screen } from '@/test/test-utils'
import { AccountPageRoute } from '@thedaviddias/web-core/account-page'

describe('AccountPageRoute', () => {
  it('renders the static export fallback without app auth wiring', () => {
    render(<AccountPageRoute isStaticExportBuild />)

    expect(screen.getByRole('heading', { name: /unavailable in static demo/i })).toBeInTheDocument()
    expect(
      screen.getByText(/github account pages are disabled for the github pages build/i)
    ).toBeInTheDocument()
  })

  it('renders the signed-in user summary from app-provided session state', () => {
    render(
      <AccountPageRoute
        user={{
          email: 'ada@example.com',
          image: 'https://example.com/ada.png',
          name: 'Ada Lovelace',
        }}
      />
    )

    expect(screen.getByRole('heading', { name: /ada lovelace/i })).toBeInTheDocument()
    expect(screen.getByText('ada@example.com')).toBeInTheDocument()
  })
})
