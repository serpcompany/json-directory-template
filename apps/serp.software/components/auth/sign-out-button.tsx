'use client'

import type { ReactElement } from 'react'
import { signOut } from 'next-auth/react'
import { SignOutButton as CoreSignOutButton } from '@thedaviddias/web-core/auth/sign-out-button'

type SignOutButtonProps = {
  className?: string
}

export function SignOutButton({ className }: SignOutButtonProps): ReactElement {
  return (
    <CoreSignOutButton
      className={className}
      onSignOut={() => {
        void signOut({ callbackUrl: '/' })
      }}
    />
  )
}
