'use client'
import { MouseEvent } from 'react'
import { useTranslations } from 'next-intl'
import {
  AppBar as MuiAppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Box,
  Divider,
  Typography,
} from '@mui/material'
import { Login, Logout, Person } from '@mui/icons-material'
import { useState } from 'react'
import { useRouter, Link } from '@/i18n/routing'
import { Session } from 'next-auth'
import { signOut } from 'next-auth/react'

import SolarSystem from '@/components/Layout/SolarLogo'

interface AppBarProps {
  session: Session | null
}

const AppBar = ({ session }: AppBarProps) => {
  const t = useTranslations('app_bar')
  const router = useRouter()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const handleOpenMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
  }

  const onSignOut = async () => {
    handleCloseMenu()
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
    await signOut({
      redirect: true,
      redirectTo: basePath ? `${basePath}/` : '/',
    })
  }

  const handleSignIn = () => {
    router.push('/login')
  }

  const redirectProfile = () => {
    router.push('/profile')
  }
  return (
    <MuiAppBar position="static" color="default" elevation={1}>
      <Toolbar className="justify-between">
        {/* Left side - could add logo or title here */}

        <Box className="flex flex-row align-middle justify-start gap-2">
          <div className="flex flex-col justify-center">
            <Link href={'/'} className="p-0 m-0 leading-none">
              <SolarSystem />
            </Link>
          </div>
          <div className="flex flex-col justify-center">
            <Typography variant="h6" color="inherit" component="h6">
              Research Announcements For The Solar System (RAFTs)
            </Typography>
          </div>
        </Box>

        {/* Right side - language selector and auth buttons */}
        <Box className="flex items-center gap-2">
          <Divider orientation="vertical" flexItem className="mx-2" />

          {session ? (
            <>
              <Tooltip title={t('profile')}>
                <IconButton onClick={handleOpenMenu}>
                  <Avatar
                    alt={session.user?.name || t('user')}
                    src={session.user?.image || undefined}
                    className="bg-blue-300"
                  >
                    {session.user?.name?.[0] || 'U'}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={redirectProfile}>
                  <Person className="mr-2" fontSize="small" />
                  {t('profile')}
                </MenuItem>
                <MenuItem onClick={onSignOut}>
                  <Logout className="mr-2" fontSize="small" />
                  {t('sign_out')}
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box className="flex items-center gap-2">
              <Tooltip title={t('sign_in')}>
                <IconButton onClick={handleSignIn} color="primary">
                  <Login />
                </IconButton>
              </Tooltip>
              {/*<Tooltip title={t('register')}>
                <IconButton onClick={() => router.push('/registration')} color="secondary">
                  <PersonAdd />
                </IconButton>
              </Tooltip>*/}
            </Box>
          )}
        </Box>
      </Toolbar>
    </MuiAppBar>
  )
}

export default AppBar
