import type { ReactElement } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@thedaviddias/design-system/avatar'
import { redirect } from 'next/navigation'
import { getRoute } from '@/lib/routes'
import { requireRouteFeature } from '@/lib/route-feature-gates'
import { getSafeCallbackUrl, getSession } from '@/lib/auth'
import { isStaticExportBuild } from '@/lib/runtime-mode'

export default async function AccountPage(): Promise<ReactElement> {
  requireRouteFeature('showAuth')

  if (isStaticExportBuild()) {
    return (
      <section className="container mx-auto flex flex-1 px-4 py-16">
        <div className="mx-auto w-full max-w-2xl rounded-none border border-border bg-card p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Account
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Unavailable in static demo</h1>
          <p className="mt-3 text-muted-foreground">
            GitHub account pages are disabled for the GitHub Pages build.
          </p>
        </div>
      </section>
    )
  }

  const session = await getSession()

  if (!session?.user) {
    redirect(`${getRoute('login')}?callbackUrl=${encodeURIComponent(getSafeCallbackUrl('/account'))}`)
  }

  const initials = session.user.name?.trim().charAt(0).toUpperCase() ?? 'U'

  return (
    <section className="container mx-auto flex flex-1 px-4 py-16">
      <div className="mx-auto w-full max-w-2xl rounded-none border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Avatar className="size-16 rounded-none">
            <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? 'User'} />
            <AvatarFallback className="rounded-none text-lg font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Account
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              {session.user.name ?? 'Signed in with GitHub'}
            </h1>
            <p className="text-muted-foreground">
              {session.user.email ?? 'Your GitHub account is connected to this site.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
