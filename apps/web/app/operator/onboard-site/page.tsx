import { notFound } from 'next/navigation'
import { SiteOnboardingForm } from '@/components/operator/site-onboarding-form'
import { isOperatorUiEnabled } from '@/lib/operator-mode'
import { loadOperatorOnboardingDocument } from '@/lib/operator-onboarding-server'
import { siteConfig } from '@/lib/site-config'

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
