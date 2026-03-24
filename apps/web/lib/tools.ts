import type { LucideIcon } from 'lucide-react'
import { Chrome, Code2, Command, GitBranch, Terminal } from 'lucide-react'
import { siteContent } from '@/lib/site-content'
import type { SiteToolIcon } from '../../../sites/types'

export interface Tool {
  description: string
  icon: LucideIcon
  imageAlt?: string
  imageSrc?: string
  name: string
  slug: string
  url: string
}

const toolIconsByName: Record<SiteToolIcon, LucideIcon> = {
  chrome: Chrome,
  code2: Code2,
  command: Command,
  gitBranch: GitBranch,
  terminal: Terminal
}

export const tools: Tool[] = siteContent.externalTools.map(tool => ({
  description: tool.description,
  icon: toolIconsByName[tool.icon],
  imageAlt: tool.imageAlt,
  imageSrc: tool.imageSrc,
  name: tool.name,
  slug: tool.slug,
  url: tool.href
}))
