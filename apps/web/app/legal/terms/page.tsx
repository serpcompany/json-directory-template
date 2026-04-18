import type { Metadata } from 'next';
import { LegalDocumentPage } from '@/components/legal/legal-document-page';
import { SITE_NAME, generateBaseMetadata } from '@thedaviddias/web-core/seo-config';

export const metadata: Metadata = generateBaseMetadata({
  title: 'Terms of Service',
  description: `Terms of service for ${SITE_NAME}. Read our terms and conditions for using this service.`,
  path: '/legal/terms',
  noindex: true,
});

export default async function TermsOfServicePage() {
  return (
    <LegalDocumentPage
      contentKey="terms"
      path="/legal/terms"
      title="Terms of Service"
    />
  );
}
