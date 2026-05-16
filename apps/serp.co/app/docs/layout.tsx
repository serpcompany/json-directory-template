import type { ReactNode } from 'react'
import { getDocs } from '@/lib/content-loader'
import { DocsRouteLayout } from '@thedaviddias/web-core/docs/layout'

export default function DocsLayout({ children }: { children: ReactNode }) {
  return <DocsRouteLayout docs={getDocs()}>{children}</DocsRouteLayout>
}
