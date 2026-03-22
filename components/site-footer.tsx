import { Github, Globe, Newspaper, Radar } from 'lucide-react'
import Link from 'next/link'
import { routes } from '@/lib/routes'

const directoryLinks = [
  { href: routes.projects, label: 'Projects' },
  { href: routes.guides, label: 'Guides' },
  { href: routes.members, label: 'Members' },
  { href: routes.featured, label: 'Featured' }
]

const featureLinks = [
  { href: routes.home, label: 'All Websites' },
  { href: routes.developerTools, label: 'Developer Tools' },
  { href: '/ai-ml/', label: 'AI & ML' },
  { href: '/automation/', label: 'Automation' }
]

const resourceLinks = [
  { href: 'https://llmstxt.org/', label: 'About llms.txt' },
  { href: routes.github, label: 'Reference Repository' },
  { href: 'https://www.raycast.com/thedaviddias/llms-txt', label: 'Raycast Extension' },
  { href: 'https://www.npmjs.com/package/llmstxt-cli', label: 'CLI Installer' }
]

const socialLinks = [
  { href: routes.github, icon: Github, label: 'GitHub' },
  { href: 'https://llmstxt.org/', icon: Globe, label: 'Standard' },
  { href: routes.guides, icon: Newspaper, label: 'Guides' },
  { href: routes.projects, icon: Radar, label: 'Projects' }
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50 bg-muted/30 py-12 md:py-16">
      <div className="container-shell mx-auto grid grid-cols-1 gap-8 md:grid-cols-6 md:gap-12">
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">llms.txt hub</h2>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
              Discover AI-ready documentation and browse websites implementing the proposed llms.txt
              standard in a lightweight static directory.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {socialLinks.map(link => {
              const Icon = link.icon

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Icon className="size-4" />
                  <span className="sr-only">{link.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="grid gap-8 md:col-span-4 md:grid-cols-3">
          <FooterColumn links={directoryLinks} title="Directory" />
          <FooterColumn links={featureLinks} title="Features" />
          <FooterColumn links={resourceLinks} title="Resources" />
        </div>
      </div>

      <div className="container-shell mt-12 border-t border-border/50 pt-8 text-sm text-muted-foreground">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="font-medium">© 2026 llms.txt hub. All rights reserved.</div>
          <div>Inspired by the original llms.txt Hub visual structure and browsing model.</div>
        </div>
      </div>
    </footer>
  )
}

interface FooterColumnProps {
  links: Array<{ href: string; label: string }>
  title: string
}

function FooterColumn({ links, title }: FooterColumnProps) {
  return (
    <div className="space-y-4">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <ul className="space-y-2 text-sm">
        {links.map(link => (
          <li key={link.href + link.label}>
            <Link href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
