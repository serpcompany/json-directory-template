import {
  Bot,
  Cable,
  ChartColumn,
  Code2,
  type LucideIcon,
  Sparkles,
  Wrench
} from 'lucide-react'

export interface CategoryMeta {
  icon: LucideIcon
  label: string
}

const categoryMetaMap: Record<string, CategoryMeta> = {
  'ai-ml': {
    icon: Bot,
    label: 'AI & ML'
  },
  automation: {
    icon: Cable,
    label: 'Integration & Automation'
  },
  'data-analytics': {
    icon: ChartColumn,
    label: 'Data & Analytics'
  },
  'developer-tools': {
    icon: Code2,
    label: 'Developer Tools'
  },
  featured: {
    icon: Sparkles,
    label: 'Featured'
  }
}

export function getCategoryMeta(slug: string): CategoryMeta {
  return (
    categoryMetaMap[slug] ?? {
      icon: Wrench,
      label: slug
    }
  )
}