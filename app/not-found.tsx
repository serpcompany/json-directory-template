import Link from 'next/link'
import { routes } from '@/lib/routes'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-6 py-16 text-center">
      <div className="space-y-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">404</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Page not found</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          The page you are looking for does not exist. Browse the directory to find AI-ready documentation.
        </p>
        <Link href={routes.home} className="inline-flex rounded-none bg-foreground px-6 py-4 text-sm font-bold text-background">
          Back to homepage
        </Link>
      </div>
    </main>
  )
}