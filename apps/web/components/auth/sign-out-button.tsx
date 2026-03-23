'use client'

import type { ReactElement } from 'react'
import { Button } from '@thedaviddias/design-system/button'
import { signOut } from 'next-auth/react'

type SignOutButtonProps = {
  className?: string
}

export function SignOutButton({ className }: SignOutButtonProps): ReactElement {
  return (
    <Button
      type="button"
      variant="ghost"
      className={className}
      onClick={() => {
        void signOut({ callbackUrl: '/' })
      }}
    >
      Sign out
    </Button>
  )
}
