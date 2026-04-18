import { render, screen } from '@/test/test-utils'
import { HeroSection } from '@/components/sections/hero-section'
import { siteConfig } from '@thedaviddias/web-core/site-config'

jest.mock('@/lib/content-loader', () => ({
  getWebsites: jest.fn(async () => new Array(42).fill(null))
}))

jest.mock('@/components/ui/animated-background', () => ({
  AnimatedBackground: () => <div data-testid="animated-background" />
}))

describe('HeroSection', () => {
  it('renders the configured site name with generic directory copy', async () => {
    render(await HeroSection())

    expect(screen.getByRole('heading', { name: siteConfig.name })).toBeInTheDocument()
    expect(screen.getByText(new RegExp(siteConfig.tagline, 'i'))).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText(/listings in directory/i)).toBeInTheDocument()
    expect(screen.getByText(/resources, and documentation links/i)).toBeInTheDocument()
    expect(screen.queryByText(/tools, and documentation links/i)).not.toBeInTheDocument()
    expect(screen.getByText(/searchable directory/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /submit a listing/i })).toBeInTheDocument()
  })
})
