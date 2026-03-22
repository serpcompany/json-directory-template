import type { Metadata } from 'next'
import { Wrench } from 'lucide-react'
import { ToolCard } from '@/components/tool-card'
import { getTools } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Developer Tools',
  description: 'Explore tools and utilities built to work with llms.txt and AI-ready documentation.'
}

export default function DeveloperToolsPage() {
  const tools = getTools()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-10">
        <header className="space-y-2">
          <h1 className="flex items-center gap-3 text-4xl font-bold tracking-tight">
            <Wrench className="size-8" />
            Developer Tools
          </h1>
          <p className="max-w-3xl text-lg text-muted-foreground">
            Tools, utilities, and APIs for generating, validating, and using llms.txt files.
          </p>
        </header>

        <section className="space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">
            All Tools ({tools.length})
          </h2>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {tools.map(tool => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}