import { LayoutProps } from '@/types/common'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import AppLayout from '@/components/Layout/AppLayout'

const LangLayout = async ({ children, params }: LayoutProps) => {
  const { locale } = await params
  if (!routing.locales.includes(locale as 'en' | 'fr')) {
    notFound()
  }
  const messages = await getMessages()
  return (
    <NextIntlClientProvider messages={messages}>
      <AppLayout>{children}</AppLayout>
    </NextIntlClientProvider>
  )
}

export default LangLayout
