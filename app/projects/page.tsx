import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Plus, Star } from 'lucide-react'
import { ProjectCard } from '@/components/project-card'
import { getProjects } from '@/lib/data'
import { routes } from '@/lib/routes'

export const metadata: Metadata = {
  title: 'Open Source Projects',
  description: 'Explore open-source projects and libraries implementing the llms.txt standard.'
}

export default function ProjectsPage() {
  const projects = getProjects()
  const featuredProject = projects[0]
  const remainingProjects = projects.slice(1)

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-10">
        <header className="space-y-2">
          <h1 className="flex items-center gap-3 text-4xl font-bold tracking-tight">
            <span className="size-2 rounded-full bg-foreground" />
            Open Source Projects
          </h1>
          <p className="max-w-3xl text-lg text-muted-foreground">
            Discover open-source projects, tools, and libraries implementing the llms.txt standard.
          </p>
        </header>

        {featuredProject ? (
          <article className="rounded-2xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Most Starred
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-background px-3 py-1 text-sm font-medium">
                  <Star className="size-4" />
                  {featuredProject.stars.toLocaleString()}
                </span>
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{featuredProject.name}</h2>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
                  {featuredProject.description}
                </p>
              </div>
              <div>
                <Link href={featuredProject.repository} className="inline-flex items-center gap-2 text-sm font-medium">
                  View project
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </article>
        ) : null}

        <section className="space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">
            All Projects ({remainingProjects.length})
          </h2>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {remainingProjects.map(project => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border/50 bg-card/50 p-8 text-center backdrop-blur-sm">
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-background">
              <Plus className="size-6 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Have a project to share?</h2>
            <p className="text-sm leading-7 text-muted-foreground sm:text-[15px]">
              Tag your repository and link it from your documentation workflow to make discovery easier.
            </p>
            <Link href={routes.github} className="inline-flex items-center gap-2 rounded-none bg-foreground px-6 py-4 text-sm font-bold text-background">
              Browse reference repo
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}