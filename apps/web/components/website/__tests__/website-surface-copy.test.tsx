import { render, screen } from '@/test/test-utils';
import { WebsiteRelatedProjects } from '@/components/website/website-related-projects';
import { WebsiteResourcesSection } from '@/components/website/website-resources-section';

jest.mock('@/components/ui/favorite-button', () => ({
  FavoriteButton: () => <div data-testid="favorite-button" />,
}));

const sampleWebsite = {
  slug: 'example-project',
  name: 'Example Project',
  description: 'A test directory entry',
  resourceLinks: [
    {
      label: 'Support Docs',
      url: 'https://example.com/docs',
    },
  ],
  website: 'https://example.com',
  category: 'developer-tools',
  publishedAt: '2026-03-22',
};

describe('website surface copy', () => {
  it('uses generic links copy and keeps the supplemental links in the simpler bottom section style', () => {
    render(<WebsiteResourcesSection website={sampleWebsite} />);

    expect(
      screen.getByRole('heading', { name: /^links$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/helpful links for this entry/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /support docs/i })).toHaveAttribute(
      'href',
      'https://example.com/docs'
    );
    expect(screen.queryByText(/example\.com/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /open link/i })
    ).not.toBeInTheDocument();
  });

  it('uses generic related-entry copy on website detail pages', () => {
    render(<WebsiteRelatedProjects websites={[sampleWebsite]} />);

    expect(
      screen.getByRole('heading', { name: /related entries/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/similar entries in the directory/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /browse the directory/i })
    ).toBeInTheDocument();
  });
});
