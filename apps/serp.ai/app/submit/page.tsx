import { SubmitPageSurface } from '@thedaviddias/web-core/forms/submit-page-surface'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Submit Yours',
  description: 'Submit your AI product, company, model, dataset, or resource to SERP AI.'
}

export default function SubmitPage() {
  return <SubmitPageSurface />
}
