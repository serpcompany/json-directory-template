'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Loader2 } from 'lucide-react';

type VerifyState = 'idle' | 'loading' | 'success' | 'error';

interface VerifyButtonProps {
  token: string;
}

export function VerifyButton({ token }: VerifyButtonProps) {
  const [state, setState] = useState<VerifyState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [slug, setSlug] = useState<string>('');

  async function handleVerify() {
    setState('loading');
    try {
      const res = await fetch('/api/verify-badge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = (await res.json()) as { verified?: boolean; message?: string; slug?: string };

      if (res.ok && data.verified) {
        setSlug(data.slug ?? '');
        setState('success');
      } else {
        setErrorMessage(data.message ?? 'Verification failed.');
        setState('error');
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
      setState('error');
    }
  }

  if (state === 'success') {
    return (
      <div className="space-y-3 rounded-md bg-emerald-50 px-4 py-3 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        <div className="flex items-center gap-2">
          <CheckCircle className="size-5 shrink-0" />
          <span>Verified! Your listing is live.</span>
        </div>
        {slug && (
          <Link
            href={`/websites/${slug}`}
            className="block text-sm font-medium underline underline-offset-2 hover:opacity-80"
          >
            View your listing →
          </Link>
        )}
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="space-y-3">
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          <p className="font-medium">Verification failed</p>
          <p>{errorMessage}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Make sure the badge is visible on your homepage and the{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">data-verify-token</code>{' '}
          attribute matches exactly. Then try again.
        </p>
        <button
          type="button"
          onClick={handleVerify}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleVerify}
      disabled={state === 'loading'}
      className="flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {state === 'loading' && <Loader2 className="size-4 animate-spin" />}
      {state === 'loading' ? 'Verifying…' : '✓ Verify & Publish'}
    </button>
  );
}
