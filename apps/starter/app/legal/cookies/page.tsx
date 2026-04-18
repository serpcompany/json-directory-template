import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb';
import type { Metadata } from 'next';
import { getLegalContent } from '@/lib/content-loader';
import { components } from '@thedaviddias/web-core/mdx-components';
import {
  LegalStaticPage,
  generateLegalPageMetadata,
} from '@thedaviddias/web-core/static-pages/legal-page';

export const metadata: Metadata = generateLegalPageMetadata({
  title: 'Cookie Policy',
  description:
    'Cookie policy for {{SITE_NAME}}. Learn how we use cookies and similar technologies.',
  path: '/legal/cookies',
});

export default async function CookiePolicyPage() {
  const content = await getLegalContent('cookies');

  return (
    <LegalStaticPage
      content={content}
      mdxComponents={components}
      path="/legal/cookies"
      slots={{ Breadcrumb }}
      title="Cookie Policy"
    />
  );
}
