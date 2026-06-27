import { permanentRedirect } from 'next/navigation'

export default function LegacyFeaturedProductsPage() {
  permanentRedirect('/categories/featured/')
}
