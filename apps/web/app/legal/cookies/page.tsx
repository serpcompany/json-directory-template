import type { Metadata } from 'next';
import { LegalDocumentPage } from '@/components/legal/legal-document-page';
import { SITE_NAME, generateBaseMetadata } from '@/lib/seo/seo-config';

export const metadata: Metadata = generateBaseMetadata({
  title: 'Cookie Policy',
  description: `Cookie policy for ${SITE_NAME}. Learn how we use cookies and similar technologies.`,
  path: '/legal/cookies',
  noindex: true,
});

export default async function CookiePolicyPage() {
  return (
    <LegalDocumentPage
      contentKey="cookies"
      path="/legal/cookies"
      title="Cookie Policy"
    />
  );
}
