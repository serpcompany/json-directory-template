import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import type { Tool } from '@/lib/types'

interface ToolCardProps {
  tool: Tool
}

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <Link
      href={tool.href}
      className="group block rounded-2xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm transition-colors hover:bg-card"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{tool.meta}</div>
          <h3 className="text-lg font-semibold tracking-tight">{tool.name}</h3>
          <p className="text-sm leading-7 text-muted-foreground">{tool.description}</p>
        </div>
        <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
      <div className="mt-4 text-sm font-medium">{tool.ctaLabel}</div>
    </Link>
  )
}