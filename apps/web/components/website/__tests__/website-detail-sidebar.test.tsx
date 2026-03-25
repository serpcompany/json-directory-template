import { render, screen } from '@/test/test-utils';
import { WebsiteDetailSidebar } from '@/components/website/website-detail-sidebar';
import type { WebsiteMetadata } from '@/lib/content-loader';

const website: WebsiteMetadata = {
  category: 'video-downloaders',
  categories: ['video-downloaders', 'developer-tools'],
  description: 'Test website description',
  name: 'Example Product',
  publishedAt: '2026-03-24',
  slug: 'example-product',
  website: 'https://example.com',
};

describe('WebsiteDetailSidebar', () => {
  it('renders links for the primary and secondary categories', () => {
    render(<WebsiteDetailSidebar website={website} />);

    expect(screen.getByText(/^Categories$/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Video Downloaders' })
    ).toHaveAttribute('href', '/categories/video-downloaders');
    expect(
      screen.getByRole('link', { name: 'Developer Tools' })
    ).toHaveAttribute('href', '/categories/developer-tools');
  });
});
