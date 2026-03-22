import Link from 'next/link'
import type { Guide } from '@/lib/types'

interface GuideCardProps {
  guide: Guide
}

export function GuideCard({ guide }: GuideCardProps) {
  return (
    <article className="rounded-2xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm transition-colors hover:bg-card">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <span>{guide.category}</span>
          <span className="size-1 rounded-full bg-border" />
          <span>{guide.level}</span>
        </div>
        <h3 className="text-lg font-semibold tracking-tight">{guide.title}</h3>
        <p className="text-sm leading-7 text-muted-foreground">{guide.description}</p>
        <Link href="/guides/" className="text-sm font-medium text-foreground underline-offset-4 hover:underline">
          Read guide
        </Link>
      </div>
    </article>
  )
}