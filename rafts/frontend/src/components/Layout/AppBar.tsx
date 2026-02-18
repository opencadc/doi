/*
 ************************************************************************
 *******************  CANADIAN ASTRONOMY DATA CENTRE  *******************
 **************  CENTRE CANADIEN DE DONNÉES ASTRONOMIQUES  **************
 *
 *  (c) 2026.                            (c) 2026.
 *  Government of Canada                 Gouvernement du Canada
 *  National Research Council            Conseil national de recherches
 *  Ottawa, Canada, K1A 0R6              Ottawa, Canada, K1A 0R6
 *  All rights reserved                  Tous droits réservés
 *
 *  NRC disclaims any warranties,        Le CNRC dénie toute garantie
 *  expressed, implied, or               énoncée, implicite ou légale,
 *  statutory, of any kind with          de quelque nature que ce
 *  respect to the software,             soit, concernant le logiciel,
 *  including without limitation         y compris sans restriction
 *  any warranty of merchantability      toute garantie de valeur
 *  or fitness for a particular          marchande ou de pertinence
 *  purpose. NRC shall not be            pour un usage particulier.
 *  liable in any event for any          Le CNRC ne pourra en aucun cas
 *  damages, whether direct or           être tenu responsable de tout
 *  indirect, special or general,        dommage, direct ou indirect,
 *  consequential or incidental,         particulier ou général,
 *  arising from the use of the          accessoire ou fortuit, résultant
 *  software.  Neither the name          de l'utilisation du logiciel. Ni
 *  of the National Research             le nom du Conseil National de
 *  Council of Canada nor the            Recherches du Canada ni les noms
 *  names of its contributors may        de ses  participants ne peuvent
 *  be used to endorse or promote        être utilisés pour approuver ou
 *  products derived from this           promouvoir les produits dérivés
 *  software without specific prior      de ce logiciel sans autorisation
 *  written permission.                  préalable et particulière
 *                                       par écrit.
 *
 *  This file is part of the             Ce fichier fait partie du projet
 *  OpenCADC project.                    OpenCADC.
 *
 *  OpenCADC is free software:           OpenCADC est un logiciel libre ;
 *  you can redistribute it and/or       vous pouvez le redistribuer ou le
 *  modify it under the terms of         modifier suivant les termes de
 *  the GNU Affero General Public        la "GNU Affero General Public
 *  License as published by the          License" telle que publiée
 *  Free Software Foundation,            par la Free Software Foundation
 *  either version 3 of the              : soit la version 3 de cette
 *  License, or (at your option)         licence, soit (à votre gré)
 *  any later version.                   toute version ultérieure.
 *
 *  OpenCADC is distributed in the       OpenCADC est distribué
 *  hope that it will be useful,         dans l'espoir qu'il vous
 *  but WITHOUT ANY WARRANTY;            sera utile, mais SANS AUCUNE
 *  without even the implied             GARANTIE : sans même la garantie
 *  warranty of MERCHANTABILITY          implicite de COMMERCIALISABILITÉ
 *  or FITNESS FOR A PARTICULAR          ni d'ADÉQUATION À UN OBJECTIF
 *  PURPOSE.  See the GNU Affero         PARTICULIER. Consultez la Licence
 *  General Public License for           Générale Publique GNU Affero
 *  more details.                        pour plus de détails.
 *
 *  You should have received             Vous devriez avoir reçu une
 *  a copy of the GNU Affero             copie de la Licence Générale
 *  General Public License along         Publique GNU Affero avec
 *  with OpenCADC.  If not, see          OpenCADC ; si ce n'est
 *  <http://www.gnu.org/licenses/>.      pas le cas, consultez :
 *                                       <http://www.gnu.org/licenses/>.
 *
 ************************************************************************
 */

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
import ThemeToggle from '@/components/Layout/ThemeToggle'

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

          <ThemeToggle />

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
