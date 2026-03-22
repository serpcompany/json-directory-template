import type { Metadata } from 'next'
import { GuideCard } from '@/components/guide-card'
import { getGuides } from '@/lib/data'

export const metadata: Metadata = {
  title: 'llms.txt Guides',
  description:
    'Step-by-step guides for creating llms.txt files and structuring AI-ready documentation.'
}

export default function GuidesPage() {
  const guides = getGuides()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-10">
        <header className="space-y-2">
          <h1 className="flex items-center gap-3 text-4xl font-bold tracking-tight">
            <span className="size-2 rounded-full bg-foreground" />
            llms.txt Guides
          </h1>
          <p className="text-lg text-muted-foreground">
            Learn how to implement and use llms.txt effectively with practical guides.
          </p>
        </header>

        <section className="space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">
            All Guides ({guides.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {guides.map(guide => (
              <GuideCard key={guide.slug} guide={guide} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}