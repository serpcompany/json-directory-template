import { Breadcrumb } from '@thedaviddias/design-system/breadcrumb';
import type { Metadata } from 'next';
import { getLegalContent } from '@/lib/content-loader';
import { components } from '@thedaviddias/web-core/mdx-components';
import {
  LegalStaticPage,
  generateLegalPageMetadata,
} from '@thedaviddias/web-core/static-pages/legal-page';

export const metadata: Metadata = generateLegalPageMetadata({
  title: 'Privacy Policy',
  description:
    'Privacy policy for {{SITE_NAME}}. Learn how we collect, use, and protect your information.',
  path: '/legal/privacy-policy',
});

export default async function PrivacyPolicyPage() {
  const content = await getLegalContent('privacy');

  return (
    <LegalStaticPage
      content={content}
      mdxComponents={components}
      path="/legal/privacy-policy"
      slots={{ Breadcrumb }}
      title="Privacy Policy"
    />
  );
}
