import { render, screen } from '@/test/test-utils';
import { Footer } from '@thedaviddias/web-core/layout/footer';
import { getRoute } from '@thedaviddias/web-core/routes';
import { siteCopy } from '@thedaviddias/web-core/site-copy';
import { siteConfig } from '@thedaviddias/web-core/site-config';

jest.mock('@thedaviddias/web-core/mode-toggle', () => ({
  ModeToggle: () => <button type="button">Toggle theme</button>,
}));

describe('Footer', () => {
  it('renders the current site config values', () => {
    render(<Footer />);

    expect(screen.getByText(siteConfig.name)).toBeInTheDocument();
    expect(screen.getByText(siteConfig.tagline)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /GitHub/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Reddit/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /X.*Twitter/ })).not.toBeInTheDocument();

    expect(
      screen.queryByRole('link', { name: /all listings/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: siteCopy.submitLabel })
    ).toHaveAttribute('href', '/submit');

    if (siteConfig.features.showProjects) {
      expect(
        screen.getByRole('link', { name: siteCopy.networkLabel })
      ).toHaveAttribute('href', '/network');
    } else {
      expect(
        screen.queryByRole('link', { name: siteCopy.networkLabel })
      ).not.toBeInTheDocument();
    }

    if (siteConfig.features.showDocs) {
      expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute(
        'href',
        '/docs'
      );
    } else {
      expect(
        screen.queryByRole('link', { name: 'Docs' })
      ).not.toBeInTheDocument();
    }

    if (siteConfig.features.showGuides) {
      expect(screen.getByRole('link', { name: 'Posts' })).toHaveAttribute(
        'href',
        '/posts'
      );
    } else {
      expect(
        screen.queryByRole('link', { name: 'Posts' })
      ).not.toBeInTheDocument();
    }

    expect(
      screen.queryByRole('link', { name: 'Advertise' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Brands' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute(
      'href',
      '/about'
    );
    expect(screen.queryByRole('link', { name: 'FAQ' })).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Privacy Policy' })
    ).toHaveAttribute('href', getRoute('privacy'));
    expect(
      screen.getByRole('link', { name: 'Terms of Service' })
    ).toHaveAttribute('href', getRoute('terms'));
    expect(
      screen.getByRole('link', { name: 'Affiliate Disclosure' })
    ).toHaveAttribute('href', getRoute('affiliateDisclosure'));
    expect(screen.getByRole('link', { name: 'DMCA' })).toHaveAttribute(
      'href',
      getRoute('dmca')
    );
    expect(
      screen.queryByRole('link', { name: 'Cookies' })
    ).not.toBeInTheDocument();
  });
});
