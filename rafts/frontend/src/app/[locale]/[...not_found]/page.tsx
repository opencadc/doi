import { notFound } from 'next/navigation'

/**
 * Catch-all route to handle any unmatched paths within the [locale] segment.
 * This triggers the custom not-found.tsx page instead of the default Next.js 404.
 */
export default function CatchAllPage() {
  notFound()
}
