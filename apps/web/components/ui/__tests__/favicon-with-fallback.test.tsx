import { fireEvent, render, screen } from '@/test/test-utils';
import { FaviconWithFallback } from '@/components/ui/favicon-with-fallback';
import { LISTING_LOGO_FALLBACK_PATH } from '@/lib/listing-logo-presentation';

describe('FaviconWithFallback', () => {
  it('uses the listing logo when one is provided', () => {
    render(
      <FaviconWithFallback
        website="https://example.com"
        name="Example Project"
        logoUrl="https://cdn.example.com/logo.png"
      />
    );

    expect(
      screen.getByRole('img', { name: 'Example Project logo' })
    ).toHaveAttribute('src', 'https://cdn.example.com/logo.png');
  });

  it('falls back to the serp logo when no logo is provided', () => {
    render(
      <FaviconWithFallback
        website="https://example.com"
        name="Example Project"
      />
    );

    expect(
      screen.getByRole('img', { name: 'Example Project fallback logo' })
    ).toHaveAttribute('src', LISTING_LOGO_FALLBACK_PATH);
  });

  it('renders the serp fallback logo when the provided logo is not a png', () => {
    render(
      <FaviconWithFallback
        website="https://example.com"
        name="Example Project"
        logoUrl="/listing-logos/serpdownloaders.com/example-project.ico"
      />
    );

    expect(
      screen.getByRole('img', { name: 'Example Project fallback logo' })
    ).toHaveAttribute('src', LISTING_LOGO_FALLBACK_PATH);
    expect(
      screen.queryByRole('img', { name: 'Example Project logo' })
    ).not.toBeInTheDocument();
  });

  it('shows the serp fallback logo when a png logo fails to load', () => {
    render(
      <FaviconWithFallback
        website="https://example.com"
        name="Example Project"
        logoUrl="https://cdn.example.com/logo.png"
      />
    );

    fireEvent.error(screen.getByRole('img', { name: 'Example Project logo' }));

    expect(
      screen.getByRole('img', { name: 'Example Project fallback logo' })
    ).toHaveAttribute('src', LISTING_LOGO_FALLBACK_PATH);
  });
});
