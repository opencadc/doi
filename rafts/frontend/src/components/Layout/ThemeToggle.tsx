'use client'

import { useTheme } from 'next-themes'
import { ReactNode, useEffect, useState, MouseEvent } from 'react'
import { IconButton, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import { DarkMode, LightMode, SettingsBrightness, Check } from '@mui/icons-material'
import { useTranslations } from 'next-intl'

type ThemeOption = 'light' | 'dark' | 'system'

const ThemeToggle = () => {
  const t = useTranslations('theme_toggle')
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleOpenMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
  }

  const handleThemeChange = (newTheme: ThemeOption) => {
    setTheme(newTheme)
    handleCloseMenu()
  }

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <IconButton color="inherit" disabled>
        <SettingsBrightness />
      </IconButton>
    )
  }

  const getCurrentIcon = () => {
    if (theme === 'system') {
      return <SettingsBrightness />
    }
    return resolvedTheme === 'dark' ? <DarkMode /> : <LightMode />
  }

  const themeOptions: { value: ThemeOption; label: string; icon: ReactNode }[] = [
    { value: 'light', label: t('light'), icon: <LightMode fontSize="small" /> },
    { value: 'dark', label: t('dark'), icon: <DarkMode fontSize="small" /> },
    { value: 'system', label: t('system'), icon: <SettingsBrightness fontSize="small" /> },
  ]

  return (
    <>
      <Tooltip title={t('tooltip')}>
        <IconButton onClick={handleOpenMenu} color="inherit">
          {getCurrentIcon()}
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {themeOptions.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => handleThemeChange(option.value)}
            selected={theme === option.value}
          >
            <ListItemIcon>{option.icon}</ListItemIcon>
            <ListItemText>{option.label}</ListItemText>
            {theme === option.value && <Check fontSize="small" sx={{ ml: 1 }} />}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default ThemeToggle
