import { render, screen } from '@/test/test-utils';
import { Footer } from '@/components/layout/footer';
import { getRoute } from '@/lib/routes';
import { siteCopy } from '@/lib/site-copy';
import { siteConfig } from '@/lib/site-config';

jest.mock('@/components/mode-toggle', () => ({
  ModeToggle: () => <button type="button">Toggle theme</button>,
}));

describe('Footer', () => {
  it('renders the current site config values', () => {
    render(<Footer />);

    expect(screen.getByText(siteConfig.name)).toBeInTheDocument();
    expect(screen.getByText(siteConfig.tagline)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /GitHub/ })).toHaveAttribute(
      'href',
      siteConfig.githubUrl
    );
    expect(screen.getByRole('link', { name: /Reddit/ })).toHaveAttribute(
      'href',
      siteConfig.redditUrl
    );
    expect(screen.getByRole('link', { name: /X.*Twitter/ })).toHaveAttribute(
      'href',
      siteConfig.twitterUrl
    );

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
