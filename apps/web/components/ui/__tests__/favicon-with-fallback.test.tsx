import { fireEvent, render, screen } from '@/test/test-utils';
import { LISTING_LOGO_FALLBACK_PATH } from '@/lib/listing-logo-presentation';
import { FaviconWithFallback } from '@thedaviddias/web-core/ui/favicon-with-fallback';

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

  it('uses remote logo urls even when they do not end with .png', () => {
    render(
      <FaviconWithFallback
        website="https://example.com"
        name="Example Project"
        logoUrl="https://imagedelivery.net/example/logo/public"
      />
    );

    expect(
      screen.getByRole('img', { name: 'Example Project logo' })
    ).toHaveAttribute('src', 'https://imagedelivery.net/example/logo/public');
  });

  it('falls back to the serp logo when no logo is provided', () => {
    render(
      <FaviconWithFallback
        website="https://example.com"
        name="Example Project"
      />
    );

    expect(
      screen.getByRole('img', { name: 'Example Project favicon' })
    ).toHaveAttribute('src', expect.stringContaining('example.com'));
  });

  it('uses the site favicon when the provided local asset is not a supported image type', () => {
    render(
      <FaviconWithFallback
        website="https://example.com"
        name="Example Project"
        logoUrl="/listing-logos/serpdownloaders.com/example-project.ico"
      />
    );

    expect(
      screen.getByRole('img', { name: 'Example Project favicon' })
    ).toHaveAttribute('src', expect.stringContaining('example.com'));
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
      screen.getByRole('img', { name: 'Example Project favicon' })
    ).toHaveAttribute('src', expect.stringContaining('example.com'));
  });

  it('falls back to the neutral placeholder when the logo and favicon both fail', () => {
    render(
      <FaviconWithFallback
        website="https://example.com"
        name="Example Project"
        logoUrl="https://cdn.example.com/logo.png"
      />
    );

    fireEvent.error(screen.getByRole('img', { name: 'Example Project logo' }));
    fireEvent.error(screen.getByRole('img', { name: 'Example Project favicon' }));

    expect(
      screen.getByRole('img', { name: 'Example Project fallback logo' })
    ).toHaveAttribute('src', LISTING_LOGO_FALLBACK_PATH);
  });
});
