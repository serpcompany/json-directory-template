'use client'

import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'

interface CopySnippetProps {
  token: string
  siteId: string
  siteName: string
  theme?: 'light' | 'dark'
}

export function CopySnippet({
  token,
  siteId,
  siteName,
  theme = 'light',
}: CopySnippetProps) {
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const baseUrl = origin || 'https://your-site.com'
  const snippet = `<a href="${baseUrl}" target="_blank" title="Featured on ${siteName}">
  <img src="${baseUrl}/badge/featured-on-${siteId}-${theme}.svg" alt="Featured on ${siteName}" data-verify-token="${token}" width="200" height="54" />
</a>`

  function handleCopy() {
    navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-2">
      <textarea
        readOnly
        value={snippet}
        rows={4}
        className="w-full rounded-md border border-border bg-muted px-3 py-2 font-mono text-sm text-foreground focus:outline-none"
        aria-label="Embed snippet"
      />
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {copied ? (
          <>
            <Check className="size-4 text-emerald-500" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="size-4 text-muted-foreground" />
            Copy snippet
          </>
        )}
      </button>
    </div>
  )
}
