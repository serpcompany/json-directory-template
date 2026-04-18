import type { ReactNode } from 'react';
import { render, screen } from '@/test/test-utils';
import { SiteOnboardingForm } from '@thedaviddias/web-core/operator/site-onboarding-form';

jest.mock('@rjsf/core', () => ({
  __esModule: true,
  default: ({
    children,
    schema,
  }: {
    children?: ReactNode;
    schema?: { title?: string };
  }) => (
    <div data-testid="mock-rjsf-form">
      <span>{schema?.title}</span>
      {children}
    </div>
  ),
}));

jest.mock('@rjsf/validator-ajv8', () => ({
  __esModule: true,
  default: {},
}));

describe('SiteOnboardingForm', () => {
  it('renders export previews for a valid onboarding document', () => {
    render(
      <SiteOnboardingForm
        initialDocument={{
          listings: [
            {
              content: {
                body: '## Overview\n\nExample body',
              },
              media: {
                logo: '/logo.png',
              },
              product: {
                categories: ['video-downloaders'],
                productPage: 'https://serp.ly/example',
                slug: 'example-downloader',
                tagline: 'Example tagline',
                title: 'Example Downloader',
              },
              relatedLinks: [
                {
                  label: 'Help Center',
                  url: 'https://serp.ly/example/help',
                },
              ],
            },
          ],
          site: {
            categoryLabels: {},
            defaultCategory: 'video-downloaders',
            description: 'Example description',
            docsLabel: 'Docs',
            docsRouteBasePath: 'docs',
            domain: 'serpdownloaders.com',
            featuredCount: 6,
            githubIssueOwner: 'serpcompany',
            githubIssueRepo: 'json-directory-template',
            githubIssuesUrl:
              'https://github.com/serpcompany/json-directory-template/issues/new/choose',
            githubRepoUrl:
              'https://github.com/serpcompany/json-directory-template',
            githubUrl: 'https://github.com/serpcompany',
            listingPluralLabel: 'downloaders',
            listingRouteBasePath: 'listing',
            listingSingularLabel: 'downloader',
            name: 'SERP Downloaders',
            networkLabel: 'Network',
            networkRouteBasePath: 'network',
            publicUrl: 'https://serpdownloaders.com',
            publishedAt: '2026-03-25',
            redditUrl: 'https://www.reddit.com/r/serpdownloaders/',
            siteId: 'serpdownloaders.com',
            submitLabel: 'Submit a Downloader',
            tagline: 'Download anything',
            twitterUrl: 'https://x.com/serpapps',
          },
        }}
      />
    );

    expect(
      screen.getByRole('heading', { name: /site onboarding/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /site identity and config/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /listings/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /listing editor/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /validation and export/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /download site-config json/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /download products\.json/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /example downloader/i })
    ).toBeInTheDocument();
    expect(screen.getAllByTestId('mock-rjsf-form')).toHaveLength(2);
    expect(
      screen.queryByText(/primary category/i)
    ).not.toBeInTheDocument();
  });
});
