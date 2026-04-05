'use client';

import { Globe } from 'lucide-react';
import { useState } from 'react';
import {
  getListingLogoFallbackPath,
  shouldUseProvidedListingLogo,
} from '@/lib/listing-logo-presentation';

interface FaviconWithFallbackProps {
  website: string;
  name: string;
  logoUrl?: string;
  size?: number;
  className?: string;
}

/**
 * Displays a listing logo with a checked-in SERP fallback for missing or weak assets.
 * @param props - The component props
 * @returns React component that handles favicon loading and errors
 */
export function FaviconWithFallback({
  website: _website,
  name,
  logoUrl,
  size = 32,
  className = 'rounded-lg',
}: FaviconWithFallbackProps) {
  const [imageError, setImageError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);
  const shouldUseProvidedLogo = shouldUseProvidedListingLogo(logoUrl);
  const shouldUseFallbackLogo =
    imageError || !shouldUseProvidedLogo || !logoUrl;

  if (shouldUseFallbackLogo && fallbackError) {
    return (
      <div
        className={`${className} flex-shrink-0 flex items-center justify-center bg-muted`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <Globe className="w-4 h-4 text-muted-foreground" />
      </div>
    );
  }

  const fallbackPath = getListingLogoFallbackPath();
  const imageSrc =
    shouldUseFallbackLogo || !logoUrl ? fallbackPath : logoUrl;
  const imageAlt = shouldUseFallbackLogo
    ? `${name} fallback logo`
    : `${name} logo`;

  return (
    <img
      src={imageSrc}
      alt={imageAlt}
      width={size}
      height={size}
      className={`${className} flex-shrink-0 object-contain`}
      style={{ width: `${size}px`, height: 'auto', aspectRatio: '1/1' }}
      onError={() => {
        if (shouldUseFallbackLogo) {
          setFallbackError(true);
          return;
        }

        setImageError(true);
      }}
    />
  );
}
