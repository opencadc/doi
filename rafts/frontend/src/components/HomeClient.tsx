'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'

export default function HomeClient() {
  const t = useTranslations('navigation')

  return (
    <main className="p-8">
      <p className="mt-2">{t('about')}</p>
      <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">{t('contact')}</button>
      <Link href="fr">FR</Link>
      <Link href="en">EN</Link>
    </main>
  )
}
