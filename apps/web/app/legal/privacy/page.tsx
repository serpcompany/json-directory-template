import type { Metadata } from 'next';
import { LegalDocumentPage } from '@/components/legal/legal-document-page';
import { SITE_NAME, generateBaseMetadata } from '@thedaviddias/web-core/seo-config';

export const metadata: Metadata = generateBaseMetadata({
  title: 'Privacy Policy',
  description: `Privacy policy for ${SITE_NAME}. Learn how we collect, use, and protect your information.`,
  path: '/legal/privacy',
  noindex: true,
});

export default async function PrivacyPolicyPage() {
  return (
    <LegalDocumentPage
      contentKey="privacy"
      path="/legal/privacy"
      title="Privacy Policy"
    />
  );
}
