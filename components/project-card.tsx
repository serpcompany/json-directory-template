import { ExternalLink, Github, Star } from 'lucide-react'
import Link from 'next/link'
import type { Project } from '@/lib/types'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="rounded-2xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm transition-colors hover:bg-card">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold tracking-tight">{project.name}</h3>
          <p className="text-sm leading-7 text-muted-foreground">{project.description}</p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          <Star className="size-3.5" />
          {project.stars.toLocaleString()}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        <Link href={project.repository} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 hover:bg-muted">
          <Github className="size-4" />
          Repository
        </Link>
        <Link href={project.website} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 hover:bg-muted">
          <ExternalLink className="size-4" />
          Website
        </Link>
      </div>
    </article>
  )
}