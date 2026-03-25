import type { LucideIcon } from 'lucide-react';
import {
  Brain,
  Briefcase,
  Code2,
  Cpu,
  Database,
  FileText,
  Globe,
  Lock,
  Package,
  ShoppingCart,
  User,
  Workflow,
} from 'lucide-react';

export interface Category {
  name: string;
  slug: string;
  description: string;
  icon: LucideIcon;
  priority: 'high' | 'medium' | 'low';
}

export const categories: Category[] = [
  {
    name: 'Developer Tools',
    slug: 'developer-tools',
    description: 'APIs, frameworks, libraries, IDEs, and development utilities',
    icon: Code2,
    priority: 'high',
  },
  {
    name: 'AI & Machine Learning',
    slug: 'ai-ml',
    description: 'AI models, ML tools, LLM platforms, and AI services',
    icon: Brain,
    priority: 'high',
  },
  {
    name: 'Data & Analytics',
    slug: 'data-analytics',
    description:
      'Databases, analytics platforms, BI tools, and data processing',
    icon: Database,
    priority: 'high',
  },
  {
    name: 'Infrastructure & Cloud',
    slug: 'infrastructure-cloud',
    description: 'Cloud platforms, hosting, containers, and DevOps tools',
    icon: Cpu,
    priority: 'high',
  },
  {
    name: 'Security & Identity',
    slug: 'security-identity',
    description: 'Security tools, authentication, encryption, and compliance',
    icon: Lock,
    priority: 'high',
  },
  {
    name: 'Automation & Workflow',
    slug: 'automation-workflow',
    description:
      'Workflow automation, integration platforms, and productivity tools',
    icon: Workflow,
    priority: 'medium',
  },
  {
    name: 'Finance & Fintech',
    slug: 'finance-fintech',
    description: 'Financial services, payment platforms, and fintech tools',
    icon: Briefcase,
    priority: 'medium',
  },
  {
    name: 'Marketing & Sales',
    slug: 'marketing-sales',
    description:
      'Marketing tools, CRM, sales platforms, and customer engagement',
    icon: User,
    priority: 'medium',
  },
  {
    name: 'E-commerce',
    slug: 'ecommerce-retail',
    description: 'Online stores, marketplaces, and retail platforms',
    icon: ShoppingCart,
    priority: 'low',
  },
  {
    name: 'Content & Media',
    slug: 'content-media',
    description: 'Publishing platforms, content management, and media tools',
    icon: FileText,
    priority: 'low',
  },
  {
    name: 'Business Operations',
    slug: 'business-operations',
    description: 'Business management, operations, and enterprise tools',
    icon: Briefcase,
    priority: 'low',
  },
  {
    name: 'Personal',
    slug: 'personal',
    description: 'Personal websites, portfolios, and blogs',
    icon: User,
    priority: 'low',
  },
  {
    name: 'Agency & Services',
    slug: 'agency-services',
    description: 'Agencies, consultancies, and service providers',
    icon: Briefcase,
    priority: 'low',
  },
  {
    name: 'International',
    slug: 'international',
    description: 'Non-English and international websites',
    icon: Globe,
    priority: 'low',
  },
  {
    name: 'Other',
    slug: 'other',
    description: "Everything else that doesn't fit other categories",
    icon: Package,
    priority: 'low',
  },
];

export const categoryAliases: Record<string, string> = {
  'integration-automation': 'automation-workflow',
};

export const getCategoryBySlug = (slug: string): Category | undefined => {
  return categories.find((c) => c.slug === slug);
};

export const getCategoryLabel = (slug: string): string => {
  return getCategoryBySlug(slug)?.name || slug;
};

export const getCategoryIcon = (slug: string): LucideIcon => {
  const category = getCategoryBySlug(slug);
  return category?.icon || Package;
};

export const normalizeCategorySlug = (slug: string): string => {
  return categoryAliases[slug] || slug;
};
