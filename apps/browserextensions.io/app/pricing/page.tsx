import type { Metadata } from 'next'
import Link from 'next/link'
import { getRoute } from '@thedaviddias/web-core/routes'

export const metadata: Metadata = {
  title: 'Pricing Plans',
  description:
    'Choose the perfect plan to showcase your browser extension or add-on on BrowserExtensions.io.',
}

export default function PricingPage() {
  return (
    <main className="container mx-auto max-w-4xl px-6 py-16">
      <div className="space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Pricing Plans</h1>
          <p className="text-lg text-muted-foreground">
            Choose the perfect plan to showcase your browser extension or add-on.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold">Submit</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Submit your browser extension for directory review.
            </p>
            <Link className="mt-4 inline-flex font-medium text-primary" href={getRoute('submit')}>
              Submit your extension
            </Link>
          </section>
          <section className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold">Sponsor</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Promote your extension to people searching for browser add-ons.
            </p>
            <Link className="mt-4 inline-flex font-medium text-primary" href="/sponsor/">
              Sponsor the directory
            </Link>
          </section>
        </div>
      </div>
    </main>
  )
}
