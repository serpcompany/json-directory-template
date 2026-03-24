import type { Metadata } from 'next';
import { LegalDocumentPage } from '@/components/legal/legal-document-page';
import { SITE_NAME, generateBaseMetadata } from '@/lib/seo/seo-config';

export const metadata: Metadata = generateBaseMetadata({
  title: 'Affiliate Disclosure',
  description: `Affiliate disclosure for ${SITE_NAME}. Learn how this site handles affiliate relationships and compensation.`,
  path: '/legal/affiliate-disclosure',
  noindex: true,
});

export default async function AffiliateDisclosurePage() {
  return (
    <LegalDocumentPage
      contentKey="affiliate-disclosure"
      path="/legal/affiliate-disclosure"
      title="Affiliate Disclosure"
    />
  );
}
