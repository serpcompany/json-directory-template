import { getWebsites } from '@/lib/content-loader'
import { HeroSection as SharedHeroSection } from '@thedaviddias/web-core/sections/hero-section'

/**
 * Hero section component for the homepage
 * Features: Bold typography, gradient text, staggered animations, enhanced CTAs
 * @returns JSX element containing the hero section with animated background and website count
 */
export async function HeroSection() {
  const websites = await getWebsites()
  return <SharedHeroSection websiteCount={websites.length} />
}
