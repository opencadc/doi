'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/routing'
import { IconButton, Menu, MenuItem, Tooltip } from '@mui/material'
import { Language } from '@mui/icons-material'

const LANGUAGES = {
  en: 'English',
  fr: 'Français',
} as const

const LanguageSelector = () => {
  const t = useTranslations('language_selector')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
  }

  const handleLanguageChange = (newLocale: string) => {
    handleCloseMenu()
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <>
      <Tooltip title={t('change_language')}>
        <IconButton
          onClick={handleOpenMenu}
          size="large"
          aria-label={t('change_language')}
          color="inherit"
        >
          <Language />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {Object.entries(LANGUAGES).map(([code, name]) => (
          <MenuItem
            key={code}
            onClick={() => handleLanguageChange(code)}
            selected={locale === code}
          >
            {name}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default LanguageSelector
