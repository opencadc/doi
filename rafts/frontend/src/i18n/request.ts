import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'
import { Lang } from '@/types/common'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = (await requestLocale) as Lang
  if (!locale || !routing.locales.includes(locale)) {
    locale = routing.defaultLocale
  }
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
