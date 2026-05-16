import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Submit to SERP',
  description: 'Submit your software, AI tool, company, resource, or SERP project to SERP.',
}

export default function SubmitPage() {
  return (
    <main className="container mx-auto max-w-3xl px-6 py-16">
      <div className="space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Submit to SERP</h1>
        <p className="text-lg text-muted-foreground">
          Share a software product, AI tool, company, resource, or SERP project for review
          by the SERP team.
        </p>
        <a
          className="inline-flex font-medium text-primary underline-offset-4 hover:underline"
          href="mailto:submit@serp.co"
        >
          submit@serp.co
        </a>
      </div>
    </main>
  )
}
