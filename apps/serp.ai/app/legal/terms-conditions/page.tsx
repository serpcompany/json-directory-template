import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb';
import type { Metadata } from 'next';
import { getLegalContent } from '@/lib/content-loader';
import { components } from '@thedaviddias/web-core/mdx-components';
import {
  LegalStaticPage,
  generateLegalPageMetadata,
} from '@thedaviddias/web-core/static-pages/legal-page';

export const metadata: Metadata = generateLegalPageMetadata({
  title: 'Terms of Service',
  description:
    'Terms of service for {{SITE_NAME}}. Read our terms and conditions for using this service.',
  path: '/legal/terms-conditions',
});

export default async function TermsOfServicePage() {
  const content = await getLegalContent('terms');

  return (
    <LegalStaticPage
      content={content}
      mdxComponents={components}
      path="/legal/terms-conditions"
      slots={{ Breadcrumb }}
      title="Terms of Service"
    />
  );
}
