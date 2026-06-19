import { getRoute } from '@thedaviddias/web-core/routes'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'SERP AI Pricing',
  description: 'Choose a plan to list, feature, and promote an AI downloader on SERP AI.'
}

export default function PricingPage() {
  return (
    <main className="container mx-auto max-w-4xl px-6 py-16">
      <div className="space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">SERP AI Pricing</h1>
          <p className="text-lg text-muted-foreground">
            Choose a plan to list, feature, and promote an AI downloader.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold">Submit</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Submit a downloader product for directory review.
            </p>
            <Link className="mt-4 inline-flex font-medium text-primary" href={getRoute('submit')}>
              Submit Yours
            </Link>
          </section>
          <section className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold">Sponsor</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Promote your downloader to people evaluating browser-based download tools.
            </p>
            <Link className="mt-4 inline-flex font-medium text-primary" href="/sponsor/">
              Sponsor SERP AI
            </Link>
          </section>
        </div>
      </div>
    </main>
  )
}
