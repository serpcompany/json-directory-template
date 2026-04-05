'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopySnippetProps {
  token: string;
  siteId: string;
  siteUrl: string;
  siteName: string;
}

export function CopySnippet({ token, siteId, siteUrl, siteName }: CopySnippetProps) {
  const [copied, setCopied] = useState(false);

  const snippet = `<a href="https://${siteUrl}" title="Featured on ${siteName}">
  <img src="https://${siteUrl}/badge/featured-on-${siteId}-light.svg" alt="Featured on ${siteName}" data-verify-token="${token}" width="153" height="44" />
</a>`;

  function handleCopy() {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
  );
}
