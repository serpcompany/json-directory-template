'use client'

import type { ReactElement } from 'react'
import { signIn } from 'next-auth/react'
import { GitHubSignInButton as CoreGitHubSignInButton } from '@thedaviddias/web-core/auth/github-sign-in-button'

type GitHubSignInButtonProps = {
  callbackUrl: string
  disabled?: boolean
}

export function GitHubSignInButton({
  callbackUrl,
  disabled = false,
}: GitHubSignInButtonProps): ReactElement {
  return (
    <CoreGitHubSignInButton
      callbackUrl={callbackUrl}
      disabled={disabled}
      onSignIn={nextCallbackUrl => {
        void signIn('github', { callbackUrl: nextCallbackUrl })
      }}
    />
  )
}
