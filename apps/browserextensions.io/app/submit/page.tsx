import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Submit Your Browser Extension',
  description:
    'Submit your browser extension or add-on to BrowserExtensions.io.',
}

export default function SubmitPage() {
  return (
    <main className="container mx-auto max-w-3xl px-6 py-16">
      <div className="space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Get Found</h1>
        <p className="text-lg text-muted-foreground">
          Submit a productivity extension, privacy add-on, shopping helper, developer
          tool, or other browser experience for review.
        </p>
        <a className="font-medium text-primary" href="mailto:marketing@serp.co">
          marketing@serp.co
        </a>
      </div>
    </main>
  )
}
