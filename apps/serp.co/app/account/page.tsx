import type { ReactElement } from 'react'
import { redirect } from 'next/navigation'
import { getRoute } from '@thedaviddias/web-core/routes'
import { AccountPageRoute } from '@thedaviddias/web-core/account-page'
import { requireRouteFeature } from '@/lib/route-feature-gates'
import { getSafeCallbackUrl, getSession } from '@/lib/auth'
import { isStaticExportBuild } from '@/lib/runtime-mode'

export default async function AccountPage(): Promise<ReactElement> {
  requireRouteFeature('showAuth')

  if (isStaticExportBuild()) {
    return <AccountPageRoute isStaticExportBuild />
  }

  const session = await getSession()

  if (!session?.user) {
    redirect(`${getRoute('login')}?callbackUrl=${encodeURIComponent(getSafeCallbackUrl('/account'))}`)
  }

  return <AccountPageRoute user={session.user} />
}
