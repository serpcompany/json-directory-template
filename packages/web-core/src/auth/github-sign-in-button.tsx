'use client'

import type { ReactElement } from 'react'
import { SiGithub } from '@icons-pack/react-simple-icons'
import { Button } from '@thedaviddias/design-system/button'
import { signIn } from 'next-auth/react'

type GitHubSignInButtonProps = {
  callbackUrl: string
  disabled?: boolean
}

export function GitHubSignInButton({
  callbackUrl,
  disabled = false
}: GitHubSignInButtonProps): ReactElement {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 w-full rounded-none font-bold"
      disabled={disabled}
      onClick={() => {
        void signIn('github', { callbackUrl })
      }}
    >
      <SiGithub className="size-4" aria-hidden="true" />
      Continue with GitHub
    </Button>
  )
}
