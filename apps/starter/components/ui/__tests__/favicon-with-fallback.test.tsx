import { LISTING_LOGO_FALLBACK_PATH } from '@thedaviddias/web-core/listing-logo-presentation'
import { FaviconWithFallback } from '@thedaviddias/web-core/ui/favicon-with-fallback'
import { fireEvent, render, screen } from '@/test/test-utils'

describe('FaviconWithFallback', () => {
  it('uses the listing logo when one is provided', () => {
    render(
      <FaviconWithFallback
        website="https://example.com"
        name="Example Project"
        logoUrl="https://cdn.example.com/logo.png"
      />
    )

    expect(screen.getByRole('img', { name: 'Example Project logo' })).toHaveAttribute(
      'src',
      'https://cdn.example.com/logo.png'
    )
  })

  it('uses remote logo urls even when they do not end with .png', () => {
    render(
      <FaviconWithFallback
        website="https://example.com"
        name="Example Project"
        logoUrl="https://imagedelivery.net/example/logo/public"
      />
    )

    expect(screen.getByRole('img', { name: 'Example Project logo' })).toHaveAttribute(
      'src',
      'https://imagedelivery.net/example/logo/public'
    )
  })

  it('falls back to the local listing fallback when no logo is provided', () => {
    render(<FaviconWithFallback website="https://example.com" name="Example Project" />)

    expect(screen.getByRole('img', { name: 'Example Project fallback logo' })).toHaveAttribute(
      'src',
      LISTING_LOGO_FALLBACK_PATH
    )
  })

  it('uses the local listing fallback when the provided local asset is not a supported image type', () => {
    render(
      <FaviconWithFallback
        website="https://example.com"
        name="Example Project"
        logoUrl="/listing-logos/serpdownloaders.com/example-project.ico"
      />
    )

    expect(screen.getByRole('img', { name: 'Example Project fallback logo' })).toHaveAttribute(
      'src',
      LISTING_LOGO_FALLBACK_PATH
    )
    expect(screen.queryByRole('img', { name: 'Example Project logo' })).not.toBeInTheDocument()
  })

  it('shows the local listing fallback logo when a png logo fails to load', () => {
    render(
      <FaviconWithFallback
        website="https://example.com"
        name="Example Project"
        logoUrl="https://cdn.example.com/logo.png"
      />
    )

    fireEvent.error(screen.getByRole('img', { name: 'Example Project logo' }))

    expect(screen.getByRole('img', { name: 'Example Project fallback logo' })).toHaveAttribute(
      'src',
      LISTING_LOGO_FALLBACK_PATH
    )
  })

  it('falls back to the neutral icon when the logo and local fallback both fail', () => {
    render(
      <FaviconWithFallback
        website="https://example.com"
        name="Example Project"
        logoUrl="https://cdn.example.com/logo.png"
      />
    )

    fireEvent.error(screen.getByRole('img', { name: 'Example Project logo' }))
    fireEvent.error(screen.getByRole('img', { name: 'Example Project fallback logo' }))

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
