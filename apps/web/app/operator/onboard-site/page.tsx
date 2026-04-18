import { notFound } from 'next/navigation'
import { isOperatorUiEnabled } from '@/lib/operator-mode'
import { loadOperatorOnboardingDocument } from '@thedaviddias/site-contract/operator-onboarding-server'
import { SiteOnboardingForm } from '@thedaviddias/web-core/operator/site-onboarding-form'
import { siteConfig } from '@thedaviddias/web-core/site-config'

export const metadata = {
  robots: {
    follow: false,
    index: false
  },
  title: 'Operator site onboarding'
}

export default async function OperatorOnboardSitePage() {
  if (!isOperatorUiEnabled()) {
    notFound()
    return null
  }

  const initialDocument = loadOperatorOnboardingDocument(siteConfig.id)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SiteOnboardingForm initialDocument={initialDocument} />
    </div>
  )
}
