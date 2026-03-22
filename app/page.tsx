import type { Metadata } from 'next'
import { ArrowRight, Code2, FileText, Zap } from 'lucide-react'
import Link from 'next/link'
import { AppSidebar } from '@/components/app-sidebar'
import { GuideCard } from '@/components/guide-card'
import { HeroSection } from '@/components/hero-section'
import { MemberCard } from '@/components/member-card'
import { ProjectCard } from '@/components/project-card'
import { Section } from '@/components/section'
import { ToolCard } from '@/components/tool-card'
import { WebsiteGrid } from '@/components/website-grid'
import {
  getCategoryCounts,
  getFeaturedWebsites,
  getGuides,
  getMembers,
  getProjects,
  getRecentWebsites,
  getSteps,
  getTools,
  getWebsites
} from '@/lib/data'
import { routes } from '@/lib/routes'

export const metadata: Metadata = {
  title: 'Directory of AI-Ready Documentation & llms.txt Examples',
  description:
    'Discover websites implementing the llms.txt standard, browse featured tools, and explore guides, members, and open-source projects.'
}

const stepIcons = [FileText, Code2, Zap]

export default function HomePage() {
  const featuredWebsites = getFeaturedWebsites()
  const recentWebsites = getRecentWebsites()
  const websites = getWebsites()
  const guides = getGuides()
  const members = getMembers().slice(0, 6)
  const projects = getProjects()
  const steps = getSteps()
  const tools = getTools()
  const categoryCounts = getCategoryCounts()

  return (
    <>
      <HeroSection />
      <div className="border-t border-border/50">
        <div className="relative flex w-full flex-row">
          <AppSidebar featuredCount={featuredWebsites.length} />

          <div className="container-shell flex w-full flex-col gap-8 pt-6 pb-16">
            <Section
              description="Discover the most popular AI-ready websites and development tools."
              title="Featured Tools & Platforms"
              titleId="featured-websites"
              viewAllHref={routes.featured}
              viewAllText="All featured"
            >
              <WebsiteGrid websites={featuredWebsites} />
            </Section>

            <Section
              description="Discover the latest websites and platforms that have joined llms.txt hub."
              title="Recently Added"
              titleId="recent-websites"
            >
              <WebsiteGrid websites={recentWebsites} />
            </Section>

            <Section
              description={`Browse the complete directory of websites implementing the llms.txt standard across ${categoryCounts.length} categories.`}
              title="All Websites"
              titleId="all-websites"
              viewAllHref={routes.websites}
            >
              <div id="all-websites" className="space-y-4">
                <div className="flex flex-wrap gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  <span className="rounded-full border border-border bg-muted px-3 py-1.5">Sort by name</span>
                  <span className="rounded-full border border-border bg-background px-3 py-1.5">Static list</span>
                </div>
                <WebsiteGrid websites={websites} />
              </div>
            </Section>

            <Section
              description="Explore tools created to help you work with llms.txt."
              title="Developer Tools"
              titleId="developer-tools"
              viewAllHref={routes.developerTools}
              viewAllText="All tools"
            >
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {tools.map(tool => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </Section>

            <Section
              description="Learn how to implement and optimize llms.txt for your documentation."
              title="Featured Guides"
              titleId="featured-guides"
              viewAllHref={routes.guides}
              viewAllText="All guides"
            >
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                {guides.map(guide => (
                  <GuideCard key={guide.slug} guide={guide} />
                ))}
              </div>
            </Section>

            <Section
              description="Welcome our newest community members building AI-ready documentation."
              title="Latest Members"
              titleId="latest-members"
              viewAllHref={routes.members}
              viewAllText="All members"
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                {members.map(member => (
                  <MemberCard key={member.slug} member={member} />
                ))}
              </div>
            </Section>

            <Section
              description="Learn how to implement llms.txt in three simple steps."
              title="How llms.txt Works"
              titleId="how-it-works"
            >
              <div className="grid gap-4 lg:grid-cols-3">
                {steps.map((step, index) => {
                  const Icon = stepIcons[index] ?? FileText

                  return (
                    <article key={step.step} className="rounded-2xl border border-border/70 bg-card p-6 text-center">
                      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted">
                        <Icon className="size-6" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold tracking-tight">
                        {step.step}. {step.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">{step.description}</p>
                    </article>
                  )
                })}
              </div>
            </Section>

            <Section
              description="Discover open-source projects, tools, and libraries implementing the llms.txt standard."
              title="More Projects"
              titleId="projects"
              viewAllHref={routes.projects}
              viewAllText="All projects"
            >
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {projects.map(project => (
                  <ProjectCard key={project.slug} project={project} />
                ))}
              </div>
            </Section>

            <section className="section-shell">
              <div className="rounded-2xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm sm:p-10">
                <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Stay updated
                    </p>
                    <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                      Follow the ecosystem around AI-ready documentation.
                    </h2>
                    <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
                      Browse featured guides, inspect real implementations, and keep your own
                      documentation model aligned with the standard.
                    </p>
                  </div>
                  <Link
                    href={routes.guides}
                    className="inline-flex items-center justify-center gap-2 rounded-none bg-foreground px-6 py-4 text-sm font-bold text-background"
                  >
                    Explore guides
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}