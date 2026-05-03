'use client'

import type { ReactElement } from 'react'
import { Button } from '../../../design-system/components/shadcn/button'

type SignOutButtonProps = {
  className?: string
  onSignOut: () => void
}

export function SignOutButton({
  className,
  onSignOut,
}: SignOutButtonProps): ReactElement {
  return (
    <Button
      type="button"
      variant="ghost"
      className={className}
      onClick={onSignOut}
    >
      Sign out
    </Button>
  )
}
