import { render, screen } from '@testing-library/react';
import { WebsiteContentSectionRoute as WebsiteContentSection } from '@thedaviddias/web-core/website/website-content-section-route';
import type { WebsiteMetadata } from '@/lib/content-loader';

jest.mock('next-mdx-remote/rsc', () => ({
  MDXRemote: ({ source }: { source: string }) => (
    <div data-testid="mdx-content">{source}</div>
  ),
}));

jest.mock('remark-gfm', () => jest.fn());

const baseWebsite: WebsiteMetadata = {
  category: 'developer-tools',
  categories: ['developer-tools'],
  description: 'Useful developer tooling.',
  name: 'Example Project',
  publishedAt: '2026-03-22',
  slug: 'example-project',
  website: 'https://example.com',
};

describe('WebsiteContentSection', () => {
  it('renders the provided long-form content when it exists', () => {
    render(
      <WebsiteContentSection
        website={{
          ...baseWebsite,
          content: '## Overview\n\nThis came from data/listings.json.',
        }}
      />
    );

    expect(screen.getByTestId('mdx-content')).toHaveTextContent(
      '## Overview This came from data/listings.json.'
    );
    expect(screen.queryByText('About Example Project')).not.toBeInTheDocument();
  });

  it('renders the first media image as the featured image when available', () => {
    render(
      <WebsiteContentSection
        website={{
          ...baseWebsite,
          media: {
            images: ['https://cdn.example.com/featured-image.png'],
          },
        }}
      />
    );

    expect(
      screen.getByRole('img', { name: 'Example Project featured image' })
    ).toHaveAttribute('src', 'https://cdn.example.com/featured-image.png');
  });

  it('strips the duplicate markdown links section when supplemental resource links are present', () => {
    render(
      <WebsiteContentSection
        website={{
          ...baseWebsite,
          content: `## Overview

This came from data/listings.json.

## Links

- Product page: https://example.com`,
          resourceLinks: [
            { label: 'Help Center', url: 'https://example.com/help' },
          ],
        }}
      />
    );

    expect(screen.getByTestId('mdx-content')).toHaveTextContent(
      '## Overview This came from data/listings.json.'
    );
    expect(screen.getByTestId('mdx-content')).not.toHaveTextContent('## Links');
    expect(screen.getByTestId('mdx-content')).not.toHaveTextContent(
      'Product page:'
    );
  });

  it('uses listing-neutral fallback copy when long-form content is missing', () => {
    render(<WebsiteContentSection website={baseWebsite} />);

    expect(
      screen.getByText(/browse this listing for resource links/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/^Listing$/)).toBeInTheDocument();
    expect(screen.queryByText(/directory entry/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Website$/)).not.toBeInTheDocument();
  });

  it('shows all assigned categories when a listing belongs to more than one category', () => {
    render(
      <WebsiteContentSection
        website={{
          ...baseWebsite,
          categories: ['developer-tools', 'video-downloaders'],
        }}
      />
    );

    expect(screen.getByText(/^Categories$/)).toBeInTheDocument();
    expect(
      screen.getByText('Developer Tools, Video Downloaders')
    ).toBeInTheDocument();
  });
});
