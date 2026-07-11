'use client'

import type { ReactElement } from 'react'
import { Button } from '@thedaviddias/design-system/button'

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
