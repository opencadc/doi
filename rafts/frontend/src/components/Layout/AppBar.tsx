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
  Button,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import { Home, ListAlt, RateReview } from '@mui/icons-material'
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
  const userRole = session?.user?.role

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
    handleCloseMenu()
    router.push('/profile')
  }

  const handleNavigation = (path: string) => {
    handleCloseMenu()
    router.push(path)
  }

  const isReviewerOrAdmin = userRole === 'reviewer' || userRole === 'admin'

  return (
    <MuiAppBar position="static" color="default" elevation={1}>
      <Toolbar className="justify-between">
        {/* Left side - Logo and title */}
        <Box className="flex flex-row align-middle justify-start gap-2">
          <div className="flex flex-col justify-center">
            <Link href={'/'} className="p-0 m-0 leading-none">
              <SolarSystem />
            </Link>
          </div>
          <Box
            className="flex flex-col justify-center"
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            <Typography variant="h6" color="inherit" component="h6">
              Research Announcements For The Solar System (RAFTs)
            </Typography>
          </Box>
        </Box>

        {/* Right side - Navigation + User menu */}
        <Box className="flex items-center gap-2">
          {/* Desktop Navigation - visible on md and up */}
          {session && (
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
              <Button
                component={Link}
                href="/"
                startIcon={<Home />}
                color="inherit"
                sx={{ textTransform: 'none' }}
              >
                {t('nav_home')}
              </Button>
              <Button
                component={Link}
                href="/view/rafts"
                startIcon={<ListAlt />}
                color="inherit"
                sx={{ textTransform: 'none' }}
              >
                {t('nav_rafts')}
              </Button>
              {isReviewerOrAdmin && (
                <Button
                  component={Link}
                  href="/review/rafts"
                  startIcon={<RateReview />}
                  color="inherit"
                  sx={{ textTransform: 'none' }}
                >
                  {t('nav_review')}
                </Button>
              )}
            </Box>
          )}

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

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
                {/* Mobile Navigation - visible only on mobile */}
                <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                  <MenuItem onClick={() => handleNavigation('/')}>
                    <ListItemIcon>
                      <Home fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>{t('nav_home')}</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => handleNavigation('/view/rafts')}>
                    <ListItemIcon>
                      <ListAlt fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>{t('nav_rafts')}</ListItemText>
                  </MenuItem>
                  {isReviewerOrAdmin && (
                    <MenuItem onClick={() => handleNavigation('/review/rafts')}>
                      <ListItemIcon>
                        <RateReview fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>{t('nav_review')}</ListItemText>
                    </MenuItem>
                  )}
                  <Divider />
                </Box>
                <MenuItem onClick={redirectProfile}>
                  <ListItemIcon>
                    <Person fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{t('profile')}</ListItemText>
                </MenuItem>
                <MenuItem onClick={onSignOut}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{t('sign_out')}</ListItemText>
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
            </Box>
          )}
        </Box>
      </Toolbar>
    </MuiAppBar>
  )
}

export default AppBar
