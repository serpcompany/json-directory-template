import type { Metadata } from 'next';
import { LegalDocumentPage } from '@/components/legal/legal-document-page';
import { SITE_NAME, generateBaseMetadata } from '@thedaviddias/web-core/seo-config';

export const metadata: Metadata = generateBaseMetadata({
  title: 'DMCA',
  description: `DMCA policy for ${SITE_NAME}. Learn how to submit copyright and intellectual property complaints.`,
  path: '/legal/dmca',
  noindex: true,
});

export default async function DmcaPage() {
  return (
    <LegalDocumentPage contentKey="dmca" path="/legal/dmca" title="DMCA" />
  );
}
