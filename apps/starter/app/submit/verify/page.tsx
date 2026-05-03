import { Suspense } from 'react'
import SubmitVerifyPageRoute from '@thedaviddias/web-core/verify/submit-verify-page'

export default function SubmitVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <SubmitVerifyPageRoute
        submissionEndpoint="/api/submission"
        verifyEndpoint="/api/verify-badge"
      />
    </Suspense>
  )
}
